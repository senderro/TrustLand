'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HashBadge } from '@/components/trust/HashBadge';
import { LoadingSkeleton } from '@/components/trust/LoadingSkeleton';
import { 
  Shield, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Hash,
  FileText,
  Clock
} from 'lucide-react';
import { apiClient, handleApiError } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils/format';
import Link from 'next/link';

interface AuditData {
  resourceType: 'loan' | 'decision';
  resourceId: string;
  decision?: {
    id: string;
    emprestimoId?: string;
    inputDados: Record<string, any>;
    resultado: Record<string, any>;
    hashDecisao: string;
    createdAt: string;
  };
  loan?: {
    id: string;
    valorTotal: number;
    estado: string;
    hashRegras: string;
    createdAt: string;
  };
  decisions?: Array<{
    id: string;
    inputDados: Record<string, any>;
    resultado: Record<string, any>;
    hashDecisao: string;
    createdAt: string;
  }>;
  hashVerification?: {
    valid: boolean;
    storedHash: string;
    computedHash: string;
  };
  relatedEvents?: Array<{
    id: string;
    tipo: string;
    timestamp: string;
    detalhes: Record<string, any>;
  }>;
  auditTrail?: Array<{
    type: 'decision' | 'event';
    id: string;
    timestamp: string;
    sequence: number;
    hash?: string;
    eventType?: string;
    data: any;
  }>;
  recomputed?: boolean;
  timestamp?: string;
}

export default function AuditPage() {
  const { id } = useParams();
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAuditData();
    }
  }, [id]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAudit(id as string);
      setAuditData(response);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRecompute = async () => {
    try {
      setRecomputing(true);
      const response = await apiClient.recomputeAudit(id as string);
      setAuditData(response);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setRecomputing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !auditData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar auditoria</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadAuditData} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Recurso de auditoria não encontrado</h2>
            <p className="text-muted-foreground mb-4">O recurso solicitado não existe ou foi removido.</p>
            <Link href="/dashboard">
              <Button variant="outline">Voltar ao Dashboard</Button>
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
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Auditoria</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">
                {auditData.resourceType === 'loan' ? 'Empréstimo' : 'Decisão'}
              </Badge>
              <span className="text-sm text-muted-foreground">#{auditData.resourceId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {auditData.resourceType === 'decision' && (
            <Button 
              onClick={handleRecompute}
              disabled={recomputing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${recomputing ? 'animate-spin' : ''}`} />
              Recomputar Hash
            </Button>
          )}
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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resource Summary */}
          {auditData.loan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações do Empréstimo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-sm">{auditData.loan.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant="outline">{auditData.loan.estado}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-semibold">${(auditData.loan.valorTotal / 1_000_000).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criado</p>
                    <p className="text-sm">{formatRelativeTime(new Date(auditData.loan.createdAt))}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Hash das Regras</p>
                  <HashBadge hash={auditData.loan.hashRegras} copyable />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Single Decision Details */}
          {auditData.decision && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Detalhes da Decisão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID da Decisão</p>
                    <p className="font-mono text-sm">{auditData.decision.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p className="text-sm">{formatRelativeTime(new Date(auditData.decision.createdAt))}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Hash da Decisão</p>
                  <HashBadge hash={auditData.decision.hashDecisao} copyable />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Dados de Entrada</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(auditData.decision.inputDados, null, 2)}
                  </pre>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Resultado</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(auditData.decision.resultado, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hash Verification Results */}
          {auditData.hashVerification && (
            <Card className={auditData.hashVerification.valid ? 'border-emerald-200' : 'border-red-200'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {auditData.hashVerification.valid ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Verificação de Integridade
                  {auditData.recomputed && (
                    <Badge variant="outline" className="ml-2">Recomputado</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`p-4 rounded ${
                    auditData.hashVerification.valid 
                      ? 'bg-emerald-50 text-emerald-800' 
                      : 'bg-red-50 text-red-800'
                  }`}>
                    <p className="font-medium">
                      {auditData.hashVerification.valid 
                        ? '✓ Hash verificado com sucesso - Integridade mantida'
                        : '✗ ALERTA: Hash não confere - Possível corrupção de dados'
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Hash Armazenado</p>
                      <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                        {auditData.hashVerification.storedHash}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Hash Computado</p>
                      <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                        {auditData.hashVerification.computedHash}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multiple Decisions */}
          {auditData.decisions && auditData.decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Decisões Registradas ({auditData.decisions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditData.decisions.map((decision, index) => (
                    <div key={decision.id} className="p-4 bg-muted/50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Decisão #{index + 1}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(decision.createdAt))}
                        </span>
                      </div>
                      <HashBadge 
                        hash={decision.hashDecisao} 
                        href={`/audit/${decision.id}`}
                        copyable
                      />
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          Ver detalhes
                        </summary>
                        <div className="mt-2 space-y-2">
                          <div>
                            <p className="text-xs font-medium">Entrada:</p>
                            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                              {JSON.stringify(decision.inputDados, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium">Resultado:</p>
                            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                              {JSON.stringify(decision.resultado, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Events */}
          {auditData.relatedEvents && auditData.relatedEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Eventos Relacionados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditData.relatedEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-muted/50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">{event.tipo}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(event.timestamp))}
                        </span>
                      </div>
                      <details>
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          Ver detalhes
                        </summary>
                        <pre className="mt-2 text-xs bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.detalhes, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Trail */}
          {auditData.auditTrail && auditData.auditTrail.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Trilha de Auditoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditData.auditTrail.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-mono">
                        {entry.sequence}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {entry.type === 'decision' ? 'DEC' : 'EVT'}
                          </Badge>
                          {entry.eventType && (
                            <span className="text-xs text-muted-foreground">
                              {entry.eventType}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(entry.timestamp))}
                        </div>
                      </div>
                      {entry.hash && (
                        <HashBadge hash={entry.hash} showIcon={false} />
                      )}
                    </div>
                  ))}
                  {auditData.auditTrail.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{auditData.auditTrail.length - 10} mais entradas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadados</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo de Recurso:</span>
                <span className="font-medium">
                  {auditData.resourceType === 'loan' ? 'Empréstimo' : 'Decisão'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID do Recurso:</span>
                <span className="font-mono">{auditData.resourceId}</span>
              </div>
              {auditData.timestamp && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consultado em:</span>
                  <span>{formatRelativeTime(new Date(auditData.timestamp))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Integridade:</span>
                <span className={auditData.hashVerification?.valid ? 'text-emerald-600' : 'text-red-600'}>
                  {auditData.hashVerification?.valid ? 'Verificada' : 'Não verificada'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
