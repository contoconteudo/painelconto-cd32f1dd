/**
 * Auth Service - Supabase Authentication
 * 
 * Serviço centralizado para autenticação com Supabase.
 * Inclui login, signup, logout, reset de senha e listeners.
 */

import { supabase } from '@/lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthUser | null;
  error: string | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const mapSupabaseUser = (user: User | null): AuthUser | null => {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.user_metadata?.full_name,
    avatarUrl: user.user_metadata?.avatar_url,
  };
};

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Registra um novo usuário
 */
export const signUp = async (data: SignUpData): Promise<AuthResult> => {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: mapSupabaseUser(authData.user), error: null };
  } catch (err) {
    console.error('SignUp error:', err);
    return { user: null, error: 'Erro ao criar conta. Tente novamente.' };
  }
};

/**
 * Faz login com email e senha
 */
export const signIn = async (data: SignInData): Promise<AuthResult> => {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Traduzir mensagens de erro comuns
      let message = error.message;
      if (error.message.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos.';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Por favor, confirme seu email antes de fazer login.';
      }
      return { user: null, error: message };
    }

    return { user: mapSupabaseUser(authData.user), error: null };
  } catch (err) {
    console.error('SignIn error:', err);
    return { user: null, error: 'Erro ao fazer login. Tente novamente.' };
  }
};

/**
 * Faz logout do usuário atual
 */
export const signOut = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    console.error('SignOut error:', err);
    return { error: 'Erro ao fazer logout.' };
  }
};

/**
 * Obtém o usuário atual
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return mapSupabaseUser(user);
  } catch (err) {
    console.error('GetCurrentUser error:', err);
    return null;
  }
};

/**
 * Obtém a sessão atual
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    console.error('GetSession error:', err);
    return null;
  }
};

/**
 * Envia email para reset de senha
 */
export const resetPassword = async (email: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    console.error('ResetPassword error:', err);
    return { error: 'Erro ao enviar email de recuperação.' };
  }
};

/**
 * Atualiza a senha do usuário
 */
export const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    console.error('UpdatePassword error:', err);
    return { error: 'Erro ao atualizar senha.' };
  }
};

/**
 * Listener para mudanças no estado de autenticação
 */
export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
};

/**
 * Atualiza dados do perfil do usuário
 */
export const updateProfile = async (data: {
  name?: string;
  avatarUrl?: string;
}): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        name: data.name,
        avatar_url: data.avatarUrl,
      },
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    console.error('UpdateProfile error:', err);
    return { error: 'Erro ao atualizar perfil.' };
  }
};
