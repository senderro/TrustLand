'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreDial } from './ScoreDial';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface LoanCardProps {
  id: string;
  valor: number;
  prazo: number;
  score: number;
  estado: string;
  tomador?: {
    nome: string;
    carteira: string;
  };
  coberturaPct?: number;
  taxaAnualBps?: number;
  createdAt?: string;
  className?: string;
}

export function LoanCard({
  id,
  valor,
  prazo,
  score,
  estado,
  tomador,
  coberturaPct = 0,
  taxaAnualBps = 0,
  createdAt,
  className
}: LoanCardProps) {
  const getEstadoColor = (estado: string) => {
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

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDENTE': return Clock;
      case 'APROVADO': return CheckCircle;
      case 'ATIVO': return TrendingUp;
      case 'QUITADO': return CheckCircle;
      case 'INADIMPLENTE': return AlertTriangle;
      case 'LIQUIDADO_INADIMPLENCIA': return AlertTriangle;
      default: return Clock;
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDENTE': return 'Pendente';
      case 'APROVADO': return 'Aprovado';
      case 'ATIVO': return 'Ativo';
      case 'QUITADO': return 'Quitado';
      case 'INADIMPLENTE': return 'Inadimplente';
      case 'LIQUIDADO_INADIMPLENCIA': return 'Liquidado';
      default: return estado;
    }
  };

  const EstadoIcon = getEstadoIcon(estado);
  const isClickable = true; // All loans are clickable for details

  const cardContent = (
    <Card className={cn(
      "transition-all duration-200",
      isClickable && "hover:shadow-md hover:scale-[1.02] cursor-pointer",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="text-lg font-bold">
              {formatCurrency(valor)}
            </div>
            <div className="text-sm text-muted-foreground">
              Empréstimo #{id.slice(-6)}
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <Badge 
              variant="outline" 
              className={cn("gap-1", getEstadoColor(estado))}
            >
              <EstadoIcon className="h-3 w-3" />
              {getEstadoLabel(estado)}
            </Badge>
            
            {taxaAnualBps > 0 && (
              <div className="text-xs text-muted-foreground">
                {(taxaAnualBps / 100).toFixed(1)}% a.a.
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left side - Details */}
          <div className="space-y-3">
            {tomador && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  TOMADOR
                </div>
                <div className="text-sm">
                  {tomador.nome}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {tomador.carteira.slice(0, 6)}...{tomador.carteira.slice(-4)}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">Prazo</span>
                </div>
                <div className="font-medium">
                  {prazo} dias
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span className="text-xs">Cobertura</span>
                </div>
                <div className={cn(
                  "font-medium",
                  coberturaPct >= 50 ? "text-emerald-600" : "text-amber-600"
                )}>
                  {coberturaPct.toFixed(0)}%
                </div>
              </div>
            </div>

            {createdAt && (
              <div className="text-xs text-muted-foreground">
                Criado {new Date(createdAt).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
          
          {/* Right side - Score */}
          <div className="flex items-center justify-center md:justify-end">
            <ScoreDial 
              score={score} 
              size={80}
              ariaLabel={`Score do tomador: ${score}`}
            />
          </div>
        </div>
        
        {/* Action indicator */}
        {isClickable && (
          <div className="flex items-center justify-center mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span>Ver detalhes</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isClickable) {
    return (
      <Link href={`/loans/${id}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
