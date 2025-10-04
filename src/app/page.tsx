'use client';
import { useAccount, useChainId, useReadContract, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import MockUSDC from '@/abis/MockUSDC.json';
import { useState } from 'react';

export default function Page() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

  // Ler saldo
  const { data: balance, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: MockUSDC.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Função de mint
  const { writeContract, isPending } = useWriteContract();

  const [mintTo, setMintTo] = useState('');
  const [mintAmount, setMintAmount] = useState('');

  const handleMint = async () => {
    if (!mintTo || !mintAmount) return alert('Preencha os campos');
   await writeContract({
      address: USDC_ADDRESS,
      abi: MockUSDC.abi,
      functionName: 'mint',
      args: [mintTo, BigInt(mintAmount) * 10n ** 6n], // ✅ tudo bigint
    });

    await refetch();
  };

  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <ConnectButton />
      {isConnected && (
        <div style={{ fontFamily: 'monospace' }}>
          <div>addr: {address}</div>
          <div>chain: {chainId}</div>
          <div>
            saldo: {balance ? Number(balance) / 10 ** 6 : '...'} USDC
          </div>

          <hr />
          <h3>Mintar USDC</h3>
          <input
            placeholder="Endereço"
            value={mintTo}
            onChange={(e) => setMintTo(e.target.value)}
            style={{ padding: 8, width: '100%' }}
          />
          <input
            placeholder="Quantidade"
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            style={{ padding: 8, width: '100%' }}
          />
          <button
            onClick={handleMint}
            disabled={isPending}
            style={{
              padding: 8,
              background: 'black',
              color: 'white',
              borderRadius: 8,
            }}
          >
            {isPending ? 'Mintando...' : 'Mintar'}
          </button>
        </div>
      )}
    </main>
  );
}
