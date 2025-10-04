'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileX, 
  Plus, 
  AlertCircle, 
  Search,
  DollarSign,
  Users,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: 'loans' | 'users' | 'search' | 'error' | 'clock';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
}

export function EmptyState({ 
  icon = 'loans', 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'loans': return DollarSign;
      case 'users': return Users;
      case 'search': return Search;
      case 'error': return AlertCircle;
      case 'clock': return Clock;
      default: return FileX;
    }
  };

  const Icon = getIcon(icon);

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2 text-center">
          {title}
        </h3>
        
        {description && (
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            {description}
          </p>
        )}
        
        {action && (
          <Button 
            onClick={action.onClick}
            variant={action.variant || 'default'}
          >
            <Plus className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function LoansEmptyState({ onCreateLoan }: { onCreateLoan?: () => void }) {
  return (
    <EmptyState
      icon="loans"
      title="Nenhum empréstimo encontrado"
      description="Comece criando seu primeiro pedido de empréstimo. Nossa plataforma usa garantia social para reduzir taxas e aumentar aprovações."
      action={onCreateLoan ? {
        label: 'Criar Empréstimo',
        onClick: onCreateLoan
      } : undefined}
    />
  );
}

export function UsersEmptyState({ onInviteUser }: { onInviteUser?: () => void }) {
  return (
    <EmptyState
      icon="users"
      title="Nenhum usuário encontrado"
      description="Convide amigos e parceiros para participar da rede de crédito colaborativo."
      action={onInviteUser ? {
        label: 'Convidar Usuário',
        onClick: onInviteUser
      } : undefined}
    />
  );
}

export function SearchEmptyState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="search"
      title="Nenhum resultado encontrado"
      description={query 
        ? `Não encontramos resultados para "${query}". Tente outros termos de busca.`
        : "Digite algo na busca para encontrar empréstimos, usuários ou transações."
      }
    />
  );
}

export function ErrorEmptyState({ 
  onRetry, 
  message = "Algo deu errado. Tente novamente." 
}: { 
  onRetry?: () => void;
  message?: string; 
}) {
  return (
    <EmptyState
      icon="error"
      title="Erro ao carregar dados"
      description={message}
      action={onRetry ? {
        label: 'Tentar Novamente',
        onClick: onRetry,
        variant: 'outline'
      } : undefined}
    />
  );
}

export function LoadingEmptyState({ message = "Carregando..." }: { message?: string }) {
  return (
    <EmptyState
      icon="clock"
      title={message}
      description="Aguarde enquanto buscamos os dados."
    />
  );
}
