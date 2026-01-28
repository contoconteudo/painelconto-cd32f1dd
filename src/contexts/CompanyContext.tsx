import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Company = string;

interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
}

interface CompanyContextType {
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
  allowedCompanies: Company[];
  availableSpaces: Space[];
  isAdmin: boolean;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = "conto-company-selection";

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [currentCompany, setCurrentCompanyState] = useState<Company>("");
  const [allowedCompanies, setAllowedCompanies] = useState<Company[]>([]);
  const [availableSpaces, setAvailableSpaces] = useState<Space[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar espaços disponíveis do banco
  const loadAvailableSpaces = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("spaces")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao carregar espaços:", error);
        return [];
      }

      const spaces: Space[] = (data || []).map(s => ({
        id: s.id,
        label: s.label,
        description: s.description || "",
        color: s.color || "bg-primary",
      }));

      setAvailableSpaces(spaces);
      return spaces;
    } catch (error) {
      console.error("Erro ao carregar espaços:", error);
      return [];
    }
  }, []);

  // Carregar permissões do usuário atual
  const loadUserPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAllowedCompanies([]);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Verificar se é admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const userIsAdmin = roleData?.role === "admin";
      setIsAdmin(userIsAdmin);

      // Carregar espaços disponíveis
      const spaces = await loadAvailableSpaces();
      const spaceIds = spaces.map(s => s.id);

      if (userIsAdmin) {
        // Admin tem acesso a todos os espaços
        setAllowedCompanies(spaceIds);
      } else {
        // Buscar permissões específicas
        const { data: permData } = await supabase
          .from("user_permissions")
          .select("spaces")
          .eq("user_id", user.id)
          .maybeSingle();

        if (permData?.spaces) {
          const validSpaces = permData.spaces.filter((s: string) => spaceIds.includes(s));
          setAllowedCompanies(validSpaces);
        } else {
          setAllowedCompanies([]);
        }
      }

      // Definir empresa atual
      const savedCompany = localStorage.getItem(STORAGE_KEY);
      if (savedCompany && spaceIds.includes(savedCompany)) {
        setCurrentCompanyState(savedCompany);
      } else if (spaceIds.length > 0) {
        setCurrentCompanyState(spaceIds[0]);
        localStorage.setItem(STORAGE_KEY, spaceIds[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadAvailableSpaces]);

  // Carregar permissões na inicialização
  useEffect(() => {
    loadUserPermissions();
  }, [loadUserPermissions]);

  // Escutar evento de mudança de usuário (login/logout)
  useEffect(() => {
    const handleAuthChange = () => {
      loadUserPermissions();
    };

    window.addEventListener("auth-user-changed", handleAuthChange);
    return () => window.removeEventListener("auth-user-changed", handleAuthChange);
  }, [loadUserPermissions]);

  // Escutar evento de mudança de espaços
  useEffect(() => {
    const handleSpacesChange = () => {
      loadAvailableSpaces();
    };

    window.addEventListener("spaces-changed", handleSpacesChange);
    return () => window.removeEventListener("spaces-changed", handleSpacesChange);
  }, [loadAvailableSpaces]);

  const setCurrentCompany = (company: Company) => {
    // Verificar se o usuário tem acesso a essa empresa
    if (!isAdmin && !allowedCompanies.includes(company)) {
      console.warn(`Usuário não tem acesso ao espaço ${company}`);
      return;
    }
    
    setCurrentCompanyState(company);
    localStorage.setItem(STORAGE_KEY, company);
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        setCurrentCompany,
        allowedCompanies,
        availableSpaces,
        isAdmin,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
