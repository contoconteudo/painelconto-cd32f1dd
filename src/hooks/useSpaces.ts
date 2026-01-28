/**
 * Hook para gerenciar espaços (empresas) do sistema.
 * Suporta tanto Supabase quanto localStorage (fallback).
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
  createdAt: string;
  user_id?: string;
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

interface SpaceRow {
  id: string;
  label: string;
  description: string | null;
  color: string | null;
  created_at: string;
  user_id: string;
}

export function useSpaces() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>(getStoredSpaces);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar espaços (Supabase ou localStorage)
  const fetchSpaces = useCallback(async () => {
    if (!user?.id) {
      setSpaces(getStoredSpaces());
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("spaces")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        setSpaces(
          (data as SpaceRow[]).map((s) => ({
            id: s.id,
            label: s.label,
            description: s.description || "",
            color: s.color || "#c4378f",
            createdAt: s.created_at,
            user_id: s.user_id,
          }))
        );
      } else {
        // Fallback para localStorage
        setSpaces(getStoredSpaces());
      }
    } catch {
      setSpaces(getStoredSpaces());
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

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

  // Salvar espaços no localStorage (fallback)
  const saveLocalSpaces = useCallback((newSpaces: Space[]) => {
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

      // Tentar criar no Supabase primeiro
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("spaces")
            .insert({
              user_id: user.id,
              label: label.trim(),
              description: description.trim() || `Espaço ${label.trim()}`,
              color,
            } as any)
            .select()
            .single();

          if (!error && data) {
            const d = data as any;
            const newSpace: Space = {
              id: d.id,
              label: d.label,
              description: d.description || "",
              color: d.color || "#c4378f",
              createdAt: d.created_at,
              user_id: d.user_id,
            };

            setSpaces((prev) => [...prev, newSpace]);
            window.dispatchEvent(new CustomEvent("spaces-changed"));
            return { success: true, space: newSpace };
          }
        } catch (err) {
          console.error("Erro ao criar no Supabase, usando localStorage:", err);
        }
      }

      // Fallback para localStorage
      const newSpace: Space = {
        id,
        label: label.trim(),
        description: description.trim() || `Espaço ${label.trim()}`,
        color,
        createdAt: new Date().toISOString(),
      };

      const newSpaces = [...spaces, newSpace];
      saveLocalSpaces(newSpaces);
      
      return { success: true, space: newSpace };
    },
    [spaces, saveLocalSpaces, user?.id]
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

      // Tentar atualizar no Supabase
      if (user?.id) {
        try {
          const { error } = await (supabase.from("spaces") as any)
            .update({
              label: updates.label,
              description: updates.description,
              color: updates.color,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (!error) {
            setSpaces((prev) =>
              prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
            );
            window.dispatchEvent(new CustomEvent("spaces-changed"));
            return { success: true };
          }
        } catch (err) {
          console.error("Erro ao atualizar no Supabase:", err);
        }
      }

      // Fallback para localStorage
      const updatedSpaces = [...spaces];
      updatedSpaces[spaceIndex] = {
        ...updatedSpaces[spaceIndex],
        ...updates,
      };
      
      saveLocalSpaces(updatedSpaces);
      return { success: true };
    },
    [spaces, saveLocalSpaces, user?.id]
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

      // Tentar excluir do Supabase
      if (user?.id) {
        try {
          const { error } = await supabase.from("spaces").delete().eq("id", id);

          if (!error) {
            setSpaces((prev) => prev.filter((s) => s.id !== id));
            window.dispatchEvent(new CustomEvent("spaces-changed"));
            return { success: true };
          }
        } catch (err) {
          console.error("Erro ao excluir do Supabase:", err);
        }
      }

      // Fallback para localStorage
      const newSpaces = spaces.filter(s => s.id !== id);
      saveLocalSpaces(newSpaces);
      
      return { success: true };
    },
    [spaces, saveLocalSpaces, user?.id]
  );

  // Obter IDs de todos os espaços
  const getSpaceIds = useCallback((): string[] => {
    return spaces.map(s => s.id);
  }, [spaces]);

  return {
    spaces,
    isLoading,
    createSpace,
    updateSpace,
    deleteSpace,
    getSpaceIds,
    refetch: fetchSpaces,
    SPACE_COLORS,
  };
}

// Exportar função síncrona para uso em contextos sem hook
export const getAllSpaces = getStoredSpaces;
