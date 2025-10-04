import { PrismaClient } from '@prisma/client';

export interface EventData {
  tipo: string;
  referenciaId: string;
  detalhes: Record<string, any>;
  idempotencyKey: string;
}

export interface EventResult {
  id: string;
  created: boolean;
}

export class EventManager {
  constructor(private prisma: PrismaClient) {}

  async createEvent(data: EventData): Promise<EventResult> {
    try {
      const event = await this.prisma.evento.create({
        data: {
          tipo: data.tipo,
          referenciaId: data.referenciaId,
          detalhes: JSON.stringify(data.detalhes),
          idempotencyKey: data.idempotencyKey
        }
      });

      return {
        id: event.id,
        created: true
      };
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('idempotencyKey')) {
        const existingEvent = await this.prisma.evento.findUnique({
          where: { idempotencyKey: data.idempotencyKey }
        });
        
        return {
          id: existingEvent?.id || '',
          created: false
        };
      }
      throw error;
    }
  }

  async getEventsForReference(referenciaId: string): Promise<Array<{
    id: string;
    tipo: string;
    detalhes: Record<string, any>;
    timestamp: Date;
  }>> {
    const events = await this.prisma.evento.findMany({
      where: { referenciaId },
      orderBy: { timestamp: 'asc' }
    });

    return events.map((event: any) => ({
      id: event.id,
      tipo: event.tipo,
      detalhes: JSON.parse(event.detalhes),
      timestamp: event.timestamp
    }));
  }

  async getRecentEvents(
    limit: number = 10,
    tipos?: string[]
  ): Promise<Array<{
    id: string;
    tipo: string;
    referenciaId: string;
    detalhes: Record<string, any>;
    timestamp: Date;
  }>> {
    const events = await this.prisma.evento.findMany({
      where: tipos ? { tipo: { in: tipos } } : undefined,
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return events.map((event: any) => ({
      id: event.id,
      tipo: event.tipo,
      referenciaId: event.referenciaId,
      detalhes: JSON.parse(event.detalhes),
      timestamp: event.timestamp
    }));
  }

  static generateIdempotencyKey(
    action: string,
    resourceId: string,
    additionalData?: Record<string, any>
  ): string {
    const data = {
      action,
      resourceId,
      timestamp: Date.now(),
      ...additionalData
    };
    
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const encoded = encoder.encode(dataString);
    const hashArray = Array.from(encoded);
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 32);
  }

  async eventExists(idempotencyKey: string): Promise<boolean> {
    const count = await this.prisma.evento.count({
      where: { idempotencyKey }
    });
    return count > 0;
  }
}

export async function emitLoanCreatedEvent(
  prisma: PrismaClient,
  loanId: string,
  details: Record<string, any>
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'CRIACAO',
    referenciaId: loanId,
    detalhes: details,
    idempotencyKey: EventManager.generateIdempotencyKey('loan_create', loanId, details)
  });
}

export async function emitEndorsementEvent(
  prisma: PrismaClient,
  loanId: string,
  endorsementId: string,
  details: Record<string, any>
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'APOIO',
    referenciaId: loanId,
    detalhes: { endorsementId, ...details },
    idempotencyKey: EventManager.generateIdempotencyKey('endorse', loanId, { endorsementId })
  });
}

export async function emitScoreUpdateEvent(
  prisma: PrismaClient,
  userId: string,
  oldScore: number,
  newScore: number,
  reason: string
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'SCORE_RECALC',
    referenciaId: userId,
    detalhes: { oldScore, newScore, delta: newScore - oldScore, reason },
    idempotencyKey: EventManager.generateIdempotencyKey('score_update', userId, { newScore, reason })
  });
}

export async function emitApprovalEvent(
  prisma: PrismaClient,
  loanId: string,
  details: Record<string, any>
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'APROVACAO',
    referenciaId: loanId,
    detalhes: details,
    idempotencyKey: EventManager.generateIdempotencyKey('approve', loanId)
  });
}

export async function emitDisbursementEvent(
  prisma: PrismaClient,
  loanId: string,
  amount: number,
  recipient: string
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'DESEMBOLSO',
    referenciaId: loanId,
    detalhes: { amount, recipient, timestamp: new Date() },
    idempotencyKey: EventManager.generateIdempotencyKey('disburse', loanId)
  });
}

export async function emitPaymentEvent(
  prisma: PrismaClient,
  loanId: string,
  amount: number,
  installmentIndex?: number
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'PAGAMENTO',
    referenciaId: loanId,
    detalhes: { amount, installmentIndex, timestamp: new Date() },
    idempotencyKey: EventManager.generateIdempotencyKey('payment', loanId, { amount, timestamp: Date.now() })
  });
}

export async function emitLateEvent(
  prisma: PrismaClient,
  loanId: string,
  daysLate: number,
  overdueAmount: number
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'ATRASO',
    referenciaId: loanId,
    detalhes: { daysLate, overdueAmount },
    idempotencyKey: EventManager.generateIdempotencyKey('late', loanId, { daysLate })
  });
}

export async function emitDefaultEvent(
  prisma: PrismaClient,
  loanId: string,
  reason: string,
  totalOwed: number
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'DEFAULT',
    referenciaId: loanId,
    detalhes: { reason, totalOwed, timestamp: new Date() },
    idempotencyKey: EventManager.generateIdempotencyKey('default', loanId)
  });
}

export async function emitWaterfallEvent(
  prisma: PrismaClient,
  loanId: string,
  breakdown: Record<string, any>
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'WATERFALL',
    referenciaId: loanId,
    detalhes: { breakdown, executedAt: new Date() },
    idempotencyKey: EventManager.generateIdempotencyKey('waterfall', loanId)
  });
}

export async function emitReleaseEvent(
  prisma: PrismaClient,
  endorsementId: string,
  amount: number,
  reason: string
): Promise<EventResult> {
  const manager = new EventManager(prisma);
  return manager.createEvent({
    tipo: 'LIBERACAO',
    referenciaId: endorsementId,
    detalhes: { amount, reason, timestamp: new Date() },
    idempotencyKey: EventManager.generateIdempotencyKey('release', endorsementId)
  });
}
