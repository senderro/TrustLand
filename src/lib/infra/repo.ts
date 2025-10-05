import {
  PrismaClient,
  Usuario,
  Emprestimo,
  Parcela,
  Endosso,
  ParametrosSistema,
} from "@prisma/client";
import { EventManager } from "./events";
import { DecisionLogger } from "./logger";

/**
 * Repository pattern implementation with Prisma
 * Provides abstraction layer and common queries
 */
export class Repository {
  constructor(
    private prisma: PrismaClient,
    private eventManager: EventManager,
    private decisionLogger: DecisionLogger
  ) {}

  // User operations
  async createUser(data: {
    nome: string;
    carteira: string;
    tipo: "TOMADOR" | "APOIADOR" | "OPERADOR" | "PROVEDOR";
    score?: number;
  }): Promise<Usuario> {
    return this.prisma.usuario.create({
      data: {
        ...data,
        score: data.score || 50,
      },
    });
  }

  async getUserById(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
    });
  }

  async getUserByWallet(carteira: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { carteira },
    });
  }

  async updateUserScore(id: string, score: number): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id },
      data: { score },
    });
  }

  async updateUserStatus(
    id: string,
    status: "ATIVO" | "SOB_REVISAO" | "BLOQUEADO"
  ): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id },
      data: { status },
    });
  }

  // Loan operations
  async createLoan(data: {
    tomadorId: string;
    valorTotal: number;
    taxaAnualBps: number;
    prazoParcelas: number;
    colateral?: number;
    hashRegras: string;
  }): Promise<Emprestimo> {
    return this.prisma.emprestimo.create({
      data: {
        ...data,
        colateral: data.colateral || 0,
      },
    });
  }

  async getLoanById(
    id: string,
    includeRelations: boolean = false
  ): Promise<
    | (Emprestimo & {
        tomador?: Usuario;
        parcelas?: Parcela[];
        endossos?: (Endosso & { apoiador?: Usuario })[];
      })
    | null
  > {
    return this.prisma.emprestimo.findUnique({
      where: { id },
      include: includeRelations
        ? {
            tomador: true,
            parcelas: { orderBy: { indice: "asc" } },
            endossos: {
              include: { apoiador: true },
              orderBy: { createdAt: "asc" },
            },
          }
        : undefined,
    });
  }

  async getLoansForUser(
    usuarioId: string,
    tipo: "TOMADOR" | "APOIADOR"
  ): Promise<Emprestimo[]> {
    if (tipo === "TOMADOR") {
      return this.prisma.emprestimo.findMany({
        where: { tomadorId: usuarioId },
        orderBy: { createdAt: "desc" },
      });
    } else {
      const endossos = await this.prisma.endosso.findMany({
        where: { apoiadorId: usuarioId },
        include: { emprestimo: true },
      });
      return endossos.map((e: any) => e.emprestimo);
    }
  }

  async updateLoanStatus(
    id: string,
    estado:
      | "PENDENTE"
      | "APROVADO"
      | "ATIVO"
      | "QUITADO"
      | "INADIMPLENTE"
      | "LIQUIDADO_INADIMPLENCIA",
    data?: {
      dataInicio?: Date;
      dataFim?: Date;
      valorPago?: number;
    }
  ): Promise<Emprestimo> {
    return this.prisma.emprestimo.update({
      where: { id },
      data: {
        estado,
        ...data,
      },
    });
  }

  // Installment operations
  async createInstallments(
    installments: Array<{
      emprestimoId: string;
      indice: number;
      valor: number;
      dueAt: Date;
    }>
  ): Promise<Parcela[]> {
    const createdInstallments: Parcela[] = [];

    for (const installment of installments) {
      const created = await this.prisma.parcela.create({
        data: installment,
      });
      createdInstallments.push(created);
    }

    return createdInstallments;
  }

  async getInstallmentsForLoan(loanId: string): Promise<Parcela[]> {
    return this.prisma.parcela.findMany({
      where: { emprestimoId: loanId },
      orderBy: { indice: "asc" },
    });
  }

  async updateInstallmentStatus(
    loanId: string,
    indice: number,
    status: "ABERTA" | "PAGA" | "ATRASADA",
    paidAt?: Date
  ): Promise<Parcela> {
    return this.prisma.parcela.update({
      where: {
        emprestimoId_indice: {
          emprestimoId: loanId,
          indice,
        },
      },
      data: {
        status,
        paidAt,
      },
    });
  }

  // Endorsement operations
  async createEndorsement(data: {
    emprestimoId: string;
    apoiadorId: string;
    valorStake: number;
  }): Promise<Endosso> {
    return this.prisma.endosso.create({
      data,
    });
  }

  async getEndorsementsForLoan(
    loanId: string
  ): Promise<(Endosso & { apoiador: Usuario })[]> {
    return this.prisma.endosso.findMany({
      where: { emprestimoId: loanId },
      include: { apoiador: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateEndorsementStatus(
    id: string,
    status: "PENDENTE" | "ATIVO" | "LIBERADO" | "CORTADO",
    data?: {
      dataBloqueio?: Date;
      dataLiberacao?: Date;
    }
  ): Promise<Endosso> {
    return this.prisma.endosso.update({
      where: { id },
      data: {
        status,
        ...data,
      },
    });
  }

  // System parameters
  async getActiveParameters(): Promise<ParametrosSistema | null> {
    // Get the most recent version
    return this.prisma.parametrosSistema.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }

  async createParameters(data: {
    versao: string;
    tabelaPricing: string;
    toleranciaAtraso: number;
    tempoParcelaS: number;
  }): Promise<ParametrosSistema> {
    return this.prisma.parametrosSistema.create({
      data,
    });
  }

  // Fraud flags
  async createFraudFlag(data: {
    usuarioId: string;
    tipo: string;
    resultado?: string;
  }): Promise<any> {
    return this.prisma.flagFraude.create({
      data,
    });
  }

  async getFraudFlagsForUser(usuarioId: string): Promise<any[]> {
    return this.prisma.flagFraude.findMany({
      where: { usuarioId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateFraudFlag(
    id: string,
    data: {
      revisado: boolean;
      resultado?: string;
    }
  ): Promise<any> {
    return this.prisma.flagFraude.update({
      where: { id },
      data,
    });
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    tvl: number;
    liquidez: number;
    inadimplenciaPct: number;
    atrasoMedio: number;
    scoreMedio: number;
    coberturamedia: number;
    alertasFraudeAtivos: number;
    eventosWaterfall: number;
    latenciaMedia: number;
  }> {
    // Execute multiple queries in parallel
    const [
      totalLoans,
      activeLoans,
      defaultLoans,
      overdueInstallments,
      avgScore,
      totalStakes,
      activeFraudAlerts,
      waterfallEvents,
    ] = await Promise.all([
      this.prisma.emprestimo.count(),
      this.prisma.emprestimo.count({ where: { estado: "ATIVO" } }),
      this.prisma.emprestimo.count({ where: { estado: "INADIMPLENTE" } }),
      this.prisma.parcela.count({ where: { status: "ATRASADA" } }),
      this.prisma.usuario.aggregate({ _avg: { score: true } }),
      this.prisma.endosso.aggregate({
        _sum: { valorStake: true },
        where: { status: "ATIVO" },
      }),
      this.prisma.flagFraude.count({ where: { revisado: false } }),
      this.prisma.evento.count({ where: { tipo: "WATERFALL" } }),
    ]);

    // Calculate TVL (sum of active loan values)
    const tvlResult = await this.prisma.emprestimo.aggregate({
      _sum: { valorTotal: true },
      where: { estado: { in: ["ATIVO", "APROVADO"] } },
    });

    const tvl = tvlResult._sum.valorTotal || 0;
    const liquidez = totalStakes._sum.valorStake || 0;
    const inadimplenciaPct =
      totalLoans > 0 ? (defaultLoans / totalLoans) * 100 : 0;
    const scoreMedio = avgScore._avg.score || 50;

    // Calculate coverage (simplified)
    const coberturamedia = tvl > 0 ? (liquidez / tvl) * 100 : 0;

    return {
      tvl,
      liquidez,
      inadimplenciaPct,
      atrasoMedio: overdueInstallments, // Simplified
      scoreMedio,
      coberturamedia,
      alertasFraudeAtivos: activeFraudAlerts,
      eventosWaterfall: waterfallEvents,
      latenciaMedia: 0, // Would need performance tracking
    };
  }

  // Cleanup utilities
  async cleanupExpiredEvents(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.evento.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  // Transaction helper
  async executeTransaction<T>(
    operations: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(operations);
  }
}
