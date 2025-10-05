'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  HandHeart, 
  TrendingUp, 
  DollarSign, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  Shield,
  Search,
  Target,
  Calendar,
  Hash,
  X
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/contexts/UserContext';
import { formatCurrency } from '@/lib/utils/format';

interface LoanForEndorsement {
  id: string;
  tomador: {
    id: string;
    nome: string;
    score: number;
  };
  valorTotal: number;
  taxaAnualBps: number;
  prazoParcelas: number;
  estado: string;
  createdAt: string;
  endossos: Array<{
    valorStake: number;
    status: string;
  }>;
  cobertura: number;
  requiredCoverage: number;
}

interface MyEndorsement {
  id: string;
  emprestimo: {
    id: string;
    tomador: {
      nome: string;
    };
    valorTotal: number;
    estado: string;
  };
  valorStake: number;
  status: string;
  dataBloqueio: string;
  dataLiberacao?: string;
}

interface ApoiadorDashboardProps {
  user: User;
}

export default function ApoiadorDashboard({ user }: ApoiadorDashboardProps) {
  const [availableLoans, setAvailableLoans] = useState<LoanForEndorsement[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanForEndorsement[]>([]);
  const [myEndorsements, setMyEndorsements] = useState<MyEndorsement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endorsingLoan, setEndorsingLoan] = useState<string | null>(null);
  const [endorsementAmounts, setEndorsementAmounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load available loans for endorsement
      const loansResponse = await fetch('/api/loans?estado=PENDENTE');
      const loansData = await loansResponse.json();
      
      // Load my endorsements
      const endorsementsResponse = await fetch(`/api/endorsements?apoiadorId=${user.id}`);
        setAvailableLoans(loansData.data || []);
        setFilteredLoans(loansData.data || []);
        setMyEndorsements(endorsementsData.data || []);
      } else {
        setError('Erro ao carregar dados');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Buscar por carteira ou CPF
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      }
    } catch (err) {
      console.error('Erro na busca:', err);
    }
  };

  const filterLoansByUser = (userId: string) => {
    const filtered = availableLoans.filter(loan => loan.tomador.id === userId);
    setFilteredLoans(filtered);
    setSearchResults([]);
    setSearchTerm('');
  };

  const clearFilters = () => {
    setFilteredLoans(availableLoans);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleEndorseLoan = async (loanId: string) => {
    const amount = endorsementAmounts[loanId];
    if (!amount || amount <= 0) {
      setError('Por favor, insira um valor válido para o endosso');
      return;
    }

    try {
      setEndorsingLoan(loanId);
      const response = await fetch('/api/endorsements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emprestimoId: loanId,
          apoiadorId: user.id,
          valorStake: amount * 1_000_000, // Convert to microUSDC
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEndorsementAmounts(prev => ({ ...prev, [loanId]: 0 }));
        await loadDashboardData(); // Refresh data
      } else {
        setError(data.error || 'Erro ao criar endosso');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar endosso');
    } finally {
      setEndorsingLoan(null);
    }
  };

  const formatCurrency = (microUSDC: number) => {
    return `$${(microUSDC / 1_000_000).toFixed(2)}`;
  };

  const formatPercentage = (bps: number) => {
    return `${(bps / 100).toFixed(2)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ATIVO': return 'bg-green-100 text-green-800 border-green-200';
      case 'LIBERADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CORTADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalStaked = myEndorsements.reduce((sum, endorsement) => sum + endorsement.valorStake, 0);
  const activeEndorsements = myEndorsements.filter(e => e.status === 'ATIVO');
  const totalEarnings = myEndorsements.filter(e => e.status === 'LIBERADO').reduce((sum, e) => sum + e.valorStake * 0.1, 0); // 10% estimated return

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
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
          <h1 className="text-3xl font-bold mb-2">Dashboard do Apoiador</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user.nome} • Score: {user.score}/100 • Apoie empréstimos da comunidade
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Apostado</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalStaked)}</p>
                  <p className="text-xs text-muted-foreground">{myEndorsements.length} endossos</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Endossos Ativos</p>
                  <p className="text-2xl font-bold">{activeEndorsements.length}</p>
                  <p className="text-xs text-muted-foreground">Em andamento</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <HandHeart className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Retorno Estimado</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs text-muted-foreground">Ganhos realizados</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Reputação</p>
                  <p className="text-2xl font-bold">{user.score}</p>
                  <p className="text-xs text-muted-foreground">Score de apoiador</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Loans for Endorsement */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Empréstimos Disponíveis</h2>
              <Button variant="outline" onClick={loadDashboardData}>
                Atualizar
              </Button>
            </div>

            {availableLoans.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum empréstimo disponível</h3>
                  <p className="text-muted-foreground">
                    Não há empréstimos pendentes de endosso no momento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {availableLoans.map((loan) => (
                  <Card key={loan.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {loan.tomador.nome}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span className={`font-semibold ${getScoreColor(loan.tomador.score)}`}>
                            {loan.tomador.score}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium ml-2">{formatCurrency(loan.valorTotal)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Taxa:</span>
                          <span className="font-medium ml-2">{formatPercentage(loan.taxaAnualBps)} a.a.</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prazo:</span>
                          <span className="font-medium ml-2">{loan.prazoParcelas} dias</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cobertura:</span>
                          <span className="font-medium ml-2">{(loan.cobertura || 0).toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso de Cobertura</span>
                          <span>{(loan.cobertura || 0).toFixed(1)}% / {loan.requiredCoverage || 100}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="h-2 bg-green-500 rounded-full transition-all"
                            style={{ width: `${Math.min(((loan.cobertura || 0) / (loan.requiredCoverage || 100)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <CurrencyInput
                          placeholder="0.00"
                          value={endorsementAmounts[loan.id] || 0}
                          onChange={(value) => setEndorsementAmounts(prev => ({
                            ...prev,
                            [loan.id]: value
                          }))}
                          min={0}
                          currency="USDC"
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleEndorseLoan(loan.id)}
                          disabled={endorsingLoan === loan.id || !endorsementAmounts[loan.id]}
                          className="flex items-center gap-2"
                        >
                          {endorsingLoan === loan.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Endossar
                        </Button>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(loan.createdAt).toLocaleDateString('pt-BR')}
                        </div>
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
          </div>

          {/* My Endorsements */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Meus Endossos</h2>

            {myEndorsements.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <HandHeart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum endosso ainda</h3>
                  <p className="text-muted-foreground">
                    Comece apoiando empréstimos da comunidade para construir sua reputação.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myEndorsements.map((endorsement) => (
                  <Card key={endorsement.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          <span className="font-medium">
                            {endorsement.emprestimo.tomador.nome}
                          </span>
                        </div>
                        <Badge className={getStatusColor(endorsement.status)}>
                          {endorsement.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Valor Empréstimo:</span>
                          <span className="font-medium ml-2">
                            {formatCurrency(endorsement.emprestimo.valorTotal)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Meu Stake:</span>
                          <span className="font-medium ml-2">
                            {formatCurrency(endorsement.valorStake)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(endorsement.dataBloqueio).toLocaleDateString('pt-BR')}
                        </div>
                        <Link href={`/loans/${endorsement.emprestimo.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Empréstimo
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
