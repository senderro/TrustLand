const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SEPOLIA_USERS = [
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
  console.log('🌱 Adicionando carteiras Sepolia...');

  // Create system parameters
  await prisma.parametrosSistema.upsert({
    where: { versao: 'v1.0.0' },
    update: {},
    create: {
      versao: 'v1.0.0',
      tabelaPricing: JSON.stringify({
        faixas: [
          { nome: 'BAIXO', scoreMin: 0, scoreMax: 39, taxaAnualBps: 2200, limiteMaxMicroUSDC: 2_000_000, exigenciaCoberturaPct: 100 },
          { nome: 'MEDIO', scoreMin: 40, scoreMax: 69, taxaAnualBps: 1800, limiteMaxMicroUSDC: 5_000_000, exigenciaCoberturaPct: 50 },
          { nome: 'BOM', scoreMin: 70, scoreMax: 89, taxaAnualBps: 1400, limiteMaxMicroUSDC: 8_000_000, exigenciaCoberturaPct: 25 },
          { nome: 'EXCELENTE', scoreMin: 90, scoreMax: 100, taxaAnualBps: 900, limiteMaxMicroUSDC: 10_000_000, exigenciaCoberturaPct: 0 }
        ]
      }),
      toleranciaAtraso: 86400,
      tempoParcelaS: 10,
    },
  });

  // Add Sepolia users
  for (const user of SEPOLIA_USERS) {
    await prisma.usuario.upsert({
      where: { carteira: user.carteira },
      update: {
        score: user.score,
        status: user.status,
      },
      create: {
        nome: user.nome,
        carteira: user.carteira,
        tipo: user.tipo,
        score: user.score,
        status: user.status,
      },
    });
    console.log(`✅ Adicionado: ${user.nome} (${user.tipo})`);
  }

  // Add admin user
  await prisma.usuario.upsert({
    where: { carteira: '0x0000000000000000000000000000000000000001' },
    update: {},
    create: {
      nome: 'Administrador Sistema',
      carteira: '0x0000000000000000000000000000000000000001',
      tipo: 'OPERADOR',
      score: 100,
      status: 'ATIVO',
    },
  });
  console.log('✅ Adicionado: Administrador Sistema (OPERADOR)');

  console.log('\n🎉 Banco atualizado com carteiras Sepolia!');
  console.log('🔗 Contratos:');
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
