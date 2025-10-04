import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ParametersUpdateSchema } from '@/lib/domain/validators';
import { createApiResponse, createApiError } from '@/lib/api';
import { Repository } from '@/lib/infra/repo';
import { EventManager } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';
import { GovernanceManager } from '@/lib/domain/governance';

const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);

export async function GET(request: NextRequest) {
  try {
    // Get current active parameters
    const params = await repository.getActiveParameters();
    
    if (!params) {
      return NextResponse.json(
        createApiError('Parâmetros do sistema não encontrados'),
        { status: 404 }
      );
    }

    // Parse pricing table
    let tabelaPricing;
    try {
      tabelaPricing = JSON.parse(params.tabelaPricing);
    } catch (error) {
      tabelaPricing = params.tabelaPricing;
    }

    return NextResponse.json(
      createApiResponse({
        versao: params.versao,
        tabelaPricing,
        toleranciaAtraso: params.toleranciaAtraso,
        tempoParcelaS: params.tempoParcelaS,
        createdAt: params.createdAt,
        isActive: true,
        metadata: {
          nextVersion: GovernanceManager.generateNewVersion(params.versao),
          activationDelay: 30, // seconds
          canUpdate: true, // In real system, check if user is operator
        }
      })
    );
  } catch (error) {
    console.error('Error fetching system parameters:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ParametersUpdateSchema.parse(body);

    // Get current parameters
    const currentParams = await repository.getActiveParameters();
    if (!currentParams) {
      return NextResponse.json(
        createApiError('Parâmetros atuais não encontrados'),
        { status: 500 }
      );
    }

    // For demo purposes, assume any request is from an operator
    // In real system, you'd validate JWT token and check user role
    const proposerType = 'OPERADOR';
    const proposerId = 'demo-operator';

    // Prepare update data
    const updates: any = {};
    
    if (validatedData.tabelaPricing) {
      // Validate that it's valid JSON
      try {
        JSON.parse(validatedData.tabelaPricing);
        updates.tabelaPricing = JSON.parse(validatedData.tabelaPricing);
      } catch (error) {
        return NextResponse.json(
          createApiError('Tabela de precificação deve ser um JSON válido'),
          { status: 400 }
        );
      }
    }

    if (validatedData.toleranciaAtraso !== undefined) {
      updates.toleranciaAtraso = validatedData.toleranciaAtraso;
    }

    if (validatedData.tempoParcelaS !== undefined) {
      updates.tempoParcelaS = validatedData.tempoParcelaS;
    }

    // Validate the proposed parameters using governance
    const governanceResult = GovernanceManager.proposeParameterUpdate(
      currentParams.versao,
      updates,
      proposerType,
      proposerId
    );

    if (!governanceResult.success) {
      return NextResponse.json(
        createApiError(governanceResult.message),
        { status: 400 }
      );
    }

    // Create new parameter version
    const newParams = await repository.createParameters({
      versao: governanceResult.newVersion!,
      tabelaPricing: validatedData.tabelaPricing || currentParams.tabelaPricing,
      toleranciaAtraso: validatedData.toleranciaAtraso ?? currentParams.toleranciaAtraso,
      tempoParcelaS: validatedData.tempoParcelaS ?? currentParams.tempoParcelaS,
    });

    // Log the governance decision
    await decisionLogger.logDecision({
      inputDados: {
        currentVersion: currentParams.versao,
        proposedUpdates: updates,
        proposerType,
        proposerId,
      },
      resultado: {
        newVersion: governanceResult.newVersion,
        activatesAt: governanceResult.activatesAt?.toISOString(),
        approved: true,
        timestamp: new Date().toISOString(),
      },
      versao: governanceResult.newVersion!
    });

    // In a real system, you'd schedule activation after delay
    // For demo, we activate immediately but show the delay info
    const isActive = GovernanceManager.isVersionActive(
      governanceResult.activatesAt!,
      new Date()
    );

    return NextResponse.json(
      createApiResponse({
        update: {
          success: true,
          newVersion: governanceResult.newVersion,
          activatesAt: governanceResult.activatesAt,
          isActive,
          message: governanceResult.message,
        },
        parameters: {
          versao: newParams.versao,
          tabelaPricing: JSON.parse(newParams.tabelaPricing),
          toleranciaAtraso: newParams.toleranciaAtraso,
          tempoParcelaS: newParams.tempoParcelaS,
          createdAt: newParams.createdAt,
        },
        governance: {
          delaySeconds: 30,
          proposerType,
          activationTime: governanceResult.activatesAt,
        }
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error updating system parameters:', error);
    
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
