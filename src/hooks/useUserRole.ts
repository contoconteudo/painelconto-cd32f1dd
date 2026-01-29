/**
 * Hook para verificar roles e permissões do usuário.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSession, AppRole, ModulePermission } from "./useUserSession";

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

  // Buscar todos os usuários
  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      if (profilesError) throw profilesError;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const { data: permissions } = await supabase
        .from("user_permissions")
        .select("user_id, modules, spaces");

      return (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const userPerms = permissions?.find(p => p.user_id === profile.id);
        
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: userRole?.role as AppRole | null,
          modules: (userPerms?.modules as ModulePermission[]) || [],
          companies: userPerms?.spaces || [],
        };
      });
    } catch {
      return [];
    }
  }, []);

  const updateUserPermissions = useCallback(async (
    userId: string, 
    modules: ModulePermission[], 
    companies: CompanyAccess[]
  ) => {
    const { error } = await supabase
      .from("user_permissions")
      .upsert({
        user_id: userId,
        modules,
        spaces: companies,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) throw error;
  }, []);

  const updateUserRole = useCallback(async (userId: string, newRole: AppRole) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (error) throw error;
  }, []);

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
