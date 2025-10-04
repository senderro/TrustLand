// Configuration and environment variables
export const config = {
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
    useMemory: process.env.USE_MEMORY === '1',
  },
  web3: {
    sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/demo',
    privateKey: process.env.PRIVATE_KEY,
    usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x0000000000000000000000000000000000000000',
    mvpAddress: process.env.NEXT_PUBLIC_MVP_ADDRESS || '0x0000000000000000000000000000000000000000',
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111'),
  },
  providers: {
    alchemyKey: process.env.ALCHEMY_OR_INFURA_KEY,
    etherscanKey: process.env.ETHERSCAN_API_KEY,
  },
  flags: {
    useMemory: process.env.USE_MEMORY === '1',
    mockMode: process.env.NODE_ENV === 'development',
  },
} as const;

// Validation
export function validateConfig() {
  const errors: string[] = [];
  
  if (!config.web3.sepoliaRpcUrl || config.web3.sepoliaRpcUrl.includes('demo')) {
    errors.push('SEPOLIA_RPC_URL not configured');
  }
  
  if (!config.web3.privateKey && typeof window === 'undefined') {
    errors.push('PRIVATE_KEY required for server-side operations');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
