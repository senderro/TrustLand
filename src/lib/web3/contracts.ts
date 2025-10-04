import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, Address } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Contract addresses from environment
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address || '0x0000000000000000000000000000000000000000';
export const MVP_ADDRESS = process.env.NEXT_PUBLIC_MVP_ADDRESS as Address || '0x0000000000000000000000000000000000000000';

export const USDC_DECIMALS = 6;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/demo';

// Public client for reading
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

// Wallet client for writing (server-side only)
export const createServerWalletClient = () => {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  const account = privateKeyToAccount(privateKey);
  
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(SEPOLIA_RPC_URL),
  });
};

// USDC Contract ABI (minimal)
const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// Helper functions
export async function readUSDC(address: Address): Promise<bigint> {
  // Check for mock mode
  if (typeof window !== 'undefined') {
    const mockParam = new URLSearchParams(window.location.search).get('mock');
    if (mockParam === '1') {
      // Return mock balance for demo
      return parseUnits('1000', USDC_DECIMALS);
    }
  }

  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
    return balance;
  } catch (error) {
    console.error('Error reading USDC balance:', error);
    return 0n;
  }
}

export async function mintUSDC(to: Address, amountMicros: number): Promise<`0x${string}` | null> {
  // Check for mock mode first
  if (typeof window !== 'undefined') {
    const mockParam = new URLSearchParams(window.location.search).get('mock');
    if (mockParam === '1') {
      // Return fake transaction hash for demo
      return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12' as `0x${string}`;
    }
  }

  // Server-side check for mock mode
  if (process.env.NODE_ENV === 'development') {
    // Return fake transaction hash for demo
    return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12' as `0x${string}`;
  }

  try {
    const walletClient = createServerWalletClient();
    const amount = BigInt(amountMicros);
    
    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'mint',
      args: [to, amount],
    });

    return hash;
  } catch (error) {
    console.error('Error minting USDC (never log private key):', error);
    return null;
  }
}

// Format helpers
export function formatUSDC(microUSDC: bigint | number): string {
  const amount = typeof microUSDC === 'bigint' ? microUSDC : BigInt(microUSDC);
  return formatUnits(amount, USDC_DECIMALS);
}

export function parseUSDC(usdc: string): bigint {
  return parseUnits(usdc, USDC_DECIMALS);
}

// Safe-guard: never log private keys
export function safeLog(message: string, data?: any) {
  if (data && typeof data === 'object') {
    const filtered = { ...data };
    delete filtered.privateKey;
    delete filtered.PRIVATE_KEY;
    console.log(message, filtered);
  } else {
    console.log(message, data);
  }
}
