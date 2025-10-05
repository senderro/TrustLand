'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  Shield,
  DollarSign,
  TrendingUp,
  Activity,
  Settings,
  Eye,
  RefreshCw,
  Hash,
  Calendar,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { User } from '@/contexts/UserContext';

interface SystemMetrics {
  totalUsers: number;
  totalLoans: number;
  totalVolume: number;
  activeLoans: number;
  defaultRate: number;
  avgScore: number;
  totalLiquidity: number;
  utilizationRate: number;
  fraudAlerts: number;
  waterfallEvents: number;
}

interface RecentActivity {
  id: string;
  tipo: string;
  referenciaId: string;
  detalhes: string;
  timestamp: string;
}

interface UserActivity {
  id: string;
  nome: string;
  tipo: string;
  score: number;
  status: string;
  lastActivity: string;
  totalLoans: number;
  totalVolume: number;
}

interface FraudAlert {
  id: string;
  usuarioId: string;
  usuario: {
    nome: string;
    carteira: string;
  };
  tipo: string;
  createdAt: string;
  revisado: boolean;
  resultado?: string;
}

interface OperadorDashboardProps {
  user: User;
}

export default function OperadorDashboard({ user }: OperadorDashboardProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'fraud' | 'activity'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load system metrics
      const metricsResponse = await fetch('/api/admin/metrics');
      const metricsData = await metricsResponse.json();
      
      // Load recent activity
      const activityResponse = await fetch('/api/admin/activity?limit=20');
      const activityData = await activityResponse.json();
      
      // Load user activity
      const usersResponse = await fetch('/api/admin/users?limit=10');
      const usersData = await usersResponse.json();
      
      // Load fraud alerts
      const fraudResponse = await fetch('/api/admin/fraud-alerts?status=pending');
      const fraudData = await fraudResponse.json();
      
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }
      
      if (activityData.success) {
        setRecentActivity(activityData.data || []);
      }
      
      if (usersData.success) {
        setUserActivity(usersData.data || []);
      }
      
      if (fraudData.success) {
        setFraudAlerts(fraudData.data || []);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleFraudReview = async (alertId: string, resultado: 'CONFIRMADO' | 'REVERTIDO') => {
    try {
      const response = await fetch(`/api/admin/fraud-alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revisado: true,
          resultado,
          reviewedBy: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadDashboardData(); // Refresh data
      } else {
        setError(data.error || 'Erro ao revisar alerta de fraude');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao revisar alerta de fraude');
    }
  };

  const formatCurrency = (microUSDC: number) => {
    return `$${(microUSDC / 1_000_000).toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800 border-green-200';
      case 'SOB_REVISAO': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BLOQUEADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'CRIACAO': return <DollarSign className="h-4 w-4" />;
      case 'APOIO': return <Shield className="h-4 w-4" />;
      case 'APROVACAO': return <CheckCircle className="h-4 w-4" />;
      case 'PAGAMENTO': return <TrendingUp className="h-4 w-4" />;
      case 'DEFAULT': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando painel administrativo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard do Operador</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {user.nome} • Painel administrativo do sistema TrustLend
            </p>
          </div>
          <Button onClick={loadDashboardData} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* System Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuários Totais</p>
                  <p className="text-2xl font-bold">{metrics?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Cadastrados</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
                  <p className="text-2xl font-bold">
                    {metrics ? formatCurrency(metrics.totalVolume) : '$0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">{metrics?.totalLoans || 0} empréstimos</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Inadimplência</p>
                  <p className="text-2xl font-bold">
                    {metrics ? formatPercentage(metrics.defaultRate) : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground">Sistema</p>
                </div>
                <div className={`p-2 rounded-lg ${
                  metrics && metrics.defaultRate > 5 ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  <TrendingUp className={`h-6 w-6 ${
                    metrics && metrics.defaultRate > 5 ? 'text-red-600' : 'text-amber-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alertas de Fraude</p>
                  <p className="text-2xl font-bold text-red-600">
                    {fraudAlerts.filter(alert => !alert.revisado).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg">
          {[
            { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { key: 'users', label: 'Usuários', icon: Users },
            { key: 'fraud', label: 'Fraude', icon: AlertTriangle },
            { key: 'activity', label: 'Atividade', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Score Médio dos Usuários</span>
                  <span className="font-semibold">{metrics?.avgScore.toFixed(0) || 0}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Liquidez Total</span>
                  <span className="font-semibold">
                    {metrics ? formatCurrency(metrics.totalLiquidity) : '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Utilização</span>
                  <span className="font-semibold">
                    {metrics ? formatPercentage(metrics.utilizationRate) : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Empréstimos Ativos</span>
                  <span className="font-semibold">{metrics?.activeLoans || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Eventos Waterfall</span>
                  <span className="font-semibold">{metrics?.waterfallEvents || 0}</span>
                </div>
              </CardContent>
            </Card>

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
                  {recentActivity.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                      <div className="p-1 bg-background rounded">
                        {getEventTypeIcon(activity.tipo)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Link href={`/audit/${activity.referenciaId}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Atividade dos Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-semibold">{user.nome}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{user.tipo}</Badge>
                          <Target className="h-3 w-3" />
                          <span>Score: {user.score}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{user.totalLoans} empréstimos</p>
                        <p>{formatCurrency(user.totalVolume)} volume</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'fraud' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Fraude
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fraudAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-green-600">Sistema Seguro</h3>
                  <p className="text-muted-foreground">
                    Nenhum alerta de fraude pendente no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fraudAlerts.map((alert) => (
                    <div key={alert.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-red-800">{alert.tipo}</h4>
                          <p className="text-sm text-red-600">
                            Usuário: {alert.usuario.nome} ({alert.usuario.carteira.slice(0, 10)}...)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!alert.revisado ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFraudReview(alert.id, 'REVERTIDO')}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Rejeitar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleFraudReview(alert.id, 'CONFIRMADO')}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Confirmar
                              </Button>
                            </>
                          ) : (
                            <Badge className={
                              alert.resultado === 'CONFIRMADO' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }>
                              {alert.resultado}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-red-600">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(alert.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Log de Atividades Detalhado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  let details;
                  try {
                    details = JSON.parse(activity.detalhes);
                  } catch {
                    details = {};
                  }

                  return (
                    <div key={activity.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getEventTypeIcon(activity.tipo)}
                          <span className="font-semibold">{activity.tipo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">
                            {activity.referenciaId.slice(-8)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        {details.valor && (
                          <p>Valor: {formatCurrency(details.valor)}</p>
                        )}
                        {details.score && (
                          <p>Score: {details.score}</p>
                        )}
                        {details.apr && (
                          <p>APR: {formatPercentage(details.apr / 100)}</p>
                        )}
                        <p className="text-xs">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(activity.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="mt-2">
                        <Link href={`/audit/${activity.referenciaId}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Auditoria
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
