import { useState, useEffect, useCallback } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Converte User do Supabase para AuthUser
  const mapUser = useCallback((supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "",
    };
  }, []);

  // Inicialização: verificar sessão existente
  useEffect(() => {
    // Listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const mappedUser = mapUser(session?.user ?? null);
        setUser(mappedUser);
        setIsLoading(false);
        
        // Disparar evento para outros componentes
        window.dispatchEvent(new CustomEvent("auth-user-changed", { detail: mappedUser }));
      }
    );

    // Depois verificar sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      const mappedUser = mapUser(session?.user ?? null);
      setUser(mappedUser);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [mapUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Email ou senha incorretos");
      }
      throw new Error(error.message);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split("@")[0],
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new Error("Este e-mail já está cadastrado no sistema");
      }
      throw new Error(error.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.dispatchEvent(new CustomEvent("auth-user-changed", { detail: null }));
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  return {
    user,
    session: user ? { user } : null,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  };
}
