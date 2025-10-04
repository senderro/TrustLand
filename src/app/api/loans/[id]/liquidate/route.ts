import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createApiResponse, createApiError } from '@/lib/api';
import { EventManager, EventHelpers } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';
import { Repository } from '@/lib/infra/repo';
import { executeWaterfall } from '@/lib/domain/waterfall';

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

    // Get loan details
    const loan = await repository.getLoanById(loanId, true);
    if (!loan) {
      return NextResponse.json(
        createApiError('Empréstimo não encontrado'),
        { status: 404 }
      );
    }

    // Check if loan can be liquidated
    if (loan.estado !== 'INADIMPLENTE') {
      return NextResponse.json(
        createApiError('Empréstimo não está inadimplente'),
        { status: 400 }
      );
    }

    // Calculate outstanding balance
    const installments = await repository.getInstallmentsForLoan(loanId);
    const outstandingBalance = installments
      .filter(i => i.status !== 'PAGA')
      .reduce((sum, i) => sum + i.valor, 0);

    // Get endorsements (stakes to be used in waterfall)
    const endorsements = loan.endossos || [];
    const stakes = endorsements
      .filter(e => e.status === 'ATIVO')
      .map(e => ({
        apoiadorId: e.apoiadorId,
        stakeAmount: e.valorStake,
      }));

    // Execute waterfall logic
    const waterfallResult = executeWaterfall(
      outstandingBalance,
      loan.colateral || 0,
      stakes,
      1_000_000_000 // 1,000 USDC mutual fund (demo)
    );

    // Update endorsement statuses based on waterfall results
    for (const corte of waterfallResult.cortesPorApoiador) {
      const endorsement = endorsements.find(e => e.apoiadorId === corte.apoiadorId);
      if (endorsement) {
        const newStatus = corte.corte > 0 ? 'CORTADO' : 'LIBERADO';
        await repository.updateEndorsementStatus(endorsement.id, newStatus, {
          dataLiberacao: new Date()
        });
      }
    }

    // Update loan status to liquidated
    await repository.updateLoanStatus(loanId, 'LIQUIDADO_INADIMPLENCIA', {
      dataFim: new Date()
    });

    // Log waterfall decision for audit
    const params = await repository.getActiveParameters();
    if (params) {
      await decisionLogger.logWaterfallDecision(
        loanId,
        {
          outstandingBalance,
          borrowerCollateral: loan.colateral || 0,
          stakes: stakes.map(s => ({ ...s, stakeAmount: s.stakeAmount })),
          mutualFund: 1_000_000_000,
        },
        waterfallResult,
        params.versao
      );
    }

    // Create waterfall event
    await eventManager.createEvent(
      EventHelpers.waterfallExecuted(loanId, {
        breakdown: waterfallResult,
        outstandingBalance,
        recoveryRate: waterfallResult.totalRecuperado / outstandingBalance,
      })
    );

    // Create release events for supporters
    const releasedSupporters = waterfallResult.cortesPorApoiador
      .filter(c => c.liberado > 0)
      .map(c => c.apoiadorId);

    const cutSupporters = waterfallResult.cortesPorApoiador
      .filter(c => c.corte > 0)
      .map(c => c.apoiadorId);

    if (releasedSupporters.length > 0) {
      await eventManager.createEvent(
        EventHelpers.stakesReleased(loanId, releasedSupporters)
      );
    }

    // Calculate final metrics
    const recoveryRate = outstandingBalance > 0 
      ? (waterfallResult.totalRecuperado / outstandingBalance) * 100 
      : 100;

    const shortfall = Math.max(0, outstandingBalance - waterfallResult.totalRecuperado);

    return NextResponse.json(
      createApiResponse({
        liquidation: {
          loanId,
          estado: 'LIQUIDADO_INADIMPLENCIA',
          outstandingBalance,
          recoveryRate,
          shortfall,
        },
        breakdown: {
          colateralUsado: waterfallResult.usadoColateral,
          cortesApoiadores: waterfallResult.cortesPorApoiador.map(c => ({
            apoiadorId: c.apoiadorId,
            stakeOriginal: c.stakeOriginal,
            valorCortado: c.corte,
            valorLiberado: c.liberado,
            percentualCorte: c.stakeOriginal > 0 ? (c.corte / c.stakeOriginal) * 100 : 0,
          })),
          fundoMutualistaUsado: waterfallResult.usadoFundo,
          totalRecuperado: waterfallResult.totalRecuperado,
        },
        summary: {
          apoiadoresAfetados: cutSupporters.length,
          apoiadoresLiberados: releasedSupporters.length,
          perdaTotal: shortfall,
          eficienciaRecuperacao: recoveryRate,
        }
      })
    );
  } catch (error) {
    console.error('Error liquidating loan:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
