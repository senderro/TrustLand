import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'viem/chains';

// Contract addresses (will be populated when deployed)
export const CONTRACTS = {
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x0000000000000000000000000000000000000000',
  MVP: process.env.NEXT_PUBLIC_MVP_ADDRESS || '0x0000000000000000000000000000000000000000',
} as const;

export const wagmiConfig = getDefaultConfig({
  appName: 'TrustLend MVP',
  projectId: 'trustlend-mvp', // Replace with actual WalletConnect project ID
  chains: [sepolia],
  ssr: true,
});

// Chain configuration
export const SEPOLIA_CHAIN_ID = 11155111;

// RPC configuration
export const RPC_CONFIG = {
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR-PROJECT-ID',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
};

// Gas settings
export const GAS_SETTINGS = {
  gasLimit: 300000n,
  maxFeePerGas: 20000000000n, // 20 gwei
  maxPriorityFeePerGas: 2000000000n, // 2 gwei
};

// USDC configuration (6 decimals)
export const USDC_DECIMALS = 6;
export const USDC_MULTIPLIER = 10 ** USDC_DECIMALS;

// Helper functions
export function microUSDCToUSDC(microUSDC: number): string {
  return (microUSDC / USDC_MULTIPLIER).toFixed(6);
}

export function usdcToMicroUSDC(usdc: number): number {
  return Math.round(usdc * USDC_MULTIPLIER);
}

export function formatUSDC(microUSDC: number): string {
  const usdc = microUSDC / USDC_MULTIPLIER;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
  }).format(usdc);
}

// Mock mode configuration
export const MOCK_MODE = process.env.NODE_ENV === 'development' && 
  (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mock') === '1' : false);

// Demo accounts for development
export const DEMO_ACCOUNTS = {
  operator: '0x1234567890123456789012345678901234567890',
  provider: '0x2345678901234567890123456789012345678901',
  borrower: '0x3456789012345678901234567890123456789012',
  supporters: [
    '0x4567890123456789012345678901234567890123',
    '0x5678901234567890123456789012345678901234',
    '0x6789012345678901234567890123456789012345',
  ],
};

export function isDemoAccount(address: string): boolean {
  return Object.values(DEMO_ACCOUNTS).flat().includes(address.toLowerCase());
}
