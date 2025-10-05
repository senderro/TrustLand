'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Minus,
  Eye,
  PieChart,
  Activity,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/contexts/UserContext';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

interface PoolMetrics {
  totalLiquidity: number;
  availableLiquidity: number;
  totalLoaned: number;
  totalRepaid: number;
  totalDefaults: number;
  apy: number;
  utilizationRate: number;
  defaultRate: number;
}

interface LiquidityPosition {
  id: string;
  amount: number;
  depositDate: string;
  currentValue: number;
  earnings: number;
  status: string;
}

interface LoanMetrics {
  id: string;
  tomador: {
    nome: string;
    score: number;
  };
  valorTotal: number;
  valorPago: number;
  taxaAnualBps: number;
  estado: string;
  createdAt: string;
  dueDate: string;
}

interface ProvedorDashboardProps {
  user: User;
}

export default function ProvedorDashboard({ user }: ProvedorDashboardProps) {
  const [poolMetrics, setPoolMetrics] = useState<PoolMetrics | null>(null);
  const [myPositions, setMyPositions] = useState<LiquidityPosition[]>([]);
  const [activeLoans, setActiveLoans] = useState<LoanMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [transacting, setTransacting] = useState<'deposit' | 'withdraw' | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load pool metrics
      const poolResponse = await fetch('/api/pool/metrics');
      const positionsResponse = await fetch(`/api/pool/positions?provedorId=${user.id}`);
      const loansResponse = await fetch('/api/loans?estado=ATIVO');
      
      if (poolResponse.ok && positionsResponse.ok && loansResponse.ok) {
        const poolData = await poolResponse.json();
        const positionsData = await positionsResponse.json();
        const loansData = await loansResponse.json();
        
        setPoolMetrics(poolData.data);
        setMyPositions(positionsData.data || []);
        setActiveLoans(loansData.data || []);
      } else {
        setError('Erro ao carregar dados do pool');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || depositAmount <= 0) {
      setError('Por favor, insira um valor válido para depósito');
      return;
    }

    try {
      setTransacting('deposit');
      const response = await fetch('/api/pool/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provedorId: user.id,
          amount: depositAmount * 1_000_000, // Convert to microUSDC
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDepositAmount(0);
        await loadDashboardData();
        setError(null);
      } else {
        setError(data.error || 'Erro ao fazer depósito');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer depósito');
    } finally {
      setTransacting(null);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      setError('Por favor, insira um valor válido para saque');
      return;
    }

    try {
      setTransacting('withdraw');
      const response = await fetch('/api/pool/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provedorId: user.id,
          amount: withdrawAmount * 1_000_000, // Convert to microUSDC
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setWithdrawAmount(0);
        await loadDashboardData();
        setError(null);
      } else {
        setError(data.error || 'Erro ao fazer saque');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer saque');
    } finally {
      setTransacting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDENTE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'QUITADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INADIMPLENTE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalInvested = myPositions.reduce((sum, pos) => sum + pos.amount, 0);
  const totalEarnings = myPositions.reduce((sum, pos) => sum + pos.earnings, 0);
  const currentValue = myPositions.reduce((sum, pos) => sum + pos.currentValue, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dashboard do provedor...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard do Provedor</h1>
            <p className="text-gray-600">
              Bem-vindo, <span className="font-medium">{user.nome}</span> • Gerenciamento de Liquidez
            </p>
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

        {/* Pool Overview */}
        {poolMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Liquidez Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(poolMetrics.totalLiquidity)}</p>
                    <p className="text-xs text-muted-foreground">no pool</p>
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
                    <p className="text-sm font-medium text-muted-foreground">APY Atual</p>
                    <p className="text-2xl font-bold">{formatPercentage(poolMetrics.apy)}</p>
                    <p className="text-xs text-muted-foreground">rendimento anual</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Utilização</p>
                    <p className="text-2xl font-bold">{formatPercentage(poolMetrics.utilizationRate)}</p>
                    <p className="text-xs text-muted-foreground">do pool emprestado</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Default</p>
                    <p className="text-2xl font-bold">{formatPercentage(poolMetrics.defaultRate)}</p>
                    <p className="text-xs text-muted-foreground">inadimplência</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Investido</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
                  <p className="text-xs text-muted-foreground">{myPositions.length} posições</p>
                </div>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Atual</p>
                  <p className="text-2xl font-bold">{formatCurrency(currentValue)}</p>
                  <p className="text-xs text-muted-foreground">valor de mercado</p>
                </div>
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Target className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rendimentos</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalInvested > 0 ? formatPercentage((totalEarnings / totalInvested) * 100) : '0%'} ROI
                  </p>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">P&L Total</p>
                  <p className={`text-2xl font-bold ${totalEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalEarnings >= 0 ? '+' : ''}{formatCurrency(totalEarnings)}
                  </p>
                  <p className="text-xs text-muted-foreground">lucro/prejuízo</p>
                </div>
                <div className={`p-2 rounded-lg ${totalEarnings >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {totalEarnings >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
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
                <CurrencyInput
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={setDepositAmount}
                  min={0}
                  currency="USDC"
                />
                <Button 
                  onClick={handleDeposit}
                  disabled={transacting === 'deposit' || !depositAmount}
                  className="w-full"
                >
                  {transacting === 'deposit' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Depositando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Depositar
                    </div>
                  )}
                </Button>
              </div>

              {/* Withdraw */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium">Retirar Liquidez</h4>
                <CurrencyInput
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={setWithdrawAmount}
                  min={0}
                  max={currentValue / 1_000_000}
                  currency="USDC"
                />
                <Button 
                  onClick={handleWithdraw}
                  disabled={transacting === 'withdraw' || !withdrawAmount}
                  variant="outline"
                  className="w-full"
                >
                  {transacting === 'withdraw' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sacando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4" />
                      Sacar
                    </div>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Disponível: {formatCurrency(currentValue)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* My Positions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Minhas Posições ({myPositions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myPositions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma posição ativa</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPositions.map((position) => (
                    <div key={position.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{formatCurrency(position.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(position.depositDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(position.status)}>
                          {position.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Valor Atual:</span>
                          <span className="font-medium">{formatCurrency(position.currentValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rendimento:</span>
                          <span className={`font-medium ${position.earnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.earnings >= 0 ? '+' : ''}{formatCurrency(position.earnings)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Loans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Empréstimos Ativos ({activeLoans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeLoans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum empréstimo ativo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeLoans.slice(0, 5).map((loan) => (
                    <div key={loan.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{loan.tomador.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Score: {loan.tomador.score}
                          </p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(loan.estado)}>
                          {loan.estado}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Valor:</span>
                          <span className="font-medium">{formatCurrency(loan.valorTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pago:</span>
                          <span className="font-medium">{formatCurrency(loan.valorPago)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa:</span>
                          <span className="font-medium">{formatPercentage(loan.taxaAnualBps / 100)}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link href={`/loans/${loan.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {activeLoans.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        +{activeLoans.length - 5} empréstimos adicionais
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
