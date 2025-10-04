'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardStep } from '@/components/trust/WizardStep';
import { ScoreDial } from '@/components/trust/ScoreDial';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { apiClient, handleApiError } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

interface LoanFormData {
  tomadorId: string;
  principal: number;
  termDays: number;
  purpose?: string;
  colateral?: number;
}

interface ScoreData {
  score: number;
  faixa: string;
  aprBps: number;
  limiteMax: number;
}

interface PricingData {
  faixa: 'BAIXO' | 'MEDIO' | 'ALTO' | 'EXCELENTE';
  aprBps: number;
  limiteMax: number;
  exigenciaCoberturaPct: number;
  aprFinalBps: number;
}

export default function NewLoanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<LoanFormData>({
    tomadorId: '',
    principal: 0,
    termDays: 30,
    purpose: '',
    colateral: 0,
  });

  // Calculated data
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loanId, setLoanId] = useState<string | null>(null);

  const handleNext = async () => {
    setError(null);
    
    if (currentStep === 1) {
      // Validate step 1 and move to step 2
      if (!formData.tomadorId || formData.principal <= 0 || formData.termDays <= 0) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }
      setCurrentStep(2);
      
      // Simulate score calculation (in real app, this would call score API)
      setTimeout(() => {
        const mockScore = Math.floor(Math.random() * 40) + 50; // 50-90
        const mockPricing: PricingData = {
          faixa: mockScore >= 80 ? 'ALTO' : mockScore >= 60 ? 'MEDIO' : 'BAIXO',
          aprBps: mockScore >= 80 ? 900 : mockScore >= 60 ? 1400 : 2200,
          limiteMax: mockScore >= 80 ? 8_000_000 : mockScore >= 60 ? 5_000_000 : 2_000_000,
          exigenciaCoberturaPct: mockScore >= 80 ? 25 : mockScore >= 60 ? 50 : 100,
          aprFinalBps: mockScore >= 80 ? 900 : mockScore >= 60 ? 1400 : 2200,
        };
        
        setScoreData({
          score: mockScore,
          faixa: mockPricing.faixa,
          aprBps: mockPricing.aprBps,
          limiteMax: mockPricing.limiteMax,
        });
        setPricing(mockPricing);
      }, 1500);
      
    } else if (currentStep === 2) {
      // Create loan
      setCurrentStep(3);
      await createLoan();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createLoan = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.createLoan({
        tomadorId: formData.tomadorId,
        principal: formData.principal * 1_000_000, // Convert to microUSDC
        termDays: formData.termDays,
        purpose: formData.purpose,
        colateral: (formData.colateral || 0) * 1_000_000,
      });
      
      setLoanId(response.loan?.id || null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (loanId) {
      router.push(`/loans/${loanId}`);
    } else {
      router.push('/');
    }
  };

  const renderStep1 = () => (
    <WizardStep
      title="Dados do Empréstimo"
      description="Informe os detalhes básicos do seu empréstimo"
      stepNumber={1}
      totalSteps={3}
      onNext={handleNext}
      nextDisabled={!formData.tomadorId || formData.principal <= 0}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="borrower" className="text-sm font-medium">
            ID do Tomador *
          </label>
          <Input
            id="borrower"
            placeholder="Insira o ID do usuário tomador"
            value={formData.tomadorId}
            onChange={(e) => setFormData({ ...formData, tomadorId: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Em uma implementação completa, isso seria selecionado automaticamente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Valor (USDC) *
            </label>
            <Input
              id="amount"
              type="number"
              placeholder="1000"
              min="1"
              max="10000"
              value={formData.principal || ''}
              onChange={(e) => setFormData({ ...formData, principal: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="term" className="text-sm font-medium">
              Prazo (dias) *
            </label>
            <Input
              id="term"
              type="number"
              placeholder="30"
              min="1"
              max="365"
              value={formData.termDays || ''}
              onChange={(e) => setFormData({ ...formData, termDays: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="purpose" className="text-sm font-medium">
            Finalidade (opcional)
          </label>
          <Input
            id="purpose"
            placeholder="Ex: Capital de giro, investimento, emergência..."
            value={formData.purpose || ''}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="collateral" className="text-sm font-medium">
            Garantia Própria (USDC)
          </label>
          <Input
            id="collateral"
            type="number"
            placeholder="0"
            min="0"
            value={formData.colateral || ''}
            onChange={(e) => setFormData({ ...formData, colateral: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-muted-foreground">
            Valor que você deposita como garantia adicional
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </WizardStep>
  );

  const renderStep2 = () => (
    <WizardStep
      title="Score e Precificação"
      description="Análise do seu perfil de crédito e condições oferecidas"
      stepNumber={2}
      totalSteps={3}
      onNext={handleNext}
      onPrevious={handlePrevious}
      isLoading={!scoreData}
      nextLabel="Criar Empréstimo"
    >
      <div className="space-y-6">
        {!scoreData ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Calculando score e condições...</p>
          </div>
        ) : (
          <>
            {/* Score Display */}
            <div className="flex justify-center">
              <ScoreDial score={scoreData.score} size={120} />
            </div>

            {/* Loan Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo do Empréstimo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-lg font-semibold">{formatCurrency(formData.principal * 1_000_000)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prazo</p>
                    <p className="text-lg font-semibold">{formData.termDays} dias</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Juros</p>
                    <p className="text-lg font-semibold">{formatPercentage(scoreData.aprBps / 100)} a.a.</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Classificação</p>
                    <Badge variant="outline">{scoreData.faixa}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {pricing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Requisitos para Aprovação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Cobertura mínima:</span>
                      <span className="text-sm font-medium">{pricing.exigenciaCoberturaPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Apoiadores mínimos:</span>
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Limite máximo:</span>
                      <span className="text-sm font-medium">{formatCurrency(pricing.limiteMax)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.principal * 1_000_000 > (scoreData.limiteMax || 0) && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  Valor solicitado excede o limite de crédito. Máximo: {formatCurrency(scoreData.limiteMax)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </WizardStep>
  );

  const renderStep3 = () => (
    <WizardStep
      title="Empréstimo Criado"
      description="Seu pedido foi criado com sucesso"
      stepNumber={3}
      totalSteps={3}
      onNext={handleFinish}
      nextLabel="Ver Detalhes"
      isLoading={isLoading}
      completed={!isLoading && !error}
    >
      <div className="text-center space-y-6">
        {isLoading ? (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Criando empréstimo...</p>
          </>
        ) : error ? (
          <>
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">Erro ao criar empréstimo</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button onClick={() => setCurrentStep(2)} variant="outline">
              Tentar Novamente
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-emerald-600 mb-2">
                Empréstimo Criado com Sucesso!
              </h3>
              <p className="text-muted-foreground">
                Seu pedido está agora disponível para endossos da comunidade.
              </p>
              {loanId && (
                <p className="text-sm text-muted-foreground mt-2">
                  ID: {loanId}
                </p>
              )}
            </div>
            
            <Card className="text-left">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Próximos passos:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Aguardar endossos de apoiadores da comunidade</li>
                  <li>Atingir a cobertura mínima de {pricing?.exigenciaCoberturaPct}%</li>
                  <li>Aprovação automática quando critérios forem atendidos</li>
                  <li>Liberação dos recursos</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </WizardStep>
  );

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Criar Novo Empréstimo</h1>
          <p className="text-muted-foreground">
            Solicite um empréstimo com garantia social da comunidade
          </p>
        </div>

        {/* Wizard */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
}
