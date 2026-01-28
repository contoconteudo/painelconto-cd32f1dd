import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/lib/supabase";

export type AppRole = "admin" | "gestor" | "comercial" | "analista" | "user";
export type ModulePermission = "dashboard" | "crm" | "clientes" | "estrategia" | "admin" | "strategy" | "clients" | "settings" | "objectives";
export type CompanyAccess = string;

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
}

// Módulos padrão por role
const ROLE_MODULES: Record<AppRole, ModulePermission[]> = {
  admin: ["dashboard", "crm", "clientes", "estrategia", "admin", "strategy", "clients", "settings", "objectives"],
  gestor: ["dashboard", "crm", "clientes", "estrategia", "strategy", "clients", "objectives"],
  comercial: ["dashboard", "crm", "clients"],
  analista: ["dashboard", "estrategia", "strategy", "objectives"],
  user: ["dashboard"],
};

export function useUserRole(): UseUserRoleReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [userSpaces, setUserSpaces] = useState<string[]>([]);
  const [userModules, setUserModules] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar role do banco de dados
  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      setRole(null);
      setUserSpaces([]);
      setUserModules([]);
      setIsLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        // Buscar role do Supabase
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!roleError && roleData) {
          const fetchedRole = (roleData as any).role as AppRole;
          setRole(fetchedRole);
          setUserModules(ROLE_MODULES[fetchedRole] || []);
        } else {
          // Usuário sem role definida - usar role padrão
          setRole("user");
          setUserModules(ROLE_MODULES.user);
        }

        // Buscar espaços do usuário do Supabase
        const { data: spacesData } = await supabase
          .from("spaces")
          .select("id")
          .eq("user_id", user.id);

        if (spacesData && spacesData.length > 0) {
          setUserSpaces(spacesData.map((s: { id: string }) => s.id));
        } else {
          setUserSpaces([]);
        }
      } catch (err) {
        console.error("Erro ao carregar permissões:", err);
        setRole("user");
        setUserModules(ROLE_MODULES.user);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id, authLoading]);

  // Escutar evento de mudança de auth
  useEffect(() => {
    const handleAuthChange = async (event: CustomEvent) => {
      const newUser = event.detail;
      if (!newUser?.id) {
        setRole(null);
        setUserSpaces([]);
        setUserModules([]);
        setIsLoading(false);
        return;
      }

      // Recarregar permissões do banco
      try {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", newUser.id)
          .maybeSingle();

        if (roleData) {
          const fetchedRole = (roleData as any).role as AppRole;
          setRole(fetchedRole);
          setUserModules(ROLE_MODULES[fetchedRole] || []);
        } else {
          setRole("user");
          setUserModules(ROLE_MODULES.user);
        }
      } catch {
        setRole("user");
        setUserModules(ROLE_MODULES.user);
      }
      setIsLoading(false);
    };

    window.addEventListener("auth-user-changed", handleAuthChange as EventListener);
    return () => window.removeEventListener("auth-user-changed", handleAuthChange as EventListener);
  }, []);

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
    return userSpaces.includes(company);
  }, [role, userSpaces]);

  const getUserModules = useCallback((): ModulePermission[] => {
    return userModules;
  }, [userModules]);

  const getUserCompanies = useCallback((): CompanyAccess[] => {
    return userSpaces;
  }, [userSpaces]);

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
  };
}
