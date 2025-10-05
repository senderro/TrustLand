#!/usr/bin/env node

// Simple test script for Sepolia integration
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 TrustLend Sepolia Integration Test\n');

// Check if .env.local exists
if (!fs.existsSync('.env.local')) {
  console.log('❌ .env.local not found');
  console.log('Please create .env.local with the Sepolia configuration');
  process.exit(1);
}

console.log('✅ Environment file found');

// Check if database exists
if (!fs.existsSync('dev.db')) {
  console.log('📦 Creating SQLite database...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database created');
  } catch (error) {
    console.log('❌ Failed to create database');
    process.exit(1);
  }
} else {
  console.log('✅ Database exists');
}

// Check Sepolia wallets
const sepoliaWallets = {
  LENDER1: '0x58213dC88141ac1D30d94ACF7007C7e5938f9600',
  LENDER2: '0x79F821FF94D3416C2C913a3960C8666813AAcF7F',
  TOMADOR1: '0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06',
  BACKER1: '0x294C347EA5Bf8496391cD424eFe04D0C6C650933',
  BACKER2: '0x89a0293626D73a76c2e6547902F190343FBb54A1',
};

console.log('🌐 Sepolia Test Wallets:');
Object.entries(sepoliaWallets).forEach(([role, address]) => {
  console.log(`  ${role}: ${address}`);
});

// Check contracts
const contracts = {
  'TrustLend MVP': '0x7767005fdcDBF5d88C419f8fdFd549B786648C7e',
  'Mock USDC': '0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E',
};

console.log('\n📋 Deployed Contracts:');
Object.entries(contracts).forEach(([name, address]) => {
  console.log(`  ${name}: ${address}`);
  console.log(`    Etherscan: https://sepolia.etherscan.io/address/${address}`);
});

console.log('\n🚀 Ready to test!');
console.log('1. Start the development server: npm run dev');
console.log('2. Go to http://localhost:3000/auth');
console.log('3. Use one of the Sepolia wallets above');
console.log('4. Test the dashboards and functionality');
console.log('\n🔗 Useful Links:');
console.log('- Sepolia Etherscan: https://sepolia.etherscan.io');
console.log('- Sepolia Faucet: https://sepoliafaucet.com');
console.log('- TrustLend Contract: https://sepolia.etherscan.io/address/0x7767005fdcDBF5d88C419f8fdFd549B786648C7e');

console.log('\n✨ Test Scenarios:');
console.log('📝 Tomador: Create loan → Get endorsements → Repay');
console.log('🤝 Apoiador: Search borrowers → Endorse loans → Track returns');
console.log('💰 Provedor: Deposit liquidity → Monitor pool → Withdraw earnings');
console.log('⚙️  Operador: Manage users → Approve loans → View system metrics');
