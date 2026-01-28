import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/lib/supabase";
import { MOCK_USERS, MockUser, USER_PERMISSIONS_KEY } from "@/data/mockData";

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
  getAllUsers: () => MockUser[];
  updateUserPermissions: (userId: string, modules: ModulePermission[], companies: CompanyAccess[]) => void;
  updateUserRole: (userId: string, role: AppRole) => void;
}

// Módulos padrão por role
const ROLE_MODULES: Record<AppRole, ModulePermission[]> = {
  admin: ["dashboard", "crm", "clientes", "estrategia", "admin", "strategy", "clients", "settings", "objectives"],
  gestor: ["dashboard", "crm", "clientes", "estrategia", "strategy", "clients", "objectives"],
  comercial: ["dashboard", "crm", "clients"],
  analista: ["dashboard", "estrategia", "strategy", "objectives"],
  user: ["dashboard"],
};

// Helper para obter permissões salvas do localStorage
const getSavedPermissions = (): Record<string, { modules: ModulePermission[]; companies: CompanyAccess[] }> => {
  try {
    const saved = localStorage.getItem(USER_PERMISSIONS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Helper para salvar permissões no localStorage
const savePermissions = (permissions: Record<string, { modules: ModulePermission[]; companies: CompanyAccess[] }>) => {
  localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(permissions));
};

export function useUserRole(): UseUserRoleReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [userSpaces, setUserSpaces] = useState<string[]>([]);
  const [userModules, setUserModules] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar role do banco de dados ou mock
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
        // Tentar buscar role do Supabase
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
          // Fallback para mock
          const mockUser = MOCK_USERS.find((u) => u.id === user.id);
          if (mockUser) {
            setRole(mockUser.role as AppRole);
            const savedPermissions = getSavedPermissions();
            const userPerms = savedPermissions[user.id];
            setUserModules((userPerms?.modules as ModulePermission[]) || (mockUser.modules as ModulePermission[]) || []);
            setUserSpaces(userPerms?.companies || mockUser.companies || []);
          } else {
            setRole("user");
            setUserModules(ROLE_MODULES.user);
          }
        }

        // Buscar espaços do usuário do Supabase
        const { data: spacesData } = await supabase
          .from("spaces")
          .select("id")
          .eq("user_id", user.id);

        if (spacesData && spacesData.length > 0) {
          setUserSpaces(spacesData.map((s: { id: string }) => s.id));
        } else {
          // Fallback - usar mock ou default
          const mockUser = MOCK_USERS.find((u) => u.id === user.id);
          if (mockUser) {
            const savedPermissions = getSavedPermissions();
            const userPerms = savedPermissions[user.id];
            setUserSpaces(userPerms?.companies || mockUser.companies || []);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar permissões:", err);
        // Fallback para mock
        const mockUser = MOCK_USERS.find((u) => u.id === user.id);
        if (mockUser) {
          setRole(mockUser.role as AppRole);
          setUserModules(mockUser.modules as ModulePermission[]);
          setUserSpaces(mockUser.companies);
        } else {
          setRole("user");
          setUserModules(ROLE_MODULES.user);
        }
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

      // Recarregar permissões
      const mockUser = MOCK_USERS.find((u) => u.id === newUser.id);
      if (mockUser) {
        setRole(mockUser.role as AppRole);
        const savedPermissions = getSavedPermissions();
        const userPerms = savedPermissions[newUser.id];
        setUserModules((userPerms?.modules as ModulePermission[]) || (mockUser.modules as ModulePermission[]) || []);
        setUserSpaces(userPerms?.companies || mockUser.companies || []);
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

  // Funções para administração de usuários (compatibilidade com AdminDashboard)
  const getAllUsers = useCallback((): MockUser[] => {
    const savedPermissions = getSavedPermissions();
    
    return MOCK_USERS.map((u) => {
      if (u.role === "admin") {
        return u;
      }
      
      const savedPerms = savedPermissions[u.id];
      return {
        ...u,
        modules: (savedPerms?.modules as typeof u.modules) ?? u.modules,
        companies: savedPerms?.companies ?? u.companies,
      };
    });
  }, []);

  const updateUserPermissions = useCallback((userId: string, modules: ModulePermission[], companies: CompanyAccess[]) => {
    const savedPermissions = getSavedPermissions();
    savedPermissions[userId] = { modules, companies };
    savePermissions(savedPermissions);
    
    // Se for o usuário atual, atualizar estado
    if (user?.id === userId && role !== "admin") {
      setUserModules(modules);
      setUserSpaces(companies);
    }
  }, [user?.id, role]);

  const updateUserRole = useCallback((_userId: string, _newRole: AppRole) => {
    // Função mantida para compatibilidade
  }, []);

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
