// Base types for the TrustLend domain

export type Score = number; // 0..100

export interface ScoreInputs {
  base: number;                 // default 50
  pagamentosEmDia: number;      // contagem
  atrasos: number;              // contagem
  inadimplente: boolean;
  coberturaPct: number;         // 0..100
  sobRevisao: boolean;          // fraude
}

export interface PricingResult {
  faixa: 'BAIXO' | 'MEDIO' | 'ALTO' | 'EXCELENTE';
  aprBps: number;
  limiteMax: number;            // microUSDC
  exigenciaCoberturaPct: number;
  ajusteCoberturaBps: number;
  aprFinalBps: number;
}

export interface ParcelaOut {
  indice: number;
  valor: number; // microUSDC
  dueAt: string; // ISO
}

export interface WaterfallResult {
  usadoColateral: number;
  cortesPorApoiador: Array<{
    apoiadorId: string;
    stakeOriginal: number;
    corte: number;
    liberado: number;
  }>;
  usadoFundo: number;
  totalRecuperado: number;
}

export interface FraudAlert {
  tipo: 'MULTICONTA' | 'CONCENTRACAO' | 'STAKE_WITHDRAWAL';
  severidade: 'BAIXA' | 'MEDIA' | 'ALTA';
  detalhes: Record<string, any>;
}

export interface PricingTable {
  faixas: Array<{
    nome: 'BAIXO' | 'MEDIO' | 'ALTO' | 'EXCELENTE';
    scoreMin: number;
    scoreMax: number;
    aprBps: number;
    limiteMaxMicroUSDC: number;
    exigenciaCoberturaPct: number;
  }>;
  ajustesCobertura: Array<{
    coberturaMin: number;
    ajusteBps: number;
  }>;
}
