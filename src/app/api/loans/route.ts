import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Validation schema
const CreateLoanSchema = z.object({
  tomadorId: z.string(),
  principal: z.number().positive(),
  termDays: z.number().positive(),
  purpose: z.string().optional(),
  colateral: z.number().default(0),
});

// Helper functions
function createApiResponse(data: any) {
  return { success: true, data };
}

function createApiError(message: string, code?: string) {
  return { success: false, error: message, code };
}

function calculateScore(baseScore: number): number {
  // Simplified score calculation for demo
  return Math.max(0, Math.min(100, baseScore + Math.floor(Math.random() * 10) - 5));
}

function calculateAPR(score: number): number {
  // Score-based APR calculation (in basis points)
  if (score >= 80) return 900;  // 9%
  if (score >= 60) return 1400; // 14%
  if (score >= 40) return 1800; // 18%
  return 2200; // 22%
}

function generateHash(data: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateLoanSchema.parse(body);

    // Check if borrower exists and is active
    const borrower = await prisma.usuario.findUnique({
      where: { id: validatedData.tomadorId }
    });

    if (!borrower) {
      return NextResponse.json(
        createApiError('Tomador não encontrado'),
        { status: 404 }
      );
    }

    if (borrower.tipo !== 'TOMADOR') {
      return NextResponse.json(
        createApiError('Usuário não é um tomador'),
        { status: 400 }
      );
    }

    if (borrower.status !== 'ATIVO') {
      return NextResponse.json(
        createApiError('Tomador não está ativo'),
        { status: 400 }
      );
    }

    // Calculate score and APR
    const currentScore = calculateScore(borrower.score);
    const aprBps = calculateAPR(currentScore);

    // Credit limit based on score (simplified)
    const limiteMax = currentScore >= 80 ? 10_000_000 : 
                     currentScore >= 60 ? 5_000_000 : 
                     currentScore >= 40 ? 3_000_000 : 2_000_000;

    // Validate loan amount against credit limit
    if (validatedData.principal > limiteMax) {
      return NextResponse.json(
        createApiError(`Valor excede o limite de crédito: ${limiteMax / 1_000_000} USDC`),
        { status: 400 }
      );
    }

    // Create hash for rules version
    const hashRegras = generateHash({
      tomadorId: validatedData.tomadorId,
      valorTotal: validatedData.principal,
      taxaAnualBps: aprBps,
      prazoParcelas: validatedData.termDays,
      colateral: validatedData.colateral,
      timestamp: Date.now(),
    });

    // Create loan in database
    const loan = await prisma.emprestimo.create({
      data: {
        tomadorId: validatedData.tomadorId,
        valorTotal: validatedData.principal,
        taxaAnualBps: aprBps,
        prazoParcelas: validatedData.termDays,
        colateral: validatedData.colateral || 0,
        hashRegras,
        estado: 'PENDENTE',
      },
    });

    // Generate simple installment schedule (one per day)
    const installments = [];
    const totalAmount = validatedData.principal + (validatedData.principal * aprBps / 10000 * validatedData.termDays / 365);
    const installmentAmount = Math.floor(totalAmount / validatedData.termDays);

    for (let i = 0; i < validatedData.termDays; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + i + 1);
      
      installments.push({
        emprestimoId: loan.id,
        indice: i,
        valor: i === validatedData.termDays - 1 
          ? totalAmount - (installmentAmount * (validatedData.termDays - 1)) // Last installment gets remainder
          : installmentAmount,
        dueAt: dueDate,
        status: 'ABERTA',
      });
    }

    // Create installments in database
    await prisma.parcela.createMany({
      data: installments,
    });

    // Update borrower score
    await prisma.usuario.update({
      where: { id: validatedData.tomadorId },
      data: { score: currentScore },
    });

    // Create audit event
    await prisma.evento.create({
      data: {
        tipo: 'CRIACAO',
        referenciaId: loan.id,
        detalhes: JSON.stringify({
          tomadorId: validatedData.tomadorId,
          valor: validatedData.principal,
          score: currentScore,
          apr: aprBps,
        }),
        idempotencyKey: `loan_creation_${loan.id}_${Date.now()}`,
      },
    });

    return NextResponse.json(
      createApiResponse({
        loan: {
          id: loan.id,
          tomadorId: loan.tomadorId,
          valorTotal: loan.valorTotal,
          taxaAnualBps: loan.taxaAnualBps,
          prazoParcelas: loan.prazoParcelas,
          estado: loan.estado,
          colateral: loan.colateral,
          hashRegras: loan.hashRegras,
          createdAt: loan.createdAt,
        },
        score: currentScore,
        pricing: {
          faixa: currentScore >= 80 ? 'ALTO' : currentScore >= 60 ? 'MEDIO' : 'BAIXO',
          aprBps,
          limiteMax,
          exigenciaCoberturaPct: currentScore >= 80 ? 25 : currentScore >= 60 ? 50 : 100,
        },
        installments: installments.map(inst => ({
          indice: inst.indice,
          valor: inst.valor,
          dueAt: inst.dueAt,
        })),
        hash: hashRegras,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating loan:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createApiError('Dados inválidos', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tomadorId = searchParams.get('tomadorId');
    const estado = searchParams.get('estado');
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereClause: any = {};
    
    if (tomadorId) {
      whereClause.tomadorId = tomadorId;
    }
    
    if (estado) {
      whereClause.estado = estado;
    }

    const loans = await prisma.emprestimo.findMany({
      where: whereClause,
      include: {
        tomador: {
          select: {
            id: true,
            nome: true,
            carteira: true,
            score: true,
          }
        },
        parcelas: {
          select: {
            indice: true,
            valor: true,
            dueAt: true,
            status: true,
          },
          orderBy: { indice: 'asc' }
        },
        endossos: {
          select: {
            id: true,
            apoiadorId: true,
            valorStake: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // Max 100 loans
    });

    // Calculate coverage and required coverage for each loan
    const loansWithCoverage = loans.map(loan => {
      const totalStake = loan.endossos.reduce((sum, endosso) => sum + endosso.valorStake, 0);
      const cobertura = loan.valorTotal > 0 ? (totalStake / loan.valorTotal) * 100 : 0;
      
      // Calculate required coverage based on score
      const score = loan.tomador.score;
      let requiredCoverage = 100; // Default 100%
      if (score >= 90) requiredCoverage = 0;
      else if (score >= 70) requiredCoverage = 25;
      else if (score >= 40) requiredCoverage = 50;
      else requiredCoverage = 100;

      return {
        ...loan,
        cobertura,
        requiredCoverage,
      };
    });

    return NextResponse.json(
      createApiResponse(loansWithCoverage)
    );
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
