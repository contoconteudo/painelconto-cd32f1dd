/**
 * Hook de Autenticação - MODO MOCK
 * 
 * TODO: Conectar Supabase depois
 * Atualmente usa dados mockados para desenvolvimento.
 */

import { useState, useEffect, useCallback } from "react";
import { MOCK_USERS, MockUser } from "@/data/mockData";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

const AUTH_STORAGE_KEY = "conto-auth-user";
const REGISTERED_USERS_KEY = "conto-registered-users";

// Obter usuários registrados do localStorage
const getRegisteredUsers = (): MockUser[] => {
  try {
    const stored = localStorage.getItem(REGISTERED_USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignorar erros de parse
  }
  return [];
};

// Salvar usuário registrado
const saveRegisteredUser = (user: MockUser) => {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
};

// Obter todos os usuários (mock + registrados)
const getAllUsers = (): MockUser[] => {
  return [...MOCK_USERS, ...getRegisteredUsers()];
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário salvo no localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
      }
    } catch {
      // Ignorar erros de parse
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    const allUsers = getAllUsers();
    const foundUser = allUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      throw new Error("Email ou senha incorretos");
    }

    const authUser: AuthUser = {
      id: foundUser.id,
      email: foundUser.email,
      full_name: foundUser.full_name,
    };

    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));

    // Disparar evento para outros componentes
    window.dispatchEvent(
      new CustomEvent("auth-user-changed", { detail: authUser })
    );
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string): Promise<void> => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    const allUsers = getAllUsers();
    const existingUser = allUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      throw new Error("Este e-mail já está cadastrado no sistema");
    }

    // Criar novo usuário
    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      password,
      full_name: name || email.split("@")[0],
      role: "user",
      modules: ["dashboard"],
      companies: [], // Sem acesso até admin liberar
      created_at: new Date().toISOString(),
    };

    // Salvar no localStorage
    saveRegisteredUser(newUser);

    // Fazer login automático
    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
    };

    setUser(authUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));

    // Disparar evento para outros componentes
    window.dispatchEvent(
      new CustomEvent("auth-user-changed", { detail: authUser })
    );
  }, []);

  const signOut = useCallback(async () => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));

    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);

    // Disparar evento para outros componentes
    window.dispatchEvent(
      new CustomEvent("auth-user-changed", { detail: null })
    );
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    const allUsers = getAllUsers();
    const foundUser = allUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!foundUser) {
      throw new Error("E-mail não encontrado no sistema");
    }

    // Em modo mock, apenas simula o envio
    console.log(`[MOCK] Email de recuperação enviado para: ${email}`);
  }, []);

  return {
    user,
    session: user ? { user } : null, // Compatibilidade
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  };
}

// Exportar função para obter usuário mock pelo ID
export const getMockUserById = (id: string): MockUser | undefined => {
  return getAllUsers().find(u => u.id === id);
};

// Exportar função para obter todos os usuários
export const getAllMockUsers = getAllUsers;
