import crypto from 'crypto';
import { keccak256 } from 'viem';

// Hash utilities for audit trail and data integrity

export function createHash(data: any, algorithm: 'sha256' | 'md5' = 'sha256'): string {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(sortObjectKeys(data));
  return crypto.createHash(algorithm).update(jsonString).digest('hex');
}

// Deterministic keccak256 hash for blockchain compatibility
export function createDeterministicHash(data: any): string {
  const normalizedPayload = sortObjectKeys(data);
  const jsonString = JSON.stringify(normalizedPayload);
  const hash = keccak256(Buffer.from(jsonString));
  return hash;
}

export function createShortHash(data: any, length = 8): string {
  const fullHash = createHash(data);
  return fullHash.substring(0, length);
}

export function verifyHash(data: any, expectedHash: string): boolean {
  const computedHash = createHash(data);
  return computedHash === expectedHash;
}

export function createChecksumHash(data: any): string {
  // Creates a deterministic hash for data integrity checks
  const sortedData = sortObjectKeys(data);
  const jsonString = JSON.stringify(sortedData);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

export function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sortObjectKeys(item));
  }

  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: any = {};
  
  for (const key of sortedKeys) {
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  
  return sortedObj;
}

export function createLoanHash(loanData: {
  tomadorId: string;
  valorTotal: number;
  taxaAnualBps: number;
  prazoParcelas: number;
  colateral: number;
  versaoParametros: string;
}): string {
  return createHash({
    ...loanData,
    timestamp: Math.floor(Date.now() / 1000), // Second precision for deterministic hash within same second
  });
}

export function createDecisionHash(
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  version: string
): string {
  return createHash({
    inputs: sortObjectKeys(inputs),
    outputs: sortObjectKeys(outputs),
    version,
    type: 'decision',
  });
}

export function createEventHash(
  eventType: string,
  referenceId: string,
  details: Record<string, any>
): string {
  return createHash({
    eventType,
    referenceId,
    details: sortObjectKeys(details),
    timestamp: Math.floor(Date.now() / 1000),
  });
}

// Specialized hash functions for different entity types
export class EntityHasher {
  static user(userData: {
    nome: string;
    carteira: string;
    tipo: string;
  }): string {
    return createHash({
      ...userData,
      entity: 'user',
    });
  }

  static loan(loanData: {
    tomadorId: string;
    valorTotal: number;
    taxaAnualBps: number;
    prazoParcelas: number;
    colateral?: number;
  }): string {
    return createHash({
      ...loanData,
      entity: 'loan',
      timestamp: Math.floor(Date.now() / 1000),
    });
  }

  static endorsement(endorsementData: {
    emprestimoId: string;
    apoiadorId: string;
    valorStake: number;
  }): string {
    return createHash({
      ...endorsementData,
      entity: 'endorsement',
      timestamp: Math.floor(Date.now() / 1000),
    });
  }

  static payment(paymentData: {
    emprestimoId: string;
    valor: number;
    parcelas: number[];
  }): string {
    return createHash({
      ...paymentData,
      entity: 'payment',
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
}
