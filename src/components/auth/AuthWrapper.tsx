'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = ['/auth', '/contract-demo'];

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se não está autenticado e não está em uma rota pública
    if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname) && pathname !== '/') {
      router.push('/auth');
      return;
    }

    // Se está autenticado e está na rota auth, redireciona para dashboard
    if (isAuthenticated && pathname === '/auth') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, pathname, router]);

  // Se não está autenticado e não está em rota pública, não renderiza nada
  // (o useEffect vai redirecionar)
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname) && pathname !== '/') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
