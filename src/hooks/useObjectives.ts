import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { Objective, ProgressLog, ObjectiveStatus } from "@/types";
// import { supabase } from "@/integrations/supabase/client"; // Comentado para DEMO
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
        // Soma de leads em negociação (exceto ganho/perdido)
        const activeStatuses = ["novo", "contato", "reuniao_agendada", "reuniao_feita", "proposta", "negociacao"];
        return leads
          .filter(l => activeStatuses.includes(l.status))
          .reduce((sum, l) => sum + (l.value || 0), 0);
      }
      case "crm_won": {
        // Soma de leads ganhos
        return leads
          .filter(l => l.status === "ganho")
          .reduce((sum, l) => sum + (l.value || 0), 0);
      }
      case "clients_mrr": {
        // MRR total de clientes ativos
        return clients
          .filter(c => c.status === "ativo")
          .reduce((sum, c) => sum + (c.monthly_value || 0), 0);
      }
      case "clients_count": {
        // Quantidade de clientes ativos
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

  // Usar useSyncExternalStore para reagir a mudanças no demoStore
  const allObjectives = useSyncExternalStore(
    (callback) => demoStore.subscribe(callback),
    () => demoStore.objectives,
    () => demoStore.objectives
  );

  // Filtrar objetivos pelo espaço atual e calcular valores automáticos
  const objectives = useMemo(() => {
    if (!DEMO_MODE) return [];
    
    const filtered = currentCompany 
      ? allObjectives.filter(o => o.space_id === currentCompany)
      : allObjectives;
    
    // Calcular valores automáticos para metas comerciais
    return filtered.map(obj => {
      if (obj.is_commercial && obj.value_type && obj.value_type !== "none") {
        const autoValue = getAutoValue(obj.value_type, obj.space_id);
        const newStatus = calculateStatus(autoValue, obj.target_value || 0, obj.end_date);
        return { ...obj, current_value: autoValue, status: newStatus };
      }
      return obj;
    });
  }, [allObjectives, currentCompany]);

  const [isLoading, setIsLoading] = useState(false);

  const addObjective = useCallback(async (
    data: Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs" | "current_value" | "status"> & { is_commercial?: boolean; value_type?: string }
  ): Promise<Objective | null> => {
    if (DEMO_MODE) {
      // Calcular valor inicial para metas automáticas
      const spaceId = data.space_id || currentCompany || "conto";
      const initialValue = data.is_commercial && data.value_type 
        ? getAutoValue(data.value_type, spaceId)
        : 0;
      
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
      toast.success("Objetivo criado com sucesso! (DEMO)");
      return newObjective;
    }

    toast.error("Modo produção desativado.");
    return null;
  }, [currentCompany]);

  const updateObjective = useCallback(async (
    id: string, 
    data: Partial<Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs">>
  ) => {
    if (DEMO_MODE) {
      const obj = allObjectives.find(o => o.id === id);
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
      toast.success("Objetivo atualizado! (DEMO)");
      return;
    }
  }, [allObjectives]);

  const deleteObjective = useCallback(async (id: string) => {
    if (DEMO_MODE) {
      demoStore.deleteObjective(id);
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
    if (DEMO_MODE) {
      const newLog: ProgressLog = {
        id: `log-${Date.now()}`,
        objective_id: objectiveId,
        value,
        notes: notes || null,
        logged_at: loggedAt || new Date().toISOString(),
        created_by: user?.id || "demo-admin-001",
      };

      const obj = allObjectives.find(o => o.id === objectiveId);
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

      toast.success("Progresso registrado! (DEMO)");
      return newLog;
    }

    return null;
  }, [user?.id, allObjectives]);

  const deleteProgressLog = useCallback(async (objectiveId: string, logId: string) => {
    if (DEMO_MODE) {
      const obj = allObjectives.find(o => o.id === objectiveId);
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
      
      toast.success("Registro removido! (DEMO)");
      return;
    }
  }, [allObjectives]);

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