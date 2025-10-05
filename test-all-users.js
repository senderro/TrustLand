const fetch = require('node-fetch');

const SEPOLIA_USERS = [
  {
    nome: 'Provedor Alpha',
    carteira: '0x58213dC88141ac1D30d94ACF7007C7e5938f9600',
    tipo: 'PROVEDOR'
  },
  {
    nome: 'Provedor Beta', 
    carteira: '0x79F821FF94D3416C2C913a3960C8666813AAcF7F',
    tipo: 'PROVEDOR'
  },
  {
    nome: 'Tomador Principal',
    carteira: '0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06',
    tipo: 'TOMADOR'
  },
  {
    nome: 'Apoiador Gamma',
    carteira: '0x294C347EA5Bf8496391cD424eFe04D0C6C650933',
    tipo: 'APOIADOR'
  },
  {
    nome: 'Apoiador Delta',
    carteira: '0x89a0293626D73a76c2e6547902F190343FBb54A1',
    tipo: 'APOIADOR'
  },
  {
    nome: 'Admin Sistema',
    carteira: '0x0000000000000000000000000000000000000001',
    tipo: 'OPERADOR'
  }
];

async function testUser(user) {
  try {
    console.log(`\n🧪 Testando ${user.nome} (${user.tipo})...`);
    
    const response = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        carteira: user.carteira,
        tipo: user.tipo
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ ${user.nome}: Login OK`);
      console.log(`   Score: ${data.user.score}`);
      console.log(`   Status: ${data.user.status}`);
    } else {
      console.log(`❌ ${user.nome}: ${data.error}`);
    }
    
  } catch (error) {
    console.error(`❌ ${user.nome}: Erro na requisição - ${error.message}`);
  }
}

async function testAllUsers() {
  console.log('🚀 Testando todos os usuários Sepolia...\n');
  
  for (const user of SEPOLIA_USERS) {
    await testUser(user);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre testes
  }
  
  console.log('\n✅ Teste completo!');
  console.log('\n📋 Instruções para teste manual:');
  console.log('1. Acesse: http://localhost:3000/auth');
  console.log('2. Use qualquer carteira acima');
  console.log('3. Selecione o tipo correspondente');
  console.log('4. Clique em "Entrar"');
  console.log('5. Verifique se vai para o dashboard correto');
}

testAllUsers();
