/**
 * Hook para verificar roles e permissões do usuário.
 * Wrapper sobre useUserSession para compatibilidade com código existente.
 */

import { useCallback } from "react";
import { useUserSession, AppRole, ModulePermission } from "./useUserSession";
import { supabase } from "@/integrations/supabase/client";

export type { AppRole, ModulePermission };
export type CompanyAccess = string;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole | null;
  modules: ModulePermission[];
  companies: CompanyAccess[];
}

interface UseUserRoleReturn {
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isComercial: boolean;
  isAnalista: boolean;
  hasRole: (role: AppRole) => boolean;
  canAccessModule: (module: ModulePermission) => boolean;
  canAccessCompany: (company: CompanyAccess) => boolean;
  getUserModules: () => ModulePermission[];
  getUserCompanies: () => CompanyAccess[];
  getAllUsers: () => Promise<UserProfile[]>;
  updateUserPermissions: (userId: string, modules: ModulePermission[], companies: CompanyAccess[]) => Promise<void>;
  updateUserRole: (userId: string, role: AppRole) => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const session = useUserSession();

  const canAccessCompany = useCallback((company: CompanyAccess): boolean => {
    return session.canAccessSpace(company);
  }, [session]);

  const getUserModules = useCallback((): ModulePermission[] => {
    return session.modules;
  }, [session.modules]);

  const getUserCompanies = useCallback((): CompanyAccess[] => {
    return session.allowedSpaces;
  }, [session.allowedSpaces]);

  // Buscar todos os usuários (para admin)
  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name");

    if (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }

    const profileList = profiles || [];
    if (profileList.length === 0) return [];

    const userIds = profileList.map((p) => p.id);

    // Evita padrão N+1: 3 queries no total (profiles + roles + permissions)
    const [rolesRes, permsRes] = await Promise.all([
      supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds),
      supabase
        // Select * para tolerar drift de schema (modules/spaces vs allowed_modules/allowed_spaces)
        .from("user_permissions")
        .select("*")
        .in("user_id", userIds),
    ]);

    if (rolesRes.error) console.error("Erro ao buscar roles:", rolesRes.error);
    if (permsRes.error) console.error("Erro ao buscar permissões:", permsRes.error);

    const roleByUser = new Map<string, AppRole>();
    (rolesRes.data || []).forEach((r: any) => {
      if (!roleByUser.has(r.user_id)) {
        roleByUser.set(r.user_id, r.role as AppRole);
      }
    });

    const permByUser = new Map<string, any>();
    (permsRes.data || []).forEach((p: any) => {
      permByUser.set(p.user_id, p);
    });

    return profileList.map((profile) => {
      const perm = permByUser.get(profile.id);
      const modules = (perm?.allowed_modules ?? perm?.modules ?? []) as ModulePermission[];
      const companies = (perm?.allowed_spaces ?? perm?.spaces ?? []) as CompanyAccess[];

      return {
        ...profile,
        role: roleByUser.get(profile.id) || null,
        modules,
        companies,
      };
    });
  }, []);

  const updateUserPermissions = useCallback(async (
    userId: string, 
    modules: ModulePermission[], 
    companies: CompanyAccess[]
  ) => {
    const { data: existing } = await supabase
      .from("user_permissions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_permissions")
        .update({ allowed_modules: modules, allowed_spaces: companies, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("user_permissions")
        .insert({ user_id: userId, allowed_modules: modules, allowed_spaces: companies });
    }

    // Se for o usuário atual, invalidar cache
    if (session.user?.id === userId) {
      await session.refreshSession();
    }
  }, [session]);

  const updateUserRole = useCallback(async (userId: string, newRole: AppRole) => {
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
    }

    // Se for o usuário atual, invalidar cache
    if (session.user?.id === userId) {
      await session.refreshSession();
    }
  }, [session]);

  return {
    role: session.role,
    isLoading: session.isLoading,
    isAdmin: session.isAdmin,
    isGestor: session.role === "gestor",
    isComercial: session.role === "comercial",
    isAnalista: session.role === "analista",
    hasRole: session.hasRole,
    canAccessModule: session.canAccessModule,
    canAccessCompany,
    getUserModules,
    getUserCompanies,
    getAllUsers,
    updateUserPermissions,
    updateUserRole,
  };
}
