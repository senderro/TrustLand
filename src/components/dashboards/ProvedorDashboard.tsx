'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { User } from '@/contexts/UserContext';

interface PoolMetrics {
  totalLiquidity: number;
  availableLiquidity: number;
  totalLoaned: number;
  activeLoans: number;
  defaultRate: number;
  avgAPR: number;
  myContribution: number;
  myEarnings: number;
  utilizationRate: number;
}

interface LoanForFunding {
  id: string;
  tomador: {
    nome: string;
    score: number;
  };
  valorTotal: number;
  taxaAnualBps: number;
  prazoParcelas: number;
  cobertura: number;
  requiredCoverage: number;
  estado: string;
  createdAt: string;
}

interface MyInvestment {
  id: string;
  amount: number;
  timestamp: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  status: string;
}

interface ProvedorDashboardProps {
  user: User;
}

export default function ProvedorDashboard({ user }: ProvedorDashboardProps) {
  const [metrics, setMetrics] = useState<PoolMetrics | null>(null);
  const [loansForFunding, setLoansForFunding] = useState<LoanForFunding[]>([]);
  const [myInvestments, setMyInvestments] = useState<MyInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load pool metrics
      const metricsResponse = await fetch('/api/pool/metrics');
      const metricsData = await metricsResponse.json();
      
      // Load loans ready for funding
      const loansResponse = await fetch('/api/loans?estado=APROVADO&needsFunding=true');
      const loansData = await loansResponse.json();
      
      // Load my investments
      const investmentsResponse = await fetch(`/api/pool/investments?providerId=${user.id}`);
      const investmentsData = await investmentsResponse.json();
      
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }
      
      if (loansData.success) {
        setLoansForFunding(loansData.data || []);
      }
      
      if (investmentsData.success) {
        setMyInvestments(investmentsData.data || []);
      }
      
      if (!metricsData.success || !loansData.success || !investmentsData.success) {
        setError('Erro ao carregar dados do pool');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Por favor, insira um valor válido para depósito');
      return;
    }

    try {
      setProcessing('deposit');
      const response = await fetch('/api/pool/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: user.id,
          amount: parseFloat(depositAmount) * 1_000_000, // Convert to microUSDC
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDepositAmount('');
        await loadDashboardData(); // Refresh data
      } else {
        setError(data.error || 'Erro ao fazer depósito');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer depósito');
    } finally {
      setProcessing(null);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Por favor, insira um valor válido para saque');
      return;
    }

    try {
      setProcessing('withdraw');
      const response = await fetch('/api/pool/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: user.id,
          amount: parseFloat(withdrawAmount) * 1_000_000, // Convert to microUSDC
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setWithdrawAmount('');
        await loadDashboardData(); // Refresh data
      } else {
        setError(data.error || 'Erro ao fazer saque');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer saque');
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (microUSDC: number) => {
    return `$${(microUSDC / 1_000_000).toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando métricas do pool...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard do Provedor de Liquidez</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user.nome} • Score: {user.score}/100 • Gerencie sua liquidez no pool
          </p>
        </div>

        {/* Pool Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">TVL Total</p>
                  <p className="text-2xl font-bold">
                    {metrics ? formatCurrency(metrics.totalLiquidity) : '$0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Value Locked</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Liquidez Disponível</p>
                  <p className="text-2xl font-bold">
                    {metrics ? formatCurrency(metrics.availableLiquidity) : '$0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">Para novos empréstimos</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Utilização</p>
                  <p className="text-2xl font-bold">
                    {metrics ? formatPercentage(metrics.utilizationRate) : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground">Capital em uso</p>
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
                  <p className="text-sm font-medium text-muted-foreground">APR Médio</p>
                  <p className="text-2xl font-bold">
                    {metrics ? formatPercentage(metrics.avgAPR / 100) : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground">Retorno anual</p>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Investment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Minha Contribuição</p>
                  <p className="text-xl font-bold">
                    {metrics ? formatCurrency(metrics.myContribution) : '$0.00'}
                  </p>
                </div>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ganhos Acumulados</p>
                  <p className="text-xl font-bold text-green-600">
                    {metrics ? formatCurrency(metrics.myEarnings) : '$0.00'}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Inadimplência</p>
                  <p className="text-xl font-bold">
                    {metrics ? formatPercentage(metrics.defaultRate) : '0%'}
                  </p>
                </div>
                <AlertTriangle className={`h-5 w-5 ${
                  metrics && metrics.defaultRate > 5 ? 'text-red-600' : 'text-amber-600'
                }`} />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liquidity Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Gerenciar Liquidez
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deposit */}
              <div className="space-y-3">
                <h4 className="font-medium">Adicionar Liquidez</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Valor (USDC)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleDeposit}
                    disabled={processing === 'deposit' || !depositAmount}
                    className="flex items-center gap-2"
                  >
                    {processing === 'deposit' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Depositar
                  </Button>
                </div>
              </div>

              {/* Withdraw */}
              <div className="space-y-3">
                <h4 className="font-medium">Retirar Liquidez</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Valor (USDC)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleWithdraw}
                    disabled={processing === 'withdraw' || !withdrawAmount}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {processing === 'withdraw' ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                    Sacar
                  </Button>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={loadDashboardData}
                className="w-full flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar Dados
              </Button>
            </CardContent>
          </Card>

          {/* Loans Ready for Funding */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Empréstimos Aguardando Financiamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loansForFunding.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum empréstimo pendente</h3>
                  <p className="text-muted-foreground">
                    Todos os empréstimos aprovados já foram financiados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loansForFunding.map((loan) => (
                    <Card key={loan.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{loan.tomador.nome}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Target className="h-3 w-3" />
                              <span className={getScoreColor(loan.tomador.score)}>
                                Score: {loan.tomador.score}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-blue-50">
                            {loan.estado}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-medium ml-2">{formatCurrency(loan.valorTotal)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">APR:</span>
                            <span className="font-medium ml-2">{formatPercentage(loan.taxaAnualBps / 100)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Prazo:</span>
                            <span className="font-medium ml-2">{loan.prazoParcelas} dias</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cobertura:</span>
                            <span className="font-medium ml-2">{loan.cobertura.toFixed(1)}%</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Garantia Social</span>
                            <span>{loan.cobertura.toFixed(1)}% / {loan.requiredCoverage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="h-2 bg-green-500 rounded-full transition-all"
                              style={{ width: `${Math.min((loan.cobertura / loan.requiredCoverage) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t mt-3">
                          <span className="text-xs text-muted-foreground">
                            Criado em {new Date(loan.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <Link href={`/loans/${loan.id}`}>
                            <Button variant="outline" size="sm">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Investment History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Histórico de Investimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myInvestments.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum investimento ainda</h3>
                <p className="text-muted-foreground">
                  Faça seu primeiro depósito para começar a ganhar com o pool de liquidez.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myInvestments.slice(0, 10).map((investment) => (
                  <div key={investment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        investment.type === 'DEPOSIT' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {investment.type === 'DEPOSIT' ? (
                          <Plus className={`h-4 w-4 ${
                            investment.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        ) : (
                          <Minus className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {investment.type === 'DEPOSIT' ? 'Depósito' : 'Saque'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(investment.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        investment.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {investment.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(investment.amount)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {investment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
