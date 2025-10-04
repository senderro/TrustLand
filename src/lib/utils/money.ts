// Money and financial calculation utilities

export const MICRO_USDC_DECIMALS = 6;
export const MICRO_USDC_MULTIPLIER = 10 ** MICRO_USDC_DECIMALS;

// Conversion functions
export function usdcToMicroUSDC(usdc: number): number {
  return Math.round(usdc * MICRO_USDC_MULTIPLIER);
}

export function microUSDCToUSDC(microUSDC: number): number {
  return microUSDC / MICRO_USDC_MULTIPLIER;
}

// Safe arithmetic operations for money
export class MoneyMath {
  static add(a: number, b: number): number {
    return Math.round(a + b);
  }

  static subtract(a: number, b: number): number {
    return Math.round(a - b);
  }

  static multiply(amount: number, factor: number): number {
    return Math.round(amount * factor);
  }

  static divide(amount: number, divisor: number): number {
    if (divisor === 0) throw new Error('Division by zero');
    return Math.round(amount / divisor);
  }

  static percentage(amount: number, percent: number): number {
    return Math.round((amount * percent) / 100);
  }

  static basisPoints(amount: number, bps: number): number {
    return Math.round((amount * bps) / 10000);
  }
}

// Interest calculations
export class InterestCalculator {
  /**
   * Calculate simple interest
   */
  static simple(
    principal: number,
    rateAnnualBps: number,
    termDays: number
  ): number {
    const rateDecimal = rateAnnualBps / 10000;
    const termYears = termDays / 365;
    const interest = Math.round(principal * rateDecimal * termYears);
    return interest;
  }

  /**
   * Calculate total amount with simple interest
   */
  static totalWithSimpleInterest(
    principal: number,
    rateAnnualBps: number,
    termDays: number
  ): number {
    const interest = this.simple(principal, rateAnnualBps, termDays);
    return MoneyMath.add(principal, interest);
  }

  /**
   * Calculate monthly payment for equal installments
   */
  static equalInstallment(
    totalAmount: number,
    numberOfPayments: number
  ): number {
    return Math.round(totalAmount / numberOfPayments);
  }

  /**
   * Calculate remaining balance after payments
   */
  static remainingBalance(
    totalAmount: number,
    paidAmount: number
  ): number {
    return Math.max(0, MoneyMath.subtract(totalAmount, paidAmount));
  }

  /**
   * Calculate APR from basis points
   */
  static bpsToAPR(bps: number): number {
    return bps / 100; // Convert to percentage
  }

  /**
   * Calculate daily rate from annual rate
   */
  static annualToDailyRate(annualRateBps: number): number {
    return annualRateBps / 365 / 10000;
  }
}

// Pricing utilities
export class PricingUtils {
  /**
   * Calculate risk premium based on score
   */
  static riskPremium(baseRate: number, score: number): number {
    // Higher score = lower risk = lower premium
    const riskMultiplier = (100 - score) / 100;
    return Math.round(baseRate * riskMultiplier * 0.5); // Max 50% premium
  }

  /**
   * Apply coverage discount
   */
  static coverageDiscount(rate: number, coveragePercent: number): number {
    if (coveragePercent >= 100) return MoneyMath.basisPoints(rate, -200); // 2% discount
    if (coveragePercent >= 80) return MoneyMath.basisPoints(rate, -100); // 1% discount
    if (coveragePercent >= 50) return 0; // No discount
    return MoneyMath.basisPoints(rate, 200); // 2% penalty
  }

  /**
   * Calculate effective rate with adjustments
   */
  static effectiveRate(
    baseRate: number,
    score: number,
    coveragePercent: number
  ): number {
    let rate = baseRate;
    rate = MoneyMath.add(rate, this.riskPremium(baseRate, score));
    rate = MoneyMath.add(rate, this.coverageDiscount(baseRate, coveragePercent));
    return Math.max(0, rate); // Never negative
  }
}

// Validation utilities
export class MoneyValidator {
  static isValidAmount(amount: number): boolean {
    return Number.isInteger(amount) && amount >= 0;
  }

  static isValidMicroUSDC(microUSDC: number): boolean {
    return this.isValidAmount(microUSDC) && microUSDC <= Number.MAX_SAFE_INTEGER;
  }

  static isValidPercentage(percent: number): boolean {
    return typeof percent === 'number' && percent >= 0 && percent <= 100;
  }

  static isValidBasisPoints(bps: number): boolean {
    return Number.isInteger(bps) && bps >= 0 && bps <= 10000;
  }
}

// Common money constants
export const MONEY_CONSTANTS = {
  MIN_LOAN_AMOUNT: usdcToMicroUSDC(1), // 1 USDC minimum
  MAX_LOAN_AMOUNT: usdcToMicroUSDC(10000), // 10,000 USDC maximum
  MIN_STAKE_AMOUNT: usdcToMicroUSDC(0.1), // 0.1 USDC minimum
  MAX_APR_BPS: 5000, // 50% maximum APR
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  DAYS_PER_YEAR: 365,
} as const;
