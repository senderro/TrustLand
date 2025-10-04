import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createApiResponse, createApiError } from '@/lib/api';
import { Repository } from '@/lib/infra/repo';
import { EventManager } from '@/lib/infra/events';
import { DecisionLogger } from '@/lib/infra/logger';

const prisma = new PrismaClient();
const eventManager = new EventManager(prisma);
const decisionLogger = new DecisionLogger(prisma);
const repository = new Repository(prisma, eventManager, decisionLogger);

export async function GET(request: NextRequest) {
  try {
    // Get dashboard metrics
    const metrics = await repository.getDashboardMetrics();

    // Get additional detailed metrics
    const [
      recentLoans,
      recentEvents,
      topBorrowers,
      topSupporters
    ] = await Promise.all([
      // Recent loans (last 10)
      prisma.emprestimo.findMany({
        include: {
          tomador: {
            select: { nome: true, carteira: true, score: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Recent events (last 20)
      eventManager.getRecentEvents(20),

      // Top borrowers by volume
      prisma.emprestimo.groupBy({
        by: ['tomadorId'],
        _sum: { valorTotal: true },
        _count: { id: true },
        orderBy: { _sum: { valorTotal: 'desc' } },
        take: 5
      }),

      // Top supporters by stakes
      prisma.endosso.groupBy({
        by: ['apoiadorId'],
        _sum: { valorStake: true },
        _count: { id: true },
        where: { status: 'ATIVO' },
        orderBy: { _sum: { valorStake: 'desc' } },
        take: 5
      })
    ]);

    // Calculate loan distribution by status
    const loansByStatus = await prisma.emprestimo.groupBy({
      by: ['estado'],
      _count: { id: true }
    });

    const statusDistribution = loansByStatus.reduce((acc, item) => {
      acc[item.estado] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calculate monthly trends (simplified for demo)
    const monthlyData = await prisma.emprestimo.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      _sum: { valorTotal: true },
      orderBy: { createdAt: 'desc' },
      take: 30 // Last 30 records as proxy for daily data
    });

    // Risk metrics
    const riskMetrics = {
      concentrationRisk: await calculateConcentrationRisk(),
      avgLoanToValue: await calculateAvgLTV(),
      defaultRate: metrics.inadimplenciaPct,
      recoveryRate: await calculateRecoveryRate()
    };

    // System health indicators
    const systemHealth = {
      apiLatency: Math.random() * 50 + 50, // Simulated
      dbConnections: Math.floor(Math.random() * 10) + 5,
      activeUsers: await prisma.usuario.count({ where: { status: 'ATIVO' } }),
      systemLoad: Math.random() * 0.7 + 0.1,
    };

    return NextResponse.json(
      createApiResponse({
        // Core metrics
        metrics,
        
        // Status distribution
        loanDistribution: statusDistribution,
        
        // Trends
        trends: {
          monthlyVolume: monthlyData.map(d => ({
            date: d.createdAt,
            count: d._count.id,
            volume: d._sum.valorTotal || 0
          })),
        },

        // Top performers
        topPerformers: {
          borrowers: topBorrowers.map(b => ({
            tomadorId: b.tomadorId,
            totalVolume: b._sum.valorTotal || 0,
            loanCount: b._count.id
          })),
          supporters: topSupporters.map(s => ({
            apoiadorId: s.apoiadorId,
            totalStaked: s._sum.valorStake || 0,
            endorsementCount: s._count.id
          }))
        },

        // Recent activity
        recentActivity: {
          loans: recentLoans.map(loan => ({
            id: loan.id,
            valor: loan.valorTotal,
            estado: loan.estado,
            tomador: loan.tomador?.nome,
            createdAt: loan.createdAt
          })),
          events: recentEvents.map(event => ({
            id: event.id,
            tipo: event.tipo,
            timestamp: event.timestamp,
            referenciaId: event.referenciaId
          }))
        },

        // Risk assessment
        risk: riskMetrics,

        // System health
        system: systemHealth,

        // Metadata
        lastUpdated: new Date().toISOString(),
        dataFreshness: 'real-time'
      })
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      createApiError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

// Helper functions for risk calculations
async function calculateConcentrationRisk(): Promise<number> {
  const totalStaked = await prisma.endosso.aggregate({
    _sum: { valorStake: true },
    where: { status: 'ATIVO' }
  });

  if (!totalStaked._sum.valorStake) return 0;

  const topStaker = await prisma.endosso.groupBy({
    by: ['apoiadorId'],
    _sum: { valorStake: true },
    where: { status: 'ATIVO' },
    orderBy: { _sum: { valorStake: 'desc' } },
    take: 1
  });

  if (topStaker.length === 0) return 0;

  return ((topStaker[0]._sum.valorStake || 0) / totalStaked._sum.valorStake) * 100;
}

async function calculateAvgLTV(): Promise<number> {
  const loans = await prisma.emprestimo.findMany({
    where: { estado: { in: ['ATIVO', 'APROVADO'] } },
    include: {
      endossos: {
        where: { status: 'ATIVO' },
        select: { valorStake: true }
      }
    }
  });

  if (loans.length === 0) return 0;

  const ltvSum = loans.reduce((sum, loan) => {
    const totalStaked = loan.endossos.reduce((s, e) => s + e.valorStake, 0);
    const ltv = loan.valorTotal > 0 ? (totalStaked / loan.valorTotal) * 100 : 0;
    return sum + ltv;
  }, 0);

  return ltvSum / loans.length;
}

async function calculateRecoveryRate(): Promise<number> {
  const liquidatedLoans = await prisma.emprestimo.findMany({
    where: { estado: 'LIQUIDADO_INADIMPLENCIA' }
  });

  if (liquidatedLoans.length === 0) return 100;

  // Simplified recovery rate calculation
  // In a real system, you'd track actual recovered amounts
  const avgRecovery = liquidatedLoans.reduce((sum, loan) => {
    const recoveryRate = (loan.valorPago / loan.valorTotal) * 100;
    return sum + recoveryRate;
  }, 0);

  return avgRecovery / liquidatedLoans.length;
}
