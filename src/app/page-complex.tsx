'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoanCard } from '@/components/trust/LoanCard';
import { LoansEmptyState } from '@/components/trust/EmptyState';
import { LoanCardSkeleton } from '@/components/trust/LoadingSkeleton';
import { 
  Plus, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Shield,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DashboardMetrics {
  tvl: number;
  liquidez: number;
  inadimplenciaPct: number;
  scoreMedio: number;
  coberturamedia: number;
  alertasFraudeAtivos: number;
}

interface Loan {
  id: string;
  valorTotal: number;
  prazoParcelas: number;
  estado: string;
  tomador: {
    nome: string;
    carteira: string;
    score: number;
  };
  createdAt: string;
}

export default function HomePage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loansResponse, dashboardResponse] = await Promise.all([
        apiClient.request('/loans?limit=6'),
        apiClient.request('/dashboard').catch(() => null) // Don't fail if dashboard is unavailable
      ]);
      
      setLoans(loansResponse || []);
      setMetrics(dashboardResponse?.metrics || null);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = () => {
    router.push('/loans/new');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            🚀 Simulação TrustLend MVP — Sem valor financeiro real
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              TrustLend MVP
            </h1>
            <p className="text-xl text-muted-foreground">
              Crédito colaborativo com garantia social
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {!isConnected && <ConnectButton />}
            <Button onClick={handleCreateLoan} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Novo Empréstimo
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">TVL</p>
                    <p className="text-2xl font-bold">
                      ${(metrics.tvl / 1_000_000).toFixed(1)}K
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Liquidez</p>
                    <p className="text-2xl font-bold">
                      ${(metrics.liquidez / 1_000_000).toFixed(1)}K
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inadimplência</p>
                    <p className="text-2xl font-bold">
                      {metrics.inadimplenciaPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score Médio</p>
                    <p className="text-2xl font-bold">
                      {metrics.scoreMedio.toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleCreateLoan}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar Empréstimo
              </CardTitle>
              <CardDescription>
                Solicite um empréstimo com garantia social
              </CardDescription>
            </CardHeader>
          </Card>

          <Link href="/dashboard">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Dashboard
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </CardTitle>
                <CardDescription>
                  Métricas e análises do sistema
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/loans">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Ver Empréstimos
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </CardTitle>
                <CardDescription>
                  Explore empréstimos ativos
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Loans */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Empréstimos Recentes</h2>
            <Link href="/loans">
              <Button variant="outline">
                Ver Todos
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <LoanCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <Card className="border-red-200">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={loadData} 
                  className="mt-4"
                >
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          ) : loans.length === 0 ? (
            <LoansEmptyState onCreateLoan={handleCreateLoan} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  id={loan.id}
                  valor={loan.valorTotal}
                  prazo={loan.prazoParcelas}
                  score={loan.tomador?.score || 0}
                  estado={loan.estado}
                  tomador={loan.tomador}
                  createdAt={loan.createdAt}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
