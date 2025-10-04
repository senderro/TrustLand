'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStepProps {
  title: string;
  description?: string;
  stepNumber: number;
  totalSteps: number;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
  completed?: boolean;
}

export function WizardStep({
  title,
  description,
  stepNumber,
  totalSteps,
  children,
  onNext,
  onPrevious,
  nextLabel = 'Próximo',
  previousLabel = 'Anterior',
  nextDisabled = false,
  isLoading = false,
  completed = false
}: WizardStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }, (_, index) => {
            const step = index + 1;
            const isActive = step === stepNumber;
            const isCompleted = step < stepNumber || completed;
            
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                    isCompleted 
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step}</span>
                    )}
                  </div>
                  <div className={cn(
                    "text-xs mt-2 text-center transition-colors",
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    Etapa {step}
                  </div>
                </div>
                
                {/* Connector line */}
                {step < totalSteps && (
                  <div className={cn(
                    "flex-1 h-px mx-4 transition-colors",
                    step < stepNumber || completed
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/30"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            Etapa {stepNumber} de {totalSteps}
          </div>
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {children}
          
          {/* Navigation buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {stepNumber > 1 && onPrevious && (
                <Button 
                  variant="outline" 
                  onClick={onPrevious}
                  disabled={isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {previousLabel}
                </Button>
              )}
            </div>
            
            <div>
              {onNext && (
                <Button 
                  onClick={onNext}
                  disabled={nextDisabled || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {stepNumber === totalSteps ? 'Finalizar' : nextLabel}
                      {stepNumber < totalSteps && <ChevronRight className="h-4 w-4 ml-1" />}
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
