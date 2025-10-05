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
      toleranciaAtraso: 30, // 30 segundos
      tempoParcelaS: 10     // 10 segundos por parcela
    }
  });

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

  const tomador = await prisma.usuario.upsert({
    where: { carteira: '0x3456789012345678901234567890123456789012' },
    update: {},
    create: {
      nome: 'João da Silva',
      cpf: '123.456.789-01',
      endereco: 'Rua das Flores, 123 - São Paulo, SP',
      carteira: '0x3456789012345678901234567890123456789012',
      tipo: 'TOMADOR',
      score: 65
    }
  });

  // Create more diverse users
  const tomadores = await Promise.all([
    prisma.usuario.upsert({
      where: { carteira: '0x3456789012345678901234567890123456789012' },
      update: {},
      create: {
        nome: 'João da Silva',
        cpf: '123.456.789-01',
        endereco: 'Rua das Flores, 123 - São Paulo, SP',
        carteira: '0x3456789012345678901234567890123456789012',
        tipo: 'TOMADOR',
        score: 65
      }
    }),
    prisma.usuario.upsert({
      where: { carteira: '0xa123456789012345678901234567890123456789' },
      update: {},
      create: {
        nome: 'Pedro Santos',
        cpf: '987.654.321-09',
        endereco: 'Av. Paulista, 1000 - São Paulo, SP',
        carteira: '0xa123456789012345678901234567890123456789',
        tipo: 'TOMADOR',
        score: 72
      }
    }),
    prisma.usuario.upsert({
      where: { carteira: '0xb234567890123456789012345678901234567890' },
      update: {},
      create: {
        nome: 'Lucia Oliveira',
        cpf: '456.789.123-45',
        endereco: 'Rua Augusta, 500 - São Paulo, SP',
        carteira: '0xb234567890123456789012345678901234567890',
        tipo: 'TOMADOR',
        score: 58
      }
    }),
    prisma.usuario.upsert({
      where: { carteira: '0xc345678901234567890123456789012345678901' },
      update: {},
      create: {
        nome: 'Roberto Lima',
        cpf: '789.123.456-78',
        endereco: 'Rua Oscar Freire, 200 - São Paulo, SP',
        carteira: '0xc345678901234567890123456789012345678901',
        tipo: 'TOMADOR',
        score: 83
      }
    })
  ]);

  const apoiadores = await Promise.all([
    prisma.usuario.upsert({
      where: { carteira: '0x4567890123456789012345678901234567890123' },
      update: {},
      create: {
        nome: 'Maria Apoiadora',
        cpf: '321.654.987-32',
        endereco: 'Rua Consolação, 800 - São Paulo, SP',
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
        cpf: '654.987.321-65',
        endereco: 'Av. Faria Lima, 1500 - São Paulo, SP',
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
        cpf: '147.258.369-14',
        endereco: 'Rua Vergueiro, 300 - São Paulo, SP',
        carteira: '0x6789012345678901234567890123456789012345',
        tipo: 'APOIADOR',
        score: 70
      }
    }),
    prisma.usuario.upsert({
      where: { carteira: '0xd456789012345678901234567890123456789012' },
      update: {},
      create: {
        nome: 'Fernando Costa',
        cpf: '258.369.147-25',
        endereco: 'Rua da República, 150 - São Paulo, SP',
        carteira: '0xd456789012345678901234567890123456789012',
        tipo: 'APOIADOR',
        score: 88
      }
    }),
    prisma.usuario.upsert({
      where: { carteira: '0xe567890123456789012345678901234567890123' },
      update: {},
      create: {
        nome: 'Juliana Mendes',
        cpf: '369.147.258-36',
        endereco: 'Av. Ibirapuera, 2000 - São Paulo, SP',
        carteira: '0xe567890123456789012345678901234567890123',
        tipo: 'APOIADOR',
        score: 77
      }
    })
  ]);

  const provedores = await Promise.all([
    prisma.usuario.upsert({
      where: { carteira: '0x2345678901234567890123456789012345678901' },
      update: {},
      create: {
        nome: 'Provedor Liquidez',
        cpf: '111.222.333-44',
        endereco: 'Av. Brigadeiro Faria Lima, 3000 - São Paulo, SP',
        carteira: '0x2345678901234567890123456789012345678901',
        tipo: 'PROVEDOR',
        score: 95
      }
    }),
    prisma.usuario.upsert({
      where: { carteira: '0xf678901234567890123456789012345678901234' },
      update: {},
      create: {
        nome: 'Investidor Institucional',
        cpf: '555.666.777-88',
        endereco: 'Rua Funchal, 500 - São Paulo, SP',
        carteira: '0xf678901234567890123456789012345678901234',
        tipo: 'PROVEDOR',
        score: 92
      }
    })
  ]);

  console.log({
    parametros: defaultParams.versao,
    operador: operador.nome,
    provedores: provedores.map((p: any) => p.nome),
    tomadores: tomadores.map((t: any) => t.nome),
    apoiadores: apoiadores.map((a: any) => a.nome),
    totalUsuarios: 2 + provedores.length + tomadores.length + apoiadores.length
  });

  console.log('🌐 Adding Sepolia testnet users...');
  
  for (const sepoliaUser of SEPOLIA_USERS) {
    await prisma.usuario.upsert({
      where: { carteira: sepoliaUser.carteira },
      update: {},
      create: {
        nome: sepoliaUser.nome,
        carteira: sepoliaUser.carteira,
        endereco: 'Sepolia Testnet',
        tipo: sepoliaUser.tipo as any,
        score: sepoliaUser.score,
        status: sepoliaUser.status as any,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${users.length} users, ${loans.length} loans, ${endorsements.length} endorsements`);
  console.log(`Added ${SEPOLIA_USERS.length} Sepolia testnet users`);
  .finally(async () => {
    await prisma.$disconnect();
  });
