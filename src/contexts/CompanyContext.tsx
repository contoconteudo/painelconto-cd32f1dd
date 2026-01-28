import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MOCK_USERS, USER_PERMISSIONS_KEY, CompanyAccess } from "@/data/mockData";

export type Company = CompanyAccess;

interface CompanyContextType {
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
  allowedCompanies: Company[];
  isAdmin: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = "conto-company-selection";
const CURRENT_USER_KEY = "conto-mock-current-user";

interface CompanyProviderProps {
  children: ReactNode;
}

// Helper para obter permissões salvas
const getSavedPermissions = () => {
  try {
    const saved = localStorage.getItem(USER_PERMISSIONS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [currentCompany, setCurrentCompanyState] = useState<Company>("conto");
  const [allowedCompanies, setAllowedCompanies] = useState<Company[]>(["conto", "amplia"]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Carregar permissões do usuário atual
  useEffect(() => {
    const loadUserPermissions = () => {
      const savedCompany = localStorage.getItem(STORAGE_KEY) as Company | null;
      const currentUserJson = localStorage.getItem(CURRENT_USER_KEY);
      
      if (!currentUserJson) {
        // Sem usuário logado, usar defaults
        setAllowedCompanies(["conto", "amplia"]);
        setIsAdmin(false);
        return;
      }

      try {
        const currentUser = JSON.parse(currentUserJson);
        const mockUser = MOCK_USERS.find((u) => u.id === currentUser.id);
        
        if (mockUser) {
          // Admin tem acesso a tudo
          if (mockUser.role === "admin") {
            setIsAdmin(true);
            setAllowedCompanies(["conto", "amplia"]);
          } else {
            setIsAdmin(false);
            
            // Verificar permissões salvas ou usar default do mock
            const savedPermissions = getSavedPermissions();
            const userPerms = savedPermissions[currentUser.id];
            
            if (userPerms?.companies) {
              setAllowedCompanies(userPerms.companies);
            } else {
              setAllowedCompanies(mockUser.companies);
            }
          }
        }
      } catch {
        setAllowedCompanies(["conto", "amplia"]);
        setIsAdmin(false);
      }

      // Restaurar empresa selecionada
      if (savedCompany && ["conto", "amplia"].includes(savedCompany)) {
        setCurrentCompanyState(savedCompany);
      }
    };

    loadUserPermissions();

    // Escutar mudanças no localStorage (quando permissões são atualizadas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_PERMISSIONS_KEY || e.key === CURRENT_USER_KEY) {
        loadUserPermissions();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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
        isAdmin,
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
