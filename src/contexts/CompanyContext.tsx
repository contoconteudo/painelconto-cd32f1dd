import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export type Company = string;

export interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
  createdAt: string;
  user_id?: string;
}

interface CompanyContextType {
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
  allowedCompanies: Company[];
  availableSpaces: Space[];
  isAdmin: boolean;
  isLoading: boolean;
  refetchSpaces: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = "conto-company-selection";

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [currentCompany, setCurrentCompanyState] = useState<Company>("");
  const [allowedCompanies, setAllowedCompanies] = useState<Company[]>([]);
  const [availableSpaces, setAvailableSpaces] = useState<Space[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar espaços e permissões do Supabase
  const loadSpacesAndPermissions = useCallback(async () => {
    if (!user?.id) {
      setAvailableSpaces([]);
      setAllowedCompanies([]);
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      // Verificar se é admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const userIsAdmin = (roleData as any)?.role === "admin";
      setIsAdmin(userIsAdmin);

      // Buscar espaços do usuário
      const { data: spacesData, error: spacesError } = await supabase
        .from("spaces")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (spacesError) {
        console.error("Erro ao carregar espaços:", spacesError);
        setAvailableSpaces([]);
        setAllowedCompanies([]);
      } else if (spacesData && spacesData.length > 0) {
        const spaces: Space[] = spacesData.map((s: any) => ({
          id: s.id,
          label: s.label,
          description: s.description || "",
          color: s.color || "#c4378f",
          createdAt: s.created_at,
          user_id: s.user_id,
        }));
        
        setAvailableSpaces(spaces);
        setAllowedCompanies(spaces.map(s => s.id));

        // Definir empresa atual
        const savedCompany = localStorage.getItem(STORAGE_KEY);
        const spaceIds = spaces.map(s => s.id);
        
        if (savedCompany && spaceIds.includes(savedCompany)) {
          setCurrentCompanyState(savedCompany);
        } else if (spaceIds.length > 0) {
          setCurrentCompanyState(spaceIds[0]);
          localStorage.setItem(STORAGE_KEY, spaceIds[0]);
        }
      } else {
        // Nenhum espaço encontrado - criar espaços padrão
        setAvailableSpaces([]);
        setAllowedCompanies([]);
      }
    } catch (err) {
      console.error("Erro ao carregar permissões:", err);
      setAvailableSpaces([]);
      setAllowedCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Carregar na inicialização e quando o usuário mudar
  useEffect(() => {
    if (!authLoading) {
      loadSpacesAndPermissions();
    }
  }, [authLoading, loadSpacesAndPermissions]);

  // Escutar evento de mudança de espaços
  useEffect(() => {
    const handleSpacesChange = () => {
      loadSpacesAndPermissions();
    };

    window.addEventListener("spaces-changed", handleSpacesChange);
    return () => window.removeEventListener("spaces-changed", handleSpacesChange);
  }, [loadSpacesAndPermissions]);

  // Escutar evento de mudança de auth
  useEffect(() => {
    const handleAuthChange = () => {
      loadSpacesAndPermissions();
    };

    window.addEventListener("auth-user-changed", handleAuthChange);
    return () => window.removeEventListener("auth-user-changed", handleAuthChange);
  }, [loadSpacesAndPermissions]);

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
        refetchSpaces: loadSpacesAndPermissions,
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
