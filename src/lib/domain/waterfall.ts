import { WaterfallResult } from './types';

export interface StakeInfo {
  apoiadorId: string;
  stakeAmount: number;
}

/**
 * Execute waterfall loss distribution
 * 
 * Order of losses:
 * 1. Borrower collateral
 * 2. Supporter stakes (proportional)
 * 3. Mutual fund
 * 
 * Rules:
 * - Never cut more than the stake amount
 * - Release remaining balance to supporters
 */
export function executeWaterfall(
  totalLoss: number,
  borrowerCollateral: number,
  stakes: StakeInfo[],
  mutualFundAvailable: number = 1_000_000_000 // 1,000 USDC default
): WaterfallResult {
  let remainingLoss = totalLoss;
  
  // Step 1: Use borrower collateral
  const usadoColateral = Math.min(remainingLoss, borrowerCollateral);
  remainingLoss -= usadoColateral;
  
  // Step 2: Calculate total stakes and proportional cuts
  const totalStakes = stakes.reduce((sum, stake) => sum + stake.stakeAmount, 0);
  const cortesPorApoiador: WaterfallResult['cortesPorApoiador'] = [];
  
  if (remainingLoss > 0 && totalStakes > 0) {
    for (const stake of stakes) {
      const proportionalLoss = (stake.stakeAmount / totalStakes) * remainingLoss;
      const actualCut = Math.min(proportionalLoss, stake.stakeAmount);
      const liberado = stake.stakeAmount - actualCut;
      
      cortesPorApoiador.push({
        apoiadorId: stake.apoiadorId,
        stakeOriginal: stake.stakeAmount,
        corte: actualCut,
        liberado
      });
    }
    
    const totalCuts = cortesPorApoiador.reduce((sum, corte) => sum + corte.corte, 0);
    remainingLoss -= totalCuts;
  } else {
    // No loss to distribute to stakes, release all
    for (const stake of stakes) {
      cortesPorApoiador.push({
        apoiadorId: stake.apoiadorId,
        stakeOriginal: stake.stakeAmount,
        corte: 0,
        liberado: stake.stakeAmount
      });
    }
  }
  
  // Step 3: Use mutual fund for any remaining loss
  const usadoFundo = Math.min(remainingLoss, mutualFundAvailable);
  remainingLoss -= usadoFundo;
  
  // Calculate total recovered
  const totalRecuperado = usadoColateral + 
    cortesPorApoiador.reduce((sum, corte) => sum + corte.corte, 0) + 
    usadoFundo;
  
  return {
    usadoColateral,
    cortesPorApoiador,
    usadoFundo,
    totalRecuperado
  };
}

/**
 * Simulate waterfall execution to preview results without applying them
 */
export function simulateWaterfall(
  outstandingBalance: number,
  expectedRecovery: number,
  borrowerCollateral: number,
  stakes: StakeInfo[],
  mutualFundAvailable: number = 1_000_000_000
): WaterfallResult & { 
  totalLoss: number;
  recoveryRate: number;
  shortfall: number;
} {
  const totalLoss = Math.max(0, outstandingBalance - expectedRecovery);
  const result = executeWaterfall(totalLoss, borrowerCollateral, stakes, mutualFundAvailable);
  
  return {
    ...result,
    totalLoss,
    recoveryRate: outstandingBalance > 0 ? (result.totalRecuperado / outstandingBalance) : 1,
    shortfall: Math.max(0, totalLoss - result.totalRecuperado)
  };
}

/**
 * Calculate the maximum loss that can be covered by current collateral and stakes
 */
export function calculateMaxCoverage(
  borrowerCollateral: number,
  stakes: StakeInfo[],
  mutualFundAvailable: number = 1_000_000_000
): number {
  const totalStakes = stakes.reduce((sum, stake) => sum + stake.stakeAmount, 0);
  return borrowerCollateral + totalStakes + mutualFundAvailable;
}

/**
 * Calculate coverage ratio for a given loan amount
 */
export function calculateCoverageRatio(
  loanAmount: number,
  borrowerCollateral: number,
  stakes: StakeInfo[]
): number {
  const totalCoverage = borrowerCollateral + stakes.reduce((sum, stake) => sum + stake.stakeAmount, 0);
  return loanAmount > 0 ? (totalCoverage / loanAmount) : 0;
}
