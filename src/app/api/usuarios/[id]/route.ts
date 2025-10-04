import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createApiResponse, createApiError } from '@/lib/api';
import { EventManager } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';
import { Repository } from '@/lib/infra/repo';

const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get user details
    const user = await repository.getUserById(id);
    if (!user) {
      return NextResponse.json(
        createApiError('Usuário não encontrado'),
        { status: 404 }
      );
    }

    // Get fraud flags
    const flagsFraude = await repository.getFraudFlagsForUser(id);

    // Get loans summary based on user type
    let emprestimosResumo = [];
    
    if (user.tipo === 'TOMADOR' || user.tipo === 'APOIADOR') {
      const loans = await repository.getLoansForUser(id, user.tipo);
      emprestimosResumo = loans.map(loan => ({
        id: loan.id,
        valorTotal: loan.valorTotal,
        estado: loan.estado,
        createdAt: loan.createdAt
      }));
    }

    return NextResponse.json(
      createApiResponse({
        ...user,
        flagsFraude,
        emprestimosResumo
      })
    );
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
