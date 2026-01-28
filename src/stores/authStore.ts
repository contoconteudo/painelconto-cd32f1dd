/**
 * Auth Store - Zustand
 * 
 * Estado global de autenticação usando Zustand.
 * Gerencia usuário, sessão e estado de loading.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/services/auth.service';
import * as authService from '@/services/auth.service';

// ============================================
// TYPES
// ============================================

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
}

type AuthStore = AuthState & AuthActions;

// ============================================
// STORE
// ============================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      initialized: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { user, error } = await authService.signIn({ email, password });

          if (error) {
            set({ isLoading: false, error });
            return false;
          }

          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: 'Erro ao fazer login. Tente novamente.',
          });
          return false;
        }
      },

      signup: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });

        try {
          const { user, error } = await authService.signUp({ email, password, name });

          if (error) {
            set({ isLoading: false, error });
            return false;
          }

          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: 'Erro ao criar conta. Tente novamente.',
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await authService.signOut();
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        if (get().initialized) return;

        set({ isLoading: true });

        try {
          const user = await authService.getCurrentUser();

          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            initialized: true,
          });
        } catch (err) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            initialized: true,
          });
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          const { error } = await authService.resetPassword(email);

          if (error) {
            set({ isLoading: false, error });
            return false;
          }

          set({ isLoading: false });
          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: 'Erro ao enviar email de recuperação.',
          });
          return false;
        }
      },

      updatePassword: async (newPassword: string) => {
        set({ isLoading: true, error: null });

        try {
          const { error } = await authService.updatePassword(newPassword);

          if (error) {
            set({ isLoading: false, error });
            return false;
          }

          set({ isLoading: false });
          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: 'Erro ao atualizar senha.',
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user data, not loading states
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectError = (state: AuthStore) => state.error;

// ============================================
// HOOKS HELPERS
// ============================================

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
