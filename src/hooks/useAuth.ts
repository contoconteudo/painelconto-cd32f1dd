import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Converter User do Supabase para AuthUser
  const mapUser = (supaUser: User | null): AuthUser | null => {
    if (!supaUser) return null;
    return {
      id: supaUser.id,
      email: supaUser.email || "",
      full_name: supaUser.user_metadata?.name || 
                 supaUser.user_metadata?.full_name || 
                 supaUser.email?.split("@")[0] || "",
    };
  };

  // Listener de mudança de autenticação
  useEffect(() => {
    // Configurar listener ANTES de verificar sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(mapUser(newSession?.user || null));
        setIsLoading(false);

        // Disparar evento para outros componentes
        window.dispatchEvent(
          new CustomEvent("auth-user-changed", { 
            detail: mapUser(newSession?.user || null) 
          })
        );
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(mapUser(currentSession?.user || null));
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const signUp = useCallback(async (email: string, password: string, name?: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
          full_name: name || email.split("@")[0],
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
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
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  };
}
