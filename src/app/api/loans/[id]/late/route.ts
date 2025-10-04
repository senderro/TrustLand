import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { LateLoanSchema } from '@/lib/domain/validators';
import { createApiResponse, createApiError } from '@/lib/api';
import { EventManager, EventHelpers } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';
import { Repository } from '@/lib/infra/repo';
import { updateInstallmentStatus } from '@/lib/domain/servicing';
import { computeScore, calculateScoreInputsFromHistory } from '@/lib/domain/score';

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
    const validatedData = LateLoanSchema.parse(body);

    // Get loan details
    const loan = await repository.getLoanById(loanId, true);
    if (!loan) {
      return NextResponse.json(
        createApiError('Empréstimo não encontrado'),
        { status: 404 }
      );
    }

    // Check if loan is in valid state
    if (loan.estado !== 'ATIVO') {
      return NextResponse.json(
        createApiError('Empréstimo não está ativo'),
        { status: 400 }
      );
    }

    // Get current installments
    const installments = await repository.getInstallmentsForLoan(loanId);
    const currentTime = new Date();

    // Find overdue installments and mark them as late
    const overdueUpdates = updateInstallmentStatus(
      installments.map(i => ({
        indice: i.indice,
        valor: i.valor,
        dueAt: i.dueAt,
        status: i.status as 'ABERTA' | 'PAGA' | 'ATRASADA',
        paidAt: i.paidAt,
      })),
      currentTime
    );

    // Update installments that became overdue
    const updatedInstallments = [];
    for (const update of overdueUpdates) {
      if (update.wasUpdated && update.status === 'ATRASADA') {
        const updated = await repository.updateInstallmentStatus(
          loanId,
          update.indice,
          'ATRASADA'
        );
        updatedInstallments.push(updated);
      }
    }

    // Recalculate borrower score (late payments reduce score)
    const borrower = await repository.getUserById(loan.tomadorId);
    if (borrower && updatedInstallments.length > 0) {
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

      const totalStaked = loan.endossos?.reduce((sum, e) => sum + e.valorStake, 0) || 0;
      const coberturaPct = loan.valorTotal > 0 ? (totalStaked / loan.valorTotal) * 100 : 0;

      const scoreInputs = calculateScoreInputsFromHistory(
        borrower.score,
        payments as any,
        hasDefaulted,
        coberturaPct,
        borrower.status === 'SOB_REVISAO'
      );

      const newScore = computeScore(scoreInputs);
      await repository.updateUserScore(loan.tomadorId, newScore);

      // Log score recalculation
      await eventManager.createEvent(
        EventHelpers.scoreRecalculated(loan.tomadorId, borrower.score, newScore, scoreInputs)
      );
    }

    // Create late payment event
    await eventManager.createEvent(
      EventHelpers.loanLate(loanId, validatedData.motivo)
    );

    // Check if loan should be marked as default
    // Rule: More than 30 seconds overdue (accelerated time) or system tolerance
    const params = await repository.getActiveParameters();
    const toleranceSeconds = params?.toleranciaAtraso || 30;
    
    const overdueInstallments = installments.filter(i => {
      const timeDiff = (currentTime.getTime() - i.dueAt.getTime()) / 1000;
      return i.status !== 'PAGA' && timeDiff > toleranceSeconds;
    });

    let shouldDefault = false;
    if (overdueInstallments.length >= 3) {
      // Rule: 3 or more overdue installments triggers default
      shouldDefault = true;
    } else {
      // Check if any installment is severely overdue (more than 2x tolerance)
      const severelyOverdue = overdueInstallments.some(i => {
        const timeDiff = (currentTime.getTime() - i.dueAt.getTime()) / 1000;
        return timeDiff > (toleranceSeconds * 2);
      });
      shouldDefault = severelyOverdue;
    }

    return NextResponse.json(
      createApiResponse({
        lateInstallments: updatedInstallments.map(p => ({
          indice: p.indice,
          valor: p.valor,
          status: p.status,
          dueAt: p.dueAt,
        })),
        loan: {
          id: loan.id,
          estado: loan.estado,
        },
        shouldDefault,
        overdueCount: overdueInstallments.length,
        toleranceSeconds,
        recommendation: shouldDefault 
          ? 'Empréstimo deve ser marcado como inadimplente'
          : 'Empréstimo ainda dentro da tolerância'
      })
    );
  } catch (error) {
    console.error('Error marking loan as late:', error);
    
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
