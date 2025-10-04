'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HashBadge } from './HashBadge';
import { 
  Clock, 
  FileText, 
  Users, 
  CheckCircle, 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  XCircle,
  ArrowRightLeft,
  Shield
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: string;
  ts: string;
  hash?: string;
  meta?: Record<string, any>;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CRIACAO': return FileText;
      case 'APOIO': return Users;
      case 'SCORE_RECALC': return Shield;
      case 'APROVACAO': return CheckCircle;
      case 'DESEMBOLSO': return DollarSign;
      case 'PAGAMENTO': return CreditCard;
      case 'ATRASO': return AlertTriangle;
      case 'DEFAULT': return XCircle;
      case 'WATERFALL': return ArrowRightLeft;
      case 'LIBERACAO': return CheckCircle;
      default: return Clock;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'CRIACAO': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'APOIO': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'SCORE_RECALC': return 'text-indigo-600 bg-indigo-100 border-indigo-200';
      case 'APROVACAO': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      case 'DESEMBOLSO': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      case 'PAGAMENTO': return 'text-green-600 bg-green-100 border-green-200';
      case 'ATRASO': return 'text-amber-600 bg-amber-100 border-amber-200';
      case 'DEFAULT': return 'text-red-600 bg-red-100 border-red-200';
      case 'WATERFALL': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'LIBERACAO': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getEventTitle = (type: string) => {
    switch (type) {
      case 'CRIACAO': return 'Empréstimo Criado';
      case 'APOIO': return 'Endosso Recebido';
      case 'SCORE_RECALC': return 'Score Recalculado';
      case 'APROVACAO': return 'Empréstimo Aprovado';
      case 'DESEMBOLSO': return 'Valor Liberado';
      case 'PAGAMENTO': return 'Pagamento Recebido';
      case 'ATRASO': return 'Pagamento Atrasado';
      case 'DEFAULT': return 'Inadimplência Declarada';
      case 'WATERFALL': return 'Liquidação Executada';
      case 'LIBERACAO': return 'Garantias Liberadas';
      default: return type;
    }
  };

  const formatEventDescription = (event: TimelineEvent) => {
    const { type, meta } = event;
    
    switch (type) {
      case 'CRIACAO':
        return `Principal: ${meta?.principal ? `$${(meta.principal / 1_000_000).toFixed(2)}` : 'N/A'}`;
      case 'APOIO':
        return `Valor: ${meta?.valorStake ? `$${(meta.valorStake / 1_000_000).toFixed(2)}` : 'N/A'}`;
      case 'SCORE_RECALC':
        return `${meta?.oldScore || 0} → ${meta?.newScore || 0} pontos`;
      case 'PAGAMENTO':
        return `Valor: ${meta?.valor ? `$${(meta.valor / 1_000_000).toFixed(2)}` : 'N/A'}`;
      case 'ATRASO':
        return meta?.motivo || 'Parcela em atraso';
      case 'WATERFALL':
        return `Recuperação: ${meta?.breakdown?.totalRecuperado ? `$${(meta.breakdown.totalRecuperado / 1_000_000).toFixed(2)}` : 'N/A'}`;
      default:
        return 'Evento processado com sucesso';
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum evento ainda</p>
            <p className="text-xs">Os eventos aparecerão aqui conforme ocorrem</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline de Eventos ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          
          <div className="space-y-6">
            {events.map((event, index) => {
              const Icon = getEventIcon(event.type);
              const eventDate = new Date(event.ts);
              
              return (
                <div key={event.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2",
                    getEventColor(event.type)
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold">
                            {getEventTitle(event.type)}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatEventDescription(event)}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <time dateTime={event.ts} title={eventDate.toLocaleString('pt-BR')}>
                            {formatRelativeTime(eventDate)}
                          </time>
                          
                          {event.hash && (
                            <HashBadge 
                              hash={event.hash} 
                              href={`/audit/${event.id}`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional metadata */}
                    {event.meta && Object.keys(event.meta).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Ver detalhes
                        </summary>
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(event.meta, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
