/**
 * Contexto de Empresa/Espaço - MODO MOCK
 * 
 * TODO: Conectar Supabase depois
 * Atualmente usa dados mockados e localStorage.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth, getMockUserById } from "@/hooks/useAuth";
import { getAllSpaces, Space } from "@/hooks/useSpaces";

export type Company = string;
export type { Space };

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

  // Carregar espaços e permissões
  const loadSpacesAndPermissions = useCallback(async () => {
    if (!user?.id) {
      setAvailableSpaces([]);
      setAllowedCompanies([]);
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    // Buscar dados do usuário mock
    const mockUser = getMockUserById(user.id);
    const userIsAdmin = mockUser?.role === "admin";
    setIsAdmin(userIsAdmin);

    // Carregar espaços
    const spaces = getAllSpaces();
    setAvailableSpaces(spaces);

    // Determinar espaços permitidos
    let allowed: string[];
    if (userIsAdmin) {
      // Admin tem acesso a todos os espaços
      allowed = spaces.map(s => s.id);
    } else if (mockUser) {
      // Usuário normal: verificar permissões
      allowed = mockUser.companies.filter(c => spaces.some(s => s.id === c));
    } else {
      // Novo usuário sem configuração
      allowed = [];
    }

    setAllowedCompanies(allowed);

    // Definir empresa atual
    const savedCompany = localStorage.getItem(STORAGE_KEY);
    
    if (savedCompany && allowed.includes(savedCompany)) {
      setCurrentCompanyState(savedCompany);
    } else if (allowed.length > 0) {
      setCurrentCompanyState(allowed[0]);
      localStorage.setItem(STORAGE_KEY, allowed[0]);
    } else if (spaces.length > 0) {
      // Fallback para primeiro espaço disponível
      setCurrentCompanyState(spaces[0].id);
      localStorage.setItem(STORAGE_KEY, spaces[0].id);
    }

    setIsLoading(false);
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
