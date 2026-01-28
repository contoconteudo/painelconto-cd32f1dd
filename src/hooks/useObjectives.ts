import { useState, useEffect, useCallback, useMemo } from "react";
import { Objective, ProgressLog, ObjectiveValueType, ObjectiveStatus, CommercialDataSource } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { useLeads } from "./useLeads";
import { useClients } from "./useClients";

function calculateStatus(currentValue: number, targetValue: number, deadline: string): ObjectiveStatus {
  const progress = (currentValue / targetValue) * 100;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const startOfYear = new Date("2025-01-01");
  const totalDays = (deadlineDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const daysElapsed = (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = (daysElapsed / totalDays) * 100;

  if (progress >= expectedProgress - 10) return "on_track";
  if (progress >= expectedProgress - 25) return "at_risk";
  return "behind";
}

export function useObjectives() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { leads } = useLeads();
  const { clients } = useClients();

  // Carregar objetivos do banco - COM FAIL-SAFE
  const loadObjectives = useCallback(async () => {
    // Se não tem empresa selecionada, retorna vazio imediatamente
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
          if (!progressLogs[log.objective_id]) {
            progressLogs[log.objective_id] = [];
          }
          progressLogs[log.objective_id].push({
            id: log.id,
            objective_id: log.objective_id,
            month: log.month,
            year: log.year,
            value: log.value,
            description: log.description || "",
            date: log.date,
          });
        });
      }

      const mappedObjectives: Objective[] = (objectivesData || []).map(o => ({
        id: o.id,
        project_id: "default",
        user_id: o.user_id,
        company_id: o.space_id,
        name: o.name,
        description: o.description || "",
        valueType: o.value_type as ObjectiveValueType,
        targetValue: o.target_value,
        currentValue: o.current_value || 0,
        deadline: o.deadline,
        status: o.status as ObjectiveStatus,
        createdAt: o.created_at?.split("T")[0] || "",
        progressLogs: progressLogs[o.id] || [],
        isCommercial: o.is_commercial || false,
        dataSources: (o.data_sources || []) as CommercialDataSource[],
      }));

      setObjectives(mappedObjectives);
    } catch (error) {
      console.error("Erro ao carregar objetivos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  useEffect(() => {
    loadObjectives();
  }, [loadObjectives]);

  // Calcula valor automático para metas comerciais
  const calculateCommercialValue = useCallback(
    (dataSources: CommercialDataSource[], valueType: ObjectiveValueType): number => {
      let value = 0;

      if (dataSources.includes("crm")) {
        const wonLeads = leads.filter(l => l.stage === "won");
        if (valueType === "financial") {
          value += wonLeads.reduce((sum, l) => sum + l.value, 0);
        } else if (valueType === "quantity") {
          value += wonLeads.length;
        }
      }

      if (dataSources.includes("clients")) {
        const activeClients = clients.filter(c => c.status === "active");
        if (valueType === "financial") {
          value += activeClients.reduce((sum, c) => sum + c.monthlyValue, 0);
        } else if (valueType === "quantity") {
          value += activeClients.length;
        }
      }

      return value;
    },
    [leads, clients]
  );

  // Objetivos com valores comerciais calculados automaticamente
  const objectivesWithCommercialValues = useMemo(() => {
    return objectives.map(obj => {
      if (obj.isCommercial && obj.dataSources.length > 0) {
        const calculatedValue = calculateCommercialValue(obj.dataSources, obj.valueType);
        const status = calculateStatus(calculatedValue, obj.targetValue, obj.deadline);
        return { ...obj, currentValue: calculatedValue, status };
      }
      return obj;
    });
  }, [objectives, calculateCommercialValue]);

  const addObjective = useCallback(async (
    data: Omit<Objective, "id" | "createdAt" | "progressLogs" | "currentValue" | "status" | "project_id" | "user_id" | "company_id">
  ): Promise<Objective | null> => {
    if (!user?.id || !currentCompany) return null;

    const initialValue = data.isCommercial && data.dataSources.length > 0
      ? calculateCommercialValue(data.dataSources, data.valueType)
      : 0;
    
    const status = calculateStatus(initialValue, data.targetValue, data.deadline);

    const { data: newObjective, error } = await supabase
      .from("objectives")
      .insert({
        space_id: currentCompany,
        user_id: user.id,
        name: data.name,
        description: data.description,
        value_type: data.valueType,
        target_value: data.targetValue,
        current_value: initialValue,
        deadline: data.deadline,
        status,
        is_commercial: data.isCommercial,
        data_sources: data.dataSources,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar objetivo:", error);
      return null;
    }

    const mappedObjective: Objective = {
      id: newObjective.id,
      project_id: "default",
      user_id: newObjective.user_id,
      company_id: newObjective.space_id,
      name: newObjective.name,
      description: newObjective.description || "",
      valueType: newObjective.value_type as ObjectiveValueType,
      targetValue: newObjective.target_value,
      currentValue: newObjective.current_value || 0,
      deadline: newObjective.deadline,
      status: newObjective.status as ObjectiveStatus,
      createdAt: newObjective.created_at?.split("T")[0] || "",
      progressLogs: [],
      isCommercial: newObjective.is_commercial || false,
      dataSources: (newObjective.data_sources || []) as CommercialDataSource[],
    };

    setObjectives(prev => [mappedObjective, ...prev]);
    return mappedObjective;
  }, [user?.id, currentCompany, calculateCommercialValue]);

  const updateObjective = useCallback(async (
    id: string, 
    data: Partial<Omit<Objective, "id" | "createdAt" | "progressLogs" | "project_id" | "user_id" | "company_id">>
  ) => {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.valueType !== undefined) updateData.value_type = data.valueType;
    if (data.targetValue !== undefined) updateData.target_value = data.targetValue;
    if (data.currentValue !== undefined) updateData.current_value = data.currentValue;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isCommercial !== undefined) updateData.is_commercial = data.isCommercial;
    if (data.dataSources !== undefined) updateData.data_sources = data.dataSources;

    const { error } = await supabase
      .from("objectives")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar objetivo:", error);
      return;
    }

    setObjectives(prev => prev.map(obj => {
      if (obj.id !== id) return obj;
      const updated = { ...obj, ...data };
      updated.status = calculateStatus(updated.currentValue, updated.targetValue, updated.deadline);
      return updated;
    }));
  }, []);

  const deleteObjective = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("objectives")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir objetivo:", error);
      return;
    }

    setObjectives(prev => prev.filter(obj => obj.id !== id));
  }, []);

  const addProgressLog = useCallback(async (
    objectiveId: string, 
    month: number, 
    year: number, 
    value: number, 
    description: string
  ): Promise<ProgressLog | null> => {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from("progress_logs")
      .select("id")
      .eq("objective_id", objectiveId)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();

    if (existing) {
      // Atualizar
      const { error } = await supabase
        .from("progress_logs")
        .update({ value, description, date: new Date().toISOString().split("T")[0] })
        .eq("id", existing.id);

      if (error) {
        console.error("Erro ao atualizar progress log:", error);
        return null;
      }
    } else {
      // Inserir
      const { error } = await supabase
        .from("progress_logs")
        .insert({
          objective_id: objectiveId,
          month,
          year,
          value,
          description,
          date: new Date().toISOString().split("T")[0],
        });

      if (error) {
        console.error("Erro ao criar progress log:", error);
        return null;
      }
    }

    // Atualizar estado local e recalcular
    setObjectives(prev => prev.map(obj => {
      if (obj.id !== objectiveId) return obj;
      
      const filteredLogs = obj.progressLogs.filter(
        l => !(l.month === month && l.year === year)
      );
      const newLog: ProgressLog = {
        id: existing?.id || crypto.randomUUID(),
        objective_id: objectiveId,
        month,
        year,
        value,
        description,
        date: new Date().toISOString().split("T")[0],
      };
      const newLogs = [...filteredLogs, newLog];
      
      let newCurrentValue: number;
      if (obj.valueType === "quantity") {
        newCurrentValue = newLogs.reduce((sum, l) => sum + l.value, 0);
      } else {
        const sortedLogs = [...newLogs].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        newCurrentValue = sortedLogs[0]?.value || 0;
      }
      
      const newStatus = calculateStatus(newCurrentValue, obj.targetValue, obj.deadline);
      
      // Atualizar no banco
      supabase
        .from("objectives")
        .update({ current_value: newCurrentValue, status: newStatus })
        .eq("id", objectiveId);
      
      return {
        ...obj,
        progressLogs: newLogs,
        currentValue: newCurrentValue,
        status: newStatus,
      };
    }));

    return null;
  }, []);

  const updateProgressLog = useCallback(async (
    objectiveId: string, 
    month: number, 
    year: number, 
    value: number, 
    description: string
  ) => {
    await addProgressLog(objectiveId, month, year, value, description);
  }, [addProgressLog]);

  const deleteProgressLog = useCallback(async (
    objectiveId: string, 
    month: number, 
    year: number
  ) => {
    const { data: logToDelete } = await supabase
      .from("progress_logs")
      .select("id")
      .eq("objective_id", objectiveId)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();

    if (logToDelete) {
      await supabase
        .from("progress_logs")
        .delete()
        .eq("id", logToDelete.id);
    }

    setObjectives(prev => prev.map(obj => {
      if (obj.id !== objectiveId) return obj;
      
      const filteredLogs = obj.progressLogs.filter(
        log => !(log.month === month && log.year === year)
      );
      
      let newCurrentValue: number;
      if (obj.valueType === "quantity") {
        newCurrentValue = filteredLogs.reduce((sum, l) => sum + l.value, 0);
      } else {
        const sortedLogs = [...filteredLogs].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        newCurrentValue = sortedLogs[0]?.value || 0;
      }
      
      const newStatus = calculateStatus(newCurrentValue, obj.targetValue, obj.deadline);
      
      supabase
        .from("objectives")
        .update({ current_value: newCurrentValue, status: newStatus })
        .eq("id", objectiveId);
      
      return {
        ...obj,
        progressLogs: filteredLogs,
        currentValue: newCurrentValue,
        status: newStatus,
      };
    }));
  }, []);

  const getMonthlyProgress = useCallback((objective: Objective, month: number, year: number) => {
    return objective.progressLogs.find(log => log.month === month && log.year === year);
  }, []);

  const getProgress = useCallback((objective: Objective) => {
    return Math.round((objective.currentValue / objective.targetValue) * 100);
  }, []);

  const getStats = useCallback(() => {
    const total = objectivesWithCommercialValues.length;
    const onTrack = objectivesWithCommercialValues.filter(o => o.status === "on_track").length;
    const atRisk = objectivesWithCommercialValues.filter(o => o.status === "at_risk").length;
    const behind = objectivesWithCommercialValues.filter(o => o.status === "behind").length;
    return { total, onTrack, atRisk, behind };
  }, [objectivesWithCommercialValues]);

  return {
    objectives: objectivesWithCommercialValues,
    isLoading,
    addObjective,
    updateObjective,
    deleteObjective,
    addProgressLog,
    updateProgressLog,
    deleteProgressLog,
    getMonthlyProgress,
    getProgress,
    getStats,
    refreshObjectives: loadObjectives,
  };
}
