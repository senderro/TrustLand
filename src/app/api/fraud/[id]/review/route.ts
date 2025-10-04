import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ReviewFraudSchema } from '@/lib/domain/validators';
import { createApiResponse, createApiError } from '@/lib/api';
import { Repository } from '@/lib/infra/repo';
import { EventManager } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';

const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: flagId } = params;
    const body = await request.json();
    const validatedData = ReviewFraudSchema.parse(body);

    // Get the fraud flag
    const fraudFlag = await prisma.flagFraude.findUnique({
      where: { id: flagId },
      include: {
        usuario: true
      }
    });

    if (!fraudFlag) {
      return NextResponse.json(
        createApiError('Alerta de fraude não encontrado'),
        { status: 404 }
      );
    }

    if (fraudFlag.revisado) {
      return NextResponse.json(
        createApiError('Alerta já foi revisado'),
        { status: 400 }
      );
    }

    // Update the fraud flag
    await repository.updateFraudFlag(flagId, {
      revisado: true,
      resultado: validatedData.resultado,
    });

    // Get all flags for this user to determine status
    const userFlags = await repository.getFraudFlagsForUser(fraudFlag.usuarioId);
    const unreviewedFlags = userFlags.filter(f => !f.revisado && f.id !== flagId);
    const confirmedFlags = userFlags.filter(f => f.revisado && f.resultado === 'CONFIRMADO');

    let newUserStatus = fraudFlag.usuario.status;
    let statusReason = '';

    // Determine new user status based on review result
    if (validatedData.resultado === 'CONFIRMADO') {
      // Confirmed fraud - user should be blocked
      newUserStatus = 'BLOQUEADO';
      statusReason = 'Fraude confirmada em revisão';
    } else if (validatedData.resultado === 'REVERTIDO') {
      // Fraud reverted
      if (unreviewedFlags.length === 0 && confirmedFlags.length === 0) {
        // No pending or confirmed fraud - user can be active
        newUserStatus = 'ATIVO';
        statusReason = 'Todos os alertas de fraude foram revertidos';
      } else if (unreviewedFlags.length === 0 && confirmedFlags.length > 0) {
        // No pending but has confirmed fraud - keep blocked
        newUserStatus = 'BLOQUEADO';
        statusReason = 'Possui outros alertas de fraude confirmados';
      } else {
        // Still has pending flags - keep under review
        newUserStatus = 'SOB_REVISAO';
        statusReason = 'Ainda possui alertas de fraude pendentes';
      }
    }

    // Update user status if changed
    if (newUserStatus !== fraudFlag.usuario.status) {
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
          fraudConfirmed: validatedData.resultado === 'CONFIRMADO',
          userStatus: newUserStatus,
          statusReason,
          timestamp: new Date().toISOString(),
        },
        versao: params.versao
      });
    }

    return NextResponse.json(
      createApiResponse({
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
          statusChanged: newUserStatus !== fraudFlag.usuario.status,
        },
        summary: {
          totalFlags: userFlags.length,
          unreviewedFlags: unreviewedFlags.length,
          confirmedFlags: confirmedFlags.length + (validatedData.resultado === 'CONFIRMADO' ? 1 : 0),
          revertedFlags: userFlags.filter(f => f.resultado === 'REVERTIDO').length + (validatedData.resultado === 'REVERTIDO' ? 1 : 0),
        }
      })
    );
  } catch (error) {
    console.error('Error reviewing fraud alert:', error);
    
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
