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

export function useUserRole(): UseUserRoleReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [userModules, setUserModules] = useState<ModulePermission[]>([]);
  const [userCompanies, setUserCompanies] = useState<CompanyAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setRole(null);
      setUserModules([]);
      setUserCompanies([]);
      setIsLoading(false);
      return;
    }

    // Busca role do usuário nos dados mockados
    const mockUser = MOCK_USERS.find((u) => u.id === user.id);
    
    if (mockUser) {
      setRole(mockUser.role);
      
      // Admin sempre tem acesso a tudo
      if (mockUser.role === "admin") {
        setUserModules(mockUser.modules);
        setUserCompanies(mockUser.companies);
      } else {
        // Para outros usuários, verificar permissões salvas ou usar default
        const savedPermissions = getSavedPermissions();
        const userSavedPerms = savedPermissions[user.id];
        
        if (userSavedPerms) {
          setUserModules(userSavedPerms.modules || []);
          setUserCompanies(userSavedPerms.companies || []);
        } else {
          // Usar módulos e empresas definidos no mockData
          setUserModules(mockUser.modules);
          setUserCompanies(mockUser.companies);
        }
      }
    } else {
      // Usuário novo - sem acesso até admin liberar
      setRole("analista");
      setUserModules([]);
      setUserCompanies([]);
    }
    
    setIsLoading(false);
  }, [user, authLoading]);

  const hasRole = (checkRole: AppRole): boolean => role === checkRole;

  const canAccessModule = useCallback((module: ModulePermission): boolean => {
    if (!role) return false;
    
    // Admin sempre tem acesso a tudo
    if (role === "admin") return true;
    
    // Para outros usuários, verificar módulos específicos
    return userModules.includes(module);
  }, [role, userModules]);

  const canAccessCompany = useCallback((company: CompanyAccess): boolean => {
    if (!role) return false;
    
    // Admin sempre tem acesso a tudo
    if (role === "admin") return true;
    
    // Para outros usuários, verificar empresas específicas
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
    
    return MOCK_USERS.map((user) => {
      if (user.role === "admin") {
        return user;
      }
      
      const savedPerms = savedPermissions[user.id];
      return {
        ...user,
        modules: savedPerms?.modules || user.modules,
        companies: savedPerms?.companies || user.companies,
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
  }, [user, role]);

  const updateUserRole = useCallback((userId: string, newRole: AppRole) => {
    // Em produção, isso salvaria no banco de dados
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
