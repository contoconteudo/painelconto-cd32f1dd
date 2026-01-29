/**
 * Hook centralizado para sessão do usuário com cache via React Query.
 * 
 * MODO DEMO: Retorna usuário admin simulado sem acessar Supabase.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useSyncExternalStore } from "react";
// import { supabase } from "@/integrations/supabase/client"; // Comentado para DEMO
import { DEMO_MODE, MOCK_ADMIN_USER, demoStore } from "@/data/mockData";

export type AppRole = "admin" | "gestor" | "comercial" | "analista";
export type ModulePermission = "dashboard" | "crm" | "clients" | "objectives" | "strategy" | "settings" | "admin";

export interface UserSession {
  user: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  role: AppRole | null;
  modules: ModulePermission[];
  spaces: string[];
  isAdmin: boolean;
  permissionsState: "ok" | "timeout" | "error";
}

type NormalizedSpace = {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  created_at?: string;
};

const ALL_MODULES: ModulePermission[] = [
  "dashboard",
  "crm",
  "clients",
  "objectives",
  "strategy",
  "settings",
  "admin",
];

const QUERY_KEY = ["user-session"];
const SPACES_KEY = ["available-spaces"];

// Sessão DEMO simulada
function getDemoSession(): UserSession {
  return {
    user: {
      id: MOCK_ADMIN_USER.id,
      email: MOCK_ADMIN_USER.email,
      fullName: MOCK_ADMIN_USER.full_name,
    },
    role: MOCK_ADMIN_USER.role,
    modules: ALL_MODULES,
    spaces: demoStore.spaces.map(s => s.id),
    isAdmin: true,
    permissionsState: "ok",
  };
}

// Espaços DEMO - lidos do store
function getDemoSpaces(): NormalizedSpace[] {
  return demoStore.spaces.map(s => ({
    id: s.id,
    label: s.label,
    description: s.description,
    color: s.color,
    icon: s.icon,
  }));
}

export function useUserSession() {
  const queryClient = useQueryClient();

  // Usar useSyncExternalStore para reagir a mudanças nos espaços do demoStore
  const demoSpaces = useSyncExternalStore(
    (callback) => demoStore.subscribe(callback),
    () => demoStore.spaces,
    () => demoStore.spaces
  );

  // Query para sessão do usuário - MODO DEMO
  const sessionQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<UserSession> => {
      // MODO DEMO: retorna sessão simulada imediatamente
      if (DEMO_MODE) {
        return getDemoSession();
      }

      // Código real comentado para DEMO
      return getDemoSession();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  // Espaços disponíveis - usando dados do store diretamente
  const availableSpaces: NormalizedSpace[] = DEMO_MODE
    ? demoSpaces.map(s => ({
        id: s.id,
        label: s.label,
        description: s.description,
        color: s.color,
        icon: s.icon,
      }))
    : [];

  const allowedSpaces = sessionQuery.data?.isAdmin
    ? availableSpaces.map((s) => s.id)
    : (sessionQuery.data?.spaces || []);

  // Escutar mudanças de autenticação - DESATIVADO em DEMO
  useEffect(() => {
    if (DEMO_MODE) return;
    
    // Código real comentado para DEMO
  }, [queryClient]);

  // Escutar mudanças de espaços
  useEffect(() => {
    const handleSpacesChange = () => {
      queryClient.invalidateQueries({ queryKey: SPACES_KEY });
    };

    window.addEventListener("spaces-changed", handleSpacesChange);
    return () => window.removeEventListener("spaces-changed", handleSpacesChange);
  }, [queryClient]);

  // Funções auxiliares
  const hasRole = useCallback((checkRole: AppRole): boolean => {
    return sessionQuery.data?.role === checkRole;
  }, [sessionQuery.data?.role]);

  const canAccessModule = useCallback((module: ModulePermission): boolean => {
    if (sessionQuery.data?.isAdmin) return true;
    if (!sessionQuery.data?.role) return false;
    return sessionQuery.data.modules.includes(module);
  }, [sessionQuery.data]);

  const canAccessSpace = useCallback((spaceId: string): boolean => {
    if (sessionQuery.data?.isAdmin) return true;
    if (!sessionQuery.data?.role) return false;
    return allowedSpaces.includes(spaceId);
  }, [sessionQuery.data?.role, sessionQuery.data?.isAdmin, allowedSpaces]);

  // Invalidar cache manualmente
  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const refreshSpaces = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SPACES_KEY });
  }, [queryClient]);

  const isLoading = sessionQuery.isLoading;
  const spacesLoading = false; // No loading in DEMO mode

  return {
    // Dados da sessão
    user: sessionQuery.data?.user || null,
    role: sessionQuery.data?.role || null,
    modules: sessionQuery.data?.modules || [],
    allowedSpaces,
    isAdmin: sessionQuery.data?.isAdmin || false,
    permissionsState: sessionQuery.data?.permissionsState || "ok",
    
    // Estados de loading
    isLoading,
    isAuthenticated: !!sessionQuery.data?.user,
    
    // Espaços disponíveis
    availableSpaces,
    spacesLoading,
    
    // Funções auxiliares
    hasRole,
    canAccessModule,
    canAccessSpace,
    refreshSession,
    refreshSpaces,
  };
}