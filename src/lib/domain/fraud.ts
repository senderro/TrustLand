import { FraudAlert } from './types';

export interface UserInfo {
  id: string;
  carteira: string;
  createdAt: Date;
  tipo: 'TOMADOR' | 'APOIADOR' | 'OPERADOR' | 'PROVEDOR';
}

export interface EndorsementInfo {
  apoiadorId: string;
  valorStake: number;
  createdAt: Date;
}

export interface LoanInfo {
  id: string;
  valorTotal: number;
  endossos: EndorsementInfo[];
}

/**
 * Detect potential fraud signals
 */
export class FraudDetector {
  /**
   * Check for multi-account fraud (same grouper/recently created wallet)
   */
  static detectMultiAccount(
    users: UserInfo[],
    suspectUserId: string,
    walletAgeThresholdHours: number = 24
  ): FraudAlert | null {
    const suspectUser = users.find(u => u.id === suspectUserId);
    if (!suspectUser) return null;

    const now = new Date();
    const walletAgeHours = (now.getTime() - suspectUser.createdAt.getTime()) / (1000 * 60 * 60);
    
    // Check if wallet is recently created
    if (walletAgeHours < walletAgeThresholdHours) {
      // Look for similar patterns (could be expanded with IP tracking, device fingerprinting, etc.)
      const recentUsers = users.filter(u => 
        u.id !== suspectUserId && 
        (now.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60) < walletAgeThresholdHours
      );

      if (recentUsers.length > 0) {
        return {
          tipo: 'MULTICONTA',
          severidade: 'ALTA',
          detalhes: {
            suspectUserId,
            walletAge: walletAgeHours,
            similarRecentUsers: recentUsers.map(u => u.id)
          }
        };
      }
    }

    return null;
  }

  /**
   * Check for concentration risk (>50% from single supporter)
   */
  static detectConcentrationRisk(
    loan: LoanInfo,
    concentrationThreshold: number = 0.5
  ): FraudAlert | null {
    const totalStakes = loan.endossos.reduce((sum, e) => sum + e.valorStake, 0);
    
    if (totalStakes === 0) return null;

    const maxStakeByUser = loan.endossos.reduce((acc, endorsement) => {
      const userId = endorsement.apoiadorId;
      acc[userId] = (acc[userId] || 0) + endorsement.valorStake;
      return acc;
    }, {} as Record<string, number>);

    const maxStake = Math.max(...Object.values(maxStakeByUser));
    const concentrationRatio = maxStake / totalStakes;

    if (concentrationRatio > concentrationThreshold) {
      const dominantUserId = Object.entries(maxStakeByUser)
        .find(([_, stake]) => stake === maxStake)?.[0];

      return {
        tipo: 'CONCENTRACAO',
        severidade: concentrationRatio > 0.8 ? 'ALTA' : 'MEDIA',
        detalhes: {
          loanId: loan.id,
          concentrationRatio,
          dominantUserId,
          dominantStake: maxStake,
          totalStakes
        }
      };
    }

    return null;
  }

  /**
   * Check for stake withdrawal before loan approval (suspicious timing)
   */
  static detectSuspiciousStakeWithdrawal(
    endorsements: EndorsementInfo[],
    loanApprovalTime: Date,
    suspiciousWindowMinutes: number = 10
  ): FraudAlert | null {
    const suspiciousWithdrawals = endorsements.filter(endorsement => {
      const timeDiff = (loanApprovalTime.getTime() - endorsement.createdAt.getTime()) / (1000 * 60);
      return timeDiff >= 0 && timeDiff <= suspiciousWindowMinutes;
    });

    if (suspiciousWithdrawals.length > 0) {
      return {
        tipo: 'STAKE_WITHDRAWAL',
        severidade: 'MEDIA',
        detalhes: {
          suspiciousWithdrawals: suspiciousWithdrawals.map(w => ({
            apoiadorId: w.apoiadorId,
            valor: w.valorStake,
            minutesBeforeApproval: (loanApprovalTime.getTime() - w.createdAt.getTime()) / (1000 * 60)
          }))
        }
      };
    }

    return null;
  }

  /**
   * Run comprehensive fraud check
   */
  static runComprehensiveCheck(
    loan: LoanInfo,
    users: UserInfo[],
    loanApprovalTime?: Date
  ): FraudAlert[] {
    const alerts: FraudAlert[] = [];

    // Check concentration risk
    const concentrationAlert = this.detectConcentrationRisk(loan);
    if (concentrationAlert) alerts.push(concentrationAlert);

    // Check multi-account for each endorser
    for (const endorsement of loan.endossos) {
      const multiAccountAlert = this.detectMultiAccount(users, endorsement.apoiadorId);
      if (multiAccountAlert) alerts.push(multiAccountAlert);
    }

    // Check suspicious stake withdrawal if approval time is provided
    if (loanApprovalTime) {
      const withdrawalAlert = this.detectSuspiciousStakeWithdrawal(
        loan.endossos,
        loanApprovalTime
      );
      if (withdrawalAlert) alerts.push(withdrawalAlert);
    }

    return alerts;
  }
}

/**
 * Calculate fraud risk score (0-100, higher = more risky)
 */
export function calculateFraudRisk(alerts: FraudAlert[]): number {
  let riskScore = 0;

  for (const alert of alerts) {
    switch (alert.severidade) {
      case 'BAIXA':
        riskScore += 10;
        break;
      case 'MEDIA':
        riskScore += 25;
        break;
      case 'ALTA':
        riskScore += 50;
        break;
    }
  }

  return Math.min(100, riskScore);
}

/**
 * Determine if user should be under review based on fraud alerts
 */
export function shouldTriggerReview(alerts: FraudAlert[]): {
  underReview: boolean;
  blockDuration: number; // seconds
  reason: string;
} {
  const riskScore = calculateFraudRisk(alerts);
  const highRiskAlerts = alerts.filter(a => a.severidade === 'ALTA');

  if (highRiskAlerts.length > 0 || riskScore >= 50) {
    return {
      underReview: true,
      blockDuration: 30, // 30 seconds as specified
      reason: `High fraud risk detected: ${alerts.map(a => a.tipo).join(', ')}`
    };
  }

  return {
    underReview: false,
    blockDuration: 0,
    reason: ''
  };
}
