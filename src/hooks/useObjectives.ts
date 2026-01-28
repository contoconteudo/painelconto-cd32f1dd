import { useLocalStorage } from "./useLocalStorage";
import { Objective, ProgressLog, ObjectiveValueType, ObjectiveStatus, CommercialDataSource } from "@/types";
import { useCallback, useMemo } from "react";
import { useLeads } from "./useLeads";
import { useClients } from "./useClients";
import { STORAGE_KEYS } from "@/lib/constants";

// Dados iniciais vazios - pronto para dados reais
const initialObjectives: Objective[] = [];

function calculateStatus(currentValue: number, targetValue: number, deadline: string): ObjectiveStatus {
  const progress = (currentValue / targetValue) * 100;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const startOfYear = new Date("2026-01-01");
  const totalDays = (deadlineDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const daysElapsed = (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = (daysElapsed / totalDays) * 100;

  if (progress >= expectedProgress - 10) return "on_track";
  if (progress >= expectedProgress - 25) return "at_risk";
  return "behind";
}

export function useObjectives() {
  const [objectives, setObjectives] = useLocalStorage<Objective[]>(STORAGE_KEYS.OBJECTIVES, initialObjectives);
  const { leads } = useLeads();
  const { clients } = useClients();

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
    (data: Omit<Objective, "id" | "createdAt" | "progressLogs" | "currentValue" | "status" | "project_id" | "user_id">) => {
      const initialValue = data.isCommercial && data.dataSources.length > 0
        ? calculateCommercialValue(data.dataSources, data.valueType)
        : 0;
      
      const newObjective: Objective = {
        ...data,
        id: crypto.randomUUID(),
        project_id: "default", // Placeholder, should come from context
        user_id: "1", // Placeholder, should come from auth
        createdAt: new Date().toISOString().split("T")[0],
        currentValue: initialValue,
        status: calculateStatus(initialValue, data.targetValue, data.deadline),
        progressLogs: [],
      };
      setObjectives((prev) => [...prev, newObjective]);
      return newObjective;
    },
    [setObjectives, calculateCommercialValue]
  );

  const updateObjective = useCallback(
    (id: string, data: Partial<Omit<Objective, "id" | "createdAt" | "progressLogs" | "project_id" | "user_id">>) => {
      setObjectives((prev) =>
        prev.map((obj) => {
          if (obj.id !== id) return obj;
          const updated = { ...obj, ...data };
          updated.status = calculateStatus(updated.currentValue, updated.targetValue, updated.deadline);
          return updated;
        })
      );
    },
    [setObjectives]
  );

  const deleteObjective = useCallback(
    (id: string) => {
      setObjectives((prev) => prev.filter((obj) => obj.id !== id));
    },
    [setObjectives]
  );

  const addProgressLog = useCallback(
    (objectiveId: string, month: number, year: number, value: number, description: string) => {
      const log: ProgressLog = {
        id: crypto.randomUUID(),
        objective_id: objectiveId,
        month,
        year,
        date: new Date().toISOString().split("T")[0],
        value,
        description,
      };

      setObjectives((prev) =>
        prev.map((obj) => {
          if (obj.id !== objectiveId) return obj;
          
          // Remove log existente para o mesmo mês/ano se houver
          const filteredLogs = obj.progressLogs.filter(
            (l) => !(l.month === month && l.year === year)
          );
          const newLogs = [...filteredLogs, log];
          
          // O currentValue é a soma de todos os valores mensais para quantity
          // Ou o último valor para financial/percentage
          let newCurrentValue: number;
          if (obj.valueType === "quantity") {
            newCurrentValue = newLogs.reduce((sum, l) => sum + l.value, 0);
          } else {
            // Para financial e percentage, pega o valor mais recente
            const sortedLogs = [...newLogs].sort((a, b) => {
              if (a.year !== b.year) return b.year - a.year;
              return b.month - a.month;
            });
            newCurrentValue = sortedLogs[0]?.value || 0;
          }
          
          const newStatus = calculateStatus(newCurrentValue, obj.targetValue, obj.deadline);
          return {
            ...obj,
            progressLogs: newLogs,
            currentValue: newCurrentValue,
            status: newStatus,
          };
        })
      );

      return log;
    },
    [setObjectives]
  );

  const updateProgressLog = useCallback(
    (objectiveId: string, month: number, year: number, value: number, description: string) => {
      setObjectives((prev) =>
        prev.map((obj) => {
          if (obj.id !== objectiveId) return obj;
          
          const updatedLogs = obj.progressLogs.map((log) => {
            if (log.month === month && log.year === year) {
              return { ...log, value, description, date: new Date().toISOString().split("T")[0] };
            }
            return log;
          });
          
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
    },
    [setObjectives]
  );

  const deleteProgressLog = useCallback(
    (objectiveId: string, month: number, year: number) => {
      setObjectives((prev) =>
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
    },
    [setObjectives]
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
    addObjective,
    updateObjective,
    deleteObjective,
    addProgressLog,
    updateProgressLog,
    deleteProgressLog,
    getMonthlyProgress,
    getProgress,
    getStats,
  };
}