import crypto from 'crypto';

/**
 * Idempotency key generation and validation utilities
 */
export class IdempotencyManager {
  /**
   * Generate a deterministic idempotency key from operation parameters
   */
  static generateKey(
    operation: string,
    resourceId: string,
    params: Record<string, any> = {},
    timeWindow: 'minute' | 'hour' | 'day' | 'none' = 'minute'
  ): string {
    let timestamp = '';
    
    // Add time component for automatic expiry
    if (timeWindow !== 'none') {
      const now = new Date();
      switch (timeWindow) {
        case 'minute':
          timestamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
          break;
        case 'hour':
          timestamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
          break;
        case 'day':
          timestamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
          break;
      }
    }

    // Create deterministic payload
    const payload = {
      operation,
      resourceId,
      timestamp,
      params: this.sortObjectKeys(params)
    };

    // Generate hash
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return `${operation}_${hash.substring(0, 16)}`;
  }

  /**
   * Generate a UUID-based idempotency key (for client-provided keys)
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Validate idempotency key format
   */
  static validateKey(key: string): boolean {
    // UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(key)) {
      return true;
    }

    // Generated key format: operation_hash
    const generatedRegex = /^[A-Z_]+_[a-f0-9]{16}$/;
    return generatedRegex.test(key);
  }

  /**
   * Sort object keys recursively for deterministic hashing
   */
  private static sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }
    
    return sortedObj;
  }

  /**
   * Extract operation name from generated key
   */
  static extractOperation(key: string): string | null {
    const match = key.match(/^([A-Z_]+)_[a-f0-9]{16}$/);
    return match ? match[1] : null;
  }

  /**
   * Check if key has expired based on generation time
   */
  static isExpired(
    key: string,
    maxAgeMinutes: number = 60
  ): boolean {
    // Only works with generated keys that include timestamp
    const operation = this.extractOperation(key);
    if (!operation) {
      return false; // UUID keys don't expire
    }

    // For now, we can't extract timestamp from the hash
    // In production, you might want to store creation time separately
    return false;
  }
}

/**
 * Middleware-style idempotency handler for API routes
 */
export interface IdempotentOperation<T> {
  key: string;
  operation: () => Promise<T>;
  ttlSeconds?: number;
}

export class IdempotencyCache {
  private cache = new Map<string, {
    result: any;
    timestamp: number;
    ttl: number;
  }>();

  /**
   * Execute operation with idempotency check
   */
  async execute<T>(config: IdempotentOperation<T>): Promise<T> {
    const { key, operation, ttlSeconds = 3600 } = config; // 1 hour default TTL
    
    // Check cache
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < (cached.ttl * 1000)) {
      return cached.result;
    }

    // Execute operation
    const result = await operation();
    
    // Store result
    this.cache.set(key, {
      result,
      timestamp: now,
      ttl: ttlSeconds
    });

    // Clean expired entries (simple cleanup)
    this.cleanExpired();
    
    return result;
  }

  /**
   * Clear specific key from cache
   */
  clear(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached results
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries from cache
   */
  private cleanExpired(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if ((now - cached.timestamp) >= (cached.ttl * 1000)) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const globalIdempotencyCache = new IdempotencyCache();

/**
 * Common idempotency key generators for loan operations
 */
export class LoanIdempotencyKeys {
  static createLoan(tomadorId: string, principal: number): string {
    return IdempotencyManager.generateKey('CREATE_LOAN', tomadorId, { principal });
  }

  static endorseLoan(loanId: string, apoiadorId: string, valorStake: number): string {
    return IdempotencyManager.generateKey('ENDORSE_LOAN', loanId, { apoiadorId, valorStake });
  }

  static approveLoan(loanId: string): string {
    return IdempotencyManager.generateKey('APPROVE_LOAN', loanId);
  }

  static repayLoan(loanId: string, valor: number): string {
    return IdempotencyManager.generateKey('REPAY_LOAN', loanId, { valor }, 'minute');
  }

  static markLate(loanId: string): string {
    return IdempotencyManager.generateKey('MARK_LATE', loanId, {}, 'hour');
  }

  static markDefault(loanId: string): string {
    return IdempotencyManager.generateKey('MARK_DEFAULT', loanId);
  }

  static liquidate(loanId: string): string {
    return IdempotencyManager.generateKey('LIQUIDATE', loanId);
  }
}
