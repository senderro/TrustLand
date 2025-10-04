import { PricingTable } from './types';

export interface ParameterUpdate {
  versao: string;
  tabelaPricing?: string; // JSON string
  toleranciaAtraso?: number;
  tempoParcelaS?: number;
  proposedBy: string;
  proposedAt: Date;
  activatesAt: Date;
  isActive: boolean;
}

export interface GovernanceResult {
  success: boolean;
  message: string;
  newVersion?: string;
  activatesAt?: Date;
}

/**
 * Governance system for parameter updates
 */
export class GovernanceManager {
  private static ACTIVATION_DELAY_SECONDS = 30; // 30 second delay as specified

  /**
   * Propose new system parameters (only operators can propose)
   */
  static proposeParameterUpdate(
    currentVersion: string,
    updates: Partial<{
      tabelaPricing: PricingTable;
      toleranciaAtraso: number;
      tempoParcelaS: number;
    }>,
    proposerType: 'TOMADOR' | 'APOIADOR' | 'OPERADOR' | 'PROVEDOR',
    proposerId: string
  ): GovernanceResult {
    // Only operators can update parameters
    if (proposerType !== 'OPERADOR') {
      return {
        success: false,
        message: 'Apenas operadores podem alterar parâmetros do sistema'
      };
    }

    // Validate parameters
    const validationResult = this.validateParameters(updates);
    if (!validationResult.valid) {
      return {
        success: false,
        message: validationResult.message
      };
    }

    // Generate new version
    const newVersion = this.generateNewVersion(currentVersion);
    const now = new Date();
    const activatesAt = new Date(now.getTime() + (this.ACTIVATION_DELAY_SECONDS * 1000));

    return {
      success: true,
      message: `Parâmetros atualizados para versão ${newVersion}. Ativação em ${activatesAt.toISOString()}`,
      newVersion,
      activatesAt
    };
  }

  /**
   * Check if a parameter version is active
   */
  static isVersionActive(activatesAt: Date, currentTime: Date = new Date()): boolean {
    return currentTime >= activatesAt;
  }

  /**
   * Generate new version string
   */
  static generateNewVersion(currentVersion: string): string {
    const match = currentVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
      return 'v1.0.0';
    }

    const [, major, minor, patch] = match;
    const newPatch = parseInt(patch) + 1;
    
    return `v${major}.${minor}.${newPatch}`;
  }

  /**
   * Validate parameter updates
   */
  static validateParameters(updates: Partial<{
    tabelaPricing: PricingTable;
    toleranciaAtraso: number;
    tempoParcelaS: number;
  }>): { valid: boolean; message: string } {
    // Validate tolerance (must be positive)
    if (updates.toleranciaAtraso !== undefined) {
      if (updates.toleranciaAtraso <= 0) {
        return {
          valid: false,
          message: 'Tolerância de atraso deve ser maior que zero'
        };
      }
    }

    // Validate installment time (must be positive)
    if (updates.tempoParcelaS !== undefined) {
      if (updates.tempoParcelaS <= 0) {
        return {
          valid: false,
          message: 'Tempo de parcela deve ser maior que zero'
        };
      }
    }

    // Validate pricing table
    if (updates.tabelaPricing) {
      const validationResult = this.validatePricingTable(updates.tabelaPricing);
      if (!validationResult.valid) {
        return validationResult;
      }
    }

    return { valid: true, message: 'Parâmetros válidos' };
  }

  /**
   * Validate pricing table structure
   */
  static validatePricingTable(table: PricingTable): { valid: boolean; message: string } {
    // Check if all required ranges are present
    const requiredRanges = ['BAIXO', 'MEDIO', 'ALTO', 'EXCELENTE'];
    const presentRanges = table.faixas.map(f => f.nome);
    
    for (const range of requiredRanges) {
      if (!presentRanges.includes(range as any)) {
        return {
          valid: false,
          message: `Faixa obrigatória ausente: ${range}`
        };
      }
    }

    // Validate score ranges don't overlap and cover 0-100
    const sortedRanges = [...table.faixas].sort((a, b) => a.scoreMin - b.scoreMin);
    
    if (sortedRanges[0].scoreMin !== 0) {
      return {
        valid: false,
        message: 'Primeira faixa deve começar em score 0'
      };
    }

    if (sortedRanges[sortedRanges.length - 1].scoreMax !== 100) {
      return {
        valid: false,
        message: 'Última faixa deve terminar em score 100'
      };
    }

    // Check for gaps or overlaps
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      const current = sortedRanges[i];
      const next = sortedRanges[i + 1];
      
      if (current.scoreMax + 1 !== next.scoreMin) {
        return {
          valid: false,
          message: `Gap ou sobreposição entre faixas ${current.nome} e ${next.nome}`
        };
      }
    }

    // Validate APR values are reasonable (0-10000 bps = 0-100%)
    for (const faixa of table.faixas) {
      if (faixa.aprBps < 0 || faixa.aprBps > 10000) {
        return {
          valid: false,
          message: `APR inválido para faixa ${faixa.nome}: ${faixa.aprBps} bps`
        };
      }
    }

    return { valid: true, message: 'Tabela de precificação válida' };
  }

  /**
   * Generate hash for decision audit trail
   */
  static generateDecisionHash(
    loanId: string,
    version: string,
    inputs: Record<string, any>,
    decision: Record<string, any>
  ): string {
    const payload = {
      loanId,
      version,
      inputs,
      decision,
      timestamp: new Date().toISOString()
    };
    
    // Simple hash implementation (in production, use crypto.createHash)
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Verify decision hash for audit purposes
   */
  static verifyDecisionHash(
    storedHash: string,
    loanId: string,
    version: string,
    inputs: Record<string, any>,
    decision: Record<string, any>
  ): boolean {
    // This is a simplified verification - in production you'd want proper cryptographic verification
    const expectedHash = this.generateDecisionHash(loanId, version, inputs, decision);
    return storedHash === expectedHash;
  }
}
