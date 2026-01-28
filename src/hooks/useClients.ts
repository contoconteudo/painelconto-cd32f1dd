/**
 * Hook para gerenciar Clientes - MODO MOCK
 * 
 * TODO: Conectar Supabase depois
 * Atualmente usa localStorage para persistência.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { useCompany } from "@/contexts/CompanyContext";
import { Client, NPSRecord, ClientStatus } from "@/types";
import { MOCK_CLIENTS } from "@/data/mockData";
import { STORAGE_KEYS } from "@/lib/constants";

// Obter clientes do localStorage
const getStoredClients = (): Client[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (stored) {
      return JSON.parse(stored);
    }
    // Salvar clientes mock se não existir
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS));
    return MOCK_CLIENTS;
  } catch {
    return MOCK_CLIENTS;
  }
};

// Salvar clientes no localStorage
const saveClients = (clients: Client[]) => {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
};

// Helper function to calculate average NPS from history
export function calculateClientNPS(npsHistory: NPSRecord[]): number {
  if (npsHistory.length === 0) return 0;
  const sum = npsHistory.reduce((acc, record) => acc + record.score, 0);
  return Math.round((sum / npsHistory.length) * 10) / 10;
}

// Helper function to get the latest NPS score
export function getLatestNPS(npsHistory: NPSRecord[]): number | null {
  if (npsHistory.length === 0) return null;
  const sorted = [...npsHistory].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
  return sorted[0].score;
}

export function useClients() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [allClients, setAllClients] = useState<Client[]>(getStoredClients);
  const [isLoading, setIsLoading] = useState(false);

  // Salvar sempre que mudar
  useEffect(() => {
    saveClients(allClients);
  }, [allClients]);

  // Filtrar clientes pelo espaço atual
  const clients = useMemo(() => {
    return allClients.filter((client) => client.company_id === currentCompany);
  }, [allClients, currentCompany]);

  const addClient = useCallback(
    async (data: Omit<Client, "id" | "project_id" | "user_id" | "company_id" | "npsHistory">) => {
      if (!user?.id) return null;

      const newClient: Client = {
        ...data,
        id: `client-${Date.now()}`,
        project_id: "default",
        user_id: user.id,
        company_id: currentCompany,
        npsHistory: [],
      };

      setAllClients((prev) => [newClient, ...prev]);
      return newClient;
    },
    [user?.id, currentCompany]
  );

  const updateClient = useCallback(
    async (id: string, data: Partial<Omit<Client, "id" | "project_id" | "user_id" | "company_id">>) => {
      setAllClients((prev) =>
        prev.map((client) => (client.id === id ? { ...client, ...data } : client))
      );
    },
    []
  );

  const deleteClient = useCallback(async (id: string) => {
    setAllClients((prev) => prev.filter((client) => client.id !== id));
  }, []);

  const addNPSRecord = useCallback(
    async (clientId: string, record: Omit<NPSRecord, "id" | "client_id" | "recordedAt">) => {
      const newRecord: NPSRecord = {
        ...record,
        id: `nps-${Date.now()}`,
        client_id: clientId,
        recordedAt: new Date().toISOString(),
      };

      setAllClients((prev) =>
        prev.map((client) => {
          if (client.id !== clientId) return client;

          // Verificar se já existe registro para este mês/ano
          const existingIndex = client.npsHistory.findIndex(
            (r) => r.month === record.month && r.year === record.year
          );

          let updatedHistory: NPSRecord[];
          if (existingIndex >= 0) {
            // Atualizar existente
            updatedHistory = [...client.npsHistory];
            updatedHistory[existingIndex] = {
              ...updatedHistory[existingIndex],
              score: record.score,
              notes: record.notes,
              recordedAt: new Date().toISOString(),
            };
          } else {
            // Adicionar novo
            updatedHistory = [...client.npsHistory, newRecord];
          }

          return { ...client, npsHistory: updatedHistory };
        })
      );
    },
    []
  );

  const deleteNPSRecord = useCallback(
    async (clientId: string, recordId: string) => {
      setAllClients((prev) =>
        prev.map((client) => {
          if (client.id !== clientId) return client;
          return {
            ...client,
            npsHistory: client.npsHistory.filter((r) => r.id !== recordId),
          };
        })
      );
    },
    []
  );

  const getStats = useCallback(() => {
    const activeClients = clients.filter((c) => c.status === "active");
    const totalMRR = activeClients.reduce((sum, c) => sum + c.monthlyValue, 0);
    const avgTicket = activeClients.length > 0 ? Math.round(totalMRR / activeClients.length) : 0;

    const allNPSScores = clients.flatMap((c) => c.npsHistory.map((r) => r.score));
    const avgNPS =
      allNPSScores.length > 0
        ? Math.round((allNPSScores.reduce((sum, s) => sum + s, 0) / allNPSScores.length) * 10) / 10
        : 0;

    return {
      activeCount: activeClients.length,
      inactiveCount: clients.filter((c) => c.status === "inactive").length,
      churnCount: clients.filter((c) => c.status === "churn").length,
      totalMRR,
      avgTicket,
      avgNPS,
    };
  }, [clients]);

  // Get clients sorted by latest NPS
  const clientsWithNPSInfo = useMemo(() => {
    return clients.map((client) => ({
      ...client,
      latestNPS: getLatestNPS(client.npsHistory),
      avgNPS: calculateClientNPS(client.npsHistory),
    }));
  }, [clients]);

  // Refetch (compatibilidade)
  const refetch = useCallback(() => {
    setAllClients(getStoredClients());
  }, []);

  return {
    clients,
    clientsWithNPSInfo,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    addNPSRecord,
    deleteNPSRecord,
    getStats,
    refetch,
  };
}
