'use client';

import React from 'react';
import Link from 'next/link';

export default function SimpleHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      {/* Demo Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-2 text-amber-800">
          <span className="text-2xl">🚀</span>
          <span className="font-semibold">
            TrustLend MVP - Simulação de Crédito Colaborativo
          </span>
          <span className="text-2xl">🚀</span>
        </div>
        <p className="text-center text-amber-700 mt-2">
          Demonstração completa • Sem valor financeiro real
        </p>
      </div>

      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          TrustLend MVP
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Plataforma de crédito colaborativo com garantia social
        </p>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Scoring Determinístico</h3>
            <p className="text-sm text-gray-600">
              Algoritmo transparente e auditável para cálculo de score de crédito
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="text-3xl mb-4">🤝</div>
            <h3 className="text-lg font-semibold mb-2">Garantia Social</h3>
            <p className="text-sm text-gray-600">
              Endossos da comunidade com regras de concentração
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Pagamentos Rápidos</h3>
            <p className="text-sm text-gray-600">
              Processamento acelerado para demonstração (10s por parcela)
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Auditoria Completa</h3>
            <p className="text-sm text-gray-600">
              Hash determinístico para todas as decisões e eventos
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Analytics em Tempo Real</h3>
            <p className="text-sm text-gray-600">
              Dashboard com métricas de TVL, liquidez e inadimplência
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="text-3xl mb-4">🌊</div>
            <h3 className="text-lg font-semibold mb-2">Waterfall Automático</h3>
            <p className="text-sm text-gray-600">
              Distribuição justa de perdas: colateral → stakes → fundo
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/loans/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg shadow-lg transition-colors"
          >
            🚀 Criar Empréstimo
          </Link>
          
          <Link 
            href="/dashboard"
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg text-lg shadow-lg transition-colors"
          >
            📊 Ver Dashboard
          </Link>
        </div>

        {/* Demo Instructions */}
        <div className="bg-white rounded-xl p-8 shadow-lg border max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            🎮 Roteiro de Demo (≤ 2 min)
          </h2>
          
          <div className="space-y-4 text-left">
            <div className="flex gap-4">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</span>
              <div>
                <strong>Criar Empréstimo (30s)</strong>
                <p className="text-sm text-gray-600">Preencher dados → Ver score automático → Confirmar</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</span>
              <div>
                <strong>Endossos & Aprovação (30s)</strong>
                <p className="text-sm text-gray-600">Adicionar 2 endossos → Atingir 80%+ cobertura → Aprovar</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</span>
              <div>
                <strong>Pagamento (30s)</strong>
                <p className="text-sm text-gray-600">Fazer pagamento → Ver parcelas atualizadas → Score aumenta</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</span>
              <div>
                <strong>Default & Waterfall (30s)</strong>
                <p className="text-sm text-gray-600">Marcar inadimplência → Executar liquidação → Ver breakdown</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">5</span>
              <div>
                <strong>Auditoria (bonus)</strong>
                <p className="text-sm text-gray-600">Clicar HashBadge → Ver JSON + hash → Recompute → Integridade ✅</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p className="mb-2">
            <strong>Stack:</strong> Next.js 14 • TypeScript • Tailwind CSS • Prisma • SQLite • wagmi • viem
          </p>
          <p>
            <strong>Business Logic:</strong> Scoring determinístico • 4 faixas de risco • Fraud detection • Waterfall automático
          </p>
        </div>
      </div>
    </div>
  );
}
