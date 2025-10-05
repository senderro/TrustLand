import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createApiResponse, createApiError } from "@/lib/api";
import { EventManager, EventHelpers } from "@/lib/infra/events";
import { DecisionLogger } from "@/lib/infra/logger";
import { Repository } from "@/lib/infra/repo";
import {
  computeScore,
  calculateScoreInputsFromHistory,
} from "@/lib/domain/score";

const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);
export async function POST(
  request: NextRequest,
  { params: routeParams }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: loanId } = await routeParams;

    const loan = await repository.getLoanById(loanId, true);
    if (!loan) {
      return NextResponse.json(createApiError("Empréstimo não encontrado"), {
        status: 404,
      });
    }

    // Check if loan can be marked as default
    if (!["ATIVO", "APROVADO"].includes(loan.estado)) {
      return NextResponse.json(
        createApiError("Empréstimo não pode ser marcado como inadimplente"),
        { status: 400 }
      );
    }

    // Get installments to check overdue status
    const installments = await repository.getInstallmentsForLoan(loanId);
    const currentTime = new Date();

    // Get system parameters for tolerance check
    const params = await repository.getActiveParameters();
    const toleranceSeconds = params?.toleranciaAtraso || 30;

    // Check if default is justified
    const overdueInstallments = installments.filter((i) => {
      if (i.status === "PAGA") return false;
      const timeDiff = (currentTime.getTime() - i.dueAt.getTime()) / 1000;
      return timeDiff > toleranceSeconds;
    });

    const justificationChecks = {
      hasOverdueInstallments: overdueInstallments.length > 0,
      overdueCount: overdueInstallments.length,
      multipleOverdue: overdueInstallments.length >= 2,
      severelyOverdue: overdueInstallments.some((i) => {
        const timeDiff = (currentTime.getTime() - i.dueAt.getTime()) / 1000;
        return timeDiff > toleranceSeconds * 3; // 3x tolerance = severely overdue
      }),
    };

    const isJustified =
      justificationChecks.hasOverdueInstallments &&
      (justificationChecks.multipleOverdue ||
        justificationChecks.severelyOverdue);

    if (!isJustified) {
      return NextResponse.json(
        createApiResponse({
          canDefault: false,
          reason: "Não há justificativa suficiente para inadimplência",
          checks: justificationChecks,
          recommendation: "Aguardar mais atrasos ou usar tolerância maior",
        })
      );
    }

    // Update loan status to INADIMPLENTE
    await repository.updateLoanStatus(loanId, "INADIMPLENTE");

    // Update all unpaid installments to ATRASADA
    for (const installment of installments) {
      if (installment.status === "ABERTA") {
        await repository.updateInstallmentStatus(
          loanId,
          installment.indice,
          "ATRASADA"
        );
      }
    }

    // Recalculate borrower score (default severely reduces score)
    const borrower = await repository.getUserById(loan.tomadorId);
    if (borrower) {
      const borrowerLoans = await repository.getLoansForUser(
        loan.tomadorId,
        "TOMADOR"
      );

      // Update this loan's status in memory for score calculation
      const updatedLoans = borrowerLoans.map((l) =>
        l.id === loanId ? { ...l, estado: "INADIMPLENTE" as any } : l
      );

      const allInstallments = await Promise.all(
        updatedLoans.map((l) => repository.getInstallmentsForLoan(l.id))
      );

      const payments = allInstallments.flat().map((installment) => ({
        status: installment.status,
        paidAt: installment.paidAt,
      }));

      const hasDefaulted = true; // This loan is now defaulted

      const totalStaked =
        loan.endossos?.reduce((sum, e) => sum + e.valorStake, 0) || 0;
      const coberturaPct =
        loan.valorTotal > 0 ? (totalStaked / loan.valorTotal) * 100 : 0;

      const scoreInputs = calculateScoreInputsFromHistory(
        borrower.score,
        payments as any,
        hasDefaulted,
        coberturaPct,
        borrower.status === "SOB_REVISAO"
      );

      const newScore = computeScore(scoreInputs);
      await repository.updateUserScore(loan.tomadorId, newScore);

      // Log score recalculation - using generic event
      await eventManager.createEvent({
        tipo: 'SCORE_RECALCULADO',
        referenciaId: loan.tomadorId,
        detalhes: {
          usuarioId: loan.tomadorId,
          scoreAnterior: borrower.score,
          novoScore: newScore,
          scoreInputs,
          timestamp: new Date()
        },
        idempotencyKey: EventManager.generateIdempotencyKey('score_recalc', loan.tomadorId, { newScore })
      });
    }

    // Log default decision
    if (params) {
      await decisionLogger.logDecision({
        emprestimoId: loanId,
        inputDados: {
          overdueInstallments: overdueInstallments.length,
          toleranceSeconds,
          checks: justificationChecks,
        },
        resultado: {
          defaulted: true,
          timestamp: currentTime.toISOString(),
        },
        versao: params.versao,
      });
    }

    // Create default event
    await eventManager.createEvent({
      tipo: 'INADIMPLENCIA',
      referenciaId: loanId,
      detalhes: {
        loanId,
        timestamp: new Date()
      },
      idempotencyKey: EventManager.generateIdempotencyKey('default', loanId)
    });

    // Calculate outstanding balance for liquidation info
    const outstandingBalance = installments
      .filter((i) => i.status !== "PAGA")
      .reduce((sum, i) => sum + i.valor, 0);

    return NextResponse.json(
      createApiResponse({
        loan: {
          id: loan.id,
          estado: "INADIMPLENTE",
          outstandingBalance,
        },
        defaultInfo: {
          overdueInstallments: overdueInstallments.length,
          outstandingBalance,
          canLiquidate: true,
          nextStep: "Executar liquidação (waterfall)",
        },
        justification: justificationChecks,
      })
    );
  } catch (error) {
    console.error("Error marking loan as default:", error);
    return NextResponse.json(createApiError("Erro interno do servidor"), {
      status: 500,
    });
  }
}
