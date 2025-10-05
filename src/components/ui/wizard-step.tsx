import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardStepProps {
  title: string;
  description?: string;
  stepNumber: number;
  totalSteps: number;
  children: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  nextDisabled?: boolean;
  prevDisabled?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  isLastStep?: boolean;
}

export function WizardStep({
  title,
  description,
  stepNumber,
  totalSteps,
  children,
  onNext,
  onPrev,
  nextDisabled = false,
  prevDisabled = false,
  nextLabel = "Próximo",
  prevLabel = "Anterior",
  isLastStep = false
}: WizardStepProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i + 1 === stepNumber
                    ? 'bg-blue-600 text-white'
                    : i + 1 < stepNumber
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            Passo {stepNumber} de {totalSteps}
          </span>
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={prevDisabled || stepNumber === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {prevLabel}
          </Button>
          
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex items-center gap-2"
          >
            {isLastStep ? 'Finalizar' : nextLabel}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
