'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/components/trust/LoadingSkeleton';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Shield,
  Activity,
  PieChart,
  BarChart3
} from 'lucide-react';
import { apiClient, handleApiError } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

interface DashboardData {
  metrics: {
    tvl: number;
    liquidez: number;
    inadimplenciaPct: number;
    scoreMedio: number;
    coberturamedia: number;
    alertasFraudeAtivos: number;
    eventosWaterfall: number;
    latenciaMedia: number;
  };
  loanDistribution: Record<string, number>;
  topPerformers: {
    borrowers: Array<{ tomadorId: string; totalVolume: number; loanCount: number }>;
    supporters: Array<{ apoiadorId: string; totalStaked: number; endorsementCount: number }>;
  };
  recentActivity: {
    loans: Array<{
      id: string;
      valor: number;
      estado: string;
      tomador: string;
      createdAt: string;
    }>;
    events: Array<{
      id: string;
      tipo: string;
      timestamp: string;
      referenciaId: string;
    }>;
  };
  risk: {
    concentrationRisk: number;
    avgLoanToValue: number;
    defaultRate: number;
    recoveryRate: number;
  };
  system: {
    apiLatency: number;
    activeUsers: number;
    systemLoad: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDashboard();
      setData(response);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar dashboard</h2>
            <p className="text-red-600 mb-4">{error || 'Dados não disponíveis'}</p>
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema TrustLend MVP
        </p>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">TVL</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.metrics.tvl)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Value Locked
                </p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Liquidez</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.metrics.liquidez)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Disponível para empréstimos
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inadimplência</p>
                <p className="text-2xl font-bold">
                  {formatPercentage(data.metrics.inadimplenciaPct)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Taxa de default
                </p>
              </div>
              <div className={`p-2 rounded-lg ${
                data.metrics.inadimplenciaPct > 5 
                  ? 'bg-red-100' 
                  : 'bg-amber-100'
              }`}>
                <TrendingUp className={`h-6 w-6 ${
                  data.metrics.inadimplenciaPct > 5 
                    ? 'text-red-600' 
                    : 'text-amber-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score Médio</p>
                <p className="text-2xl font-bold">
                  {data.metrics.scoreMedio.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  /100 pontos
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Loan Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição de Empréstimos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.loanDistribution).map(([status, count]) => {
                const total = Object.values(data.loanDistribution).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{status}</Badge>
                      <span className="text-sm">{count} empréstimos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="h-2 bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Risk Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Métricas de Risco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Concentração</span>
                <span className="font-medium">{data.risk.concentrationRisk.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    data.risk.concentrationRisk > 50 ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(data.risk.concentrationRisk, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>LTV Médio</span>
                <span className="font-medium">{data.risk.avgLoanToValue.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div 
                  className="h-2 bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(data.risk.avgLoanToValue, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Taxa de Recuperação</span>
                <span className="font-medium">{data.risk.recoveryRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div 
                  className="h-2 bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(data.risk.recoveryRate, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Empréstimos Recentes</h4>
              {data.recentActivity.loans.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum empréstimo recente</p>
              ) : (
                data.recentActivity.loans.slice(0, 5).map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium">#{loan.id.slice(-6)}</p>
                      <p className="text-xs text-muted-foreground">{loan.tomador}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(loan.valor)}</p>
                      <Badge variant="outline" className="text-xs">{loan.estado}</Badge>
                    </div>
                  </div>
                ))
              )}

              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-2">Eventos Recentes</h4>
                {data.recentActivity.events.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>{event.tipo}</span>
                    <span>•</span>
                    <span>{new Date(event.timestamp).toLocaleTimeString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Usuários Ativos</span>
              <Badge variant="outline">{data.system.activeUsers}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Alertas de Fraude</span>
              <Badge 
                variant={data.metrics.alertasFraudeAtivos > 0 ? 'destructive' : 'outline'}
              >
                {data.metrics.alertasFraudeAtivos}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Eventos Waterfall</span>
              <Badge variant="outline">{data.metrics.eventosWaterfall}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Latência API</span>
              <span className="text-sm font-medium">{data.system.apiLatency.toFixed(0)}ms</span>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Carga do Sistema</span>
                <span className="font-medium">{(data.system.systemLoad * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    data.system.systemLoad > 0.8 
                      ? 'bg-red-500' 
                      : data.system.systemLoad > 0.6 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(data.system.systemLoad * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Última atualização: {new Date().toLocaleString('pt-BR')}</p>
        <p>Dados em tempo real • TrustLend MVP</p>
      </div>
    </div>
  );
}
