import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createApiResponse, createApiError } from '@/lib/api';
import { DecisionLogger } from '@/lib/infra/logger';
import { EventManager } from '@/lib/infra/events';
import { Repository } from '@/lib/infra/repo';
import { createDeterministicHash } from '@/lib/utils/hash';

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
    const { searchParams } = new URL(request.url);
    const recompute = searchParams.get('recompute') === '1';

    // Check if ID is a loan ID or decision log ID
    let decisionLog;
    let loan;

    // Try to find decision log by ID first
    decisionLog = await decisionLogger.getDecisionById(id);

    if (!decisionLog) {
      // Try to find loan and its decisions
      loan = await repository.getLoanById(id);
      if (!loan) {
        return NextResponse.json(
          createApiError('Recurso não encontrado para auditoria'),
          { status: 404 }
        );
      }

      // Get all decisions for this loan
      const decisions = await decisionLogger.getDecisionsForLoan(id);
      
      return NextResponse.json(
        createApiResponse({
          resourceType: 'loan',
          resourceId: id,
          loan: {
            id: loan.id,
            valorTotal: loan.valorTotal,
            estado: loan.estado,
            hashRegras: loan.hashRegras,
            createdAt: loan.createdAt,
          },
          decisions: decisions.map(d => ({
            id: d.id,
            inputDados: d.inputDados,
            resultado: d.resultado,
            hashDecisao: d.hashDecisao,
            createdAt: d.createdAt,
          })),
          auditTrail: await getAuditTrail(id),
        })
      );
    }

    // Handle single decision audit
    const params = await repository.getActiveParameters();
    let hashVerification = null;

    if (recompute && params) {
      // Recompute hash and verify
      hashVerification = await decisionLogger.verifyDecisionHash(id, params.versao);
    }

    // Get related events
    const relatedEvents = decisionLog.emprestimoId 
      ? await eventManager.getEventsForReference(decisionLog.emprestimoId)
      : [];

    return NextResponse.json(
      createApiResponse({
        resourceType: 'decision',
        resourceId: id,
        decision: {
          id: decisionLog.id,
          emprestimoId: decisionLog.emprestimoId,
          inputDados: decisionLog.inputDados,
          resultado: decisionLog.resultado,
          hashDecisao: decisionLog.hashDecisao,
          createdAt: decisionLog.createdAt,
        },
        hashVerification,
        relatedEvents: relatedEvents.map(e => ({
          id: e.id,
          tipo: e.tipo,
          timestamp: e.timestamp,
          detalhes: e.detalhes
        })),
        recomputed: recompute,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Error fetching audit data:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const recompute = searchParams.get('recompute') === '1';

    if (!recompute) {
      return NextResponse.json(
        createApiError('Ação não especificada'),
        { status: 400 }
      );
    }

    // Get the decision log
    const decisionLog = await decisionLogger.getDecisionById(id);
    if (!decisionLog) {
      return NextResponse.json(
        createApiError('Log de decisão não encontrado'),
        { status: 404 }
      );
    }

    // Get current system parameters
    const params = await repository.getActiveParameters();
    if (!params) {
      return NextResponse.json(
        createApiError('Parâmetros do sistema não encontrados'),
        { status: 500 }
      );
    }

    // Recompute and verify hash
    const verification = await decisionLogger.verifyDecisionHash(id, params.versao);
    
    // Create recomputation audit trail
    const recomputeHash = createDeterministicHash({
      originalDecisionId: id,
      recomputeTimestamp: new Date().toISOString(),
      verification,
      systemVersion: params.versao,
    });

    // Log the recomputation itself
    await decisionLogger.logDecision({
      inputDados: {
        action: 'RECOMPUTE_HASH',
        targetDecisionId: id,
        systemVersion: params.versao,
      },
      resultado: {
        verification,
        recomputeTimestamp: new Date().toISOString(),
      },
      versao: params.versao
    });

    return NextResponse.json(
      createApiResponse({
        recomputation: {
          targetDecisionId: id,
          verification,
          recomputeHash,
          timestamp: new Date().toISOString(),
          systemVersion: params.versao,
        },
        integrity: {
          valid: verification.valid,
          storedHash: verification.storedHash,
          computedHash: verification.computedHash,
          message: verification.valid 
            ? 'Hash verificado com sucesso - integridade mantida'
            : 'ALERTA: Hash não confere - possível corrupção de dados'
        }
      })
    );
  } catch (error) {
    console.error('Error recomputing audit hash:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

// Helper function to get complete audit trail
async function getAuditTrail(loanId: string) {
  const [decisions, events] = await Promise.all([
    decisionLogger.getDecisionsForLoan(loanId),
    eventManager.getEventsForReference(loanId)
  ]);

  // Merge and sort by timestamp
  const auditEntries = [
    ...decisions.map(d => ({
      type: 'decision',
      id: d.id,
      timestamp: d.createdAt,
      hash: d.hashDecisao,
      data: { inputDados: d.inputDados, resultado: d.resultado }
    })),
    ...events.map(e => ({
      type: 'event',
      id: e.id,
      timestamp: e.timestamp,
      eventType: e.tipo,
      data: e.detalhes
    }))
  ];

  return auditEntries
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((entry, index) => ({ ...entry, sequence: index + 1 }));
}
