import { createPublicClient, createWalletClient, http, parseEther, parseUnits, formatUnits, PublicClient } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
// Import only the non-wagmi config to avoid circular dependencies
const CONTRACTS = {
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x0000000000000000000000000000000000000000',
  MVP: process.env.NEXT_PUBLIC_MVP_ADDRESS || '0x0000000000000000000000000000000000000000',
} as const;

const RPC_CONFIG = {
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR-PROJECT-ID',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
};

const USDC_DECIMALS = 6;

const MOCK_MODE = process.env.NODE_ENV === 'development' && 
  (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mock') === '1' : false);

// Public client for reading data
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_CONFIG.sepolia.rpcUrl),
});

// Wallet client for transactions (server-side only)
export function createServerWalletClient() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_CONFIG.sepolia.rpcUrl),
  });
}

// USDC contract interactions
export class USDCContract {
  private publicClient: PublicClient = publicClient;
  private walletClient?: ReturnType<typeof createServerWalletClient>;

  constructor(private address: `0x${string}` = CONTRACTS.USDC as `0x${string}`) {
    if (typeof window === 'undefined' && process.env.PRIVATE_KEY) {
      this.walletClient = createServerWalletClient();
    }
  }

  // Read balance
  async balanceOf(account: `0x${string}`): Promise<bigint> {
    if (MOCK_MODE) {
      // Return mock balance for demo
      return parseUnits('1000', USDC_DECIMALS);
    }

    try {
      const balance = await this.publicClient.readContract({
        address: this.address,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [account],
      });
      return balance;
    } catch (error) {
      console.error('Error reading USDC balance:', error);
      return 0n;
    }
  }

  // Mint tokens (demo only)
  async mint(to: `0x${string}`, amountDecimal: number): Promise<`0x${string}` | null> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available');
    }

    if (MOCK_MODE) {
      // Return fake transaction hash for demo
      return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12' as `0x${string}`;
    }

    try {
      const amount = parseUnits(amountDecimal.toString(), USDC_DECIMALS);
      
      const hash = await this.walletClient.writeContract({
        address: this.address,
        abi: [
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
        ],
        functionName: 'mint',
        args: [to, amount],
      });

      return hash;
    } catch (error) {
      console.error('Error minting USDC:', error);
      return null;
    }
  }

  // Transfer tokens
  async transfer(to: `0x${string}`, amountDecimal: number): Promise<`0x${string}` | null> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available');
    }

    if (MOCK_MODE) {
      // Return fake transaction hash for demo
      return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab' as `0x${string}`;
    }

    try {
      const amount = parseUnits(amountDecimal.toString(), USDC_DECIMALS);
      
      const hash = await this.walletClient.writeContract({
        address: this.address,
        abi: [
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
        ],
        functionName: 'transfer',
        args: [to, amount],
      });

      return hash;
    } catch (error) {
      console.error('Error transferring USDC:', error);
      return null;
    }
  }

  // Format balance for display
  formatBalance(balance: bigint): string {
    return formatUnits(balance, USDC_DECIMALS);
  }
}

// TrustLend MVP contract interactions
export class TrustLendContract {
  private publicClient: PublicClient = publicClient;
  private walletClient?: ReturnType<typeof createServerWalletClient>;

  constructor(private address: `0x${string}` = CONTRACTS.MVP as `0x${string}`) {
    if (typeof window === 'undefined' && process.env.PRIVATE_KEY) {
      this.walletClient = createServerWalletClient();
    }
  }

  // Create loan (simplified for MVP)
  async createLoan(
    borrower: `0x${string}`,
    amount: bigint,
    termSeconds: number
  ): Promise<`0x${string}` | null> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available');
    }

    if (MOCK_MODE) {
      // Return fake transaction hash for demo
      return '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde' as `0x${string}`;
    }

    try {
      // This would interact with actual smart contract
      // For now, return a mock hash
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      return '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde' as `0x${string}`;
    } catch (error) {
      console.error('Error creating loan on-chain:', error);
      return null;
    }
  }

  // Disburse loan
  async disburseLoan(loanId: string, amount: bigint): Promise<`0x${string}` | null> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available');
    }

    if (MOCK_MODE) {
      return '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456' as `0x${string}`;
    }

    try {
      // This would interact with actual smart contract
      await new Promise(resolve => setTimeout(resolve, 1000));
      return '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456' as `0x${string}`;
    } catch (error) {
      console.error('Error disbursing loan:', error);
      return null;
    }
  }

  // Repay loan
  async repayLoan(loanId: string, amount: bigint): Promise<`0x${string}` | null> {
    if (!this.walletClient) {
      throw new Error('Wallet client not available');
    }

    if (MOCK_MODE) {
      return '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`;
    }

    try {
      // This would interact with actual smart contract
      await new Promise(resolve => setTimeout(resolve, 1000));
      return '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`;
    } catch (error) {
      console.error('Error repaying loan:', error);
      return null;
    }
  }
}

// Factory functions for contract instances
export function createUSDCContract(address?: `0x${string}`) {
  return new USDCContract(address);
}

export function createTrustLendContract(address?: `0x${string}`) {
  return new TrustLendContract(address);
}

// Transaction status checker
export class TransactionMonitor {
  constructor(private publicClient: PublicClient = publicClient) {}

  async waitForTransaction(hash: `0x${string}`, timeout = 60000): Promise<{
    status: 'success' | 'reverted' | 'timeout';
    blockNumber?: bigint;
    gasUsed?: bigint;
  }> {
    if (MOCK_MODE) {
      // Simulate successful transaction for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        status: 'success',
        blockNumber: BigInt(Date.now()),
        gasUsed: 21000n,
      };
    }

    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout,
      });

      return {
        status: receipt.status === 'success' ? 'success' : 'reverted',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      console.error('Transaction timeout or error:', error);
      return { status: 'timeout' };
    }
  }

  async getTransaction(hash: `0x${string}`) {
    if (MOCK_MODE) {
      return {
        hash,
        blockNumber: BigInt(Date.now()),
        from: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        to: '0x2345678901234567890123456789012345678901' as `0x${string}`,
        value: 0n,
      };
    }

    try {
      return await this.publicClient.getTransaction({ hash });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }
}

export const transactionMonitor = new TransactionMonitor();
