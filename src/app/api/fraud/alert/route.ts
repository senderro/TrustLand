import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { CreateFraudAlertSchema } from '@/lib/domain/validators';
import { createApiResponse, createApiError } from '@/lib/api';
import { Repository } from '@/lib/infra/repo';
import { EventManager } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';

const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateFraudAlertSchema.parse(body);

    // Check if user exists
    const user = await repository.getUserById(validatedData.usuarioId);
    if (!user) {
      return NextResponse.json(
        createApiError('Usuário não encontrado'),
        { status: 404 }
      );
    }

    // Create fraud flag
    const fraudFlag = await repository.createFraudFlag({
      usuarioId: validatedData.usuarioId,
      tipo: validatedData.tipo,
    });

    // Check if user should be put under review
    const existingFlags = await repository.getFraudFlagsForUser(validatedData.usuarioId);
    const unreviewed = existingFlags.filter(f => !f.revisado);

    let shouldReview = false;
    let reviewReason = '';

    // Rules for automatic review
    if (unreviewed.length >= 3) {
      shouldReview = true;
      reviewReason = 'Múltiplos alertas de fraude não revisados';
    } else if (['MULTICONTA', 'CONCENTRACAO'].includes(validatedData.tipo)) {
      shouldReview = true;
      reviewReason = `Alerta de alta severidade: ${validatedData.tipo}`;
    }

    // Update user status if needed
    if (shouldReview && user.status === 'ATIVO') {
      await repository.updateUserStatus(validatedData.usuarioId, 'SOB_REVISAO');
    }

    return NextResponse.json(
      createApiResponse({
        fraudFlag: {
          id: fraudFlag.id,
          usuarioId: fraudFlag.usuarioId,
          tipo: fraudFlag.tipo,
          createdAt: fraudFlag.createdAt,
          revisado: fraudFlag.revisado,
        },
        action: {
          userUnderReview: shouldReview,
          reason: reviewReason,
          blockDuration: shouldReview ? 30 : 0, // 30 seconds as specified
        },
        user: {
          id: user.id,
          status: shouldReview ? 'SOB_REVISAO' : user.status,
          totalFlags: existingFlags.length + 1,
          unreviewedFlags: unreviewed.length + 1,
        }
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating fraud alert:', error);
    
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
    const usuarioId = searchParams.get('usuarioId');
    const revisado = searchParams.get('revisado');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause: any = {};
    
    if (usuarioId) {
      whereClause.usuarioId = usuarioId;
    }
    
    if (revisado !== null) {
      whereClause.revisado = revisado === 'true';
    }

    const fraudFlags = await prisma.flagFraude.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            carteira: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    return NextResponse.json(
      createApiResponse({
        flags: fraudFlags.map(flag => ({
          id: flag.id,
          usuarioId: flag.usuarioId,
          usuario: flag.usuario,
          tipo: flag.tipo,
          createdAt: flag.createdAt,
          revisado: flag.revisado,
          resultado: flag.resultado,
        })),
        summary: {
          total: fraudFlags.length,
          revisadas: fraudFlags.filter(f => f.revisado).length,
          pendentes: fraudFlags.filter(f => !f.revisado).length,
        }
      })
    );
  } catch (error) {
    console.error('Error fetching fraud alerts:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
