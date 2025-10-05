import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { ReviewFraudSchema } from "@/lib/domain/validators";
import { Repository } from "@/lib/infra/repo";
import { EventManager } from "@/lib/infra/events";
import { DecisionLogger } from "@/lib/infra/logger";
import { createApiError, createApiResponse } from "@/lib/api";

// Initialize dependencies
const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);

// Define user status enum for type safety
enum UserStatus {
  ATIVO = "ATIVO",
  BLOQUEADO = "BLOQUEADO",
  SOB_REVISAO = "SOB_REVISAO",
}

// Define review result enum for type safety
enum ReviewResult {
  CONFIRMADO = "CONFIRMADO",
  REVERTIDO = "REVERTIDO",
}

export async function POST(
  request: NextRequest,
  { params: routeParams }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract and validate route parameter
    const { id: flagId } = await routeParams;
    if (!flagId) {
      return NextResponse.json(
        createApiError("ID do alerta de fraude não fornecido"),
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ReviewFraudSchema.parse(body);

    // Get the fraud flag with user data
    const fraudFlag = await prisma.flagFraude.findUnique({
      where: { id: flagId },
      include: { usuario: true },
    });

    if (!fraudFlag) {
      return NextResponse.json(
        createApiError("Alerta de fraude não encontrado"),
        { status: 404 }
      );
    }

    if (fraudFlag.revisado) {
      return NextResponse.json(createApiError("Alerta já foi revisado"), {
        status: 400,
      });
    }

    // Update fraud flag
    await repository.updateFraudFlag(flagId, {
      revisado: true,
      resultado: validatedData.resultado,
    });

    // Get all flags for the user
    const userFlags = await repository.getFraudFlagsForUser(
      fraudFlag.usuarioId
    );
    const unreviewedFlags = userFlags.filter(
      (f) => !f.revisado && f.id !== flagId
    );
    const confirmedFlags = userFlags.filter(
      (f) => f.revisado && f.resultado === ReviewResult.CONFIRMADO
    );

    // Determine new user status
    let newUserStatus: UserStatus = fraudFlag.usuario.status as UserStatus;
    let statusReason = "";

    if (validatedData.resultado === ReviewResult.CONFIRMADO) {
      newUserStatus = UserStatus.BLOQUEADO;
      statusReason = "Fraude confirmada em revisão";
    } else if (validatedData.resultado === ReviewResult.REVERTIDO) {
      if (unreviewedFlags.length === 0 && confirmedFlags.length === 0) {
        newUserStatus = UserStatus.ATIVO;
        statusReason = "Todos os alertas de fraude foram revertidos";
      } else if (unreviewedFlags.length === 0 && confirmedFlags.length > 0) {
        newUserStatus = UserStatus.BLOQUEADO;
        statusReason = "Possui outros alertas de fraude confirmados";
      } else {
        newUserStatus = UserStatus.SOB_REVISAO;
        statusReason = "Ainda possui alertas de fraude pendentes";
      }
    }

    // Update user status if changed
    if (newUserStatus !== (fraudFlag.usuario.status as UserStatus)) {
      await repository.updateUserStatus(fraudFlag.usuarioId, newUserStatus);
    }

    // Log the review decision
    const params = await repository.getActiveParameters();
    if (params) {
      await decisionLogger.logDecision({
        inputDados: {
          fraudFlagId: flagId,
          usuarioId: fraudFlag.usuarioId,
          fraudType: fraudFlag.tipo,
          reviewAction: validatedData.resultado,
          observacoes: validatedData.observacoes,
        },
        resultado: {
          fraudConfirmed: validatedData.resultado === ReviewResult.CONFIRMADO,
          userStatus: newUserStatus,
          statusReason,
          timestamp: new Date().toISOString(),
        },
        versao: params.versao,
      });
    }

    // Prepare response
    const response = createApiResponse({
      review: {
        fraudFlagId: flagId,
        resultado: validatedData.resultado,
        observacoes: validatedData.observacoes,
        reviewedAt: new Date().toISOString(),
      },
      userUpdate: {
        userId: fraudFlag.usuarioId,
        previousStatus: fraudFlag.usuario.status,
        newStatus: newUserStatus,
        statusReason,
        statusChanged:
          newUserStatus !== (fraudFlag.usuario.status as UserStatus),
      },
      summary: {
        totalFlags: userFlags.length,
        unreviewedFlags: unreviewedFlags.length,
        confirmedFlags:
          confirmedFlags.length +
          (validatedData.resultado === ReviewResult.CONFIRMADO ? 1 : 0),
        revertedFlags:
          userFlags.filter((f) => f.resultado === ReviewResult.REVERTIDO)
            .length +
          (validatedData.resultado === ReviewResult.REVERTIDO ? 1 : 0),
      },
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error reviewing fraud alert:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createApiError("Dados inválidos", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    return NextResponse.json(createApiError("Erro interno do servidor"), {
      status: 500,
    });
  } finally {
    // Ensure Prisma client is disconnected
    await prisma.$disconnect();
  }
}
