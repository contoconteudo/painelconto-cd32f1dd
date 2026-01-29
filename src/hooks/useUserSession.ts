/**
 * Hook centralizado para sessão do usuário com cache via React Query.
 * Substitui múltiplas chamadas redundantes ao banco por uma única fonte de verdade.
 * 
 * FAIL-SAFE: Nunca deixa a aplicação travada em loading infinito.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

// Timeout para evitar espera infinita (5 segundos)
const FETCH_TIMEOUT = 5000;

// Carregar dados de permissão do usuário - COM FAIL-SAFE
async function fetchUserSession(userId: string): Promise<Omit<UserSession, "user">> {
  const defaultPermissions: Omit<UserSession, "user"> = {
    role: null,
    modules: [],
    spaces: [],
    isAdmin: false,
  };

  try {
    // Criar promise com timeout
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), FETCH_TIMEOUT)
    );

    // Buscar role
    const rolePromise = supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    // Buscar permissões
    const permPromise = supabase
      .from("user_permissions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Race: dados ou timeout
    const results = await Promise.race([
      Promise.all([rolePromise, permPromise]),
      timeoutPromise.then(() => null),
    ]);

    // Se timeout, retorna default
    if (!results) {
      console.warn("Timeout ao buscar permissões - usando valores padrão");
      return defaultPermissions;
    }

    const [roleResult, permResult] = results;

    // Log para debug
    if (roleResult.error) {
      console.warn("Erro ao buscar role:", roleResult.error.message);
    }
    if (permResult.error) {
      console.warn("Erro ao buscar permissões:", permResult.error.message);
    }

    const role = (roleResult.data?.role as AppRole) || null;
    const isAdmin = role === "admin";

    // Schema padronizado: usar apenas 'modules' e 'spaces'
    const rawModules = (permResult.data as any)?.modules ?? [];
    const rawSpaces = (permResult.data as any)?.spaces ?? [];
    
    // Se admin, tem acesso total
    if (isAdmin) {
      return {
        role,
        modules: ALL_MODULES,
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
  } catch (error) {
    console.error("Erro crítico ao buscar permissões:", error);
    return defaultPermissions;
  }
}

// Carregar espaços disponíveis - COM FAIL-SAFE
async function fetchAvailableSpaces(): Promise<NormalizedSpace[]> {
  try {
    // Timeout promise
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), FETCH_TIMEOUT)
    );

    const fetchPromise = supabase
      .from("spaces")
      .select("*")
      .order("created_at", { ascending: true });

    const result = await Promise.race([fetchPromise, timeoutPromise]);

    // Se timeout, retorna array vazio
    if (!result) {
      console.warn("Timeout ao carregar espaços");
      return [];
    }

    if (result.error) {
      console.warn("Erro ao carregar espaços:", result.error.message);
      return [];
    }

    const rows = (result.data || []) as Array<Record<string, any>>;
    const normalized: NormalizedSpace[] = rows
      .filter((row) => !!row?.id)
      .map((row) => ({
        id: String(row.id),
        label: String(row.label ?? row.name ?? row.title ?? row.id),
        description: String(row.description ?? ""),
        color: String(row.color ?? "bg-primary"),
        icon: String(row.icon ?? "LayoutDashboard"),
        created_at: row.created_at ? String(row.created_at) : undefined,
      }));

    return normalized;
  } catch (error) {
    console.error("Erro crítico ao carregar espaços:", error);
    return [];
  }
}

export function useUserSession() {
  const queryClient = useQueryClient();

  // Query para sessão do usuário - NUNCA trava
  const sessionQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<UserSession> => {
      try {
        // getSession() é local e muito rápido
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        
        if (!user) {
          return {
            user: null,
            role: null,
            modules: [],
            spaces: [],
            isAdmin: false,
          };
        }

        // Buscar permissões com fail-safe
        const permissions = await fetchUserSession(user.id);
        
        return {
          user: {
            id: user.id,
            email: user.email || "",
            fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          },
          ...permissions,
        };
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
        // Retorna sessão vazia para evitar loading infinito
        return {
          user: null,
          role: null,
          modules: [],
          spaces: [],
          isAdmin: false,
        };
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0, // Sem retry para evitar loading infinito
  });

  // Query para espaços disponíveis - NUNCA trava
  const spacesQuery = useQuery({
    queryKey: SPACES_KEY,
    queryFn: fetchAvailableSpaces,
    enabled: sessionQuery.isSuccess && !!sessionQuery.data?.user,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
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
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: SPACES_KEY });
          
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
    // Se é admin, tem acesso total
    if (sessionQuery.data?.isAdmin) return true;
    // Se não tem role, não tem acesso
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

  // IMPORTANTE: isLoading só é true durante o fetch inicial
  const isLoading = sessionQuery.isLoading;
  const spacesLoading = spacesQuery.isLoading && sessionQuery.isSuccess && !!sessionQuery.data?.user;

  return {
    // Dados da sessão
    user: sessionQuery.data?.user || null,
    role: sessionQuery.data?.role || null,
    modules: sessionQuery.data?.modules || [],
    allowedSpaces,
    isAdmin: sessionQuery.data?.isAdmin || false,
    
    // Estados de loading - NUNCA ficam true indefinidamente
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
