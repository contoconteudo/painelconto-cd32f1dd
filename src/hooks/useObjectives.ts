import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useCompany } from "@/contexts/CompanyContext";
import { useLeads } from "./useLeads";
import { useClients } from "./useClients";
import { Objective, ProgressLog, ObjectiveValueType, ObjectiveStatus, CommercialDataSource } from "@/types";

interface ObjectiveRow {
  id: string;
  user_id: string;
  space_id: string | null;
  name: string;
  description: string | null;
  value_type: string | null;
  target_value: number;
  current_value: number | null;
  deadline: string;
  status: string | null;
  is_commercial: boolean | null;
  data_sources: string[] | null;
  created_at: string;
}

interface ProgressLogRow {
  id: string;
  objective_id: string;
  user_id: string;
  month: number;
  year: number;
  value: number;
  description: string | null;
  logged_at: string;
}

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
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const { leads } = useLeads();
  const { clients } = useClients();
  const [allObjectives, setAllObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mapear dados do Supabase para o tipo Objective
  const mapObjective = (row: ObjectiveRow, progressLogs: ProgressLog[] = []): Objective => ({
    id: row.id,
    name: row.name,
    description: row.description || "",
    valueType: (row.value_type as ObjectiveValueType) || "quantity",
    targetValue: row.target_value || 0,
    currentValue: row.current_value || 0,
    deadline: row.deadline,
    status: (row.status as ObjectiveStatus) || "on_track",
    isCommercial: row.is_commercial || false,
    dataSources: (row.data_sources as CommercialDataSource[]) || [],
    createdAt: row.created_at?.split("T")[0] || "",
    project_id: "default",
    user_id: row.user_id,
    company_id: row.space_id || "",
    progressLogs,
  });

  // Carregar objetivos do banco
  const fetchObjectives = useCallback(async () => {
    if (!user?.id) {
      setAllObjectives([]);
      setIsLoading(false);
      return;
    }

    try {
      // Buscar objetivos
      const { data: objectivesData, error: objectivesError } = await supabase
        .from("objectives")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (objectivesError) {
        console.error("Erro ao carregar objetivos:", objectivesError);
        setAllObjectives([]);
        setIsLoading(false);
        return;
      }

      // Buscar logs de progresso
      const { data: logsData, error: logsError } = await supabase
        .from("progress_logs")
        .select("*")
        .eq("user_id", user.id);

      if (logsError) {
        console.error("Erro ao carregar progress logs:", logsError);
      }

      // Agrupar logs por objetivo
      const logsByObjective: Record<string, ProgressLog[]> = {};
      ((logsData as ProgressLogRow[]) || []).forEach((log) => {
        if (!logsByObjective[log.objective_id]) {
          logsByObjective[log.objective_id] = [];
        }
        logsByObjective[log.objective_id].push({
          id: log.id,
          objective_id: log.objective_id,
          month: log.month,
          year: log.year,
          date: log.logged_at?.split("T")[0] || "",
          value: log.value || 0,
          description: log.description || "",
        });
      });

      setAllObjectives(
        ((objectivesData as ObjectiveRow[]) || []).map((o) => mapObjective(o, logsByObjective[o.id] || []))
      );
    } catch (err) {
      console.error("Erro ao carregar objetivos:", err);
      setAllObjectives([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  // Filtrar objetivos pelo espaço atual
  const objectives = useMemo(() => {
    return allObjectives.filter((obj) => obj.company_id === currentCompany);
  }, [allObjectives, currentCompany]);

  // Calcula valor automático para metas comerciais
  const calculateCommercialValue = useCallback(
    (dataSources: CommercialDataSource[], valueType: ObjectiveValueType): number => {
      let value = 0;

      if (dataSources.includes("crm")) {
        const wonLeads = leads.filter((l) => l.stage === "won");
        if (valueType === "financial") {
          value += wonLeads.reduce((sum, l) => sum + l.value, 0);
        } else if (valueType === "quantity") {
          value += wonLeads.length;
        }
      }

      if (dataSources.includes("clients")) {
        const activeClients = clients.filter((c) => c.status === "active");
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
    return objectives.map((obj) => {
      if (obj.isCommercial && obj.dataSources.length > 0) {
        const calculatedValue = calculateCommercialValue(obj.dataSources, obj.valueType);
        const status = calculateStatus(calculatedValue, obj.targetValue, obj.deadline);
        return { ...obj, currentValue: calculatedValue, status };
      }
      return obj;
    });
  }, [objectives, calculateCommercialValue]);

  const addObjective = useCallback(
    async (data: Omit<Objective, "id" | "createdAt" | "progressLogs" | "currentValue" | "status" | "project_id" | "user_id" | "company_id">) => {
      if (!user?.id) return null;

      const initialValue =
        data.isCommercial && data.dataSources.length > 0
          ? calculateCommercialValue(data.dataSources, data.valueType)
          : 0;

      try {
        const { data: newData, error } = await supabase
          .from("objectives")
          .insert({
            user_id: user.id,
            space_id: currentCompany || null,
            name: data.name,
            description: data.description,
            value_type: data.valueType,
            target_value: data.targetValue,
            current_value: initialValue,
            deadline: data.deadline,
            status: calculateStatus(initialValue, data.targetValue, data.deadline),
            is_commercial: data.isCommercial,
            data_sources: data.dataSources,
          } as any)
          .select()
          .single();

        if (error) {
          console.error("Erro ao criar objetivo:", error);
          return null;
        }

        const newObjective = mapObjective(newData as ObjectiveRow, []);
        setAllObjectives((prev) => [newObjective, ...prev]);
        return newObjective;
      } catch (err) {
        console.error("Erro ao criar objetivo:", err);
        return null;
      }
    },
    [user?.id, currentCompany, calculateCommercialValue]
  );

  const updateObjective = useCallback(
    async (id: string, data: Partial<Omit<Objective, "id" | "createdAt" | "progressLogs" | "project_id" | "user_id" | "company_id">>) => {
      try {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.valueType !== undefined) updateData.value_type = data.valueType;
        if (data.targetValue !== undefined) updateData.target_value = data.targetValue;
        if (data.currentValue !== undefined) updateData.current_value = data.currentValue;
        if (data.deadline !== undefined) updateData.deadline = data.deadline;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.isCommercial !== undefined) updateData.is_commercial = data.isCommercial;
        if (data.dataSources !== undefined) updateData.data_sources = data.dataSources;

        const { error } = await (supabase.from("objectives") as any).update(updateData).eq("id", id);

        if (error) {
          console.error("Erro ao atualizar objetivo:", error);
          return;
        }

        setAllObjectives((prev) =>
          prev.map((obj) => {
            if (obj.id !== id) return obj;
            const updated = { ...obj, ...data };
            updated.status = calculateStatus(updated.currentValue, updated.targetValue, updated.deadline);
            return updated;
          })
        );
      } catch (err) {
        console.error("Erro ao atualizar objetivo:", err);
      }
    },
    []
  );

  const deleteObjective = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("objectives").delete().eq("id", id);

      if (error) {
        console.error("Erro ao deletar objetivo:", error);
        return;
      }

      setAllObjectives((prev) => prev.filter((obj) => obj.id !== id));
    } catch (err) {
      console.error("Erro ao deletar objetivo:", err);
    }
  }, []);

  const addProgressLog = useCallback(
    async (objectiveId: string, month: number, year: number, value: number, description: string) => {
      if (!user?.id) return null;

      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from("progress_logs")
          .select("id")
          .eq("objective_id", objectiveId)
          .eq("month", month)
          .eq("year", year)
          .maybeSingle();

        if (existing) {
          const { error } = await (supabase.from("progress_logs") as any)
            .update({ value, description, logged_at: new Date().toISOString() })
            .eq("id", (existing as any).id);

          if (error) {
            console.error("Erro ao atualizar progress log:", error);
            return null;
          }
        } else {
          const { error } = await supabase.from("progress_logs").insert({
            objective_id: objectiveId,
            user_id: user.id,
            month,
            year,
            value,
            description,
          } as any);

          if (error) {
            console.error("Erro ao criar progress log:", error);
            return null;
          }
        }

        // Recarregar dados
        await fetchObjectives();

        return { id: crypto.randomUUID(), objective_id: objectiveId, month, year, value, description, date: new Date().toISOString().split("T")[0] };
      } catch (err) {
        console.error("Erro ao adicionar progress log:", err);
        return null;
      }
    },
    [user?.id, fetchObjectives]
  );

  const updateProgressLog = useCallback(
    async (objectiveId: string, month: number, year: number, value: number, description: string) => {
      await addProgressLog(objectiveId, month, year, value, description);
    },
    [addProgressLog]
  );

  const deleteProgressLog = useCallback(
    async (objectiveId: string, month: number, year: number) => {
      try {
        const { error } = await supabase
          .from("progress_logs")
          .delete()
          .eq("objective_id", objectiveId)
          .eq("month", month)
          .eq("year", year);

        if (error) {
          console.error("Erro ao deletar progress log:", error);
          return;
        }

        // Atualizar estado local
        setAllObjectives((prev) =>
          prev.map((obj) => {
            if (obj.id !== objectiveId) return obj;

            const filteredLogs = obj.progressLogs.filter(
              (log) => !(log.month === month && log.year === year)
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
            return {
              ...obj,
              progressLogs: filteredLogs,
              currentValue: newCurrentValue,
              status: newStatus,
            };
          })
        );
      } catch (err) {
        console.error("Erro ao deletar progress log:", err);
      }
    },
    []
  );

  const getMonthlyProgress = useCallback((objective: Objective, month: number, year: number) => {
    return objective.progressLogs.find((log) => log.month === month && log.year === year);
  }, []);

  const getProgress = useCallback((objective: Objective) => {
    return Math.round((objective.currentValue / objective.targetValue) * 100);
  }, []);

  const getStats = useCallback(() => {
    const total = objectivesWithCommercialValues.length;
    const onTrack = objectivesWithCommercialValues.filter((o) => o.status === "on_track").length;
    const atRisk = objectivesWithCommercialValues.filter((o) => o.status === "at_risk").length;
    const behind = objectivesWithCommercialValues.filter((o) => o.status === "behind").length;
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
    refetch: fetchObjectives,
  };
}
