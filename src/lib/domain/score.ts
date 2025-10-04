import { Score, ScoreInputs } from './types';

/**
 * Computes the credit score based on deterministic rules (no ML)
 * 
 * Rules:
 * - Base: 50
 * - +2 per installment paid on time (cap at 100)
 * - -3 per light delay (minimum cap at 0)
 * - -10 if defaulted=true (single application on event)
 * - +1 if coverage >= 80%
 * - -5 if under review (fraud)
 */
export function computeScore(inputs: ScoreInputs): Score {
  let score = inputs.base;

  // +2 per payment on time
  score += inputs.pagamentosEmDia * 2;

  // -3 per delay
  score -= inputs.atrasos * 3;

  // -10 if defaulted
  if (inputs.inadimplente) {
    score -= 10;
  }

  // +1 if coverage >= 80%
  if (inputs.coberturaPct >= 80) {
    score += 1;
  }

  // -5 if under fraud review
  if (inputs.sobRevisao) {
    score -= 5;
  }

  // Ensure score is within bounds [0, 100]
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate updated score inputs based on current user state
 */
export function calculateScoreInputsFromHistory(
  baseScore: number,
  payments: Array<{ status: 'PAGA' | 'ATRASADA' | 'ABERTA', paidAt?: Date }>,
  isDefaulted: boolean,
  coveragePercent: number,
  isUnderReview: boolean
): ScoreInputs {
  const pagamentosEmDia = payments.filter(p => p.status === 'PAGA').length;
  const atrasos = payments.filter(p => p.status === 'ATRASADA').length;

  return {
    base: baseScore,
    pagamentosEmDia,
    atrasos,
    inadimplente: isDefaulted,
    coberturaPct: coveragePercent,
    sobRevisao: isUnderReview
  };
}
