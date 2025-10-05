// Sepolia Testnet Wallets for TrustLend Demo

export const SEPOLIA_WALLETS = {
  // Lenders (Provedores de Liquidez)
  LENDER1: '0x58213dC88141ac1D30d94ACF7007C7e5938f9600',
  LENDER2: '0x79F821FF94D3416C2C913a3960C8666813AAcF7F',
  
  // Borrower (Tomador)
  TOMADOR1: '0x7A9b374c4Ac6dE5a49a866A986d1A8C7A523aE06',
  
  // Backers (Apoiadores)
  BACKER1: '0x294C347EA5Bf8496391cD424eFe04D0C6C650933',
  BACKER2: '0x89a0293626D73a76c2e6547902F190343FBb54A1',
};

export const SEPOLIA_USERS = [
  // Lenders
  {
    nome: 'Provedor Alpha',
    carteira: SEPOLIA_WALLETS.LENDER1,
    tipo: 'PROVEDOR',
    score: 95,
    status: 'ATIVO'
  },
  {
    nome: 'Provedor Beta',
    carteira: SEPOLIA_WALLETS.LENDER2,
    tipo: 'PROVEDOR',
    score: 88,
    status: 'ATIVO'
  },
  
  // Borrower
  {
    nome: 'Tomador Principal',
    carteira: SEPOLIA_WALLETS.TOMADOR1,
    tipo: 'TOMADOR',
    score: 75,
    status: 'ATIVO'
  },
  
  // Backers
  {
    nome: 'Apoiador Gamma',
    carteira: SEPOLIA_WALLETS.BACKER1,
    tipo: 'APOIADOR',
    score: 82,
    status: 'ATIVO'
  },
  {
    nome: 'Apoiador Delta',
    carteira: SEPOLIA_WALLETS.BACKER2,
    tipo: 'APOIADOR',
    score: 78,
    status: 'ATIVO'
  }
];

// Sepolia Network Configuration
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  name: 'Sepolia',
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/dsk93iS_CPvx1KDsp3qYaRFwAnURxr5l',
  blockExplorer: 'https://sepolia.etherscan.io',
  
  // Contract addresses (deployed)
  contracts: {
    trustLendMVP: '0x7767005fdcDBF5d88C419f8fdFd549B786648C7e', // TrustLend MVP Contract
    usdcToken: '0x4EDF6078705AB68B70f4786ff2Cb7840BFFA336E', // Mock USDC Contract
    trustLendFactory: '0x7767005fdcDBF5d88C419f8fdFd549B786648C7e', // Same as MVP for now
  }
};

export function isSepoliaWallet(address: string): boolean {
  return Object.values(SEPOLIA_WALLETS).includes(address.toLowerCase() as any);
}

export function getWalletRole(address: string): string | null {
  const lowerAddress = address.toLowerCase();
  
  if ([SEPOLIA_WALLETS.LENDER1, SEPOLIA_WALLETS.LENDER2].includes(lowerAddress as any)) {
    return 'PROVEDOR';
  }
  
  if (lowerAddress === SEPOLIA_WALLETS.TOMADOR1.toLowerCase()) {
    return 'TOMADOR';
  }
  
  if ([SEPOLIA_WALLETS.BACKER1, SEPOLIA_WALLETS.BACKER2].includes(lowerAddress as any)) {
    return 'APOIADOR';
  }
  
  return null;
}
