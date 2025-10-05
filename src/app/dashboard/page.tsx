'use client';

import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { Header } from '@/components/layout/Header';
import TomadorDashboard from '@/components/dashboards/TomadorDashboard';
import ApoiadorDashboard from '@/components/dashboards/ApoiadorDashboardNew';
import ProvedorDashboard from '@/components/dashboards/ProvedorDashboardNew';
import OperadorDashboard from '@/components/dashboards/OperadorDashboardNew';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useUser();

  if (!isAuthenticated || !user) {
    return (
      <AuthWrapper>
        <div className="min-h-screen bg-background py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  const renderDashboardByRole = () => {
    switch (user.tipo) {
      case 'TOMADOR':
        return (
          <>
            <Header />
            <TomadorDashboard user={user} />
          </>
        );
      case 'APOIADOR':
        return (
          <>
            <Header />
            <ApoiadorDashboard user={user} />
          </>
        );
      case 'PROVEDOR':
        return (
          <>
            <Header />
            <ProvedorDashboard user={user} />
          </>
        );
      case 'OPERADOR':
        return (
          <>
            <Header />
            <OperadorDashboard user={user} />
          </>
        );
      default:
        return (
          <>
            <Header />
            <div className="min-h-screen bg-background py-8 flex items-center justify-center">
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-amber-600 mb-2">Tipo de usuário não reconhecido</h2>
                  <p className="text-amber-600">Tipo: {user.tipo}</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
    }
  };

  return (
    <AuthWrapper>
      {renderDashboardByRole()}
    </AuthWrapper>
  );
}
