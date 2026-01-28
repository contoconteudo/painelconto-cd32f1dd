import { useState, useEffect, useCallback } from "react";
import { MOCK_USERS, MockUser, MOCK_STORAGE_KEYS } from "@/data/mockData";

// Tipo simplificado do usuário para a interface
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega usuário do localStorage na inicialização
  useEffect(() => {
    const savedUser = localStorage.getItem(MOCK_STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem(MOCK_STORAGE_KEYS.CURRENT_USER);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    // Busca usuário mockado
    const foundUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
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
    localStorage.setItem(MOCK_STORAGE_KEYS.CURRENT_USER, JSON.stringify(authUser));
    
    // Disparar evento para notificar outros componentes sobre mudança de usuário
    window.dispatchEvent(new CustomEvent("auth-user-changed", { detail: authUser }));
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    // Verifica se email já existe nos usuários mockados
    const existsInMock = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existsInMock) {
      throw new Error("Este e-mail já está cadastrado no sistema");
    }

    // Verifica se já existe um usuário criado com este email no localStorage
    const registeredUsersStr = localStorage.getItem(MOCK_STORAGE_KEYS.REGISTERED_USERS);
    const registeredUsers: AuthUser[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
    
    const existsInRegistered = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existsInRegistered) {
      throw new Error("Este e-mail já está cadastrado no sistema");
    }

    // Cria novo usuário
    const newUser: AuthUser = {
      id: `user-new-${Date.now()}`,
      email: email,
      full_name: email.split("@")[0],
    };

    // Salva na lista de usuários registrados
    registeredUsers.push(newUser);
    localStorage.setItem(MOCK_STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));

    // Loga o usuário
    setUser(newUser);
    localStorage.setItem(MOCK_STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    localStorage.removeItem(MOCK_STORAGE_KEYS.CURRENT_USER);
    
    // Disparar evento para notificar outros componentes sobre logout
    window.dispatchEvent(new CustomEvent("auth-user-changed", { detail: null }));
  }, []);

  return {
    user,
    session: user ? { user } : null, // Compatibilidade com interface anterior
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}
