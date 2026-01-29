import { useState, useEffect, useCallback, useMemo } from "react";
import { Objective, ProgressLog, ObjectiveStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

function calculateStatus(currentValue: number, targetValue: number, endDate: string | null): ObjectiveStatus {
  if (!endDate || !targetValue) return "em_andamento";
  
  const progress = (currentValue / targetValue) * 100;
  const now = new Date();
  const deadline = new Date(endDate);
  
  if (progress >= 100) return "concluido";
  if (now > deadline) return "atrasado";
  
  // Calcular progresso esperado baseado no tempo decorrido
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

  // Carregar objetivos do banco
  const loadObjectives = useCallback(async () => {
    if (!currentCompany) {
      setObjectives([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Buscar objetivos
      const { data: objectivesData, error: objectivesError } = await supabase
        .from("objectives")
        .select("*")
        .eq("space_id", currentCompany)
        .order("created_at", { ascending: false });

      if (objectivesError) {
        console.error("Erro ao carregar objetivos:", objectivesError);
        toast.error("Erro ao carregar objetivos.");
        return;
      }

      // Buscar progress logs
      const objectiveIds = (objectivesData || []).map(o => o.id);
      let progressLogs: Record<string, ProgressLog[]> = {};

      if (objectiveIds.length > 0) {
        const { data: logsData } = await supabase
          .from("progress_logs")
          .select("*")
          .in("objective_id", objectiveIds);

        (logsData || []).forEach(log => {
          if (!log.objective_id) return;
          if (!progressLogs[log.objective_id]) {
            progressLogs[log.objective_id] = [];
          }
          progressLogs[log.objective_id].push({
            id: log.id,
            objective_id: log.objective_id,
            value: log.value,
            notes: log.notes,
            logged_at: log.logged_at,
            created_by: log.created_by,
          });
        });
      }

      const mappedObjectives: Objective[] = (objectivesData || []).map(o => ({
        id: o.id,
        space_id: o.space_id,
        title: o.title,
        description: o.description,
        category: o.category,
        target_value: o.target_value,
        current_value: o.current_value || 0,
        unit: o.unit || '%',
        start_date: o.start_date,
        end_date: o.end_date,
        status: o.status as ObjectiveStatus,
        is_commercial: o.is_commercial || false,
        value_type: o.value_type || null,
        created_by: o.created_by,
        created_at: o.created_at,
        updated_at: o.updated_at,
        progressLogs: progressLogs[o.id] || [],
      }));

      setObjectives(mappedObjectives);
    } catch (error) {
      console.error("Erro ao carregar objetivos:", error);
      toast.error("Erro inesperado ao carregar objetivos.");
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  useEffect(() => {
    loadObjectives();
  }, [loadObjectives]);

  const addObjective = useCallback(async (
    data: Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs" | "current_value" | "status"> & { is_commercial?: boolean; value_type?: string }
  ): Promise<Objective | null> => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para criar um objetivo.");
      return null;
    }
    
    if (!currentCompany) {
      toast.error("Nenhum espaço selecionado.");
      return null;
    }

    try {
      const { data: newObjective, error } = await supabase
        .from("objectives")
        .insert({
          space_id: currentCompany,
          title: data.title,
          description: data.description || null,
          category: data.category || null,
          target_value: data.target_value || null,
          current_value: 0,
          unit: data.unit || '%',
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          status: 'em_andamento',
          is_commercial: data.is_commercial || false,
          value_type: data.value_type || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar objetivo:", error);
        toast.error("Erro ao criar objetivo: " + (error.message || "Tente novamente."));
        return null;
      }

      const mappedObjective: Objective = {
        ...newObjective,
        status: newObjective.status as ObjectiveStatus,
        progressLogs: [],
      };

      setObjectives(prev => [mappedObjective, ...prev]);
      toast.success("Objetivo criado com sucesso!");
      return mappedObjective;
    } catch (error) {
      console.error("Erro inesperado ao criar objetivo:", error);
      toast.error("Erro inesperado. Verifique sua conexão.");
      return null;
    }
  }, [user?.id, currentCompany]);

  const updateObjective = useCallback(async (
    id: string, 
    data: Partial<Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs">>
  ) => {
    const updateData: Record<string, unknown> = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.target_value !== undefined) updateData.target_value = data.target_value;
    if (data.current_value !== undefined) updateData.current_value = data.current_value;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.is_commercial !== undefined) updateData.is_commercial = data.is_commercial;
    if (data.value_type !== undefined) updateData.value_type = data.value_type;

    const { error } = await supabase
      .from("objectives")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar objetivo:", error);
      toast.error("Erro ao atualizar objetivo. Tente novamente.");
      return;
    }

    setObjectives(prev => prev.map(obj => {
      if (obj.id !== id) return obj;
      const updated = { ...obj, ...data };
      // Recalcular status se necessário
      if (data.current_value !== undefined || data.target_value !== undefined || data.end_date !== undefined) {
        updated.status = calculateStatus(
          updated.current_value, 
          updated.target_value || 0, 
          updated.end_date
        );
      }
      return updated;
    }));
    toast.success("Objetivo atualizado com sucesso!");
  }, []);

  const deleteObjective = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("objectives")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir objetivo:", error);
      toast.error("Erro ao excluir objetivo. Tente novamente.");
      return;
    }

    setObjectives(prev => prev.filter(obj => obj.id !== id));
    toast.success("Objetivo excluído com sucesso!");
  }, []);

  const addProgressLog = useCallback(async (
    objectiveId: string, 
    value: number, 
    notes?: string
  ): Promise<ProgressLog | null> => {
    if (!user?.id) {
      toast.error("Você precisa estar logado.");
      return null;
    }

    try {
      const { data: newLog, error } = await supabase
        .from("progress_logs")
        .insert({
          objective_id: objectiveId,
          value,
          notes: notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar log de progresso:", error);
        toast.error("Erro ao registrar progresso.");
        return null;
      }

      const mappedLog: ProgressLog = {
        id: newLog.id,
        objective_id: objectiveId,
        value: newLog.value,
        notes: newLog.notes,
        logged_at: newLog.logged_at,
        created_by: newLog.created_by,
      };

      // Atualizar estado local
      setObjectives(prev => prev.map(obj => {
        if (obj.id !== objectiveId) return obj;
        
        const newLogs = [...(obj.progressLogs || []), mappedLog];
        const newCurrentValue = newLogs.reduce((sum, l) => sum + l.value, 0);
        const newStatus = calculateStatus(newCurrentValue, obj.target_value || 0, obj.end_date);
        
        // Atualizar no banco também
        supabase
          .from("objectives")
          .update({ current_value: newCurrentValue, status: newStatus })
          .eq("id", objectiveId);
        
        return {
          ...obj,
          progressLogs: newLogs,
          current_value: newCurrentValue,
          status: newStatus,
        };
      }));

      toast.success("Progresso registrado!");
      return mappedLog;
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado.");
      return null;
    }
  }, [user?.id]);

  const deleteProgressLog = useCallback(async (objectiveId: string, logId: string) => {
    const { error } = await supabase
      .from("progress_logs")
      .delete()
      .eq("id", logId);

    if (error) {
      console.error("Erro ao excluir log:", error);
      toast.error("Erro ao excluir registro.");
      return;
    }

    setObjectives(prev => prev.map(obj => {
      if (obj.id !== objectiveId) return obj;
      
      const filteredLogs = (obj.progressLogs || []).filter(l => l.id !== logId);
      const newCurrentValue = filteredLogs.reduce((sum, l) => sum + l.value, 0);
      const newStatus = calculateStatus(newCurrentValue, obj.target_value || 0, obj.end_date);
      
      supabase
        .from("objectives")
        .update({ current_value: newCurrentValue, status: newStatus })
        .eq("id", objectiveId);
      
      return {
        ...obj,
        progressLogs: filteredLogs,
        current_value: newCurrentValue,
        status: newStatus,
      };
    }));
    
    toast.success("Registro removido!");
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
