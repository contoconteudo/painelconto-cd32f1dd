import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { MOCK_USERS, USER_PERMISSIONS_KEY, AppRole, ModulePermission, CompanyAccess, MockUser } from "@/data/mockData";

// Re-exportando tipos para uso externo
export type { AppRole, ModulePermission, CompanyAccess };

interface UserPermissions {
  [userId: string]: {
    modules: ModulePermission[];
    companies: CompanyAccess[];
  };
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
  getAllUsers: () => MockUser[];
  updateUserPermissions: (userId: string, modules: ModulePermission[], companies: CompanyAccess[]) => void;
  updateUserRole: (userId: string, role: AppRole) => void;
}

// Helper para obter permissões salvas do localStorage
const getSavedPermissions = (): UserPermissions => {
  try {
    const saved = localStorage.getItem(USER_PERMISSIONS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Helper para salvar permissões no localStorage
const savePermissions = (permissions: UserPermissions) => {
  localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(permissions));
};

// Helper para carregar permissões de um usuário
const loadUserPermissions = (userId: string | null) => {
  if (!userId) {
    return { role: null as AppRole | null, modules: [] as ModulePermission[], companies: [] as CompanyAccess[] };
  }

  const mockUser = MOCK_USERS.find((u) => u.id === userId);
  
  if (!mockUser) {
    return { role: "analista" as AppRole, modules: [] as ModulePermission[], companies: [] as CompanyAccess[] };
  }

  // Admin sempre tem acesso a tudo
  if (mockUser.role === "admin") {
    return { role: mockUser.role, modules: mockUser.modules, companies: mockUser.companies };
  }

  // Para outros usuários, verificar permissões salvas
  const savedPermissions = getSavedPermissions();
  const userSavedPerms = savedPermissions[userId];
  
  if (userSavedPerms) {
    return { 
      role: mockUser.role, 
      modules: userSavedPerms.modules || [], 
      companies: userSavedPerms.companies || [] 
    };
  }

  return { role: mockUser.role, modules: mockUser.modules, companies: mockUser.companies };
};

export function useUserRole(): UseUserRoleReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [userModules, setUserModules] = useState<ModulePermission[]>([]);
  const [userCompanies, setUserCompanies] = useState<CompanyAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar permissões quando user mudar
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const perms = loadUserPermissions(user?.id || null);
    setRole(perms.role);
    setUserModules(perms.modules);
    setUserCompanies(perms.companies);
    setIsLoading(false);
  }, [user?.id, authLoading]);

  // Escutar evento de mudança de auth para recarregar permissões
  useEffect(() => {
    const handleAuthChange = (event: CustomEvent) => {
      const newUser = event.detail;
      const perms = loadUserPermissions(newUser?.id || null);
      setRole(perms.role);
      setUserModules(perms.modules);
      setUserCompanies(perms.companies);
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
    return userCompanies.includes(company);
  }, [role, userCompanies]);

  const getUserModules = useCallback((): ModulePermission[] => {
    return userModules;
  }, [userModules]);

  const getUserCompanies = useCallback((): CompanyAccess[] => {
    return userCompanies;
  }, [userCompanies]);

  const getAllUsers = useCallback((): MockUser[] => {
    const savedPermissions = getSavedPermissions();
    
    return MOCK_USERS.map((u) => {
      if (u.role === "admin") {
        return u;
      }
      
      const savedPerms = savedPermissions[u.id];
      return {
        ...u,
        modules: savedPerms?.modules ?? u.modules,
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
      setUserCompanies(companies);
    }
  }, [user?.id, role]);

  const updateUserRole = useCallback((userId: string, newRole: AppRole) => {
    console.log(`Role do usuário ${userId} alterada para ${newRole}`);
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
