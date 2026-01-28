/**
 * Hook para gerenciar Objetivos - MODO MOCK
 * 
 * TODO: Conectar Supabase depois
 * Atualmente usa localStorage para persistência.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { useCompany } from "@/contexts/CompanyContext";
import { useLeads } from "./useLeads";
import { useClients } from "./useClients";
import { Objective, ProgressLog, ObjectiveValueType, ObjectiveStatus, CommercialDataSource } from "@/types";
import { MOCK_OBJECTIVES } from "@/data/mockData";
import { STORAGE_KEYS } from "@/lib/constants";

// Obter objetivos do localStorage
const getStoredObjectives = (): Objective[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.OBJECTIVES);
    if (stored) {
      return JSON.parse(stored);
    }
    // Salvar objetivos mock se não existir
    localStorage.setItem(STORAGE_KEYS.OBJECTIVES, JSON.stringify(MOCK_OBJECTIVES));
    return MOCK_OBJECTIVES;
  } catch {
    return MOCK_OBJECTIVES;
  }
};

// Salvar objetivos no localStorage
const saveObjectives = (objectives: Objective[]) => {
  localStorage.setItem(STORAGE_KEYS.OBJECTIVES, JSON.stringify(objectives));
};

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
  const [allObjectives, setAllObjectives] = useState<Objective[]>(getStoredObjectives);
  const [isLoading, setIsLoading] = useState(false);

  // Salvar sempre que mudar
  useEffect(() => {
    saveObjectives(allObjectives);
  }, [allObjectives]);

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

      const newObjective: Objective = {
        ...data,
        id: `obj-${Date.now()}`,
        project_id: "default",
        user_id: user.id,
        company_id: currentCompany,
        currentValue: initialValue,
        status: calculateStatus(initialValue, data.targetValue, data.deadline),
        createdAt: new Date().toISOString().split("T")[0],
        progressLogs: [],
      };

      setAllObjectives((prev) => [newObjective, ...prev]);
      return newObjective;
    },
    [user?.id, currentCompany, calculateCommercialValue]
  );

  const updateObjective = useCallback(
    async (id: string, data: Partial<Omit<Objective, "id" | "createdAt" | "progressLogs" | "project_id" | "user_id" | "company_id">>) => {
      setAllObjectives((prev) =>
        prev.map((obj) => {
          if (obj.id !== id) return obj;
          const updated = { ...obj, ...data };
          updated.status = calculateStatus(updated.currentValue, updated.targetValue, updated.deadline);
          return updated;
        })
      );
    },
    []
  );

  const deleteObjective = useCallback(async (id: string) => {
    setAllObjectives((prev) => prev.filter((obj) => obj.id !== id));
  }, []);

  const addProgressLog = useCallback(
    async (objectiveId: string, month: number, year: number, value: number, description: string) => {
      const newLog: ProgressLog = {
        id: `log-${Date.now()}`,
        objective_id: objectiveId,
        month,
        year,
        value,
        description,
        date: new Date().toISOString().split("T")[0],
      };

      setAllObjectives((prev) =>
        prev.map((obj) => {
          if (obj.id !== objectiveId) return obj;

          // Verificar se já existe log para este mês/ano
          const existingIndex = obj.progressLogs.findIndex(
            (l) => l.month === month && l.year === year
          );

          let updatedLogs: ProgressLog[];
          if (existingIndex >= 0) {
            updatedLogs = [...obj.progressLogs];
            updatedLogs[existingIndex] = newLog;
          } else {
            updatedLogs = [...obj.progressLogs, newLog];
          }

          // Recalcular valor atual
          let newCurrentValue: number;
          if (obj.valueType === "quantity") {
            newCurrentValue = updatedLogs.reduce((sum, l) => sum + l.value, 0);
          } else {
            const sortedLogs = [...updatedLogs].sort((a, b) => {
              if (a.year !== b.year) return b.year - a.year;
              return b.month - a.month;
            });
            newCurrentValue = sortedLogs[0]?.value || 0;
          }

          const newStatus = calculateStatus(newCurrentValue, obj.targetValue, obj.deadline);

          return {
            ...obj,
            progressLogs: updatedLogs,
            currentValue: newCurrentValue,
            status: newStatus,
          };
        })
      );

      return newLog;
    },
    []
  );

  const updateProgressLog = useCallback(
    async (objectiveId: string, month: number, year: number, value: number, description: string) => {
      return addProgressLog(objectiveId, month, year, value, description);
    },
    [addProgressLog]
  );

  const deleteProgressLog = useCallback(
    async (objectiveId: string, month: number, year: number) => {
      setAllObjectives((prev) =>
        prev.map((obj) => {
          if (obj.id !== objectiveId) return obj;

          const filteredLogs = obj.progressLogs.filter(
            (log) => !(log.month === month && log.year === year)
          );

          // Recalcular valor atual
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

  // Refetch (compatibilidade)
  const refetch = useCallback(() => {
    setAllObjectives(getStoredObjectives());
  }, []);

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
    refetch,
  };
}
