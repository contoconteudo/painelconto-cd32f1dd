/**
 * Hook para gerenciar espaços (empresas) do sistema.
 * Usa useUserSession para evitar queries duplicadas.
 */

import { useCallback, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSession } from "./useUserSession";
import { DEMO_MODE, MOCK_SPACES } from "@/data/mockData";

export interface Space {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  createdAt: string;
}

// Cores disponíveis para novos espaços
export const SPACE_COLORS = [
  { value: "bg-primary", label: "Magenta" },
  { value: "bg-blue-600", label: "Azul" },
  { value: "bg-green-600", label: "Verde" },
  { value: "bg-purple-600", label: "Roxo" },
  { value: "bg-orange-600", label: "Laranja" },
  { value: "bg-cyan-600", label: "Ciano" },
  { value: "bg-rose-600", label: "Rosa" },
  { value: "bg-amber-600", label: "Âmbar" },
];

// Ícones disponíveis para espaços
export const SPACE_ICONS = [
  { value: "Building", label: "Prédio" },
  { value: "Building2", label: "Empresa" },
  { value: "Rocket", label: "Foguete" },
  { value: "Briefcase", label: "Maleta" },
  { value: "Store", label: "Loja" },
  { value: "Globe", label: "Globo" },
  { value: "Star", label: "Estrela" },
  { value: "Zap", label: "Raio" },
];

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
  const session = useUserSession();
  const [localSpaces, setLocalSpaces] = useState<Space[]>([]);

  // Inicializar espaços locais no modo DEMO
  useEffect(() => {
    if (DEMO_MODE) {
      const initialSpaces = MOCK_SPACES.map(s => ({
        id: s.id,
        label: s.label,
        description: s.description || "",
        color: s.color || "bg-primary",
        icon: s.icon || "Building",
        createdAt: new Date().toISOString(),
      }));
      setLocalSpaces(initialSpaces);
    }
  }, []);

  // Mapear espaços do formato do banco para o formato do hook
  const spaces: Space[] = DEMO_MODE 
    ? localSpaces
    : session.availableSpaces.map(s => ({
        id: s.id,
        label: s.label,
        description: s.description || "",
        color: s.color || "bg-primary",
        icon: s.icon || "Building",
        createdAt: s.created_at || new Date().toISOString(),
      }));

  // Criar novo espaço
  const createSpace = useCallback(async (
    label: string, 
    description: string, 
    color: string,
    icon: string = "Building"
  ): Promise<{ success: boolean; error?: string; space?: Space }> => {
    if (!session.user?.id) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const id = generateSpaceId(label);
    
    // Validações
    if (!label.trim()) {
      return { success: false, error: "Nome é obrigatório" };
    }
    
    if (label.length > 50) {
      return { success: false, error: "Nome deve ter no máximo 50 caracteres" };
    }
    
    if (spaces.some(s => s.id === id)) {
      return { success: false, error: "Já existe um espaço com nome similar" };
    }

    // MODO DEMO: adiciona localmente
    if (DEMO_MODE) {
      const newSpace: Space = {
        id,
        label: label.trim(),
        description: description.trim() || `Espaço ${label.trim()}`,
        color,
        icon,
        createdAt: new Date().toISOString(),
      };
      
      setLocalSpaces(prev => [...prev, newSpace]);
      window.dispatchEvent(new CustomEvent("spaces-changed"));
      
      return { success: true, space: newSpace };
    }

    const { data, error } = await supabase
      .from("spaces")
      .insert({
        id,
        label: label.trim(),
        description: description.trim() || `Espaço ${label.trim()}`,
        color,
        icon,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar espaço:", error);
      return { success: false, error: error.message };
    }

    const newSpace: Space = {
      id: data.id,
      label: data.label,
      description: data.description,
      color: data.color,
      icon: data.icon || "Building",
      createdAt: data.created_at,
    };

    // Disparar evento para atualizar cache
    window.dispatchEvent(new CustomEvent("spaces-changed"));
    await session.refreshSpaces();
    
    return { success: true, space: newSpace };
  }, [session, spaces]);

  // Atualizar espaço existente
  const updateSpace = useCallback(async (
    id: string, 
    updates: Partial<Omit<Space, "id" | "createdAt">>
  ): Promise<{ success: boolean; error?: string }> => {
    // MODO DEMO: atualiza localmente
    if (DEMO_MODE) {
      setLocalSpaces(prev => prev.map(s => 
        s.id === id ? { ...s, ...updates } : s
      ));
      window.dispatchEvent(new CustomEvent("spaces-changed"));
      return { success: true };
    }

    const { error } = await supabase
      .from("spaces")
      .update(updates)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    window.dispatchEvent(new CustomEvent("spaces-changed"));
    await session.refreshSpaces();
    
    return { success: true };
  }, [session]);

  // Excluir espaço
  const deleteSpace = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (spaces.length <= 1) {
      return { success: false, error: "Não é possível excluir o último espaço" };
    }

    // MODO DEMO: remove localmente
    if (DEMO_MODE) {
      setLocalSpaces(prev => prev.filter(s => s.id !== id));
      window.dispatchEvent(new CustomEvent("spaces-changed"));
      return { success: true };
    }

    const { error } = await supabase
      .from("spaces")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    window.dispatchEvent(new CustomEvent("spaces-changed"));
    await session.refreshSpaces();
    
    return { success: true };
  }, [session, spaces.length]);

  // Obter IDs de todos os espaços
  const getSpaceIds = useCallback((): string[] => {
    return spaces.map(s => s.id);
  }, [spaces]);

  return {
    spaces,
    isLoading: DEMO_MODE ? false : session.spacesLoading,
    createSpace,
    updateSpace,
    deleteSpace,
    getSpaceIds,
    refreshSpaces: session.refreshSpaces,
    SPACE_COLORS,
    SPACE_ICONS,
  };
}

// Função helper para uso fora de componentes React
export async function getAllSpaces(): Promise<Space[]> {
  if (DEMO_MODE) {
    return MOCK_SPACES.map(s => ({
      id: s.id,
      label: s.label,
      description: s.description || "",
      color: s.color || "bg-primary",
      icon: s.icon || "Building",
      createdAt: new Date().toISOString(),
    }));
  }

  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao carregar espaços:", error);
    return [];
  }

  return (data || []).map(s => ({
    id: s.id,
    label: s.label,
    description: s.description || "",
    color: s.color || "bg-primary",
    icon: s.icon || "Building",
    createdAt: s.created_at,
  }));
}