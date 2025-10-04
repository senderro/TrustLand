import { NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import MockUSDC from '@/abis/MockUSDC.json';

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/dsk93iS_CPvx1KDsp3qYaRFwAnURxr5l';

const account = PRIVATE_KEY ? privateKeyToAccount(PRIVATE_KEY) : null;
const walletClient = account ? createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL),
}) : null;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

export async function POST(req: Request) {
  const { to, amount } = await req.json();

  if (!to || !amount) {
    return NextResponse.json({ error: 'Campos obrigatórios: to, amount' }, { status: 400 });
  }

  const isMock = req.headers.get('x-mock') === '1' || !PRIVATE_KEY || !walletClient;
  
  if (isMock) {
    return NextResponse.json({
      success: true,
      data: {
        hash: `0x${Math.random().toString(16).slice(2, 66).padEnd(64, '0')}`,
        to,
        amount,
        mock: true
      }
    });
  }

  try {
    const hash = await walletClient!.writeContract({
      address: USDC_ADDRESS,
      abi: MockUSDC.abi,
      functionName: 'mint',
      args: [to as `0x${string}`, parseUnits(amount.toString(), 6)],
    });

    return NextResponse.json({ 
      success: true,
      data: { hash, to, amount }
    });
  } catch (err: any) {
    console.error('Mint error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
