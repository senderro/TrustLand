import { PrismaClient } from '@prisma/client';
import { GovernanceManager } from '../domain/governance';

export interface DecisionLog {
  emprestimoId?: string;
  inputDados: Record<string, any>;
  resultado: Record<string, any>;
  versao: string;
}

/**
 * Decision logger for audit trail
 */
export class DecisionLogger {
  constructor(private prisma: PrismaClient) {}

  /**
   * Log a decision with deterministic hash for audit
   */
  async logDecision(data: DecisionLog): Promise<{
    id: string;
    hash: string;
  }> {
    // Generate deterministic hash
    const hash = GovernanceManager.generateDecisionHash(
      data.emprestimoId || 'system',
      data.versao,
      data.inputDados,
      data.resultado
    );

    try {
      const log = await this.prisma.logsDeDecisao.create({
        data: {
          emprestimoId: data.emprestimoId,
          inputDados: JSON.stringify(data.inputDados),
          resultado: JSON.stringify(data.resultado),
          hashDecisao: hash
        }
      });

      return {
        id: log.id,
        hash: log.hashDecisao
      };
    } catch (error: any) {
      // If hash collision (shouldn't happen with proper deterministic hashing)
      if (error.code === 'P2002' && error.meta?.target?.includes('hashDecisao')) {
        const existingLog = await this.prisma.logsDeDecisao.findUnique({
          where: { hashDecisao: hash }
        });
        
        if (existingLog) {
          return {
            id: existingLog.id,
            hash: existingLog.hashDecisao
          };
        }
      }
      
      throw error;
    }
  }

  /**
   * Get decision log by ID
   */
  async getDecisionById(id: string): Promise<{
    id: string;
    emprestimoId?: string;
    inputDados: Record<string, any>;
    resultado: Record<string, any>;
    hashDecisao: string;
    createdAt: Date;
  } | null> {
    const log = await this.prisma.logsDeDecisao.findUnique({
      where: { id }
    });

    if (!log) return null;

    return {
      id: log.id,
      emprestimoId: log.emprestimoId || undefined,
      inputDados: JSON.parse(log.inputDados),
      resultado: JSON.parse(log.resultado),
      hashDecisao: log.hashDecisao,
      createdAt: log.createdAt
    };
  }

  /**
   * Verify hash integrity
   */
  async verifyDecisionHash(
    id: string,
    versao: string
  ): Promise<{
    valid: boolean;
    storedHash: string;
    computedHash: string;
  }> {
    const log = await this.getDecisionById(id);
    if (!log) {
      throw new Error('Decision log not found');
    }

    const computedHash = GovernanceManager.generateDecisionHash(
      log.emprestimoId || 'system',
      versao,
      log.inputDados,
      log.resultado
    );

    return {
      valid: log.hashDecisao === computedHash,
      storedHash: log.hashDecisao,
      computedHash
    };
  }

  /**
   * Get decisions for a specific loan
   */
  async getDecisionsForLoan(loanId: string): Promise<Array<{
    id: string;
    inputDados: Record<string, any>;
    resultado: Record<string, any>;
    hashDecisao: string;
    createdAt: Date;
  }>> {
    const logs = await this.prisma.logsDeDecisao.findMany({
      where: { emprestimoId: loanId },
      orderBy: { createdAt: 'asc' }
    });

    return logs.map((log: any) => ({
      id: log.id,
      inputDados: JSON.parse(log.inputDados),
      resultado: JSON.parse(log.resultado),
      hashDecisao: log.hashDecisao,
      createdAt: log.createdAt
    }));
  }

  /**
   * Helper methods for common decision types
   */
  async logScoreDecision(
    usuarioId: string,
    inputs: Record<string, any>,
    score: number,
    versao: string
  ): Promise<{ id: string; hash: string }> {
    return this.logDecision({
      inputDados: { ...inputs, usuarioId },
      resultado: { score, timestamp: new Date().toISOString() },
      versao
    });
  }

  async logPricingDecision(
    loanId: string,
    score: number,
    coberturaPct: number,
    pricing: Record<string, any>,
    versao: string
  ): Promise<{ id: string; hash: string }> {
    return this.logDecision({
      emprestimoId: loanId,
      inputDados: { score, coberturaPct },
      resultado: { ...pricing, timestamp: new Date().toISOString() },
      versao
    });
  }

  async logApprovalDecision(
    loanId: string,
    checks: Record<string, any>,
    approved: boolean,
    versao: string
  ): Promise<{ id: string; hash: string }> {
    return this.logDecision({
      emprestimoId: loanId,
      inputDados: checks,
      resultado: { approved, timestamp: new Date().toISOString() },
      versao
    });
  }

  async logWaterfallDecision(
    loanId: string,
    inputs: Record<string, any>,
    breakdown: Record<string, any>,
    versao: string
  ): Promise<{ id: string; hash: string }> {
    return this.logDecision({
      emprestimoId: loanId,
      inputDados: inputs,
      resultado: { ...breakdown, timestamp: new Date().toISOString() },
      versao
    });
  }
}

/**
 * Application logger for general logging (console + optional external service)
 */
export class AppLogger {
  private context: string;

  constructor(context: string = 'TrustLend') {
    this.context = context;
  }

  private log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      data
    };

    // Console output
    console.log(`[${timestamp}] [${this.context}] [${level}] ${message}`, data ? JSON.stringify(data, null, 2) : '');

    // TODO: Add external logging service integration here if needed
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  error(message: string, error?: Error | any, data?: any) {
    this.log('ERROR', message, {
      error: error?.message || error,
      stack: error?.stack,
      ...data
    });
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, data);
    }
  }
}
