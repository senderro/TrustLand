import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Helper functions
function createApiResponse(data: any) {
  return { success: true, data };
}

function createApiError(message: string, code?: string) {
  return { success: false, error: message, code };
}

function createDeterministicHash(data: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const recompute = searchParams.get('recompute') === '1';

    // Try to find loan first
    const loan = await prisma.emprestimo.findUnique({
      where: { id },
      include: {
        tomador: {
          select: {
            nome: true,
            score: true,
          }
        },
        parcelas: {
          select: {
            indice: true,
            valor: true,
            status: true,
            dueAt: true,
          },
          orderBy: { indice: 'asc' }
        },
        endossos: {
          select: {
            valorStake: true,
            status: true,
            apoiador: {
              select: {
                nome: true,
              }
            }
          }
        }
      }
    });

    if (!loan) {
      return NextResponse.json(
        createApiError('Recurso não encontrado para auditoria'),
        { status: 404 }
      );
    }

    // Get related events
    const events = await prisma.evento.findMany({
      where: { referenciaId: id },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate hash verification
    const currentData = {
      tomadorId: loan.tomadorId,
      valorTotal: loan.valorTotal,
      taxaAnualBps: loan.taxaAnualBps,
      prazoParcelas: loan.prazoParcelas,
      colateral: loan.colateral,
      estado: loan.estado,
    };

    const computedHash = createDeterministicHash(currentData);
    const hashVerification = {
      valid: computedHash === loan.hashRegras,
      storedHash: loan.hashRegras,
      computedHash: computedHash,
    };

    // Build audit trail
    const auditTrail = events.map((event, index) => ({
      type: 'event' as const,
      id: event.id,
      timestamp: event.timestamp,
      sequence: index + 1,
      eventType: event.tipo,
      data: event.detalhes,
    }));

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
          tomador: loan.tomador,
        },
        hashVerification,
        relatedEvents: events.map(e => ({
          id: e.id,
          tipo: e.tipo,
          timestamp: e.timestamp,
          detalhes: e.detalhes
        })),
        auditTrail,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'recompute') {
      return NextResponse.json(
        createApiError('Ação não suportada'),
        { status: 400 }
      );
    }

    // Get the loan
    const loan = await prisma.emprestimo.findUnique({
      where: { id }
    });

    if (!loan) {
      return NextResponse.json(
        createApiError('Empréstimo não encontrado'),
        { status: 404 }
      );
    }

    // Recompute hash
    const currentData = {
      tomadorId: loan.tomadorId,
      valorTotal: loan.valorTotal,
      taxaAnualBps: loan.taxaAnualBps,
      prazoParcelas: loan.prazoParcelas,
      colateral: loan.colateral,
      estado: loan.estado,
    };

    const computedHash = createDeterministicHash(currentData);
    const verification = {
      valid: computedHash === loan.hashRegras,
      storedHash: loan.hashRegras,
      computedHash: computedHash,
    };

    // Create audit event for recomputation
    await prisma.evento.create({
      data: {
        tipo: 'RECOMPUTE_HASH',
        referenciaId: id,
        detalhes: JSON.stringify({
          verification,
          recomputeTimestamp: new Date().toISOString(),
        }),
        idempotencyKey: `recompute_${id}_${Date.now()}`,
      },
    });

    return NextResponse.json(
      createApiResponse({
        resourceType: 'loan',
        resourceId: id,
        hashVerification: verification,
        recomputed: true,
        timestamp: new Date().toISOString(),
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
