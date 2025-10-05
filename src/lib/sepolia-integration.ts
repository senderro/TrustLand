// Sepolia Blockchain Integration for TrustLend

import { SEPOLIA_CONFIG, SEPOLIA_WALLETS } from './sepolia-wallets';

// Contract ABIs (simplified for demo)
export const TRUSTLEND_MVP_ABI = [
  // Read functions
  "function getScore(address user) view returns (uint256)",
  "function getLoan(uint256 loanId) view returns (tuple(address borrower, uint256 amount, uint256 apr, uint256 term, uint8 status))",
  "function getEndorsement(uint256 endorsementId) view returns (tuple(address endorser, uint256 loanId, uint256 amount, uint8 status))",
  "function getPoolBalance() view returns (uint256)",
  "function getUserBalance(address user) view returns (uint256)",
  
  // Write functions
  "function createLoan(uint256 amount, uint256 termDays, string memory purpose) returns (uint256)",
  "function endorseLoan(uint256 loanId, uint256 amount) returns (uint256)",
  "function depositToPool(uint256 amount) returns (bool)",
  "function withdrawFromPool(uint256 amount) returns (bool)",
  "function repayLoan(uint256 loanId, uint256 amount) returns (bool)",
  
  // Events
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount)",
  "event LoanEndorsed(uint256 indexed loanId, address indexed endorser, uint256 amount)",
  "event LoanRepaid(uint256 indexed loanId, uint256 amount)",
  "event PoolDeposit(address indexed provider, uint256 amount)",
  "event PoolWithdraw(address indexed provider, uint256 amount)",
];

export const MOCK_USDC_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) returns (bool)", // For testing
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

// Helper functions for contract interaction
export class SepoliaContractHelper {
  private rpcUrl: string;
  private contracts: typeof SEPOLIA_CONFIG.contracts;

  constructor() {
    this.rpcUrl = SEPOLIA_CONFIG.rpcUrl;
    this.contracts = SEPOLIA_CONFIG.contracts;
  }

  // Get contract addresses
  getTrustLendAddress(): string {
    return this.contracts.trustLendMVP;
  }

  getUSDCAddress(): string {
    return this.contracts.usdcToken;
  }

  // Format amounts for contract calls (convert to wei/microUSDC)
  formatAmount(amount: number): string {
    return (amount * 1_000_000).toString(); // Convert to microUSDC
  }

  // Parse amounts from contract responses
  parseAmount(amount: string): number {
    return parseInt(amount) / 1_000_000; // Convert from microUSDC
  }

  // Get Etherscan URL for transaction
  getTransactionUrl(txHash: string): string {
    return `${SEPOLIA_CONFIG.blockExplorer}/tx/${txHash}`;
  }

  // Get Etherscan URL for address
  getAddressUrl(address: string): string {
    return `${SEPOLIA_CONFIG.blockExplorer}/address/${address}`;
  }

  // Check if address is one of our demo wallets
  isKnownWallet(address: string): boolean {
    return Object.values(SEPOLIA_WALLETS).includes(address.toLowerCase() as any);
  }

  // Get wallet info
  getWalletInfo(address: string) {
    const lowerAddress = address.toLowerCase();
    
    if (lowerAddress === SEPOLIA_WALLETS.LENDER1.toLowerCase()) {
      return { name: 'Provedor Alpha', type: 'PROVEDOR' };
    }
    if (lowerAddress === SEPOLIA_WALLETS.LENDER2.toLowerCase()) {
      return { name: 'Provedor Beta', type: 'PROVEDOR' };
    }
    if (lowerAddress === SEPOLIA_WALLETS.TOMADOR1.toLowerCase()) {
      return { name: 'Tomador Principal', type: 'TOMADOR' };
    }
    if (lowerAddress === SEPOLIA_WALLETS.BACKER1.toLowerCase()) {
      return { name: 'Apoiador Gamma', type: 'APOIADOR' };
    }
    if (lowerAddress === SEPOLIA_WALLETS.BACKER2.toLowerCase()) {
      return { name: 'Apoiador Delta', type: 'APOIADOR' };
    }
    
    return null;
  }
}

// Transaction types for tracking
export enum TransactionType {
  LOAN_CREATE = 'LOAN_CREATE',
  ENDORSEMENT = 'ENDORSEMENT',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  PAYMENT = 'PAYMENT',
  APPROVE = 'APPROVE',
}

// Status types
export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum LoanStatus {
  PENDING = 0,
  ACTIVE = 1,
  REPAID = 2,
  DEFAULTED = 3,
}

export enum EndorsementStatus {
  PENDING = 0,
  ACTIVE = 1,
  RELEASED = 2,
  SLASHED = 3,
}

// Contract interaction helpers
export const ContractHelper = new SepoliaContractHelper();

// Demo data for testing
export const DEMO_TRANSACTIONS = [
  {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    type: TransactionType.LOAN_CREATE,
    from: SEPOLIA_WALLETS.TOMADOR1,
    amount: 1000, // 1000 USDC
    status: TransactionStatus.SUCCESS,
  },
  {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    type: TransactionType.ENDORSEMENT,
    from: SEPOLIA_WALLETS.BACKER1,
    amount: 500, // 500 USDC
    status: TransactionStatus.SUCCESS,
  },
  {
    hash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    type: TransactionType.DEPOSIT,
    from: SEPOLIA_WALLETS.LENDER1,
    amount: 5000, // 5000 USDC
    status: TransactionStatus.SUCCESS,
  },
];

export default ContractHelper;
