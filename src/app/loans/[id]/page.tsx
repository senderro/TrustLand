'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScoreDial } from '@/components/trust/ScoreDial';
import { EndorseList } from '@/components/trust/EndorseList';
import { Timeline } from '@/components/trust/Timeline';
import { HashBadge } from '@/components/trust/HashBadge';
import { LoadingSkeleton } from '@/components/trust/LoadingSkeleton';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { apiClient, handleApiError } from '@/lib/api';
import { formatCurrency, formatPercentage, formatRelativeTime } from '@/lib/utils/format';
import Link from 'next/link';

interface LoanDetails {
  id: string;
  tomadorId: string;
  valorTotal: number;
  taxaAnualBps: number;
  prazoParcelas: number;
  estado: string;
  dataInicio?: string;
  dataFim?: string;
  colateral: number;
  valorPago: number;
  hashRegras: string;
  createdAt: string;
  coberturaPct: number;
  totalOwed: number;
  overdueAmount: number;
  tomador: {
    nome: string;
    carteira: string;
    score: number;
  };
}

interface Installment {
  indice: number;
  valor: number;
  dueAt: string;
  status: string;
  paidAt?: string;
}

interface Endorsement {
  id: string;
  apoiadorId: string;
  valorStake: number;
  status: string;
  apoiador: {
    nome: string;
    carteira: string;
  };
}

export default function LoanDetailsPage() {
  const { id } = useParams();
  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Action form states
  const [repayAmount, setRepayAmount] = useState('');
  const [endorseAmount, setEndorseAmount] = useState('');

  useEffect(() => {
    if (id) {
      loadLoanDetails();
    }
  }, [id]);

  const loadLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getLoan(id as string) as any;
      
      setLoan(response.loan);
      setInstallments(response.parcelas || []);
      setEndorsements(response.endossos || []);
      setEvents(response.events || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEndorse = async (valorStake: number) => {
    setActionLoading('endorse');
    try {
      // In a real app, this would get the current user ID
      const apoiadorId = 'demo-supporter-id';
      
      await apiClient.endorseLoan(id as string, {
        apoiadorId,
        valorStake,
      });
      
      await loadLoanDetails(); // Refresh data
      setEndorseAmount('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await apiClient.approveLoan(id as string);
      await loadLoanDetails();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRepay = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) return;
    
    setActionLoading('repay');
    try {
      await apiClient.repayLoan(id as string, {
        valor: parseFloat(repayAmount) * 1_000_000, // Convert to microUSDC
      });
      
      await loadLoanDetails();
      setRepayAmount('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkLate = async () => {
    setActionLoading('late');
    try {
      await apiClient.markLoanLate(id as string, {
        motivo: 'Marcado manualmente como atrasado',
      });
      
      await loadLoanDetails();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDefault = async () => {
    setActionLoading('default');
    try {
      await apiClient.defaultLoan(id as string);
      await loadLoanDetails();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLiquidate = async () => {
    setActionLoading('liquidate');
    try {
      await apiClient.liquidateLoan(id as string);
      await loadLoanDetails();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'PENDENTE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'APROVADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ATIVO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'QUITADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'INADIMPLENTE': return 'bg-red-100 text-red-800 border-red-200';
      case 'LIQUIDADO_INADIMPLENCIA': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar empréstimo</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadLoanDetails} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Empréstimo não encontrado</h2>
            <p className="text-muted-foreground mb-4">O empréstimo solicitado não existe ou foi removido.</p>
            <Link href="/loans">
              <Button variant="outline">Voltar para Empréstimos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/loans">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Empréstimo #{loan.id.slice(-6)}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getStatusColor(loan.estado)}>
                {loan.estado}
              </Badge>
              <HashBadge hash={loan.hashRegras} href={`/audit/${loan.id}`} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/audit/${loan.id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Auditoria
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumo do Empréstimo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xl font-bold">{formatCurrency(loan.valorTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Juros</p>
                <p className="text-xl font-bold">{formatPercentage(loan.taxaAnualBps / 100)} a.a.</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prazo</p>
                <p className="text-xl font-bold">{loan.prazoParcelas} dias</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Pago</p>
                <p className="text-xl font-bold">{formatCurrency(loan.valorPago)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Borrower Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tomador</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{loan.tomador.nome}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {loan.tomador.carteira}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Criado {formatRelativeTime(new Date(loan.createdAt))}
                </p>
              </div>
              <ScoreDial score={loan.tomador.score} size={80} />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Repayment */}
              {loan.estado === 'ATIVO' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fazer Pagamento (USDC)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <Button 
                      onClick={handleRepay}
                      disabled={!repayAmount || actionLoading === 'repay'}
                    >
                      {actionLoading === 'repay' ? 'Pagando...' : 'Pagar'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Approval */}
              {loan.estado === 'PENDENTE' && loan.coberturaPct >= 50 && (
                <Button 
                  onClick={handleApprove}
                  disabled={actionLoading === 'approve'}
                  className="w-full"
                >
                  {actionLoading === 'approve' ? 'Aprovando...' : 'Aprovar Empréstimo'}
                </Button>
              )}

              {/* Mark Late */}
              {loan.estado === 'ATIVO' && (
                <Button 
                  onClick={handleMarkLate}
                  disabled={actionLoading === 'late'}
                  variant="outline"
                  className="w-full"
                >
                  {actionLoading === 'late' ? 'Processando...' : 'Marcar como Atrasado'}
                </Button>
              )}

              {/* Default */}
              {['ATIVO', 'APROVADO'].includes(loan.estado) && (
                <Button 
                  onClick={handleDefault}
                  disabled={actionLoading === 'default'}
                  variant="destructive"
                  className="w-full"
                >
                  {actionLoading === 'default' ? 'Processando...' : 'Marcar Inadimplência'}
                </Button>
              )}

              {/* Liquidate */}
              {loan.estado === 'INADIMPLENTE' && (
                <Button 
                  onClick={handleLiquidate}
                  disabled={actionLoading === 'liquidate'}
                  variant="destructive"
                  className="w-full"
                >
                  {actionLoading === 'liquidate' ? 'Liquidando...' : 'Executar Liquidação'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Endorsements & Timeline */}
        <div className="space-y-6">
          {/* Endorsements */}
          <EndorseList
            loanId={loan.id}
            items={endorsements.map(e => ({
              id: e.id,
              apoiador: e.apoiador.nome,
              valorStake: e.valorStake,
              status: e.status,
            }))}
            coberturaPct={loan.coberturaPct}
            onEndorse={handleEndorse}
            disabled={!['PENDENTE'].includes(loan.estado)}
          />

          {/* Installments Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Parcelas ({installments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {installments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma parcela gerada</p>
                ) : (
                  installments.slice(0, 5).map((installment) => (
                    <div
                      key={installment.indice}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{installment.indice}</span>
                        <Badge 
                          variant="outline"
                          className={
                            installment.status === 'PAGA' 
                              ? 'bg-emerald-100 text-emerald-800'
                              : installment.status === 'ATRASADA'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }
                        >
                          {installment.status}
                        </Badge>
                      </div>
                      <span className="text-sm">{formatCurrency(installment.valor)}</span>
                    </div>
                  ))
                )}
                {installments.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{installments.length - 5} mais parcelas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Timeline events={events} />
        </div>
      </div>
    </div>
  );
}
