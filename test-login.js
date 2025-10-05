const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🧪 Testando login...');
    
    const response = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        carteira: '0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06',
        tipo: 'TOMADOR'
      })
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Login funcionando!');
      console.log('Usuário:', data.user.nome);
      console.log('Tipo:', data.user.tipo);
    } else {
      console.log('❌ Erro no login:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testLogin();
