import { z } from 'zod';

// User-related schemas
export const CreateUserSchema = z.object({
  nome: z.string().min(1).max(100),
  carteira: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço de carteira inválido'),
  tipo: z.enum(['TOMADOR', 'APOIADOR', 'OPERADOR', 'PROVEDOR'])
});

export const UserResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  carteira: z.string(),
  tipo: z.enum(['TOMADOR', 'APOIADOR', 'OPERADOR', 'PROVEDOR']),
  score: z.number().min(0).max(100),
  status: z.enum(['ATIVO', 'SOB_REVISAO', 'BLOQUEADO']),
  createdAt: z.date()
});

// Loan-related schemas
export const CreateLoanSchema = z.object({
  tomadorId: z.string().cuid(),
  principal: z.number().int().positive(),
  termDays: z.number().int().positive().max(365),
  purpose: z.string().optional(),
  colateral: z.number().int().min(0).optional()
});

export const LoanResponseSchema = z.object({
  id: z.string(),
  tomadorId: z.string(),
  valorTotal: z.number(),
  taxaAnualBps: z.number(),
  prazoParcelas: z.number(),
  estado: z.enum(['PENDENTE', 'APROVADO', 'ATIVO', 'QUITADO', 'INADIMPLENTE', 'LIQUIDADO_INADIMPLENCIA']),
  dataInicio: z.date().nullable(),
  dataFim: z.date().nullable(),
  colateral: z.number(),
  valorPago: z.number(),
  hashRegras: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const EndorseLoanSchema = z.object({
  apoiadorId: z.string().cuid(),
  valorStake: z.number().int().positive()
});

export const RepayLoanSchema = z.object({
  valor: z.number().int().positive()
});

export const LateLoanSchema = z.object({
  motivo: z.string().optional()
});

// Pricing and scoring schemas
export const PricingResultSchema = z.object({
  faixa: z.enum(['BAIXO', 'MEDIO', 'ALTO', 'EXCELENTE']),
  aprBps: z.number(),
  limiteMax: z.number(),
  exigenciaCoberturaPct: z.number(),
  ajusteCoberturaBps: z.number(),
  aprFinalBps: z.number()
});

export const ScoreInputsSchema = z.object({
  base: z.number().min(0).max(100),
  pagamentosEmDia: z.number().int().min(0),
  atrasos: z.number().int().min(0),
  inadimplente: z.boolean(),
  coberturaPct: z.number().min(0).max(100),
  sobRevisao: z.boolean()
});

// Installment schemas
export const ParcelaSchema = z.object({
  id: z.string(),
  emprestimoId: z.string(),
  indice: z.number().int().positive(),
  valor: z.number().int().positive(),
  dueAt: z.date(),
  status: z.enum(['ABERTA', 'PAGA', 'ATRASADA']),
  paidAt: z.date().nullable()
});

export const ParcelaOutSchema = z.object({
  indice: z.number().int().positive(),
  valor: z.number().int().positive(),
  dueAt: z.string().datetime()
});

// Endorsement schemas
export const EndossoSchema = z.object({
  id: z.string(),
  emprestimoId: z.string(),
  apoiadorId: z.string(),
  valorStake: z.number().int().positive(),
  status: z.enum(['PENDENTE', 'ATIVO', 'LIBERADO', 'CORTADO']),
  dataBloqueio: z.date().nullable(),
  dataLiberacao: z.date().nullable(),
  createdAt: z.date()
});

// Event schemas
export const EventoSchema = z.object({
  id: z.string(),
  tipo: z.enum(['CRIACAO', 'APOIO', 'SCORE_RECALC', 'APROVACAO', 'DESEMBOLSO', 'PAGAMENTO', 'ATRASO', 'DEFAULT', 'WATERFALL', 'LIBERACAO']),
  referenciaId: z.string(),
  detalhes: z.string(),
  timestamp: z.date(),
  idempotencyKey: z.string()
});

// Fraud schemas
export const FraudAlertSchema = z.object({
  tipo: z.enum(['MULTICONTA', 'CONCENTRACAO', 'STAKE_WITHDRAWAL']),
  severidade: z.enum(['BAIXA', 'MEDIA', 'ALTA']),
  detalhes: z.record(z.any())
});

export const CreateFraudAlertSchema = z.object({
  usuarioId: z.string().cuid(),
  tipo: z.string().min(1),
  detalhes: z.record(z.any()).optional()
});

export const ReviewFraudSchema = z.object({
  resultado: z.enum(['CONFIRMADO', 'REVERTIDO']),
  observacoes: z.string().optional()
});

// Parameter schemas
export const ParametersUpdateSchema = z.object({
  tabelaPricing: z.string().optional(), // JSON string
  toleranciaAtraso: z.number().int().positive().optional(),
  tempoParcelaS: z.number().int().positive().optional()
});

// USDC utility schemas
export const USDCBalanceSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

export const USDCMintSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountDecimal: z.number().positive()
});

// Dashboard metrics schema
export const DashboardMetricsSchema = z.object({
  tvl: z.number(),
  liquidez: z.number(),
  inadimplenciaPct: z.number(),
  atrasoMedio: z.number(),
  scoreMedio: z.number(),
  coberturamedia: z.number(),
  alertasFraudeAtivos: z.number(),
  eventosWaterfall: z.number(),
  latenciaMedia: z.number()
});

// Waterfall schemas
export const WaterfallResultSchema = z.object({
  usadoColateral: z.number(),
  cortesPorApoiador: z.array(z.object({
    apoiadorId: z.string(),
    stakeOriginal: z.number(),
    corte: z.number(),
    liberado: z.number()
  })),
  usadoFundo: z.number(),
  totalRecuperado: z.number()
});

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime()
});

// Error response schema
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  timestamp: z.string().datetime()
});

// Idempotency schema
export const IdempotencySchema = z.object({
  idempotencyKey: z.string().uuid().optional()
});

// Types derived from schemas
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type CreateLoanRequest = z.infer<typeof CreateLoanSchema>;
export type LoanResponse = z.infer<typeof LoanResponseSchema>;
export type EndorseLoanRequest = z.infer<typeof EndorseLoanSchema>;
export type RepayLoanRequest = z.infer<typeof RepayLoanSchema>;
export type LateLoanRequest = z.infer<typeof LateLoanSchema>;
export type PricingResult = z.infer<typeof PricingResultSchema>;
export type ScoreInputs = z.infer<typeof ScoreInputsSchema>;
export type ParcelaResponse = z.infer<typeof ParcelaSchema>;
export type ParcelaOut = z.infer<typeof ParcelaOutSchema>;
export type EndossoResponse = z.infer<typeof EndossoSchema>;
export type EventoResponse = z.infer<typeof EventoSchema>;
export type FraudAlert = z.infer<typeof FraudAlertSchema>;
export type CreateFraudAlertRequest = z.infer<typeof CreateFraudAlertSchema>;
export type ReviewFraudRequest = z.infer<typeof ReviewFraudSchema>;
export type ParametersUpdateRequest = z.infer<typeof ParametersUpdateSchema>;
export type USDCBalanceRequest = z.infer<typeof USDCBalanceSchema>;
export type USDCMintRequest = z.infer<typeof USDCMintSchema>;
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
export type WaterfallResult = z.infer<typeof WaterfallResultSchema>;
export type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema>>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
