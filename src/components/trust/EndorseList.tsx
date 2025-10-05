'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Plus, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface EndorseItem {
  id: string;
  apoiador: string;
  valorStake: number;
  status: string;
}

interface EndorseListProps {
  loanId: string;
  items: EndorseItem[];
  coberturaPct: number;
  onEndorse: (valorStake: number) => Promise<void>;
  disabled?: boolean;
  minCoverage?: number;
}

export function EndorseList({ 
  loanId, 
  items, 
  coberturaPct, 
  onEndorse, 
  disabled = false,
  minCoverage = 50
}: EndorseListProps) {
  const [stakeAmount, setStakeAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEndorse = async () => {
    if (!stakeAmount || stakeAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onEndorse(stakeAmount * 1_000_000); // Convert to microUSDC
      setStakeAmount(0);
    } catch (error) {
      console.error('Error endorsing loan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalStaked = items.reduce((sum, item) => sum + item.valorStake, 0);
  const isMinCoverageReached = coberturaPct >= minCoverage;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDENTE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LIBERADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CORTADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Endossos e Garantia Social
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coverage Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Cobertura Atual</span>
            <span className={cn(
              "text-sm font-bold",
              isMinCoverageReached ? "text-emerald-600" : "text-amber-600"
            )}>
              {coberturaPct.toFixed(1)}%
            </span>
          </div>
          
          <Progress 
            value={coberturaPct} 
            className="h-3"
            // @ts-ignore - Progress component styling
            indicatorClassName={cn(
              "transition-all duration-300",
              isMinCoverageReached ? "bg-emerald-500" : "bg-amber-500"
            )}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mínimo: {minCoverage}%</span>
            <span>Total: {formatCurrency(totalStaked)}</span>
          </div>

          {!isMinCoverageReached && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Cobertura insuficiente para aprovação
            </div>
          )}
        </div>

        {/* Endorsement List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Apoiadores ({items.length})</h4>
          
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum endosso ainda</p>
              <p className="text-xs">Seja o primeiro a apoiar este empréstimo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {item.apoiador.length > 20 
                        ? `${item.apoiador.slice(0, 6)}...${item.apoiador.slice(-4)}`
                        : item.apoiador
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(item.valorStake)}
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(item.status)}
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Endorsement */}
        {!disabled && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Adicionar Endosso</h4>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <CurrencyInput
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(value) => setStakeAmount(value)}
                  min={0}
                  step={0.01}
                  disabled={isSubmitting}
                  currency="USDC"
                  className="text-right"
                />
              </div>
              
              <Button 
                onClick={handleEndorse}
                disabled={!stakeAmount || isSubmitting || stakeAmount <= 0}
                size="sm"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Endossar
                  </div>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Seu endosso ajuda a reduzir a taxa de juros e possibilita a aprovação do empréstimo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
