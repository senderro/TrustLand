import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { carteira, tipo } = await request.json();

    if (!carteira || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Carteira e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca usuário pela carteira (tenta exato primeiro, depois lowercase)
    let user = await prisma.usuario.findUnique({
      where: { carteira: carteira },
    });
    
    // Se não encontrou, tenta com lowercase
    if (!user) {
      user = await prisma.usuario.findUnique({
        where: { carteira: carteira.toLowerCase() },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado. Por favor, cadastre-se primeiro.' },
        { status: 404 }
      );
    }

    // Verifica se o tipo coincide (opcional - pode permitir mudança de papel)
    if (user.tipo !== tipo) {
      // Atualiza o tipo do usuário para permitir flexibilidade na demo
      const updatedUser = await prisma.usuario.update({
        where: { id: user.id },
        data: { tipo },
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `Tipo de usuário atualizado para ${tipo}`,
      });
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'Login realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
