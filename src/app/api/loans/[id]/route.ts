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

    // Get loan with full details
    const loan = await repository.getLoanById(id, true);
    if (!loan) {
      return NextResponse.json(
        createApiError('Empréstimo não encontrado'),
        { status: 404 }
      );
    }

    // Get events for this loan
    const events = await eventManager.getEventsForReference(id);

    // Calculate coverage percentage
    const totalStaked = loan.endossos?.reduce((sum, e) => sum + e.valorStake, 0) || 0;
    const coberturaPct = loan.valorTotal > 0 ? (totalStaked / loan.valorTotal) * 100 : 0;

    // Calculate amounts owed
    const totalOwed = loan.parcelas?.reduce((sum, p) => 
      p.status !== 'PAGA' ? sum + p.valor : sum, 0
    ) || 0;

    const overdueAmount = loan.parcelas?.reduce((sum, p) => 
      p.status === 'ATRASADA' ? sum + p.valor : sum, 0
    ) || 0;

    return NextResponse.json(
      createApiResponse({
        loan: {
          ...loan,
          coberturaPct,
          totalOwed,
          overdueAmount
        },
        parcelas: loan.parcelas || [],
        endossos: loan.endossos || [],
        events
      })
    );
  } catch (error) {
    console.error('Error fetching loan details:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
