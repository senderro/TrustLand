const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://trustlend:trustlend123@localhost:5432/trustlend"
    }
  }
});

async function checkUser() {
  try {
    const carteira = '0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06';
    
    console.log('🔍 Verificando usuário...');
    console.log('Carteira buscada:', carteira);
    
    // Busca exata
    const userExact = await prisma.usuario.findUnique({
      where: { carteira: carteira }
    });
    
    // Busca lowercase
    const userLower = await prisma.usuario.findUnique({
      where: { carteira: carteira.toLowerCase() }
    });
    
    // Busca todos os usuários
    const allUsers = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        carteira: true,
        tipo: true,
        status: true
      }
    });
    
    console.log('\n📊 Resultados:');
    console.log('Usuário (busca exata):', userExact ? '✅ Encontrado' : '❌ Não encontrado');
    console.log('Usuário (lowercase):', userLower ? '✅ Encontrado' : '❌ Não encontrado');
    
    console.log('\n👥 Todos os usuários no banco:');
    allUsers.forEach(user => {
      console.log(`  ${user.tipo.padEnd(10)} | ${user.carteira} | ${user.nome}`);
    });
    
    if (userExact) {
      console.log('\n✅ Usuário encontrado (busca exata):');
      console.log(JSON.stringify(userExact, null, 2));
    }
    
    if (userLower) {
      console.log('\n✅ Usuário encontrado (lowercase):');
      console.log(JSON.stringify(userLower, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
