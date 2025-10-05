import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { nome, cpf, endereco, carteira, tipo } = await request.json();

    if (!nome || !carteira || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Nome, carteira e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação básica de tipos permitidos
    const tiposPermitidos = ['TOMADOR', 'APOIADOR', 'OPERADOR', 'PROVEDOR'];
    if (!tiposPermitidos.includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de usuário inválido' },
        { status: 400 }
      );
    }

    // Verifica se a carteira já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { carteira: carteira.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Esta carteira já está cadastrada. Use o login.' },
        { status: 409 }
      );
    }

    // Cria o novo usuário
    const user = await prisma.usuario.create({
      data: {
        nome,
        cpf: cpf || null,
        endereco: endereco || null,
        carteira: carteira.toLowerCase(),
        tipo,
        score: 50, // Score inicial padrão
        status: 'ATIVO',
      },
    });

    return NextResponse.json({
      success: true,
      user,
      message: 'Usuário cadastrado com sucesso',
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
