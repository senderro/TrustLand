import { Score, PricingResult, PricingTable } from './types';

/**
 * Default pricing table based on score ranges
 */
const DEFAULT_PRICING_TABLE: PricingTable = {
  faixas: [
    {
      nome: 'BAIXO',
      scoreMin: 0,
      scoreMax: 39,
      aprBps: 2200,
      limiteMaxMicroUSDC: 2_000_000, // 2 USDC
      exigenciaCoberturaPct: 100
    },
    {
      nome: 'MEDIO',
      scoreMin: 40,
      scoreMax: 69,
      aprBps: 1400,
      limiteMaxMicroUSDC: 5_000_000, // 5 USDC
      exigenciaCoberturaPct: 50
    },
    {
      nome: 'ALTO',
      scoreMin: 70,
      scoreMax: 89,
      aprBps: 900,
      limiteMaxMicroUSDC: 8_000_000, // 8 USDC
      exigenciaCoberturaPct: 25
    },
    {
      nome: 'EXCELENTE',
      scoreMin: 90,
      scoreMax: 100,
      aprBps: 600,
      limiteMaxMicroUSDC: 10_000_000, // 10 USDC
      exigenciaCoberturaPct: 0
    }
  ],
  ajustesCobertura: [
    { coberturaMin: 80, ajusteBps: -100 },
    { coberturaMin: 50, ajusteBps: 0 },
    { coberturaMin: 30, ajusteBps: 150 },
    { coberturaMin: 0, ajusteBps: 0 } // colateral integral
  ]
};

/**
 * Price a loan based on borrower's score and coverage percentage
 */
export function priceByScore(
  score: Score, 
  coberturaPct: number, 
  customTable?: PricingTable
): PricingResult {
  const table = customTable || DEFAULT_PRICING_TABLE;

  // Find the appropriate score range
  const faixa = table.faixas.find(f => score >= f.scoreMin && score <= f.scoreMax);
  
  if (!faixa) {
    throw new Error(`Invalid score: ${score}. Must be between 0 and 100.`);
  }

  // Calculate coverage adjustment
  let ajusteCoberturaBps = 0;
  
  if (coberturaPct === 0) {
    // No coverage requires integral collateral and maximum rate
    ajusteCoberturaBps = 0; // Use maximum rate of the range
  } else {
    // Find appropriate coverage adjustment
    const ajuste = table.ajustesCobertura
      .sort((a, b) => b.coberturaMin - a.coberturaMin) // Sort descending
      .find(a => coberturaPct >= a.coberturaMin);
    
    ajusteCoberturaBps = ajuste?.ajusteBps || 0;
  }

  const aprFinalBps = Math.max(0, faixa.aprBps + ajusteCoberturaBps);

  return {
    faixa: faixa.nome,
    aprBps: faixa.aprBps,
    limiteMax: faixa.limiteMaxMicroUSDC,
    exigenciaCoberturaPct: faixa.exigenciaCoberturaPct,
    ajusteCoberturaBps,
    aprFinalBps
  };
}

/**
 * Check if a loan amount is within the credit limit for the given score
 */
export function isWithinCreditLimit(
  loanAmount: number, 
  score: Score, 
  customTable?: PricingTable
): boolean {
  const pricing = priceByScore(score, 0, customTable); // Use 0% coverage for limit check
  return loanAmount <= pricing.limiteMax;
}

/**
 * Get minimum coverage required for a given score
 */
export function getMinimumCoverage(score: Score, customTable?: PricingTable): number {
  const pricing = priceByScore(score, 0, customTable);
  return pricing.exigenciaCoberturaPct;
}
