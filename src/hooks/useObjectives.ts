import { useLocalStorage } from "./useLocalStorage";
import { Objective, ProgressLog, ObjectiveValueType, ObjectiveStatus } from "@/types";
import { useCallback } from "react";

const STORAGE_KEY = "conto-objectives";

// Dados iniciais de exemplo
const initialObjectives: Objective[] = [
  {
    id: "1",
    name: "Aumentar faturamento em 67%",
    description: "Crescimento de R$ 30.000 para R$ 50.000/mês",
    valueType: "financial",
    targetValue: 50000,
    currentValue: 36000,
    deadline: "2026-12-31",
    status: "on_track",
    createdAt: "2026-01-01",
    progressLogs: [
      { id: "log1", date: "2026-01-15", value: 32000, description: "Fechamento de janeiro" },
      { id: "log2", date: "2026-01-25", value: 36000, description: "Novo cliente Tech Solutions" },
    ],
  },
  {
    id: "2",
    name: "Conquistar 5 novos clientes Premium",
    description: "Clientes com ticket médio acima de R$ 5.500",
    valueType: "quantity",
    targetValue: 5,
    currentValue: 3,
    deadline: "2026-12-31",
    status: "on_track",
    createdAt: "2026-01-01",
    progressLogs: [
      { id: "log3", date: "2026-01-10", value: 1, description: "Cliente Tech Solutions" },
      { id: "log4", date: "2026-01-18", value: 2, description: "Cliente Fashion Store" },
      { id: "log5", date: "2026-01-22", value: 3, description: "Cliente Clínica Premium" },
    ],
  },
  {
    id: "3",
    name: "Aumentar margem para 75%",
    description: "Otimização de processos e redução de custos",
    valueType: "percentage",
    targetValue: 75,
    currentValue: 68,
    deadline: "2026-12-31",
    status: "at_risk",
    createdAt: "2026-01-01",
    progressLogs: [],
  },
  {
    id: "4",
    name: "Montar equipe de 5 pessoas",
    description: "Contratação de Designer Sr e Analista de Mídia",
    valueType: "quantity",
    targetValue: 5,
    currentValue: 2,
    deadline: "2026-06-30",
    status: "behind",
    createdAt: "2026-01-01",
    progressLogs: [],
  },
];

function calculateStatus(currentValue: number, targetValue: number, deadline: string): ObjectiveStatus {
  const progress = (currentValue / targetValue) * 100;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const totalDays = (deadlineDate.getTime() - new Date("2026-01-01").getTime()) / (1000 * 60 * 60 * 24);
  const daysElapsed = (now.getTime() - new Date("2026-01-01").getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = (daysElapsed / totalDays) * 100;

  if (progress >= expectedProgress - 10) return "on_track";
  if (progress >= expectedProgress - 25) return "at_risk";
  return "behind";
}

export function useObjectives() {
  const [objectives, setObjectives] = useLocalStorage<Objective[]>(STORAGE_KEY, initialObjectives);

  const addObjective = useCallback(
    (data: Omit<Objective, "id" | "createdAt" | "progressLogs" | "currentValue" | "status">) => {
      const newObjective: Objective = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().split("T")[0],
        currentValue: 0,
        status: "behind",
        progressLogs: [],
      };
      setObjectives((prev) => [...prev, newObjective]);
      return newObjective;
    },
    [setObjectives]
  );

  const updateObjective = useCallback(
    (id: string, data: Partial<Omit<Objective, "id" | "createdAt" | "progressLogs">>) => {
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
    (objectiveId: string, value: number, description: string) => {
      const log: ProgressLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split("T")[0],
        value,
        description,
      };

      setObjectives((prev) =>
        prev.map((obj) => {
          if (obj.id !== objectiveId) return obj;
          const newLogs = [...obj.progressLogs, log];
          const newCurrentValue = value;
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

  const getProgress = useCallback((objective: Objective) => {
    return Math.round((objective.currentValue / objective.targetValue) * 100);
  }, []);

  const getStats = useCallback(() => {
    const total = objectives.length;
    const onTrack = objectives.filter((o) => o.status === "on_track").length;
    const atRisk = objectives.filter((o) => o.status === "at_risk").length;
    const behind = objectives.filter((o) => o.status === "behind").length;
    return { total, onTrack, atRisk, behind };
  }, [objectives]);

  return {
    objectives,
    addObjective,
    updateObjective,
    deleteObjective,
    addProgressLog,
    getProgress,
    getStats,
  };
}
