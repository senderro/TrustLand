import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Validation schema
const CreateEndorsementSchema = z.object({
  emprestimoId: z.string(),
  apoiadorId: z.string(),
  valorStake: z.number().positive(),
});

// Helper functions
function createApiResponse(data: any) {
  return { success: true, data };
}

function createApiError(message: string, code?: string) {
  return { success: false, error: message, code };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateEndorsementSchema.parse(body);

    // Check if loan exists and is in PENDENTE state
    const loan = await prisma.emprestimo.findUnique({
      where: { id: validatedData.emprestimoId },
      include: {
        endossos: true,
      },
    });

    if (!loan) {
      return NextResponse.json(
        createApiError('Empréstimo não encontrado'),
        { status: 404 }
      );
    }

    if (loan.estado !== 'PENDENTE') {
      return NextResponse.json(
        createApiError('Empréstimo não está disponível para endosso'),
        { status: 400 }
      );
    }

    // Check if user exists and is APOIADOR
    const apoiador = await prisma.usuario.findUnique({
      where: { id: validatedData.apoiadorId }
    });

    if (!apoiador) {
      return NextResponse.json(
        createApiError('Apoiador não encontrado'),
        { status: 404 }
      );
    }

    if (apoiador.tipo !== 'APOIADOR') {
      return NextResponse.json(
        createApiError('Usuário não é um apoiador'),
        { status: 400 }
      );
    }

    // Check if user already endorsed this loan
    const existingEndorsement = await prisma.endosso.findFirst({
      where: {
        emprestimoId: validatedData.emprestimoId,
        apoiadorId: validatedData.apoiadorId,
      },
    });

    if (existingEndorsement) {
      return NextResponse.json(
        createApiError('Você já endossou este empréstimo'),
        { status: 409 }
      );
    }

    // Calculate current coverage
    const currentStake = loan.endossos.reduce((sum, endosso) => sum + endosso.valorStake, 0);
    const newCoverage = ((currentStake + validatedData.valorStake) / loan.valorTotal) * 100;

    // Check 5% limit per endorser
    const maxStakePerEndorser = loan.valorTotal * 0.05; // 5% limit
    if (validatedData.valorStake > maxStakePerEndorser) {
      return NextResponse.json(
        createApiError(`Valor máximo por apoiador: $${(maxStakePerEndorser / 1_000_000).toFixed(2)}`),
        { status: 400 }
      );
    }

    // Create endorsement
    const endorsement = await prisma.endosso.create({
      data: {
        emprestimoId: validatedData.emprestimoId,
        apoiadorId: validatedData.apoiadorId,
        valorStake: validatedData.valorStake,
        status: 'PENDENTE',
        dataBloqueio: new Date(),
      },
    });

    // Create audit event
    await prisma.evento.create({
      data: {
        tipo: 'APOIO',
        referenciaId: loan.id,
        detalhes: JSON.stringify({
          apoiadorId: validatedData.apoiadorId,
          valorStake: validatedData.valorStake,
          coberturaAnterior: (currentStake / loan.valorTotal) * 100,
          coberturaNova: newCoverage,
        }),
        idempotencyKey: `endorsement_${endorsement.id}_${Date.now()}`,
      },
    });

    // Check if loan should be approved (≥80% coverage)
    if (newCoverage >= 80) {
      await prisma.emprestimo.update({
        where: { id: loan.id },
        data: { estado: 'APROVADO' },
      });

      // Update all endorsements to ATIVO
      await prisma.endosso.updateMany({
        where: { emprestimoId: loan.id },
        data: { status: 'ATIVO' },
      });

      // Create approval event
      await prisma.evento.create({
        data: {
          tipo: 'APROVACAO',
          referenciaId: loan.id,
          detalhes: JSON.stringify({
            coberturaFinal: newCoverage,
            totalEndossos: loan.endossos.length + 1,
          }),
          idempotencyKey: `approval_${loan.id}_${Date.now()}`,
        },
      });
    }

    return NextResponse.json(
      createApiResponse({
        endorsement: {
          id: endorsement.id,
          emprestimoId: endorsement.emprestimoId,
          apoiadorId: endorsement.apoiadorId,
          valorStake: endorsement.valorStake,
          status: endorsement.status,
          dataBloqueio: endorsement.dataBloqueio,
        },
        newCoverage,
        loanApproved: newCoverage >= 80,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating endorsement:', error);
    
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
    const apoiadorId = searchParams.get('apoiadorId');
    const emprestimoId = searchParams.get('emprestimoId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereClause: any = {};
    
    if (apoiadorId) {
      whereClause.apoiadorId = apoiadorId;
    }
    
    if (emprestimoId) {
      whereClause.emprestimoId = emprestimoId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const endorsements = await prisma.endosso.findMany({
      where: whereClause,
      include: {
        emprestimo: {
          select: {
            id: true,
            valorTotal: true,
            estado: true,
            tomador: {
              select: {
                nome: true,
              }
            }
          }
        },
        apoiador: {
          select: {
            id: true,
            nome: true,
            score: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    return NextResponse.json(
      createApiResponse(endorsements)
    );
  } catch (error) {
    console.error('Error fetching endorsements:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
