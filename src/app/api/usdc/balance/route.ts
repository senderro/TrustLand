import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import MockUSDC from '@/abis/MockUSDC.json';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/dsk93iS_CPvx1KDsp3qYaRFwAnURxr5l';

const client = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address') as `0x${string}`;

  if (!address) {
    return NextResponse.json({ error: 'Endereço não fornecido' }, { status: 400 });
  }

  if (searchParams.get('mock') === '1') {
    const mockBalance = Math.random() * 10000;
    return NextResponse.json({
      success: true,
      data: {
        address,
        balance: mockBalance,
        formatted: `${mockBalance.toFixed(2)} USDC`
      }
    });
  }

  try {
    const balance = await client.readContract({
      address: USDC_ADDRESS,
      abi: MockUSDC.abi,
      functionName: 'balanceOf',
      args: [address],
    }) as bigint;

    const formatted = Number(formatUnits(balance, 6));
    return NextResponse.json({ 
      success: true,
      data: {
        address, 
        balance: formatted,
        formatted: `${formatted.toFixed(2)} USDC`
      }
    });
  } catch (err: any) {
    console.error('Error reading balance:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to get balance' 
    }, { status: 500 });
  }
}
