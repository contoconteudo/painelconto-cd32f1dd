/**
 * Hook para verificar roles e permissões do usuário.
 * 
 * MODO DEMO: Retorna dados simulados sem acessar Supabase.
 */

import { useCallback } from "react";
import { useUserSession, AppRole, ModulePermission } from "./useUserSession";
// import { supabase } from "@/integrations/supabase/client"; // Comentado para DEMO
import { DEMO_MODE, MOCK_ADMIN_USER, MOCK_SPACES } from "@/data/mockData";

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

  // Buscar todos os usuários - MODO DEMO
  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    // MODO DEMO: retorna lista simulada
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
        {
          id: "demo-gestor-001",
          email: "gestor@demo.conto.com.br",
          full_name: "Maria Gestora",
          role: "gestor",
          modules: ["dashboard", "strategy", "crm", "clients", "settings"],
          companies: ["conto"],
        },
        {
          id: "demo-comercial-001",
          email: "comercial@demo.conto.com.br",
          full_name: "João Comercial",
          role: "comercial",
          modules: ["dashboard", "crm", "clients", "settings"],
          companies: ["conto", "amplia"],
        },
      ];
    }

    return [];
  }, []);

  const updateUserPermissions = useCallback(async (
    userId: string, 
    modules: ModulePermission[], 
    companies: CompanyAccess[]
  ) => {
    // MODO DEMO: apenas exibe toast
    if (DEMO_MODE) {
      console.log("DEMO: updateUserPermissions", { userId, modules, companies });
      return;
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, newRole: AppRole) => {
    // MODO DEMO: apenas exibe toast
    if (DEMO_MODE) {
      console.log("DEMO: updateUserRole", { userId, newRole });
      return;
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
