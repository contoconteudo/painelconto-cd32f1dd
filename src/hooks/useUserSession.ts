/**
 * Hook centralizado para sessão do usuário.
 * Gerencia autenticação, roles, permissões e espaços via Supabase.
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

// Buscar sessão do Supabase
async function fetchSession(): Promise<UserSession> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return {
      user: null,
      role: null,
      modules: [],
      spaces: [],
      isAdmin: false,
      permissionsState: "ok",
    };
  }

  const userId = session.user.id;

  // Buscar profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();

  // Buscar role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  // Buscar permissões
  const { data: permissions } = await supabase
    .from("user_permissions")
    .select("modules, spaces")
    .eq("user_id", userId)
    .maybeSingle();

  const role = roleData?.role as AppRole | null;
  const isAdmin = role === "admin";

  return {
    user: {
      id: userId,
      email: profile?.email || session.user.email || "",
      fullName: profile?.full_name || session.user.email?.split("@")[0] || "",
    },
    role,
    modules: isAdmin ? ALL_MODULES : (permissions?.modules as ModulePermission[] || []),
    spaces: permissions?.spaces || [],
    isAdmin,
    permissionsState: "ok",
  };
}

export function useUserSession() {
  const queryClient = useQueryClient();

  // Query para sessão do usuário
  const sessionQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Query para espaços disponíveis
  const spacesQuery = useQuery({
    queryKey: SPACES_KEY,
    queryFn: async (): Promise<NormalizedSpace[]> => {
      const { data, error } = await supabase
        .from("spaces")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(s => ({
        id: s.id,
        label: s.label,
        description: s.description || "",
        color: s.color || "bg-primary",
        icon: s.icon || "Building",
        created_at: s.created_at,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const availableSpaces: NormalizedSpace[] = spacesQuery.data || [];

  const allowedSpaces = sessionQuery.data?.isAdmin
    ? availableSpaces.map((s) => s.id)
    : (sessionQuery.data?.spaces || []);

  // Escutar mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    });

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

  return {
    user: sessionQuery.data?.user || null,
    role: sessionQuery.data?.role || null,
    modules: sessionQuery.data?.modules || [],
    allowedSpaces,
    isAdmin: sessionQuery.data?.isAdmin || false,
    permissionsState: sessionQuery.data?.permissionsState || "ok",
    isLoading: sessionQuery.isLoading,
    isAuthenticated: !!sessionQuery.data?.user,
    availableSpaces,
    spacesLoading: spacesQuery.isLoading,
    hasRole,
    canAccessModule,
    canAccessSpace,
    refreshSession,
    refreshSpaces,
  };
}
