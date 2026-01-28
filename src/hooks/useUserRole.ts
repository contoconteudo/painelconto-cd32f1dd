import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "gestor" | "comercial" | "analista";
export type ModulePermission = "dashboard" | "crm" | "clients" | "objectives" | "strategy" | "settings" | "admin";
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
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [userModules, setUserModules] = useState<ModulePermission[]>([]);
  const [userCompanies, setUserCompanies] = useState<CompanyAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar role e permissões do banco
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Buscar role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        console.error("Erro ao buscar role:", roleError);
        setRole(null);
      } else {
        setRole(roleData?.role as AppRole | null);
      }

      // Se for admin, tem acesso total
      if (roleData?.role === "admin") {
        // Buscar todos os espaços disponíveis
        const { data: spacesData } = await supabase
          .from("spaces")
          .select("id");
        
        const allModules: ModulePermission[] = ["dashboard", "strategy", "crm", "clients", "settings", "admin"];
        setUserModules(allModules);
        setUserCompanies(spacesData?.map(s => s.id) || []);
      } else {
        // Buscar permissões específicas
        const { data: permData } = await supabase
          .from("user_permissions")
          .select("modules, spaces")
          .eq("user_id", userId)
          .maybeSingle();

        if (permData) {
          setUserModules((permData.modules || []) as ModulePermission[]);
          setUserCompanies(permData.spaces || []);
        } else {
          setUserModules([]);
          setUserCompanies([]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar permissões quando user mudar
  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      setRole(null);
      setUserModules([]);
      setUserCompanies([]);
      setIsLoading(false);
      return;
    }

    loadUserData(user.id);
  }, [user?.id, authLoading, loadUserData]);

  // Escutar evento de mudança de auth
  useEffect(() => {
    const handleAuthChange = async (event: CustomEvent) => {
      const newUser = event.detail;
      if (newUser?.id) {
        await loadUserData(newUser.id);
      } else {
        setRole(null);
        setUserModules([]);
        setUserCompanies([]);
        setIsLoading(false);
      }
    };

    window.addEventListener("auth-user-changed", handleAuthChange as EventListener);
    return () => window.removeEventListener("auth-user-changed", handleAuthChange as EventListener);
  }, [loadUserData]);

  const hasRole = useCallback((checkRole: AppRole): boolean => {
    return role === checkRole;
  }, [role]);

  const canAccessModule = useCallback((module: ModulePermission): boolean => {
    if (!role) return false;
    if (role === "admin") return true;
    return userModules.includes(module);
  }, [role, userModules]);

  const canAccessCompany = useCallback((company: CompanyAccess): boolean => {
    if (!role) return false;
    if (role === "admin") return true;
    return userCompanies.includes(company);
  }, [role, userCompanies]);

  const getUserModules = useCallback((): ModulePermission[] => {
    return userModules;
  }, [userModules]);

  const getUserCompanies = useCallback((): CompanyAccess[] => {
    return userCompanies;
  }, [userCompanies]);

  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name
      `);

    if (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }

    // Buscar roles e permissões para cada usuário
    const usersWithRoles = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id)
          .maybeSingle();

        const { data: permData } = await supabase
          .from("user_permissions")
          .select("modules, spaces")
          .eq("user_id", profile.id)
          .maybeSingle();

        return {
          ...profile,
          role: (roleData?.role as AppRole) || null,
          modules: (permData?.modules || []) as ModulePermission[],
          companies: permData?.spaces || [],
        };
      })
    );

    return usersWithRoles;
  }, []);

  const updateUserPermissions = useCallback(async (
    userId: string, 
    modules: ModulePermission[], 
    companies: CompanyAccess[]
  ) => {
    // Verificar se já existe registro
    const { data: existing } = await supabase
      .from("user_permissions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Atualizar
      await supabase
        .from("user_permissions")
        .update({ modules, spaces: companies, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    } else {
      // Inserir
      await supabase
        .from("user_permissions")
        .insert({ user_id: userId, modules, spaces: companies });
    }

    // Se for o usuário atual, atualizar estado
    if (user?.id === userId && role !== "admin") {
      setUserModules(modules);
      setUserCompanies(companies);
    }
  }, [user?.id, role]);

  const updateUserRole = useCallback(async (userId: string, newRole: AppRole) => {
    // Verificar se já existe registro
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Atualizar
      await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
    } else {
      // Inserir
      await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
    }

    // Se for o usuário atual, recarregar dados
    if (user?.id === userId) {
      await loadUserData(userId);
    }
  }, [user?.id, loadUserData]);

  return {
    role,
    isLoading: isLoading || authLoading,
    isAdmin: role === "admin",
    isGestor: role === "gestor",
    isComercial: role === "comercial",
    isAnalista: role === "analista",
    hasRole,
    canAccessModule,
    canAccessCompany,
    getUserModules,
    getUserCompanies,
    getAllUsers,
    updateUserPermissions,
    updateUserRole,
  };
}
