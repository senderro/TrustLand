import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { SEPOLIA_USERS, SEPOLIA_CONFIG } from '../src/lib/sepolia-wallets';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Sepolia database seed...');

  // Create Sepolia contract configuration
  console.log('⚙️ Setting up Sepolia contract configuration...');
  
  const sepoliaConfig = await prisma.contractConfig.upsert({
    where: { network: 'sepolia' },
    update: {
      poolAddress: '0x7767005fdcDBF5d88C419f8fdFd549B786648C7e',
      factoryAddress: '0x7767005fdcDBF5d88C419f8fdFd549B786648C7e',
      usdcAddress: '0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E',
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/dsk93iS_CPvx1KDsp3qYaRFwAnURxr5l',
    },
    create: {
      network: 'sepolia',
      poolAddress: '0x7767005fdcDBF5d88C419f8fdFd549B786648C7e', // TrustLend MVP Contract
      factoryAddress: '0x7767005fdcDBF5d88C419f8fdFd549B786648C7e', // Same as MVP
      usdcAddress: '0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E', // Mock USDC Contract
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/dsk93iS_CPvx1KDsp3qYaRFwAnURxr5l',
      blockExplorer: 'https://sepolia.etherscan.io',
      chainId: 11155111,
      isActive: true,
    },
  });

  // Create default system parameters
  console.log('📋 Creating system parameters...');
  
  const defaultParams = await prisma.parametrosSistema.upsert({
    where: { versao: 'v1.0.0-sepolia' },
    update: {},
    create: {
      versao: 'v1.0.0-sepolia',
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
      toleranciaAtraso: 86400, // 24h em segundos
      tempoParcelaS: 10, // 10s para demo
    },
  });

  // Create Sepolia users
  console.log('👥 Creating Sepolia users...');
  
  const createdUsers = [];
  
  for (const sepoliaUser of SEPOLIA_USERS) {
    const user = await prisma.usuario.upsert({
      where: { carteira: sepoliaUser.carteira },
      update: {
        score: sepoliaUser.score,
        status: sepoliaUser.status as any,
        network: 'sepolia',
        lastActivity: new Date(),
      },
      create: {
        nome: sepoliaUser.nome,
        carteira: sepoliaUser.carteira,
        tipo: sepoliaUser.tipo as any,
        score: sepoliaUser.score,
        status: sepoliaUser.status as any,
        network: 'sepolia',
        lastActivity: new Date(),
      },
    });
    createdUsers.push(user);
  }

  // Create admin user
  const adminUser = await prisma.usuario.upsert({
    where: { carteira: '0x0000000000000000000000000000000000000001' },
    update: {},
    create: {
      nome: 'Administrador Sistema',
      carteira: '0x0000000000000000000000000000000000000001',
      tipo: 'OPERADOR',
      score: 100,
      status: 'ATIVO',
      network: 'sepolia',
      isContract: true,
    },
  });

  // Create sample loan for testing
  console.log('💰 Creating sample loan...');
  
  const tomador = createdUsers.find(u => u.tipo === 'TOMADOR');
  if (tomador) {
    const hashRegras = crypto.createHash('sha256').update(JSON.stringify({
      tomadorId: tomador.id,
      valorTotal: 1_000_000, // 1 USDC
      taxaAnualBps: 1400,
      prazoParcelas: 30,
      timestamp: Date.now(),
    })).digest('hex');

    const sampleLoan = await prisma.emprestimo.create({
      data: {
        tomadorId: tomador.id,
        valorTotal: 1_000_000, // 1 USDC
        taxaAnualBps: 1400, // 14%
        prazoParcelas: 30, // 30 dias
        estado: 'PENDENTE',
        colateral: 0,
        hashRegras,
        network: 'sepolia',
      },
    });

    // Create installments
    const installments = [];
    const totalAmount = 1_000_000 + (1_000_000 * 1400 / 10000 * 30 / 365);
    const installmentAmount = Math.floor(totalAmount / 30);

    for (let i = 0; i < 30; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + i + 1);
      
      installments.push({
        emprestimoId: sampleLoan.id,
        indice: i,
        valor: i === 29 
          ? totalAmount - (installmentAmount * 29) // Last installment gets remainder
          : installmentAmount,
        dueAt: dueDate,
        status: 'ABERTA',
      });
    }

    await prisma.parcela.createMany({
      data: installments,
    });

    // Create audit event
    await prisma.evento.create({
      data: {
        tipo: 'CRIACAO',
        referenciaId: sampleLoan.id,
        detalhes: JSON.stringify({
          tomadorId: tomador.id,
          valor: 1_000_000,
          score: tomador.score,
          apr: 1400,
          network: 'sepolia',
        }),
        idempotencyKey: `loan_creation_${sampleLoan.id}_${Date.now()}`,
      },
    });

    console.log(`📄 Created sample loan: ${sampleLoan.id}`);
  }

  // Create sample pool positions for lenders
  console.log('🏊 Creating sample pool positions...');
  
  const lenders = createdUsers.filter(u => u.tipo === 'PROVEDOR');
  for (const lender of lenders) {
    const position = await prisma.poolPosition.create({
      data: {
        provedorId: lender.id,
        amount: 5_000_000, // 5 USDC
        shares: 5_000_000, // 1:1 ratio initially
        status: 'ATIVO',
      },
    });

    console.log(`💰 Created pool position for ${lender.nome}: ${position.id}`);
  }

  console.log('✅ Sepolia database seeded successfully!');
  console.log(`Created ${createdUsers.length} Sepolia users + 1 admin`);
  console.log(`Network: ${sepoliaConfig.network} (Chain ID: ${sepoliaConfig.chainId})`);
  console.log(`USDC Address: ${sepoliaConfig.usdcAddress}`);
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
