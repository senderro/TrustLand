'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  nome: string;
  cpf?: string;
  endereco?: string;
  carteira: string;
  tipo: 'TOMADOR' | 'APOIADOR' | 'OPERADOR' | 'PROVEDOR';
  score: number;
  status: string;
  createdAt: string;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (wallet: string, userType: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  createUser: (userData: Omit<User, 'id' | 'score' | 'status' | 'createdAt'>) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Carrega usuário do localStorage na inicialização
  useEffect(() => {
    const savedUser = localStorage.getItem('trustlend_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário salvo:', error);
        localStorage.removeItem('trustlend_user');
      }
    }
  }, []);

  const login = async (wallet: string, userType: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Tenta encontrar usuário existente pela carteira
      const response = await fetch(`/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carteira: wallet,
          tipo: userType,
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('trustlend_user', JSON.stringify(data.user));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Omit<User, 'id' | 'score' | 'status' | 'createdAt'>): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('trustlend_user', JSON.stringify(data.user));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('trustlend_user');
  };

  const value: UserContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    createUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
