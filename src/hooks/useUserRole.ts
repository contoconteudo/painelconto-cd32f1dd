import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = 'admin' | 'gestor' | 'comercial' | 'analista';

interface UseUserRoleReturn {
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isComercial: boolean;
  isAnalista: boolean;
  hasRole: (role: AppRole) => boolean;
  canAccessModule: (module: ModulePermission) => boolean;
}

type ModulePermission = 'dashboard' | 'crm' | 'clients' | 'objectives' | 'strategy' | 'settings' | 'admin';

const MODULE_PERMISSIONS: Record<ModulePermission, AppRole[]> = {
  dashboard: ['admin', 'gestor', 'comercial', 'analista'],
  crm: ['admin', 'gestor', 'comercial'],
  clients: ['admin', 'gestor', 'comercial'],
  objectives: ['admin', 'gestor'],
  strategy: ['admin', 'gestor'],
  settings: ['admin', 'gestor', 'comercial', 'analista'],
  admin: ['admin'],
};

export function useUserRole(): UseUserRoleReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else {
          setRole(data?.role as AppRole | null);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchRole();
    }
  }, [user, authLoading]);

  const hasRole = (checkRole: AppRole): boolean => role === checkRole;

  const canAccessModule = (module: ModulePermission): boolean => {
    if (!role) return false;
    return MODULE_PERMISSIONS[module]?.includes(role) ?? false;
  };

  return {
    role,
    isLoading: isLoading || authLoading,
    isAdmin: role === 'admin',
    isGestor: role === 'gestor',
    isComercial: role === 'comercial',
    isAnalista: role === 'analista',
    hasRole,
    canAccessModule,
  };
}
