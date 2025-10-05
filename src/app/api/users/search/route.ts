import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function createApiResponse(data: any) {
  return { success: true, data };
}

function createApiError(message: string, code?: string) {
  return { success: false, error: message, code };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        createApiError('Query deve ter pelo menos 3 caracteres'),
        { status: 400 }
      );
    }

    const searchTerm = query.trim();

    // Buscar usuários por carteira ou nome
    const users = await prisma.usuario.findMany({
      where: {
        OR: [
          {
            carteira: {
              contains: searchTerm
            }
          },
          {
            nome: {
              contains: searchTerm
            }
          }
        ],
        status: 'ATIVO' // Apenas usuários ativos
      },
      select: {
        id: true,
        nome: true,
        carteira: true,
        tipo: true,
        score: true,
        status: true
      },
      take: 10 // Limitar resultados
    });

    return NextResponse.json(
      createApiResponse(users)
    );
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
