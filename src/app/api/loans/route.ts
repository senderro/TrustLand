import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { CreateLoanSchema } from '@/lib/domain/validators';
import { createApiResponse, createApiError } from '@/lib/api';
import { EventManager, EventHelpers } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';
import { Repository } from '@/lib/infra/repo';
import { computeScore, calculateScoreInputsFromHistory } from '@/lib/domain/score';
import { priceByScore } from '@/lib/domain/pricing';
import { generateInstallments } from '@/lib/domain/servicing';
import { EntityHasher } from '@/lib/utils/hash';
import { LoanIdempotencyKeys } from '@/lib/infra/idempotency';

const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateLoanSchema.parse(body);

    // Check if borrower exists and is active
    const borrower = await repository.getUserById(validatedData.tomadorId);
    if (!borrower) {
      return NextResponse.json(
        createApiError('Tomador não encontrado'),
        { status: 404 }
      );
    }

    if (borrower.tipo !== 'TOMADOR') {
      return NextResponse.json(
        createApiError('Usuário não é um tomador'),
        { status: 400 }
      );
    }

    if (borrower.status !== 'ATIVO') {
      return NextResponse.json(
        createApiError('Tomador não está ativo'),
        { status: 400 }
      );
    }

    // Get system parameters
    const params = await repository.getActiveParameters();
    if (!params) {
      return NextResponse.json(
        createApiError('Parâmetros do sistema não configurados'),
        { status: 500 }
      );
    }

    // Calculate borrower's current score
    const borrowerLoans = await repository.getLoansForUser(validatedData.tomadorId, 'TOMADOR');
    const allInstallments = await Promise.all(
      borrowerLoans.map(loan => repository.getInstallmentsForLoan(loan.id))
    );
    const payments = allInstallments.flat().map(installment => ({
      status: installment.status,
      paidAt: installment.paidAt,
    }));

    const hasDefaulted = borrowerLoans.some(loan => 
      ['INADIMPLENTE', 'LIQUIDADO_INADIMPLENCIA'].includes(loan.estado)
    );

    const scoreInputs = calculateScoreInputsFromHistory(
      borrower.score,
      payments as any,
      hasDefaulted,
      0, // Coverage will be calculated after endorsements
      borrower.status === 'SOB_REVISAO'
    );

    const currentScore = computeScore(scoreInputs);

    // Get pricing based on score (0% coverage initially)
    const pricing = priceByScore(currentScore, 0);

    // Validate loan amount against credit limit
    if (validatedData.principal > pricing.limiteMax) {
      return NextResponse.json(
        createApiError(`Valor excede o limite de crédito: ${pricing.limiteMax / 1_000_000} USDC`),
        { status: 400 }
      );
    }

    // Create hash for rules version
    const hashRegras = EntityHasher.loan({
      tomadorId: validatedData.tomadorId,
      valorTotal: validatedData.principal,
      taxaAnualBps: pricing.aprFinalBps,
      prazoParcelas: validatedData.termDays,
      colateral: validatedData.colateral || 0,
    });

    // Create loan in database
    const loan = await repository.createLoan({
      tomadorId: validatedData.tomadorId,
      valorTotal: validatedData.principal,
      taxaAnualBps: pricing.aprFinalBps,
      prazoParcelas: validatedData.termDays,
      colateral: validatedData.colateral || 0,
      hashRegras,
    });

    // Generate installment schedule
    const installments = generateInstallments(
      validatedData.principal,
      pricing.aprFinalBps,
      validatedData.termDays,
      validatedData.termDays, // One installment per day in simulation
      params.tempoParcelaS
    );

    // Create installments in database
    await repository.createInstallments(
      installments.map((installment, index) => ({
        emprestimoId: loan.id,
        indice: installment.indice,
        valor: installment.valor,
        dueAt: new Date(installment.dueAt),
      }))
    );

    // Create creation event
    const eventResult = await eventManager.createEvent(
      EventHelpers.loanCreated(loan.id, validatedData.tomadorId, validatedData.principal, pricing)
    );

    // Log decision for audit
    await decisionLogger.logPricingDecision(
      loan.id,
      currentScore,
      0, // Initial coverage
      pricing,
      params.versao
    );

    // Update borrower score
    await repository.updateUserScore(validatedData.tomadorId, currentScore);

    return NextResponse.json(
      createApiResponse({
        loan: {
          id: loan.id,
          tomadorId: loan.tomadorId,
          valorTotal: loan.valorTotal,
          taxaAnualBps: loan.taxaAnualBps,
          prazoParcelas: loan.prazoParcelas,
          estado: loan.estado,
          colateral: loan.colateral,
          hashRegras: loan.hashRegras,
          createdAt: loan.createdAt,
        },
        score: currentScore,
        pricing,
        installments,
        hash: hashRegras,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating loan:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tomadorId = searchParams.get('tomadorId');
    const estado = searchParams.get('estado');
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereClause: any = {};
    
    if (tomadorId) {
      whereClause.tomadorId = tomadorId;
    }
    
    if (estado) {
      whereClause.estado = estado;
    }

    const loans = await prisma.emprestimo.findMany({
      where: whereClause,
      include: {
        tomador: {
          select: {
            id: true,
            nome: true,
            carteira: true,
            score: true,
          }
        },
        parcelas: {
          select: {
            id: true,
            indice: true,
            valor: true,
            dueAt: true,
            status: true,
          },
          orderBy: { indice: 'asc' }
        },
        endossos: {
          select: {
            id: true,
            apoiadorId: true,
            valorStake: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // Max 100 loans
    });

    return NextResponse.json(
      createApiResponse(loans)
    );
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
