/**
 * Hook para gerenciar objetivos estratégicos.
 * Integra com Supabase para CRUD de objetivos e logs de progresso.
 */

import { useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { Objective, ProgressLog, ObjectiveStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { DEMO_MODE, demoStore } from "@/data/mockData";

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

// Calcula valor automático baseado na fonte de dados
function getAutoValue(valueType: string | null, spaceId: string): number {
  if (!valueType || valueType === "none") return 0;
  
  if (DEMO_MODE) {
    const leads = demoStore.leads.filter(l => l.space_id === spaceId);
    const clients = demoStore.clients.filter(c => c.space_id === spaceId);

    switch (valueType) {
      case "crm_pipeline": {
        const activeStatuses = ["novo", "contato", "reuniao_agendada", "reuniao_feita", "proposta", "negociacao"];
        return leads
          .filter(l => activeStatuses.includes(l.status))
          .reduce((sum, l) => sum + (l.value || 0), 0);
      }
      case "crm_won": {
        return leads
          .filter(l => l.status === "ganho")
          .reduce((sum, l) => sum + (l.value || 0), 0);
      }
      case "clients_mrr": {
        return clients
          .filter(c => c.status === "ativo")
          .reduce((sum, c) => sum + (c.monthly_value || 0), 0);
      }
      case "clients_count": {
        return clients.filter(c => c.status === "ativo").length;
      }
      default:
        return 0;
    }
  }
  return 0;
}

export function useObjectives() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // DEMO: usar useSyncExternalStore para reagir a mudanças no demoStore
  const demoObjectives = useSyncExternalStore(
    (callback) => demoStore.subscribe(callback),
    () => demoStore.objectives,
    () => demoStore.objectives
  );

  // Filtrar objetivos pelo espaço atual e calcular valores automáticos
  const objectives = useMemo(() => {
    if (DEMO_MODE) {
      const filtered = currentCompany 
        ? demoObjectives.filter(o => o.space_id === currentCompany)
        : demoObjectives;
      
      // Calcular valores automáticos para metas comerciais
      return filtered.map(obj => {
        if (obj.is_commercial && obj.value_type && obj.value_type !== "none") {
          const autoValue = getAutoValue(obj.value_type, obj.space_id);
          const newStatus = calculateStatus(autoValue, obj.target_value || 0, obj.end_date);
          return { ...obj, current_value: autoValue, status: newStatus };
        }
        return obj;
      });
    }
    return [];
  }, [demoObjectives, currentCompany]);

  const addObjective = useCallback(async (
    data: Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs" | "current_value" | "status"> & { is_commercial?: boolean; value_type?: string }
  ): Promise<Objective | null> => {
    const spaceId = data.space_id || currentCompany || "";
    const initialValue = data.is_commercial && data.value_type 
      ? getAutoValue(data.value_type, spaceId)
      : 0;

    if (DEMO_MODE) {
      const newObjective: Objective = {
        ...data,
        id: `obj-${Date.now()}`,
        space_id: spaceId,
        current_value: initialValue,
        status: calculateStatus(initialValue, data.target_value || 0, data.end_date),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progressLogs: [],
      };
      demoStore.addObjective(newObjective);
      toast.success("Objetivo criado com sucesso!");
      return newObjective;
    }

    setIsLoading(true);
    try {
      const { data: newObj, error } = await supabase
        .from("objectives")
        .insert({
          ...data,
          space_id: spaceId,
          current_value: initialValue,
          status: calculateStatus(initialValue, data.target_value || 0, data.end_date),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Objetivo criado com sucesso!");
      return { ...newObj, progressLogs: [] } as Objective;
    } catch (error: any) {
      toast.error("Erro ao criar objetivo: " + error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user?.id]);

  const updateObjective = useCallback(async (
    id: string, 
    data: Partial<Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs">>
  ) => {
    if (DEMO_MODE) {
      const obj = demoObjectives.find(o => o.id === id);
      if (obj) {
        const updated = { ...obj, ...data, updated_at: new Date().toISOString() };
        if (data.current_value !== undefined || data.target_value !== undefined || data.end_date !== undefined) {
          updated.status = calculateStatus(
            updated.current_value, 
            updated.target_value || 0, 
            updated.end_date
          );
        }
        demoStore.updateObjective(id, updated);
      }
      toast.success("Objetivo atualizado!");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("objectives")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Objetivo atualizado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar objetivo: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [demoObjectives]);

  const deleteObjective = useCallback(async (id: string) => {
    if (DEMO_MODE) {
      demoStore.deleteObjective(id);
      toast.success("Objetivo excluído!");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("objectives")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Objetivo excluído!");
    } catch (error: any) {
      toast.error("Erro ao excluir objetivo: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProgressLog = useCallback(async (
    objectiveId: string, 
    value: number, 
    notes?: string,
    loggedAt?: string
  ): Promise<ProgressLog | null> => {
    const newLog: ProgressLog = {
      id: `log-${Date.now()}`,
      objective_id: objectiveId,
      value,
      notes: notes || null,
      logged_at: loggedAt || new Date().toISOString(),
      created_by: user?.id || "",
    };

    if (DEMO_MODE) {
      const obj = demoObjectives.find(o => o.id === objectiveId);
      if (obj) {
        const newLogs = [...(obj.progressLogs || []), newLog];
        const computedCurrentValue = newLogs.reduce((sum, l) => sum + l.value, 0);
        const computedStatus = calculateStatus(computedCurrentValue, obj.target_value || 0, obj.end_date);

        demoStore.updateObjective(objectiveId, {
          progressLogs: newLogs,
          current_value: computedCurrentValue,
          status: computedStatus,
        });
      }

      toast.success("Progresso registrado!");
      return newLog;
    }

    try {
      const { data, error } = await supabase
        .from("progress_logs")
        .insert({
          objective_id: objectiveId,
          value,
          notes,
          logged_at: loggedAt || new Date().toISOString(),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Progresso registrado!");
      return data as ProgressLog;
    } catch (error: any) {
      toast.error("Erro ao registrar progresso: " + error.message);
      return null;
    }
  }, [user?.id, demoObjectives]);

  const deleteProgressLog = useCallback(async (objectiveId: string, logId: string) => {
    if (DEMO_MODE) {
      const obj = demoObjectives.find(o => o.id === objectiveId);
      if (obj) {
        const filteredLogs = (obj.progressLogs || []).filter(l => l.id !== logId);
        const computedCurrentValue = filteredLogs.reduce((sum, l) => sum + l.value, 0);
        const computedStatus = calculateStatus(computedCurrentValue, obj.target_value || 0, obj.end_date);

        demoStore.updateObjective(objectiveId, {
          progressLogs: filteredLogs,
          current_value: computedCurrentValue,
          status: computedStatus,
        });
      }
      
      toast.success("Registro removido!");
      return;
    }

    try {
      const { error } = await supabase
        .from("progress_logs")
        .delete()
        .eq("id", logId);

      if (error) throw error;
      toast.success("Registro removido!");
    } catch (error: any) {
      toast.error("Erro ao remover registro: " + error.message);
    }
  }, [demoObjectives]);

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
    refreshObjectives: () => {},
  };
}
