import { useState, useEffect, useCallback, useMemo } from "react";
import { Objective, ProgressLog, ObjectiveStatus } from "@/types";
// import { supabase } from "@/integrations/supabase/client"; // Comentado para DEMO
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { DEMO_MODE, MOCK_OBJECTIVES } from "@/data/mockData";

function calculateStatus(currentValue: number, targetValue: number, endDate: string | null): ObjectiveStatus {
  if (!endDate || !targetValue) return "em_andamento";
  
  const progress = (currentValue / targetValue) * 100;
  const now = new Date();
  const deadline = new Date(endDate);
  
  if (progress >= 100) return "concluido";
  if (now > deadline) return "atrasado";
  
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const totalDays = (deadline.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const daysElapsed = (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = (daysElapsed / totalDays) * 100;

  if (progress >= expectedProgress - 10) return "em_andamento";
  return "atrasado";
}

export function useObjectives() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  // Carregar objetivos - MODO DEMO
  const loadObjectives = useCallback(async () => {
    setIsLoading(true);

    // MODO DEMO: retorna dados mock filtrados por espaço
    if (DEMO_MODE) {
      const filteredObjectives = currentCompany 
        ? MOCK_OBJECTIVES.filter(o => o.space_id === currentCompany)
        : MOCK_OBJECTIVES;
      setObjectives(filteredObjectives);
      setIsLoading(false);
      return;
    }

    // Código real comentado para DEMO
    setIsLoading(false);
  }, [currentCompany]);

  useEffect(() => {
    loadObjectives();
  }, [loadObjectives]);

  const addObjective = useCallback(async (
    data: Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs" | "current_value" | "status"> & { is_commercial?: boolean; value_type?: string }
  ): Promise<Objective | null> => {
    // MODO DEMO: adiciona localmente
    if (DEMO_MODE) {
      const newObjective: Objective = {
        ...data,
        id: `obj-${Date.now()}`,
        current_value: 0,
        status: "em_andamento",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progressLogs: [],
      };
      setObjectives(prev => [newObjective, ...prev]);
      toast.success("Objetivo criado com sucesso! (DEMO)");
      return newObjective;
    }

    toast.error("Modo produção desativado.");
    return null;
  }, []);

  const updateObjective = useCallback(async (
    id: string, 
    data: Partial<Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs">>
  ) => {
    // MODO DEMO: atualiza localmente
    if (DEMO_MODE) {
      setObjectives(prev => prev.map(obj => {
        if (obj.id !== id) return obj;
        const updated = { ...obj, ...data, updated_at: new Date().toISOString() };
        if (data.current_value !== undefined || data.target_value !== undefined || data.end_date !== undefined) {
          updated.status = calculateStatus(
            updated.current_value, 
            updated.target_value || 0, 
            updated.end_date
          );
        }
        return updated;
      }));
      toast.success("Objetivo atualizado! (DEMO)");
      return;
    }
  }, []);

  const deleteObjective = useCallback(async (id: string) => {
    // MODO DEMO: remove localmente
    if (DEMO_MODE) {
      setObjectives(prev => prev.filter(obj => obj.id !== id));
      toast.success("Objetivo excluído! (DEMO)");
      return;
    }
  }, []);

  const addProgressLog = useCallback(async (
    objectiveId: string, 
    value: number, 
    notes?: string,
    loggedAt?: string
  ): Promise<ProgressLog | null> => {
    // MODO DEMO: adiciona log localmente
    if (DEMO_MODE) {
      const newLog: ProgressLog = {
        id: `log-${Date.now()}`,
        objective_id: objectiveId,
        value,
        notes: notes || null,
        logged_at: loggedAt || new Date().toISOString(),
        created_by: user?.id || "demo-admin-001",
      };

      setObjectives(prev => prev.map(obj => {
        if (obj.id !== objectiveId) return obj;
        
        const newLogs = [...(obj.progressLogs || []), newLog];
        const computedCurrentValue = newLogs.reduce((sum, l) => sum + l.value, 0);
        const computedStatus = calculateStatus(computedCurrentValue, obj.target_value || 0, obj.end_date);

        return {
          ...obj,
          progressLogs: newLogs,
          current_value: computedCurrentValue,
          status: computedStatus,
        };
      }));

      toast.success("Progresso registrado! (DEMO)");
      return newLog;
    }

    return null;
  }, [user?.id]);

  const deleteProgressLog = useCallback(async (objectiveId: string, logId: string) => {
    // MODO DEMO: remove log localmente
    if (DEMO_MODE) {
      setObjectives(prev => prev.map(obj => {
        if (obj.id !== objectiveId) return obj;

        const filteredLogs = (obj.progressLogs || []).filter(l => l.id !== logId);
        const computedCurrentValue = filteredLogs.reduce((sum, l) => sum + l.value, 0);
        const computedStatus = calculateStatus(computedCurrentValue, obj.target_value || 0, obj.end_date);

        return {
          ...obj,
          progressLogs: filteredLogs,
          current_value: computedCurrentValue,
          status: computedStatus,
        };
      }));
      
      toast.success("Registro removido! (DEMO)");
      return;
    }
  }, []);

  const getProgress = useCallback((objective: Objective) => {
    if (!objective.target_value) return 0;
    return Math.round((objective.current_value / objective.target_value) * 100);
  }, []);

  const getStats = useCallback(() => {
    const total = objectives.length;
    const concluido = objectives.filter(o => o.status === "concluido").length;
    const emAndamento = objectives.filter(o => o.status === "em_andamento").length;
    const atrasado = objectives.filter(o => o.status === "atrasado").length;
    const pausado = objectives.filter(o => o.status === "pausado").length;
    return { total, concluido, emAndamento, atrasado, pausado };
  }, [objectives]);

  return {
    objectives,
    isLoading,
    addObjective,
    updateObjective,
    deleteObjective,
    addProgressLog,
    deleteProgressLog,
    getProgress,
    getStats,
    refreshObjectives: loadObjectives,
  };
}
