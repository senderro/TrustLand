// src/app/layout.tsx
import type { Metadata } from 'next';
import Providers from './providers';
import "./globals.css";

export const metadata: Metadata = {
  title: 'TrustLend MVP',
  description: 'Demo Sepolia — RainbowKit + wagmi v2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
