// API client and response utilities
import { z } from 'zod';
import { ApiResponseSchema, ApiErrorSchema } from './domain/validators';

// Response wrapper
export function createApiResponse<T>(data: T, success = true) {
  return {
    success,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createApiError(error: string, code?: string) {
  return {
    success: false,
    error,
    code,
    timestamp: new Date().toISOString(),
  };
}

// API client for frontend
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error(`Failed to parse JSON response: ${response.status}`);
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    if (schema) {
      return schema.parse(data.data || data);
    }

    return data.data || data;
  }

  // User operations
  async createUser(userData: {
    nome: string;
    carteira: string;
    tipo: 'TOMADOR' | 'APOIADOR' | 'OPERADOR' | 'PROVEDOR';
  }) {
    return this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(id: string) {
    return this.request(`/usuarios/${id}`);
  }

  // Loan operations
  async createLoan(loanData: {
    tomadorId: string;
    principal: number;
    termDays: number;
    purpose?: string;
    colateral?: number;
  }) {
    return this.request('/loans', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
  }

  async getLoan(id: string) {
    return this.request(`/loans/${id}`);
  }

  async endorseLoan(id: string, endorsement: {
    apoiadorId: string;
    valorStake: number;
  }) {
    return this.request(`/loans/${id}/endorse`, {
      method: 'POST',
      body: JSON.stringify(endorsement),
    });
  }

  async approveLoan(id: string) {
    return this.request(`/loans/${id}/approve`, {
      method: 'POST',
    });
  }

  async repayLoan(id: string, repayment: { valor: number }) {
    return this.request(`/loans/${id}/repay`, {
      method: 'POST',
      body: JSON.stringify(repayment),
    });
  }

  async markLoanLate(id: string, data?: { motivo?: string }) {
    return this.request(`/loans/${id}/late`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async defaultLoan(id: string) {
    return this.request(`/loans/${id}/default`, {
      method: 'POST',
    });
  }

  async liquidateLoan(id: string) {
    return this.request(`/loans/${id}/liquidate`, {
      method: 'POST',
    });
  }

  // Dashboard and metrics
  async getDashboard() {
    return this.request('/dashboard');
  }

  // Audit
  async getAudit(id: string): Promise<{
    resourceType: 'loan' | 'decision';
    resourceId: string;
    decision?: {
      id: string;
      emprestimoId?: string;
      inputDados: Record<string, any>;
      resultado: Record<string, any>;
      hashDecisao: string;
      createdAt: string;
    };
    loan?: {
      id: string;
      valorTotal: number;
      estado: string;
      hashRegras: string;
      createdAt: string;
      tomador?: {
        nome: string;
        score: number;
      };
    };
    decisions?: Array<{
      id: string;
      inputDados: Record<string, any>;
      resultado: Record<string, any>;
      hashDecisao: string;
      createdAt: string;
    }>;
    hashVerification?: {
      valid: boolean;
      storedHash: string;
      computedHash: string;
    };
    relatedEvents?: Array<{
      id: string;
      tipo: string;
      timestamp: string;
      detalhes: Record<string, any>;
    }>;
    auditTrail?: Array<{
      type: 'decision' | 'event';
      id: string;
      timestamp: string;
      sequence: number;
      hash?: string;
      eventType?: string;
      data: any;
    }>;
    recomputed?: boolean;
    timestamp?: string;
  }> {
    return this.request(`/audit/${id}`);
  }

  async recomputeAudit(id: string): Promise<{
    resourceType: 'loan' | 'decision';
    resourceId: string;
    hashVerification?: {
      valid: boolean;
      storedHash: string;
      computedHash: string;
    };
    recomputed?: boolean;
    timestamp?: string;
  }> {
    return this.request(`/audit/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'recompute' }),
    });
  }

  // Fraud
  async createFraudAlert(alert: {
    usuarioId: string;
    tipo: string;
  }) {
    return this.request('/fraud/alert', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async reviewFraud(id: string, review: {
    resultado: 'CONFIRMADO' | 'REVERTIDO';
    observacoes?: string;
  }) {
    return this.request(`/fraud/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  // Parameters
  async getParams() {
    return this.request('/params');
  }

  async updateParams(params: {
    tabelaPricing?: string;
    toleranciaAtraso?: number;
    tempoParcelaS?: number;
  }) {
    return this.request('/params', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // USDC utilities
  async getUSDCBalance(address: string) {
    return this.request(`/usdc/balance?address=${address}`);
  }

  async mintUSDC(data: {
    to: string;
    amountDecimal: number;
  }) {
    return this.request('/usdc/mint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Default API client instance
export const apiClient = new ApiClient();

// Helper for handling API errors in components
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erro desconhecido';
}
