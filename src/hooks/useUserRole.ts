/**
 * Hook para verificar roles e permissões do usuário.
 * Usa useUserSession como fonte de dados.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSession, AppRole, ModulePermission } from "./useUserSession";
import { DEMO_MODE, MOCK_ADMIN_USER } from "@/data/mockData";

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
    if (DEMO_MODE) {
      return [
        {
          id: MOCK_ADMIN_USER.id,
          email: MOCK_ADMIN_USER.email,
          full_name: MOCK_ADMIN_USER.full_name,
          role: MOCK_ADMIN_USER.role,
          modules: MOCK_ADMIN_USER.modules,
          companies: MOCK_ADMIN_USER.companies,
        },
      ];
    }

    try {
      // Buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      if (profilesError) throw profilesError;

      // Buscar roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // Buscar permissões
      const { data: permissions } = await supabase
        .from("user_permissions")
        .select("user_id, modules, spaces");

      // Combinar dados
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
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  }, []);

  const updateUserPermissions = useCallback(async (
    userId: string, 
    modules: ModulePermission[], 
    companies: CompanyAccess[]
  ) => {
    if (DEMO_MODE) {
      console.log("DEMO: updateUserPermissions", { userId, modules, companies });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_permissions")
        .upsert({
          user_id: userId,
          modules,
          spaces: companies,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao atualizar permissões:", error);
      throw error;
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, newRole: AppRole) => {
    if (DEMO_MODE) {
      console.log("DEMO: updateUserRole", { userId, newRole });
      return;
    }

    try {
      // Deletar role existente e inserir nova
      await supabase.from("user_roles").delete().eq("user_id", userId);
      
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      throw error;
    }
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
