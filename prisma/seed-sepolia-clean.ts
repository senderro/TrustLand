import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Sepolia Wallets
const SEPOLIA_WALLETS = [
  {
    nome: 'Provedor Alpha',
    carteira: '0x58213dC88141ac1D30d94ACF7007C7e5938f9600',
    tipo: 'PROVEDOR',
    score: 95,
    status: 'ATIVO'
  },
  {
    nome: 'Provedor Beta',
    carteira: '0x79F821FF94D3416C2C913a3960C8666813AAcF7F',
    tipo: 'PROVEDOR',
    score: 88,
    status: 'ATIVO'
  },
  {
    nome: 'Tomador Principal',
    carteira: '0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06',
    tipo: 'TOMADOR',
    score: 75,
    status: 'ATIVO'
  },
  {
    nome: 'Apoiador Gamma',
    carteira: '0x294C347EA5Bf8496391cD424eFe04D0C6C650933',
    tipo: 'APOIADOR',
    score: 82,
    status: 'ATIVO'
  },
  {
    nome: 'Apoiador Delta',
    carteira: '0x89a0293626D73a76c2e6547902F190343FBb54A1',
    tipo: 'APOIADOR',
    score: 78,
    status: 'ATIVO'
  }
];

async function main() {
  console.log('🌱 Starting Sepolia database seed...');

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
            taxaAnualBps: 2200, // 22%
            limiteMaxMicroUSDC: 2_000_000, // 2 USDC
            exigenciaCoberturaPct: 100
          },
          {
            nome: 'MEDIO',
            scoreMin: 40,
            scoreMax: 69,
            taxaAnualBps: 1800, // 18%
            limiteMaxMicroUSDC: 5_000_000, // 5 USDC
            exigenciaCoberturaPct: 50
          },
          {
            nome: 'BOM',
            scoreMin: 70,
            scoreMax: 89,
            taxaAnualBps: 1400, // 14%
            limiteMaxMicroUSDC: 8_000_000, // 8 USDC
            exigenciaCoberturaPct: 25
          },
          {
            nome: 'EXCELENTE',
            scoreMin: 90,
            scoreMax: 100,
            taxaAnualBps: 900, // 9%
            limiteMaxMicroUSDC: 10_000_000, // 10 USDC
            exigenciaCoberturaPct: 0
          }
        ]
      }),
      toleranciaAtraso: 86400, // 24h
      tempoParcelaS: 10, // 10s for demo
    }
  });
  console.log('✅ System parameters created');

  // Create Sepolia wallet users
  console.log('Creating Sepolia wallet users...');
  
  const users = [];
  for (const wallet of SEPOLIA_WALLETS) {
    const user = await prisma.usuario.upsert({
      where: { carteira: wallet.carteira },
      update: {
        score: wallet.score,
        status: wallet.status,
      },
      create: {
        nome: wallet.nome,
        carteira: wallet.carteira,
        tipo: wallet.tipo,
        score: wallet.score,
        status: wallet.status,
      },
    });
    users.push(user);
    console.log(`✅ Created user: ${wallet.nome} (${wallet.tipo})`);
  }

  // Create admin user
  const admin = await prisma.usuario.upsert({
    where: { carteira: '0x0000000000000000000000000000000000000001' },
    update: {},
    create: {
      nome: 'Admin Operador',
      carteira: '0x0000000000000000000000000000000000000001',
      tipo: 'OPERADOR',
      score: 100,
      status: 'ATIVO',
    },
  });
  users.push(admin);
  console.log(`✅ Created user: Admin Operador (OPERADOR)`);

  // Create sample loans for testing
  console.log('Creating sample loans for testing...');

  const tomador = users.find(u => u.tipo === 'TOMADOR');
  const apoiadores = users.filter(u => u.tipo === 'APOIADOR');
  const provedores = users.filter(u => u.tipo === 'PROVEDOR');

  if (tomador) {
    // Create first loan - Active with endorsements
    const loan1Hash = crypto.createHash('sha256')
      .update(JSON.stringify({
        tomadorId: tomador.id,
        valorTotal: 1_000_000,
        taxaAnualBps: 1400,
        prazoParcelas: 30,
      }))
      .digest('hex');

    const loan1 = await prisma.emprestimo.create({
      data: {
        tomadorId: tomador.id,
        valorTotal: 1_000_000, // 1 USDC
        taxaAnualBps: 1400, // 14%
        prazoParcelas: 30,
        estado: 'APROVADO',
        hashRegras: loan1Hash,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Create endorsements for loan1
    for (const apoiador of apoiadores) {
      await prisma.endosso.create({
        data: {
          emprestimoId: loan1.id,
          apoiadorId: apoiador.id,
          valorStake: 250_000, // 0.25 USDC each
          status: 'ATIVO',
          dataBloqueio: new Date(),
        },
      });
    }

    console.log(`✅ Created loan with endorsements for ${tomador.nome}`);

    // Create second loan - Pending
    const loan2Hash = crypto.createHash('sha256')
      .update(JSON.stringify({
        tomadorId: tomador.id,
        valorTotal: 2_000_000,
        taxaAnualBps: 1400,
        prazoParcelas: 60,
      }))
      .digest('hex');

    const loan2 = await prisma.emprestimo.create({
      data: {
        tomadorId: tomador.id,
        valorTotal: 2_000_000, // 2 USDC
        taxaAnualBps: 1400, // 14%
        prazoParcelas: 60,
        estado: 'PENDENTE',
        hashRegras: loan2Hash,
      },
    });

    console.log(`✅ Created pending loan for ${tomador.nome}`);

    // Create audit events
    await prisma.evento.create({
      data: {
        tipo: 'CRIACAO',
        referenciaId: loan1.id,
        detalhes: JSON.stringify({
          tomadorId: tomador.id,
          valor: 1_000_000,
          score: tomador.score,
        }),
        idempotencyKey: `loan1_${Date.now()}`,
      },
    });

    await prisma.evento.create({
      data: {
        tipo: 'CRIACAO',
        referenciaId: loan2.id,
        detalhes: JSON.stringify({
          tomadorId: tomador.id,
          valor: 2_000_000,
          score: tomador.score,
        }),
        idempotencyKey: `loan2_${Date.now()}`,
      },
    });
  }

  console.log('\n🎉 Sepolia seed completed successfully!');
  console.log(`Created ${users.length} users, 2 loans, and ${apoiadores.length} endorsements`);
  
  console.log('\n🌐 Sepolia Wallets:');
  SEPOLIA_WALLETS.forEach(wallet => {
    console.log(`  ${wallet.tipo.padEnd(10)} | ${wallet.carteira}`);
  });
  
  console.log('\n🔗 Contracts:');
  console.log('  TrustLend MVP: 0x7767005fdcDBF5d88C419f8fdFd549B786648C7e');
  console.log('  Mock USDC: 0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
