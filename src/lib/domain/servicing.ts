import { ParcelaOut } from './types';

/**
 * Generate loan installments based on simple interest calculation
 * 
 * @param principal Principal amount in microUSDC
 * @param aprBps Annual percentage rate in basis points (e.g., 1400 = 14%)
 * @param termDays Loan term in days
 * @param numInstallments Number of installments
 * @param installmentIntervalSeconds Seconds between installments (default 10s)
 * @param startDate Start date for the loan (default now)
 */
export function generateInstallments(
  principal: number,
  aprBps: number,
  termDays: number,
  numInstallments: number,
  installmentIntervalSeconds: number = 10,
  startDate: Date = new Date()
): ParcelaOut[] {
  // Simple interest calculation: Total = Principal * (1 + APR * (termDays/365))
  const aprDecimal = aprBps / 10000; // Convert basis points to decimal
  const interestFactor = 1 + (aprDecimal * (termDays / 365));
  const totalAmount = Math.round(principal * interestFactor);
  
  // Divide into equal installments
  const installmentAmount = Math.round(totalAmount / numInstallments);
  
  // Adjust last installment to account for rounding
  const lastInstallmentAmount = totalAmount - (installmentAmount * (numInstallments - 1));
  
  const installments: ParcelaOut[] = [];
  
  for (let i = 0; i < numInstallments; i++) {
    const dueAt = new Date(startDate);
    dueAt.setSeconds(dueAt.getSeconds() + (i + 1) * installmentIntervalSeconds);
    
    installments.push({
      indice: i + 1,
      valor: i === numInstallments - 1 ? lastInstallmentAmount : installmentAmount,
      dueAt: dueAt.toISOString()
    });
  }
  
  return installments;
}

/**
 * Calculate if installments are overdue based on simulated time
 */
export function updateInstallmentStatus(
  installments: Array<{
    indice: number;
    valor: number;
    dueAt: Date;
    status: 'ABERTA' | 'PAGA' | 'ATRASADA';
    paidAt?: Date;
  }>,
  currentTime: Date = new Date()
): Array<{
  indice: number;
  status: 'ABERTA' | 'PAGA' | 'ATRASADA';
  wasUpdated: boolean;
}> {
  return installments.map(installment => {
    let newStatus = installment.status;
    let wasUpdated = false;

    // Don't change status if already paid
    if (installment.status === 'PAGA') {
      return { indice: installment.indice, status: newStatus, wasUpdated };
    }

    // Check if overdue
    if (currentTime > installment.dueAt && installment.status === 'ABERTA') {
      newStatus = 'ATRASADA';
      wasUpdated = true;
    }

    return { 
      indice: installment.indice, 
      status: newStatus, 
      wasUpdated 
    };
  });
}

/**
 * Process a payment against open installments (FIFO order)
 */
export function processPayment(
  installments: Array<{
    indice: number;
    valor: number;
    status: 'ABERTA' | 'PAGA' | 'ATRASADA';
  }>,
  paymentAmount: number,
  paymentDate: Date = new Date()
): {
  paidInstallments: number[];
  remainingBalance: number;
  appliedPayments: Array<{
    indice: number;
    amountApplied: number;
    fullyPaid: boolean;
  }>;
} {
  let remainingAmount = paymentAmount;
  const paidInstallments: number[] = [];
  const appliedPayments: Array<{
    indice: number;
    amountApplied: number;
    fullyPaid: boolean;
  }> = [];

  // Sort by index (FIFO)
  const openInstallments = installments
    .filter(i => i.status !== 'PAGA')
    .sort((a, b) => a.indice - b.indice);

  for (const installment of openInstallments) {
    if (remainingAmount <= 0) break;

    const amountToApply = Math.min(remainingAmount, installment.valor);
    const fullyPaid = amountToApply >= installment.valor;

    appliedPayments.push({
      indice: installment.indice,
      amountApplied: amountToApply,
      fullyPaid
    });

    if (fullyPaid) {
      paidInstallments.push(installment.indice);
    }

    remainingAmount -= amountToApply;
  }

  // Calculate remaining balance (sum of unpaid amounts)
  const totalOwed = installments
    .filter(i => i.status !== 'PAGA')
    .reduce((sum, i) => sum + i.valor, 0);
  
  const remainingBalance = Math.max(0, totalOwed - paymentAmount);

  return {
    paidInstallments,
    remainingBalance,
    appliedPayments
  };
}

/**
 * Calculate total amount owed across all installments
 */
export function calculateTotalOwed(
  installments: Array<{
    valor: number;
    status: 'ABERTA' | 'PAGA' | 'ATRASADA';
  }>
): {
  totalOwed: number;
  overdueAmount: number;
  currentAmount: number;
} {
  let totalOwed = 0;
  let overdueAmount = 0;
  let currentAmount = 0;

  for (const installment of installments) {
    if (installment.status !== 'PAGA') {
      totalOwed += installment.valor;
      
      if (installment.status === 'ATRASADA') {
        overdueAmount += installment.valor;
      } else {
        currentAmount += installment.valor;
      }
    }
  }

  return { totalOwed, overdueAmount, currentAmount };
}
