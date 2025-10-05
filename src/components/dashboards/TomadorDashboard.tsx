'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Target,
  CreditCard,
  Calendar,
  Hash,
  Eye,
  Percent
} from 'lucide-react';
import { User } from '@/contexts/UserContext';

interface Loan {
  id: string;
  valorTotal: number;
  taxaAnualBps: number;
  prazoParcelas: number;
  estado: string;
  colateral: number;
  valorPago: number;
  hashRegras: string;
  createdAt: string;
  parcelas?: Array<{
    indice: number;
    valor: number;
    dueAt: string;
    status: string;
  }>;
  endossos?: Array<{
    valorStake: number;
    status: string;
  }>;
}

interface TomadorDashboardProps {
  user: User;
}

export default function TomadorDashboard({ user }: TomadorDashboardProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserLoans();
  }, [user.id]);

  const loadUserLoans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loans?tomadorId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setLoans(data.data || []);
      } else {
        setError(data.error || 'Erro ao carregar empréstimos');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar empréstimos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (microUSDC: number) => {
    return `$${(microUSDC / 1_000_000).toFixed(2)}`;
  };

  const formatPercentage = (bps: number) => {
    return `${(bps / 100).toFixed(2)}%`;
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'PENDENTE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'APROVADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ATIVO': return 'bg-green-100 text-green-800 border-green-200';
      case 'QUITADO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INADIMPLENTE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'PENDENTE': return <Clock className="h-4 w-4" />;
      case 'APROVADO': return <CheckCircle className="h-4 w-4" />;
      case 'ATIVO': return <TrendingUp className="h-4 w-4" />;
      case 'QUITADO': return <CheckCircle className="h-4 w-4" />;
      case 'INADIMPLENTE': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const calculateCoverage = (loan: Loan) => {
    if (!loan.endossos) return 0;
    const totalStake = loan.endossos.reduce((sum, endosso) => sum + endosso.valorStake, 0);
    return (totalStake / loan.valorTotal) * 100;
  };

  const totalBorrowed = loans.reduce((sum, loan) => sum + loan.valorTotal, 0);
  const totalPaid = loans.reduce((sum, loan) => sum + loan.valorPago, 0);
  const activeLoans = loans.filter(loan => ['ATIVO', 'APROVADO'].includes(loan.estado));
  const pendingLoans = loans.filter(loan => loan.estado === 'PENDENTE');

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando seus empréstimos...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard do Tomador</h1>
            <p className="text-gray-600">
              Bem-vindo, <span className="font-medium">{user.nome}</span> • Score: <span className="font-semibold text-blue-600">{user.score}/100</span>
            </p>
          </div>
          <Link href="/loans/new">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Novo Empréstimo
            </Button>
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Score Social</p>
                  <p className="text-2xl font-bold">{user.score}</p>
                  <p className="text-xs text-muted-foreground">/100 pontos</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Emprestado</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalBorrowed)}</p>
                  <p className="text-xs text-muted-foreground">{loans.length} empréstimos</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pago</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalBorrowed > 0 ? `${((totalPaid / totalBorrowed) * 100).toFixed(1)}%` : '0%'} do total
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empréstimos Ativos</p>
                  <p className="text-2xl font-bold">{activeLoans.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {pendingLoans.length} pendentes
                  </p>
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-amber-600" />
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

        {/* Loans List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Seus Empréstimos</h2>
            <Button variant="outline" onClick={loadUserLoans}>
              Atualizar
            </Button>
          </div>

          {loans.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum empréstimo encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não possui empréstimos. Crie seu primeiro empréstimo para começar.
                </p>
                <Link href="/loans/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Empréstimo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {loans.map((loan) => (
                <Card key={loan.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Empréstimo #{loan.id.slice(-6)}
                      </CardTitle>
                      <Badge className={getStatusColor(loan.estado)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(loan.estado)}
                          {loan.estado}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Loan Details */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Detalhes do Empréstimo</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Valor:</span>
                            <span className="text-sm font-medium">{formatCurrency(loan.valorTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Taxa:</span>
                            <span className="text-sm font-medium">{formatPercentage(loan.taxaAnualBps)} a.a.</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Prazo:</span>
                            <span className="text-sm font-medium">{loan.prazoParcelas} dias</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Colateral:</span>
                            <span className="text-sm font-medium">{formatCurrency(loan.colateral)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Coverage & Support */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Apoio da Comunidade</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Cobertura:</span>
                            <span className="text-sm font-medium">{calculateCoverage(loan).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Apoiadores:</span>
                            <span className="text-sm font-medium">{loan.endossos?.length || 0}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="h-2 bg-green-500 rounded-full transition-all"
                              style={{ width: `${Math.min(calculateCoverage(loan), 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Ações</h4>
                        <div className="space-y-2">
                          <Link href={`/loans/${loan.id}`}>
                            <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                              <Eye className="h-3 w-3" />
                              Ver Detalhes
                            </Button>
                          </Link>
                          <Link href={`/audit/${loan.id}`}>
                            <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                              <Hash className="h-3 w-3" />
                              Auditoria
                            </Button>
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(loan.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
