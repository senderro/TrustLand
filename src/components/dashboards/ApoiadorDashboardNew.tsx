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
  X,
  Filter
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
    carteira: string;
    cpf: string;
  };
  valorTotal: number;
  taxaAnualBps: number;
  prazoParcelas: number;
  estado: string;
  cobertura: number;
  requiredCoverage: number;
  createdAt: string;
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

interface SearchResult {
  id: string;
  nome: string;
  carteira: string;
  cpf: string;
  tipo: string;
  score: number;
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load available loans for endorsement
      const loansResponse = await fetch('/api/loans?estado=PENDENTE');
      const endorsementsResponse = await fetch(`/api/endorsements?apoiadorId=${user.id}`);
      
      if (loansResponse.ok && endorsementsResponse.ok) {
        const loansData = await loansResponse.json();
        const endorsementsData = await endorsementsResponse.json();
        
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

  const filterLoansByUser = (userId: string, userName: string) => {
    const filtered = availableLoans.filter(loan => loan.tomador.id === userId);
    setFilteredLoans(filtered);
    setSearchResults([]);
    setSearchTerm('');
    setActiveFilter(userName);
  };

  const clearFilters = () => {
    setFilteredLoans(availableLoans);
    setSearchTerm('');
    setSearchResults([]);
    setActiveFilter(null);
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
        setError(null);
      } else {
        setError(data.error || 'Erro ao criar endosso');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar endosso');
    } finally {
      setEndorsingLoan(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDENTE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LIBERADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CORTADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalEndorsed = myEndorsements.reduce((sum, endorsement) => sum + endorsement.valorStake, 0);
  const activeEndorsements = myEndorsements.filter(e => e.status === 'ATIVO');
  const totalAtRisk = activeEndorsements.reduce((sum, e) => sum + e.valorStake, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dashboard do apoiador...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard do Apoiador</h1>
            <p className="text-gray-600">
              Bem-vindo, <span className="font-medium">{user.nome}</span> • Score: <span className="font-semibold text-green-600">{user.score}/100</span>
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
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Endossado</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalEndorsed)}</p>
                  <p className="text-xs text-muted-foreground">{myEndorsements.length} endossos</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HandHeart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Risco</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAtRisk)}</p>
                  <p className="text-xs text-muted-foreground">{activeEndorsements.length} ativos</p>
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empréstimos Disponíveis</p>
                  <p className="text-2xl font-bold">{filteredLoans.length}</p>
                  <p className="text-xs text-muted-foreground">para endosso</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

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
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Tomadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite carteira pública ou CPF do tomador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              {activeFilter && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtro
                </Button>
              )}
            </div>

            {activeFilter && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Filtrando por: <strong>{activeFilter}</strong>
                </span>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Resultados da busca:</p>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => filterLoansByUser(result.id, result.nome)}
                  >
                    <div>
                      <div className="font-medium">{result.nome}</div>
                      <div className="text-sm text-gray-600">
                        {result.carteira.slice(0, 6)}...{result.carteira.slice(-4)} • Score: {result.score}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {result.tipo}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Available Loans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Empréstimos Disponíveis ({filteredLoans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLoans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {activeFilter ? 'Nenhum empréstimo encontrado para este tomador' : 'Nenhum empréstimo disponível'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLoans.map((loan) => (
                    <div key={loan.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{loan.tomador.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            Score: {loan.tomador.score} • {formatCurrency(loan.valorTotal)}
                          </p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(loan.estado)}>
                          {loan.estado}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Cobertura:</span>
                          <span className="font-medium">{(loan.cobertura || 0).toFixed(1)}%</span>
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

                      <div className="flex gap-2 pt-2">
                        <Link href={`/loans/${loan.id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Detalhes
                          </Button>
                        </Link>
                        <Link href={`/audit/${loan.id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Auditoria
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Endorsements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandHeart className="h-5 w-5" />
                Meus Endossos ({myEndorsements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myEndorsements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <HandHeart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Você ainda não fez nenhum endosso</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myEndorsements.map((endorsement) => (
                    <div key={endorsement.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{endorsement.emprestimo.tomador.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            Empréstimo: {formatCurrency(endorsement.emprestimo.valorTotal)}
                          </p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(endorsement.status)}>
                          {endorsement.status}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Valor Endossado:</span>
                          <span className="font-medium">{formatCurrency(endorsement.valorStake)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Data:</span>
                          <span>{new Date(endorsement.dataBloqueio).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/loans/${endorsement.emprestimo.id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Ver Empréstimo
                          </Button>
                        </Link>
                        <Link href={`/audit/${endorsement.emprestimo.id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Auditoria
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
