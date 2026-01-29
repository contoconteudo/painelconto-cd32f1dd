/**
 * Contexto para gerenciar a empresa/espaço selecionado.
 * Usa useUserSession para dados de permissões.
 */

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { useUserSession } from "@/hooks/useUserSession";
import { COMPANY_STORAGE_KEY } from "@/data/mockData";

export type Company = string;

interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
  icon?: string;
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

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const session = useUserSession();
  const [currentCompany, setCurrentCompanyState] = useState<Company>(() => {
    try {
      return localStorage.getItem(COMPANY_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  // Mapear espaços disponíveis
  const availableSpaces: Space[] = useMemo(() => {
    try {
      return (session.availableSpaces || []).map((s) => ({
        id: s.id,
        label: s.label || s.id,
        description: s.description || "",
        color: s.color || "bg-primary",
        icon: s.icon || "LayoutDashboard",
      }));
    } catch {
      return [];
    }
  }, [session.availableSpaces]);

  const availableSpaceIds = useMemo(() => availableSpaces.map((s) => s.id), [availableSpaces]);

  // Atualizar empresa selecionada quando dados carregarem
  useEffect(() => {
    if (session.isLoading) return;

    try {
      const savedCompany = localStorage.getItem(COMPANY_STORAGE_KEY);
      
      if (savedCompany && availableSpaceIds.includes(savedCompany)) {
        if (currentCompany !== savedCompany) {
          setCurrentCompanyState(savedCompany);
        }
        return;
      }
      
      if (availableSpaceIds.length > 0 && !availableSpaceIds.includes(currentCompany)) {
        setCurrentCompanyState(availableSpaceIds[0]);
        localStorage.setItem(COMPANY_STORAGE_KEY, availableSpaceIds[0]);
      }
    } catch {
      // Silenciar erros de localStorage
    }
  }, [session.isLoading, availableSpaceIds, currentCompany]);

  const setCurrentCompany = useCallback((company: Company) => {
    try {
      if (!session.isAdmin && session.allowedSpaces.length > 0 && !session.allowedSpaces.includes(company)) {
        return;
      }
      
      setCurrentCompanyState(company);
      localStorage.setItem(COMPANY_STORAGE_KEY, company);
    } catch {
      // Silenciar erros de localStorage
    }
  }, [session.isAdmin, session.allowedSpaces]);

  const contextValue = useMemo<CompanyContextType>(() => ({
    currentCompany,
    setCurrentCompany,
    allowedCompanies: session.allowedSpaces || [],
    availableSpaces,
    isAdmin: session.isAdmin || false,
    isLoading: session.isLoading,
  }), [currentCompany, setCurrentCompany, session.allowedSpaces, availableSpaces, session.isAdmin, session.isLoading]);

  return (
    <CompanyContext.Provider value={contextValue}>
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
