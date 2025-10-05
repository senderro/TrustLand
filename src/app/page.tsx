'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { Header } from '@/components/layout/Header';
import { 
  Target, 
  HandHeart, 
  Zap, 
  Shield, 
  BarChart3, 
  Waves,
  LogIn,
  Plus,
  LayoutDashboard,
  LogOut,
  Wrench
} from 'lucide-react';

export default function SimpleHomePage() {
  const { isAuthenticated, user, logout } = useUser();

  // Layout para usuários logados
  if (isAuthenticated) {
    return (
      <AuthWrapper>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <Image 
                  src="/LogoTrustLendWithoutBackground.png" 
                  alt="TrustLend Logo" 
                  width={200} 
                  height={80}
                  className="h-16 w-auto"
                />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Bem-vindo, {user?.nome}!
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Você está logado como <span className="font-semibold text-blue-600">{user?.tipo}</span>
              </p>
              <p className="text-lg text-gray-500">
                Score Social: <span className="font-semibold text-green-600">{user?.score}/100</span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Link 
                href="/dashboard"
                className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <LayoutDashboard className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Dashboard</h3>
                    <p className="text-sm text-gray-600">Ver suas atividades e métricas</p>
                  </div>
                </div>
              </Link>

              {user?.tipo === 'TOMADOR' && (
                <Link 
                  href="/loans/new"
                  className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                      <Plus className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Novo Empréstimo</h3>
                      <p className="text-sm text-gray-600">Solicitar um novo empréstimo</p>
                    </div>
                  </div>
                </Link>
              )}

              <Link 
                href="/contract-demo"
                className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                    <Wrench className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Demo Contratos</h3>
                    <p className="text-sm text-gray-600">Testar funcionalidades</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Features Overview */}
            <div className="bg-white rounded-xl p-8 shadow-lg border">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Recursos da Plataforma
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Scoring Determinístico</h3>
                  <p className="text-sm text-gray-600">Algoritmo transparente para avaliação de crédito</p>
                </div>

                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-green-100 rounded-full">
                      <HandHeart className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Garantia Social</h3>
                  <p className="text-sm text-gray-600">Endossos da comunidade com regras claras</p>
                </div>

                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Auditoria Completa</h3>
                  <p className="text-sm text-gray-600">Transparência total com hash determinístico</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  // Layout para usuários não logados
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header with Logo */}
        <div className="flex justify-center mb-6">
          <Image 
            src="/LogoTrustLendWithoutBackground.png" 
            alt="TrustLend Logo" 
            width={300} 
            height={120}
            className="h-24 w-auto"
          />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Crédito Colaborativo com Garantia Social
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Plataforma descentralizada para empréstimos baseados em confiança comunitária
        </p>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Scoring Determinístico</h3>
            <p className="text-sm text-gray-600">
              Algoritmo transparente e auditável para cálculo de score de crédito
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <HandHeart className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Garantia Social</h3>
            <p className="text-sm text-gray-600">
              Endossos da comunidade com regras de concentração
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Processamento Rápido</h3>
            <p className="text-sm text-gray-600">
              Transações e aprovações em tempo real
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Auditoria Completa</h3>
            <p className="text-sm text-gray-600">
              Hash determinístico para todas as decisões e eventos
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Analytics em Tempo Real</h3>
            <p className="text-sm text-gray-600">
              Dashboard com métricas de TVL, liquidez e inadimplência
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-cyan-100 rounded-full">
                <Waves className="h-8 w-8 text-cyan-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Waterfall Automático</h3>
            <p className="text-sm text-gray-600">
              Distribuição justa de perdas: colateral → stakes → fundo
            </p>
          </div>
        </div>

        {/* Action Buttons - apenas para usuários não logados */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/auth"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg shadow-lg transition-colors flex items-center gap-2 justify-center"
          >
            <LogIn className="h-5 w-5" />
            Entrar / Cadastrar
          </Link>
          
          <Link 
            href="/contract-demo"
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg text-lg shadow-lg transition-colors flex items-center gap-2 justify-center"
          >
            <Wrench className="h-5 w-5" />
            Demo Contratos
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl p-6 shadow-lg border max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Tecnologia & Inovação</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-800 mb-2">Stack Tecnológico</p>
                <p>Next.js 14 • TypeScript • Tailwind CSS</p>
                <p>Prisma • SQLite • Lucide Icons</p>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-2">Funcionalidades</p>
                <p>Scoring determinístico • Auditoria completa</p>
                <p>Waterfall automático • Analytics em tempo real</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AuthWrapper>
  );
}
