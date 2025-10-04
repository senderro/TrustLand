'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';

export default function Page() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <ConnectButton />
      {isConnected && (
        <div style={{ fontFamily: 'monospace' }}>
          <div>addr: {address}</div>
          <div>chain: {chainId}</div>
        </div>
      )}
    </main>
  );
}
