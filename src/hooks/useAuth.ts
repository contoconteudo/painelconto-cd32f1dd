/**
 * Hook simplificado para autenticação.
 * 
 * MODO DEMO: Usa useUserSession que já retorna usuário simulado.
 */

import { useCallback } from "react";
// import { supabase } from "@/integrations/supabase/client"; // Comentado para DEMO
import { useUserSession } from "./useUserSession";
import { toast } from "sonner";
import { DEMO_MODE } from "@/data/mockData";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export function useAuth() {
  const session = useUserSession();

  const user: AuthUser | null = session.user ? {
    id: session.user.id,
    email: session.user.email,
    full_name: session.user.fullName,
  } : null;

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    // MODO DEMO: simula login bem-sucedido
    if (DEMO_MODE) {
      toast.success("Login simulado! (DEMO)");
      window.location.replace("/");
      return;
    }

    // Código real comentado para DEMO
    /*
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
    */
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<void> => {
    // MODO DEMO: simula cadastro
    if (DEMO_MODE) {
      toast.success("Cadastro simulado! (DEMO)");
      return;
    }

    // Código real comentado para DEMO
    /*
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
    */
  }, []);

  const signOut = useCallback(async () => {
    // MODO DEMO: simula logout
    if (DEMO_MODE) {
      toast.success("Logout simulado! (DEMO)");
      window.location.replace("/login");
      return;
    }

    // Código real comentado para DEMO
    // await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    // MODO DEMO: simula reset
    if (DEMO_MODE) {
      toast.success("Email de recuperação enviado! (DEMO)");
      return;
    }

    // Código real comentado para DEMO
    /*
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
    */
  }, []);

  return {
    user,
    session: user ? { user } : null,
    isLoading: session.isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: session.isAuthenticated,
  };
}
