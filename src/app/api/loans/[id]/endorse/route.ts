import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { EndorseLoanSchema } from '@/lib/domain/validators';
import { createApiResponse, createApiError } from '@/lib/api';
import { EventManager, EventHelpers } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';
import { Repository } from '@/lib/infra/repo';
import { FraudDetector } from '@/lib/domain/fraud';
import { computeScore, calculateScoreInputsFromHistory } from '@/lib/domain/score';
import { priceByScore } from '@/lib/domain/pricing';
import { LoanIdempotencyKeys } from '@/lib/infra/idempotency';

const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: loanId } = params;
    const body = await request.json();
    const validatedData = EndorseLoanSchema.parse(body);

    // Get loan details
    const loan = await repository.getLoanById(loanId, true);
    if (!loan) {
      return NextResponse.json(
        createApiError('Empréstimo não encontrado'),
        { status: 404 }
      );
    }

    // Check if loan is in valid state for endorsements
    if (loan.estado !== 'PENDENTE') {
      return NextResponse.json(
        createApiError('Empréstimo não está pendente'),
        { status: 400 }
      );
    }

    // Get supporter details
    const supporter = await repository.getUserById(validatedData.apoiadorId);
    if (!supporter) {
      return NextResponse.json(
        createApiError('Apoiador não encontrado'),
        { status: 404 }
      );
    }

    if (supporter.tipo !== 'APOIADOR') {
      return NextResponse.json(
        createApiError('Usuário não é um apoiador'),
        { status: 400 }
      );
    }

    if (supporter.status !== 'ATIVO') {
      return NextResponse.json(
        createApiError('Apoiador não está ativo'),
        { status: 400 }
      );
    }

    // Check business rules
    // Rule: No self-endorsement
    if (loan.tomadorId === validatedData.apoiadorId) {
      return NextResponse.json(
        createApiError('Auto-apoio não é permitido'),
        { status: 400 }
      );
    }

    // Rule: Maximum 20% per endorsement
    const maxStakePerEndorser = loan.valorTotal * 0.2;
    if (validatedData.valorStake > maxStakePerEndorser) {
      return NextResponse.json(
        createApiError(`Valor máximo por apoiador: ${(maxStakePerEndorser / 1_000_000).toFixed(2)} USDC`),
        { status: 400 }
      );
    }

    // Rule: Check if supporter already has 3+ active loans
    const supporterLoans = await repository.getLoansForUser(validatedData.apoiadorId, 'APOIADOR');
    const activeLoans = supporterLoans.filter(l => ['ATIVO', 'APROVADO'].includes(l.estado));
    if (activeLoans.length >= 3) {
      return NextResponse.json(
        createApiError('Apoiador já tem 3 empréstimos ativos (limite máximo)'),
        { status: 400 }
      );
    }

    // Create endorsement
    const endorsement = await repository.createEndorsement({
      emprestimoId: loanId,
      apoiadorId: validatedData.apoiadorId,
      valorStake: validatedData.valorStake,
    });

    // Get updated endorsements and calculate new coverage
    const allEndorsements = await repository.getEndorsementsForLoan(loanId);
    const totalStaked = allEndorsements.reduce((sum, e) => sum + e.valorStake, 0);
    const coberturaPct = (totalStaked / loan.valorTotal) * 100;

    // Run fraud detection
    const users = await prisma.usuario.findMany();
    const loanInfo = {
      id: loanId,
      valorTotal: loan.valorTotal,
      endossos: allEndorsements.map(e => ({
        apoiadorId: e.apoiadorId,
        valorStake: e.valorStake,
        createdAt: e.createdAt,
      }))
    };

    const fraudAlerts = FraudDetector.runComprehensiveCheck(loanInfo, users);
    
    // Create fraud flags if necessary
    for (const alert of fraudAlerts) {
      await repository.createFraudFlag({
        usuarioId: validatedData.apoiadorId,
        tipo: alert.tipo,
      });
    }

    // Check concentration rule: ≤50% from single supporter
    const concentrationAlert = fraudAlerts.find(a => a.tipo === 'CONCENTRACAO');
    if (concentrationAlert && concentrationAlert.severidade === 'ALTA') {
      return NextResponse.json(
        createApiError('Concentração muito alta. Máximo 50% por apoiador.'),
        { status: 400 }
      );
    }

    // Recalculate borrower score with new coverage
    const borrower = await repository.getUserById(loan.tomadorId);
    if (borrower) {
      const borrowerLoans = await repository.getLoansForUser(loan.tomadorId, 'TOMADOR');
      const allInstallments = await Promise.all(
        borrowerLoans.map(l => repository.getInstallmentsForLoan(l.id))
      );
      const payments = allInstallments.flat().map(installment => ({
        status: installment.status,
        paidAt: installment.paidAt,
      }));

      const hasDefaulted = borrowerLoans.some(l => 
        ['INADIMPLENTE', 'LIQUIDADO_INADIMPLENCIA'].includes(l.estado)
      );

      const scoreInputs = calculateScoreInputsFromHistory(
        borrower.score,
        payments as any,
        hasDefaulted,
        coberturaPct,
        borrower.status === 'SOB_REVISAO'
      );

      const newScore = computeScore(scoreInputs);
      await repository.updateUserScore(loan.tomadorId, newScore);

      // Get updated pricing
      const pricing = priceByScore(newScore, coberturaPct);

      // Log pricing decision
      const params = await repository.getActiveParameters();
      if (params) {
        await decisionLogger.logPricingDecision(
          loanId,
          newScore,
          coberturaPct,
          pricing,
          params.versao
        );
      }
    }

    // Create endorsement event
    await eventManager.createEvent(
      EventHelpers.loanEndorsed(loanId, validatedData.apoiadorId, validatedData.valorStake)
    );

    return NextResponse.json(
      createApiResponse({
        endorsement: {
          id: endorsement.id,
          apoiadorId: endorsement.apoiadorId,
          valorStake: endorsement.valorStake,
          status: endorsement.status,
        },
        coberturaPct,
        totalStaked,
        fraudAlerts: fraudAlerts.map(a => ({ 
          tipo: a.tipo, 
          severidade: a.severidade 
        }))
      })
    );
  } catch (error) {
    console.error('Error creating endorsement:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createApiError('Dados inválidos', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
