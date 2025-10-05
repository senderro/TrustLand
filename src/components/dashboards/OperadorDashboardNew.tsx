'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  Ban,
  UserCheck,
  FileText,
  Hash,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/contexts/UserContext';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

interface SystemMetrics {
  totalUsers: number;
  totalLoans: number;
  totalVolume: number;
  totalDefaults: number;
  avgScore: number;
  poolTVL: number;
  activeEndorsements: number;
  systemHealth: number;
}

interface UserData {
  id: string;
  nome: string;
  carteira: string;
  cpf: string;
  tipo: string;
  score: number;
  status: string;
  createdAt: string;
  lastActivity: string;
}

interface LoanData {
  id: string;
  tomador: {
    nome: string;
    score: number;
  };
  valorTotal: number;
  valorPago: number;
  taxaAnualBps: number;
  estado: string;
  cobertura: number;
  createdAt: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AuditEvent {
  id: string;
  tipo: string;
  referenciaId: string;
  detalhes: any;
  timestamp: string;
  hash: string;
}

interface OperadorDashboardProps {
  user: User;
}

export default function OperadorDashboard({ user }: OperadorDashboardProps) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load system metrics
      const metricsResponse = await fetch('/api/admin/metrics');
      const usersResponse = await fetch('/api/admin/users');
      const loansResponse = await fetch('/api/admin/loans');
      const auditResponse = await fetch('/api/admin/audit');
      
      if (metricsResponse.ok && usersResponse.ok && loansResponse.ok && auditResponse.ok) {
        const metricsData = await metricsResponse.json();
        const usersData = await usersResponse.json();
        const loansData = await loansResponse.json();
        const auditData = await auditResponse.json();
        
        setSystemMetrics(metricsData.data);
        setUsers(usersData.data || []);
        setLoans(loansData.data || []);
        setAuditEvents(auditData.data || []);
      } else {
        setError('Erro ao carregar dados administrativos');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'ban') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await loadDashboardData();
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao executar ação');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao executar ação');
    }
  };

  const handleLoanAction = async (loanId: string, action: 'approve' | 'reject' | 'pause') => {
    try {
      const response = await fetch(`/api/admin/loans/${loanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await loadDashboardData();
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao executar ação');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao executar ação');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SUSPENSO': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BANIDO': return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDENTE': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.carteira.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.cpf.includes(searchTerm)
  );

  const filteredLoans = loans.filter(loan =>
    loan.tomador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dashboard administrativo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Administrativo</h1>
            <p className="text-gray-600">
              Bem-vindo, <span className="font-medium">{user.nome}</span> • Controle Total do Sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              <Settings className="h-3 w-3 mr-1" />
              Administrador
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              ×
            </Button>
          </div>
        )}

        {/* System Metrics */}
        {systemMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                    <p className="text-2xl font-bold">{systemMetrics.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">registrados</p>
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
                    <p className="text-2xl font-bold">{formatCurrency(systemMetrics.totalVolume)}</p>
                    <p className="text-xs text-muted-foreground">{systemMetrics.totalLoans} empréstimos</p>
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
                    <p className="text-sm font-medium text-muted-foreground">TVL do Pool</p>
                    <p className="text-2xl font-bold">{formatCurrency(systemMetrics.poolTVL)}</p>
                    <p className="text-xs text-muted-foreground">liquidez total</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Saúde do Sistema</p>
                    <p className="text-2xl font-bold">{systemMetrics.systemHealth}%</p>
                    <p className="text-xs text-muted-foreground">score médio: {systemMetrics.avgScore}</p>
                  </div>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar usuários, empréstimos ou eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="loans">Empréstimos</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditEvents.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{event.tipo}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Link href={`/audit/${event.referenciaId}`}>
                          <Button variant="outline" size="sm">
                            <Hash className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Saúde do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Score Médio dos Usuários</span>
                      <span className="font-medium">{systemMetrics?.avgScore}/100</span>
                    </div>
                    <Progress value={systemMetrics?.avgScore || 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Taxa de Inadimplência</span>
                      <span className="font-medium">
                        {systemMetrics ? formatPercentage((systemMetrics.totalDefaults / systemMetrics.totalLoans) * 100) : '0%'}
                      </span>
                    </div>
                    <Progress 
                      value={systemMetrics ? (systemMetrics.totalDefaults / systemMetrics.totalLoans) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Endossos Ativos</span>
                      <span className="font-medium">{systemMetrics?.activeEndorsements || 0}</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((userData) => (
                    <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{userData.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {userData.carteira.slice(0, 6)}...{userData.carteira.slice(-4)} • Score: {userData.score}
                            </p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(userData.status)}>
                            {userData.status}
                          </Badge>
                          <Badge variant="outline">
                            {userData.tipo}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {userData.status === 'ATIVO' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(userData.id, 'suspend')}
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                        {userData.status === 'SUSPENSO' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(userData.id, 'activate')}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(userData.id, 'ban')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Empréstimos ({filteredLoans.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{loan.tomador.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(loan.valorTotal)} • Taxa: {formatPercentage(loan.taxaAnualBps / 100)}
                            </p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(loan.estado)}>
                            {loan.estado}
                          </Badge>
                          <Badge variant="outline" className={getRiskColor(loan.riskLevel)}>
                            {loan.riskLevel}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progresso: {formatCurrency(loan.valorPago)} / {formatCurrency(loan.valorTotal)}</span>
                            <span>Cobertura: {loan.cobertura.toFixed(1)}%</span>
                          </div>
                          <Progress value={(loan.valorPago / loan.valorTotal) * 100} className="h-1 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/loans/${loan.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        {loan.estado === 'PENDENTE' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoanAction(loan.id, 'approve')}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoanAction(loan.id, 'reject')}
                              className="text-red-600"
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {loan.estado === 'ATIVO' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoanAction(loan.id, 'pause')}
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Log de Auditoria ({auditEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <FileText className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{event.tipo}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs font-mono bg-gray-50 p-2 rounded">
                          Hash: {event.hash.slice(0, 16)}...
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/audit/${event.referenciaId}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
