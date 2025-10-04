import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { RepayLoanSchema } from '@/lib/domain/validators';
import { createApiResponse, createApiError } from '@/lib/api';
import { EventManager, EventHelpers } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';
import { Repository } from '@/lib/infra/repo';
import { processPayment } from '@/lib/domain/servicing';
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
    const validatedData = RepayLoanSchema.parse(body);

    // Get loan details
    const loan = await repository.getLoanById(loanId, true);
    if (!loan) {
      return NextResponse.json(
        createApiError('Empréstimo não encontrado'),
        { status: 404 }
      );
    }

    // Check if loan is in valid state for repayment
    if (!['ATIVO', 'INADIMPLENTE'].includes(loan.estado)) {
      return NextResponse.json(
        createApiError('Empréstimo não está ativo'),
        { status: 400 }
      );
    }

    // Get current installments
    const installments = await repository.getInstallmentsForLoan(loanId);
    if (installments.length === 0) {
      return NextResponse.json(
        createApiError('Nenhuma parcela encontrada'),
        { status: 400 }
      );
    }

    // Process payment against installments
    const paymentResult = processPayment(
      installments.map(i => ({
        indice: i.indice,
        valor: i.valor,
        status: i.status as 'ABERTA' | 'PAGA' | 'ATRASADA'
      })),
      validatedData.valor,
      new Date()
    );

    // Update paid installments
    const updatedInstallments = [];
    for (const payment of paymentResult.appliedPayments) {
      if (payment.fullyPaid) {
        const updated = await repository.updateInstallmentStatus(
          loanId,
          payment.indice,
          'PAGA',
          new Date()
        );
        updatedInstallments.push(updated);
      }
    }

    // Update loan's total paid amount
    const newTotalPaid = loan.valorPago + validatedData.valor;
    const isFullyPaid = paymentResult.remainingBalance === 0;

    let newLoanStatus = loan.estado;
    let dataFim: Date | undefined;

    if (isFullyPaid) {
      newLoanStatus = 'QUITADO';
      dataFim = new Date();
    } else if (loan.estado === 'INADIMPLENTE' && paymentResult.remainingBalance < loan.valorTotal) {
      // Partial payment on defaulted loan brings it back to active
      newLoanStatus = 'ATIVO';
    }

    await repository.updateLoanStatus(loanId, newLoanStatus as any, {
      valorPago: newTotalPaid,
      dataFim
    });

    // Recalculate borrower score (payment improves score)
    const borrower = await repository.getUserById(loan.tomadorId);
    if (borrower) {
      const borrowerLoans = await repository.getLoansForUser(loan.tomadorId, 'TOMADOR');
      const allInstallments = await Promise.all(
        borrowerLoans.map(l => repository.getInstallmentsForLoan(l.id))
      );
      
      // Get updated installments for this loan
      const updatedLoanInstallments = await repository.getInstallmentsForLoan(loanId);
      
      // Replace old installments with updated ones
      const allUpdatedInstallments = allInstallments.flat().map(inst => {
        const updated = updatedLoanInstallments.find(u => u.id === inst.id);
        return updated || inst;
      });

      const payments = allUpdatedInstallments.map(installment => ({
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

    // If loan is fully paid, release endorsements
    if (isFullyPaid && loan.endossos) {
      const releasedSupporters = [];
      for (const endorsement of loan.endossos) {
        await repository.updateEndorsementStatus(endorsement.id, 'LIBERADO', {
          dataLiberacao: new Date()
        });
        releasedSupporters.push(endorsement.apoiadorId);
      }

      // Create release event
      await eventManager.createEvent(
        EventHelpers.stakesReleased(loanId, releasedSupporters)
      );
    }

    // Create payment event
    await eventManager.createEvent(
      EventHelpers.paymentMade(loanId, validatedData.valor, paymentResult.paidInstallments)
    );

    return NextResponse.json(
      createApiResponse({
        payment: {
          valor: validatedData.valor,
          parcelasPagas: paymentResult.paidInstallments,
          saldoDevedor: paymentResult.remainingBalance,
        },
        loan: {
          id: loan.id,
          estado: newLoanStatus,
          valorPago: newTotalPaid,
          saldoDevedor: paymentResult.remainingBalance,
          quitado: isFullyPaid,
        },
        parcelasAtualizadas: updatedInstallments.map(p => ({
          indice: p.indice,
          valor: p.valor,
          status: p.status,
          paidAt: p.paidAt,
        }))
      })
    );
  } catch (error) {
    console.error('Error processing repayment:', error);
    
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
