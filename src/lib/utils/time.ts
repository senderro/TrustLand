// Time utilities for accelerated simulation

export class TimeUtils {
  /**
   * Add seconds to a date (for accelerated time simulation)
   */
  static addSeconds(date: Date, seconds: number): Date {
    return new Date(date.getTime() + seconds * 1000);
  }

  /**
   * Add days to a date
   */
  static addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * Convert days to seconds (for accelerated simulation)
   */
  static daysToSeconds(days: number, accelerationFactor = 1): number {
    return Math.round(days * 24 * 60 * 60 / accelerationFactor);
  }

  /**
   * Convert real time to simulated time
   */
  static realToSimulated(
    realSeconds: number,
    simulationSpeed = 1440 // 1 day = 1 minute by default
  ): number {
    return realSeconds * simulationSpeed;
  }

  /**
   * Convert simulated time to real time
   */
  static simulatedToReal(
    simulatedSeconds: number,
    simulationSpeed = 1440
  ): number {
    return simulatedSeconds / simulationSpeed;
  }

  /**
   * Check if a date is overdue
   */
  static isOverdue(dueDate: Date, currentDate = new Date()): boolean {
    return currentDate > dueDate;
  }

  /**
   * Calculate days between dates
   */
  static daysBetween(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate seconds between dates
   */
  static secondsBetween(startDate: Date, endDate: Date): number {
    return Math.round((endDate.getTime() - startDate.getTime()) / 1000);
  }

  /**
   * Format time remaining
   */
  static formatTimeRemaining(dueDate: Date, currentDate = new Date()): string {
    const diffMs = dueDate.getTime() - currentDate.getTime();
    
    if (diffMs <= 0) {
      return 'Vencido';
    }
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get next installment due date
   */
  static getNextInstallmentDate(
    startDate: Date,
    installmentIndex: number,
    installmentIntervalSeconds: number
  ): Date {
    return this.addSeconds(startDate, installmentIndex * installmentIntervalSeconds);
  }

  /**
   * Generate installment schedule
   */
  static generateInstallmentSchedule(
    startDate: Date,
    numberOfInstallments: number,
    intervalSeconds: number
  ): Date[] {
    const schedule: Date[] = [];
    
    for (let i = 1; i <= numberOfInstallments; i++) {
      schedule.push(this.getNextInstallmentDate(startDate, i, intervalSeconds));
    }
    
    return schedule;
  }

  /**
   * Check business hours (simplified for demo)
   */
  static isBusinessHours(date = new Date()): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    
    // Monday to Friday, 9 AM to 5 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }

  /**
   * Get next business day
   */
  static getNextBusinessDay(date = new Date()): Date {
    const nextDay = this.addDays(date, 1);
    const dayOfWeek = nextDay.getDay();
    
    // If weekend, move to Monday
    if (dayOfWeek === 0) { // Sunday
      return this.addDays(nextDay, 1);
    } else if (dayOfWeek === 6) { // Saturday
      return this.addDays(nextDay, 2);
    }
    
    return nextDay;
  }

  /**
   * Calculate maturity date for loan
   */
  static calculateMaturityDate(
    startDate: Date,
    termDays: number,
    useSimulatedTime = true,
    simulationFactor = 144 // 1 day = 10 minutes
  ): Date {
    if (useSimulatedTime) {
      const simulatedSeconds = this.daysToSeconds(termDays, simulationFactor);
      return this.addSeconds(startDate, simulatedSeconds);
    } else {
      return this.addDays(startDate, termDays);
    }
  }
}

// Time constants for simulation
export const TIME_CONSTANTS = {
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 3600,
  SECONDS_PER_DAY: 86400,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30, // Approximation
  DAYS_PER_YEAR: 365,
  
  // Simulation acceleration
  DEFAULT_INSTALLMENT_INTERVAL_SECONDS: 10, // 10 seconds per installment in demo
  DEFAULT_SIMULATION_SPEED: 144, // 1 day = 10 minutes
  DEFAULT_TOLERANCE_SECONDS: 30, // 30 seconds tolerance for late payments
} as const;

// Predefined time periods for common use cases
export const TIME_PERIODS = {
  INSTANT: 0,
  TEN_SECONDS: 10,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  TEN_MINUTES: 600,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  ONE_DAY_SIMULATED: 600, // 10 minutes in simulation time
  ONE_WEEK_SIMULATED: 4200, // 70 minutes in simulation time
} as const;
