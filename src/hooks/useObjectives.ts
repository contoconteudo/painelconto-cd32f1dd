/**
 * Hook para gerenciar objetivos estratégicos.
 * Integra diretamente com Supabase.
 */

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Objective, ProgressLog, ObjectiveStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const QUERY_KEY = "objectives";
const LOGS_QUERY_KEY = "progress_logs";

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
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar objetivos do espaço atual
  const { data: objectives = [], isLoading } = useQuery({
    queryKey: [QUERY_KEY, currentCompany],
    queryFn: async () => {
      if (!currentCompany) return [];
      
      const { data, error } = await supabase
        .from("objectives")
        .select("*")
        .eq("space_id", currentCompany)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Objective[];
    },
    enabled: !!currentCompany,
  });

  // Query para buscar progress logs
  const { data: progressLogs = [] } = useQuery({
    queryKey: [LOGS_QUERY_KEY, currentCompany],
    queryFn: async () => {
      if (!currentCompany || objectives.length === 0) return [];
      
      const objectiveIds = objectives.map(o => o.id);
      const { data, error } = await supabase
        .from("progress_logs")
        .select("*")
        .in("objective_id", objectiveIds)
        .order("logged_at", { ascending: false });

      if (error) throw error;
      return data as ProgressLog[];
    },
    enabled: !!currentCompany && objectives.length > 0,
  });

  // Combinar objetivos com logs de progresso
  const objectivesWithLogs = useMemo(() => {
    return objectives.map(obj => ({
      ...obj,
      progressLogs: progressLogs.filter(l => l.objective_id === obj.id),
    }));
  }, [objectives, progressLogs]);

  // Mutation para adicionar objetivo
  const addMutation = useMutation({
    mutationFn: async (data: Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs" | "current_value" | "status">) => {
      const { data: newObj, error } = await supabase
        .from("objectives")
        .insert({
          ...data,
          space_id: data.space_id || currentCompany,
          current_value: 0,
          status: calculateStatus(0, data.target_value || 0, data.end_date),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return newObj as Objective;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      toast.success("Objetivo criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar objetivo: " + error.message);
    },
  });

  // Mutation para atualizar objetivo
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Objective> }) => {
      const obj = objectives.find(o => o.id === id);
      const updated = { ...obj, ...data };
      
      // Recalcular status se valores relevantes mudaram
      let newStatus = data.status;
      if (data.current_value !== undefined || data.target_value !== undefined || data.end_date !== undefined) {
        newStatus = calculateStatus(
          updated.current_value ?? 0, 
          updated.target_value ?? 0, 
          updated.end_date ?? null
        );
      }

      const { error } = await supabase
        .from("objectives")
        .update({ 
          ...data, 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      toast.success("Objetivo atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar objetivo: " + error.message);
    },
  });

  // Mutation para deletar objetivo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("objectives")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      toast.success("Objetivo excluído!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir objetivo: " + error.message);
    },
  });

  // Mutation para adicionar log de progresso
  const addLogMutation = useMutation({
    mutationFn: async ({ objectiveId, value, notes, loggedAt }: { 
      objectiveId: string; 
      value: number; 
      notes?: string;
      loggedAt?: string;
    }) => {
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

      // Atualizar valor atual do objetivo
      const obj = objectives.find(o => o.id === objectiveId);
      if (obj) {
        const logsForObj = progressLogs.filter(l => l.objective_id === objectiveId);
        const newCurrentValue = logsForObj.reduce((sum, l) => sum + l.value, 0) + value;
        
        await supabase
          .from("objectives")
          .update({ 
            current_value: newCurrentValue,
            status: calculateStatus(newCurrentValue, obj.target_value || 0, obj.end_date),
            updated_at: new Date().toISOString(),
          })
          .eq("id", objectiveId);
      }

      return data as ProgressLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      queryClient.invalidateQueries({ queryKey: [LOGS_QUERY_KEY, currentCompany] });
      toast.success("Progresso registrado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao registrar progresso: " + error.message);
    },
  });

  // Mutation para deletar log de progresso
  const deleteLogMutation = useMutation({
    mutationFn: async ({ objectiveId, logId }: { objectiveId: string; logId: string }) => {
      const logToDelete = progressLogs.find(l => l.id === logId);
      
      const { error } = await supabase
        .from("progress_logs")
        .delete()
        .eq("id", logId);

      if (error) throw error;

      // Atualizar valor atual do objetivo
      const obj = objectives.find(o => o.id === objectiveId);
      if (obj && logToDelete) {
        const logsForObj = progressLogs.filter(l => l.objective_id === objectiveId && l.id !== logId);
        const newCurrentValue = logsForObj.reduce((sum, l) => sum + l.value, 0);
        
        await supabase
          .from("objectives")
          .update({ 
            current_value: newCurrentValue,
            status: calculateStatus(newCurrentValue, obj.target_value || 0, obj.end_date),
            updated_at: new Date().toISOString(),
          })
          .eq("id", objectiveId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      queryClient.invalidateQueries({ queryKey: [LOGS_QUERY_KEY, currentCompany] });
      toast.success("Registro removido!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover registro: " + error.message);
    },
  });

  const addObjective = useCallback(async (
    data: Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs" | "current_value" | "status">
  ): Promise<Objective | null> => {
    try {
      return await addMutation.mutateAsync(data);
    } catch {
      return null;
    }
  }, [addMutation]);

  const updateObjective = useCallback(async (
    id: string, 
    data: Partial<Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs">>
  ) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteObjective = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const addProgressLog = useCallback(async (
    objectiveId: string, 
    value: number, 
    notes?: string,
    loggedAt?: string
  ): Promise<ProgressLog | null> => {
    try {
      return await addLogMutation.mutateAsync({ objectiveId, value, notes, loggedAt });
    } catch {
      return null;
    }
  }, [addLogMutation]);

  const deleteProgressLog = useCallback(async (objectiveId: string, logId: string) => {
    await deleteLogMutation.mutateAsync({ objectiveId, logId });
  }, [deleteLogMutation]);

  const getProgress = useCallback((objective: Objective) => {
    if (!objective.target_value) return 0;
    return Math.round((objective.current_value / objective.target_value) * 100);
  }, []);

  const getStats = useCallback(() => {
    const total = objectivesWithLogs.length;
    const concluido = objectivesWithLogs.filter(o => o.status === "concluido").length;
    const emAndamento = objectivesWithLogs.filter(o => o.status === "em_andamento").length;
    const atrasado = objectivesWithLogs.filter(o => o.status === "atrasado").length;
    const pausado = objectivesWithLogs.filter(o => o.status === "pausado").length;
    return { total, concluido, emAndamento, atrasado, pausado };
  }, [objectivesWithLogs]);

  const refreshObjectives = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
    queryClient.invalidateQueries({ queryKey: [LOGS_QUERY_KEY, currentCompany] });
  }, [queryClient, currentCompany]);

  return {
    objectives: objectivesWithLogs,
    isLoading,
    addObjective,
    updateObjective,
    deleteObjective,
    addProgressLog,
    deleteProgressLog,
    getProgress,
    getStats,
    refreshObjectives,
  };
}
