import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { CreateUserSchema, ApiResponseSchema } from '@/lib/domain/validators';
import { createApiResponse, createApiError } from '@/lib/api';
import { EventManager, EventHelpers } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';
import { Repository } from '@/lib/infra/repo';
import { FraudDetector, UserInfo } from '@/lib/domain/fraud';

const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);

    // Check if wallet already exists
    const existingUser = await repository.getUserByWallet(validatedData.carteira);
    if (existingUser) {
      return NextResponse.json(
        createApiError('Carteira já cadastrada'),
        { status: 409 }
      );
    }

    // Create user
    const user = await repository.createUser(validatedData);

    // Run fraud detection for new users
    const users = await prisma.usuario.findMany();
    const userInfos: UserInfo[] = users.map(u => ({
      id: u.id,
      carteira: u.carteira,
      createdAt: u.createdAt,
      tipo: u.tipo as 'TOMADOR' | 'APOIADOR' | 'OPERADOR' | 'PROVEDOR'
    }));
    const fraudAlert = FraudDetector.detectMultiAccount(userInfos, user.id);
    
    if (fraudAlert) {
      await repository.createFraudFlag({
        usuarioId: user.id,
        tipo: fraudAlert.tipo,
      });
      
      // Update user status if high risk
      if (fraudAlert.severidade === 'ALTA') {
        await repository.updateUserStatus(user.id, 'SOB_REVISAO');
      }
    }

    return NextResponse.json(
      createApiResponse({
        id: user.id,
        nome: user.nome,
        carteira: user.carteira,
        tipo: user.tipo,
        score: user.score,
        status: user.status,
        createdAt: user.createdAt,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    
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
    const wallet = searchParams.get('wallet');
    const tipo = searchParams.get('tipo');

    let users;
    
    if (wallet) {
      const user = await repository.getUserByWallet(wallet);
      users = user ? [user] : [];
    } else if (tipo) {
      users = await prisma.usuario.findMany({
        where: { tipo: tipo as any },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      users = await prisma.usuario.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to prevent large responses
      });
    }

    return NextResponse.json(
      createApiResponse(users.map(user => ({
        id: user.id,
        nome: user.nome,
        carteira: user.carteira,
        tipo: user.tipo,
        score: user.score,
        status: user.status,
        createdAt: user.createdAt,
      })))
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
