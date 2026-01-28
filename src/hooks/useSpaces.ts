/**
 * Hook para gerenciar espaços (empresas) do sistema - MODO MOCK
 * 
 * TODO: Conectar Supabase depois
 * Atualmente usa localStorage para persistência.
 */

import { useState, useEffect, useCallback } from "react";

export interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
  createdAt: string;
}

// Cores disponíveis para novos espaços
export const SPACE_COLORS = [
  { value: "#c4378f", label: "Magenta" },
  { value: "#2563eb", label: "Azul" },
  { value: "#16a34a", label: "Verde" },
  { value: "#9333ea", label: "Roxo" },
  { value: "#ea580c", label: "Laranja" },
  { value: "#0891b2", label: "Ciano" },
  { value: "#e11d48", label: "Rosa" },
  { value: "#d97706", label: "Âmbar" },
];

const SPACES_STORAGE_KEY = "conto-spaces";

// Espaços padrão do sistema
const DEFAULT_SPACES: Space[] = [
  { 
    id: "conto", 
    label: "Conto", 
    description: "Agência Conto", 
    color: "#c4378f",
    createdAt: "2024-01-01T00:00:00Z"
  },
  { 
    id: "amplia", 
    label: "Amplia", 
    description: "Agência Amplia", 
    color: "#2563eb",
    createdAt: "2024-01-01T00:00:00Z"
  },
];

// Função para obter espaços do localStorage
const getStoredSpaces = (): Space[] => {
  try {
    const stored = localStorage.getItem(SPACES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Salvar espaços padrão se não existir
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(DEFAULT_SPACES));
    return DEFAULT_SPACES;
  } catch {
    return DEFAULT_SPACES;
  }
};

// Função para gerar ID único baseado no nome
const generateSpaceId = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>(getStoredSpaces);
  const [isLoading, setIsLoading] = useState(false);

  // Escutar mudanças de storage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SPACES_STORAGE_KEY) {
        setSpaces(getStoredSpaces());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Salvar espaços no localStorage
  const saveSpaces = useCallback((newSpaces: Space[]) => {
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(newSpaces));
    setSpaces(newSpaces);
    window.dispatchEvent(new CustomEvent("spaces-changed"));
  }, []);

  // Criar novo espaço
  const createSpace = useCallback(
    async (
      label: string,
      description: string,
      color: string
    ): Promise<{ success: boolean; error?: string; space?: Space }> => {
      if (!label.trim()) {
        return { success: false, error: "Nome é obrigatório" };
      }

      if (label.length > 50) {
        return { success: false, error: "Nome deve ter no máximo 50 caracteres" };
      }

      const id = generateSpaceId(label);

      if (spaces.some(s => s.id === id)) {
        return { success: false, error: "Já existe um espaço com nome similar" };
      }

      const newSpace: Space = {
        id,
        label: label.trim(),
        description: description.trim() || `Espaço ${label.trim()}`,
        color,
        createdAt: new Date().toISOString(),
      };

      const newSpaces = [...spaces, newSpace];
      saveSpaces(newSpaces);
      
      return { success: true, space: newSpace };
    },
    [spaces, saveSpaces]
  );

  // Atualizar espaço
  const updateSpace = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Space, "id" | "createdAt">>
    ): Promise<{ success: boolean; error?: string }> => {
      const spaceIndex = spaces.findIndex(s => s.id === id);
      
      if (spaceIndex === -1) {
        return { success: false, error: "Espaço não encontrado" };
      }

      const updatedSpaces = [...spaces];
      updatedSpaces[spaceIndex] = {
        ...updatedSpaces[spaceIndex],
        ...updates,
      };
      
      saveSpaces(updatedSpaces);
      return { success: true };
    },
    [spaces, saveSpaces]
  );

  // Excluir espaço
  const deleteSpace = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const space = spaces.find(s => s.id === id);
      
      if (!space) {
        return { success: false, error: "Espaço não encontrado" };
      }

      if (spaces.length <= 1) {
        return { success: false, error: "Não é possível excluir o último espaço" };
      }

      const newSpaces = spaces.filter(s => s.id !== id);
      saveSpaces(newSpaces);
      
      return { success: true };
    },
    [spaces, saveSpaces]
  );

  // Obter IDs de todos os espaços
  const getSpaceIds = useCallback((): string[] => {
    return spaces.map(s => s.id);
  }, [spaces]);

  // Refetch (compatibilidade)
  const refetch = useCallback(() => {
    setSpaces(getStoredSpaces());
  }, []);

  return {
    spaces,
    isLoading,
    createSpace,
    updateSpace,
    deleteSpace,
    getSpaceIds,
    refetch,
    SPACE_COLORS,
  };
}

// Exportar função síncrona para uso em contextos sem hook
export const getAllSpaces = getStoredSpaces;
