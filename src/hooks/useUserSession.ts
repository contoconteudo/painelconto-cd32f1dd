/**
 * Hook centralizado para sessão do usuário com cache via React Query.
 * Substitui múltiplas chamadas redundantes ao banco por uma única fonte de verdade.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

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
}

type NormalizedSpace = {
  id: string;
  label: string;
  description: string;
  color: string;
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

// Carregar dados de permissão do usuário em uma única query otimizada
async function fetchUserSession(userId: string): Promise<Omit<UserSession, "user">> {
  // Buscar role e permissões em paralelo
  const [roleResult, permResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_permissions")
      // Select * para tolerar drift de schema (ex.: modules/spaces vs allowed_modules/allowed_spaces)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const role = (roleResult.data?.role as AppRole) || null;
  const isAdmin = role === "admin";

  const rawModules = (permResult.data as any)?.allowed_modules ?? (permResult.data as any)?.modules ?? [];
  const rawSpaces = (permResult.data as any)?.allowed_spaces ?? (permResult.data as any)?.spaces ?? [];
  
  // Se admin, tem acesso total
  if (isAdmin) {
    return {
      role,
      modules: ALL_MODULES,
      // spaces será resolvido a partir de availableSpaces (query separada)
      spaces: [],
      isAdmin: true,
    };
  }

  return {
    role,
    modules: (rawModules || []) as ModulePermission[],
    spaces: (rawSpaces || []) as string[],
    isAdmin: false,
  };
}

// Carregar espaços disponíveis
async function fetchAvailableSpaces() {
  // Select * para evitar quebrar o app quando o schema real diverge (ex.: label vs name)
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao carregar espaços:", error);
    return [];
  }

  const rows = (data || []) as Array<Record<string, any>>;
  const normalized: NormalizedSpace[] = rows
    .filter((row) => !!row?.id)
    .map((row) => ({
      id: String(row.id),
      label: String(row.label ?? row.name ?? row.title ?? row.id),
      description: String(row.description ?? ""),
      color: String(row.color ?? "bg-primary"),
      created_at: row.created_at ? String(row.created_at) : undefined,
    }));

  return normalized;
}

export function useUserSession() {
  const queryClient = useQueryClient();

  // Query para sessão do usuário - com cache de 5 minutos
  const sessionQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<UserSession> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          user: null,
          role: null,
          modules: [],
          spaces: [],
          isAdmin: false,
        };
      }

      const permissions = await fetchUserSession(user.id);
      
      return {
        user: {
          id: user.id,
          email: user.email || "",
          fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        },
        ...permissions,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Query para espaços disponíveis - com cache de 10 minutos
  const spacesQuery = useQuery({
    queryKey: SPACES_KEY,
    queryFn: fetchAvailableSpaces,
    // Não buscar espaços enquanto não estiver autenticado (evita chamadas no /login)
    enabled: sessionQuery.isSuccess && !!sessionQuery.data?.user,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    // Falha de spaces não pode travar o app por 30s via backoff/retry
    retry: 0,
  });

  const availableSpaces = spacesQuery.data || [];
  const allowedSpaces = sessionQuery.data?.isAdmin
    ? availableSpaces.map((s) => s.id)
    : (sessionQuery.data?.spaces || []);

  // Escutar mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          // Invalidar cache para forçar reload
          await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          
          // Disparar evento para componentes legacy
          const mappedUser = session?.user ? {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
          } : null;
          window.dispatchEvent(new CustomEvent("auth-user-changed", { detail: mappedUser }));
        }
      }
    );

    return () => subscription.unsubscribe();
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
    if (!sessionQuery.data?.role) return false;
    if (sessionQuery.data.isAdmin) return true;
    return sessionQuery.data.modules.includes(module);
  }, [sessionQuery.data]);

  const canAccessSpace = useCallback((spaceId: string): boolean => {
    if (!sessionQuery.data?.role) return false;
    if (sessionQuery.data.isAdmin) return true;
    return allowedSpaces.includes(spaceId);
  }, [sessionQuery.data?.role, sessionQuery.data?.isAdmin, allowedSpaces]);

  // Invalidar cache manualmente
  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const refreshSpaces = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SPACES_KEY });
  }, [queryClient]);

  return {
    // Dados da sessão
    user: sessionQuery.data?.user || null,
    role: sessionQuery.data?.role || null,
    modules: sessionQuery.data?.modules || [],
    allowedSpaces,
    isAdmin: sessionQuery.data?.isAdmin || false,
    
    // Estados de loading
    isLoading: sessionQuery.isLoading,
    isAuthenticated: !!sessionQuery.data?.user,
    
    // Espaços disponíveis
    availableSpaces,
    spacesLoading: spacesQuery.isLoading,
    
    // Funções auxiliares
    hasRole,
    canAccessModule,
    canAccessSpace,
    refreshSession,
    refreshSpaces,
  };
}
