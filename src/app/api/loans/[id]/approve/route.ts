import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createApiResponse, createApiError } from "@/lib/api";
import { EventManager, EventHelpers } from "@/lib/infra/events";
import { DecisionLogger } from "@/lib/infra/logger";
import { Repository } from "@/lib/infra/repo";
import { priceByScore } from "@/lib/domain/pricing";
// import { createUSDCContract, createTrustLendContract } from "@/lib/web3/client";

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
    const { searchParams } = new URL(request.url);
    const mockMode = searchParams.get("mock") === "1";

    // Get loan details
    const loan = await repository.getLoanById(loanId, true);
    if (!loan) {
      return NextResponse.json(createApiError("Empréstimo não encontrado"), {
        status: 404,
      });
    }

    // Check if loan is in valid state for approval
    if (loan.estado !== "PENDENTE") {
      return NextResponse.json(createApiError("Empréstimo não está pendente"), {
        status: 400,
      });
    }

    // Get borrower score
    const borrower = await repository.getUserById(loan.tomadorId);
    if (!borrower) {
      return NextResponse.json(createApiError("Tomador não encontrado"), {
        status: 404,
      });
    }

    // Calculate coverage
    const totalStaked =
      loan.endossos?.reduce((sum, e) => sum + e.valorStake, 0) || 0;
    const coberturaPct =
      loan.valorTotal > 0 ? (totalStaked / loan.valorTotal) * 100 : 0;

    // Get pricing requirements
    const pricing = priceByScore(borrower.score, coberturaPct);

    // Check approval requirements
    const approvalChecks = {
      scoreMinimo: borrower.score >= 20, // Minimum score of 20
      coberturaMinima: coberturaPct >= pricing.exigenciaCoberturaPct,
      valorDentroLimite: loan.valorTotal <= pricing.limiteMax,
      apoiadoresMinimos: (loan.endossos?.length || 0) >= 2,
      liquidezDisponivel: true, // Simplified for MVP
    };

    const allChecksPassed = Object.values(approvalChecks).every(Boolean);

    if (!allChecksPassed) {
      return NextResponse.json(
        createApiResponse({
          approved: false,
          checks: approvalChecks,
          requirements: {
            scoreMinimo: 20,
            coberturaMinima: pricing.exigenciaCoberturaPct,
            valorMaximo: pricing.limiteMax,
            apoiadoresMinimos: 2,
          },
          message: "Requisitos de aprovação não atendidos",
        })
      );
    }

    // Log approval decision
    const params = await repository.getActiveParameters();
    if (params) {
      await decisionLogger.logApprovalDecision(
        loanId,
        {
          ...approvalChecks,
          score: borrower.score,
          cobertura: coberturaPct,
          valorEmprestimo: loan.valorTotal,
          apoiadores: loan.endossos?.length || 0,
        },
        true,
        params.versao
      );
    }

    // Update loan status to APROVADO
    await repository.updateLoanStatus(loanId, "APROVADO");

    // Update endorsements to ATIVO
    if (loan.endossos) {
      for (const endorsement of loan.endossos) {
        await repository.updateEndorsementStatus(endorsement.id, "ATIVO", {
          dataBloqueio: new Date(),
        });
      }
    }

    // Create approval event
    await eventManager.createEvent(
      EventHelpers.loanApproved(loanId, new Date()) // In real app, would be operator ID
    );

    // Attempt disbursement (on-chain or simulated)
    let txHash: string | null = null;
    let finalStatus = "APROVADO";

    try {
      if (mockMode || process.env.NODE_ENV === "development") {
        // Simulate disbursement with fake hash
        txHash =
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
      } else {
        // Real on-chain disbursement (temporarily disabled)
        // const trustLendContract = createTrustLendContract();
        // txHash = await trustLendContract.disburseLoan(
        //   loanId,
        //   BigInt(loan.valorTotal)
        // );
        txHash = "0xtemp1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
      }

      if (txHash) {
        // Update to ATIVO if disbursement successful
        await repository.updateLoanStatus(loanId, "ATIVO", {
          dataInicio: new Date(),
        });
        finalStatus = "ATIVO";

        // Create disbursement event
        await eventManager.createEvent(
          EventHelpers.loanDisbursed(loanId, loan.valorTotal, loan.tomadorId)
        );
      }
    } catch (error) {
      console.error("Disbursement failed:", error);
      // Loan remains APROVADO, disbursement can be retried later
    }

    return NextResponse.json(
      createApiResponse({
        approved: true,
        status: finalStatus,
        txHash,
        checks: approvalChecks,
        loan: {
          id: loan.id,
          estado: finalStatus,
          valorTotal: loan.valorTotal,
          coberturaPct,
        },
      })
    );
  } catch (error) {
    console.error("Error approving loan:", error);
    return NextResponse.json(createApiError("Erro interno do servidor"), {
      status: 500,
    });
  }
}
