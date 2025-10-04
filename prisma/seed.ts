import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default system parameters
  const defaultParams = await prisma.parametrosSistema.upsert({
    where: { versao: 'v1.0.0' },
    update: {},
    create: {
      versao: 'v1.0.0',
      tabelaPricing: JSON.stringify({
        faixas: [
          {
            nome: 'BAIXO',
            scoreMin: 0,
            scoreMax: 39,
            aprBps: 2200,
            limiteMaxMicroUSDC: 2_000_000, // 2 USDC
            exigenciaCoberturaPct: 100
          },
          {
            nome: 'MEDIO',
            scoreMin: 40,
            scoreMax: 69,
            aprBps: 1400,
            limiteMaxMicroUSDC: 5_000_000, // 5 USDC
            exigenciaCoberturaPct: 50
          },
          {
            nome: 'ALTO',
            scoreMin: 70,
            scoreMax: 89,
            aprBps: 900,
            limiteMaxMicroUSDC: 8_000_000, // 8 USDC
            exigenciaCoberturaPct: 25
          },
          {
            nome: 'EXCELENTE',
            scoreMin: 90,
            scoreMax: 100,
            aprBps: 600,
            limiteMaxMicroUSDC: 10_000_000, // 10 USDC
            exigenciaCoberturaPct: 0
          }
        ],
        ajustesCobertura: [
          { coberturaMin: 80, ajusteBps: -100 },
          { coberturaMin: 50, ajusteBps: 0 },
          { coberturaMin: 30, ajusteBps: 150 },
          { coberturaMin: 0, ajusteBps: 0 } // colateral integral
        ]
      }),
      toleranciaAtraso: 30, // 30 segundos
      tempoParcelaS: 10     // 10 segundos por parcela
    }
  });

  // Create test users
  const operador = await prisma.usuario.upsert({
    where: { carteira: '0x1234567890123456789012345678901234567890' },
    update: {},
    create: {
      nome: 'Operador Sistema',
      carteira: '0x1234567890123456789012345678901234567890',
      tipo: 'OPERADOR',
      score: 100
    }
  });

  const provedor = await prisma.usuario.upsert({
    where: { carteira: '0x2345678901234567890123456789012345678901' },
    update: {},
    create: {
      nome: 'Provedor Liquidez',
      carteira: '0x2345678901234567890123456789012345678901',
      tipo: 'PROVEDOR',
      score: 95
    }
  });

  const tomador = await prisma.usuario.upsert({
    where: { carteira: '0x3456789012345678901234567890123456789012' },
    update: {},
    create: {
      nome: 'João da Silva',
      carteira: '0x3456789012345678901234567890123456789012',
      tipo: 'TOMADOR',
      score: 65
    }
  });

  const apoiadores = await Promise.all([
    prisma.usuario.upsert({
      where: { carteira: '0x4567890123456789012345678901234567890123' },
      update: {},
      create: {
        nome: 'Maria Apoiadora',
        carteira: '0x4567890123456789012345678901234567890123',
        tipo: 'APOIADOR',
        score: 75
      }
    }),
    prisma.usuario.upsert({
      where: { carteira: '0x5678901234567890123456789012345678901234' },
      update: {},
      create: {
        nome: 'Carlos Investidor',
        carteira: '0x5678901234567890123456789012345678901234',
        tipo: 'APOIADOR',
        score: 80
      }
    }),
    prisma.usuario.upsert({
      where: { carteira: '0x6789012345678901234567890123456789012345' },
      update: {},
      create: {
        nome: 'Ana Financeira',
        carteira: '0x6789012345678901234567890123456789012345',
        tipo: 'APOIADOR',
        score: 70
      }
    })
  ]);

  console.log({
    parametros: defaultParams.versao,
    operador: operador.nome,
    provedor: provedor.nome,
    tomador: tomador.nome,
    apoiadores: apoiadores.map((a: any) => a.nome).sort()
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
