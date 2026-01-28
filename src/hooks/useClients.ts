import { useLocalStorage } from "./useLocalStorage";
import { Client, NPSRecord, ClientStatus } from "@/types";
import { useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

// Dados iniciais vazios - pronto para dados reais
const initialClients: Client[] = [];

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
  const [clients, setClients] = useLocalStorage<Client[]>(STORAGE_KEYS.CLIENTS, initialClients);

  const addClient = useCallback(
    (data: Omit<Client, "id" | "project_id" | "user_id">) => {
      const newClient: Client = {
        ...data,
        id: crypto.randomUUID(),
        project_id: "default", // Placeholder, should come from context
        user_id: "1", // Placeholder, should come from auth
      };
      setClients((prev) => [...prev, newClient]);
      return newClient;
    },
    [setClients]
  );

  const updateClient = useCallback(
    (id: string, data: Partial<Omit<Client, "id" | "project_id" | "user_id">>) => {
      setClients((prev) =>
        prev.map((client) => (client.id === id ? { ...client, ...data } : client))
      );
    },
    [setClients]
  );

  const deleteClient = useCallback(
    (id: string) => {
      setClients((prev) => prev.filter((client) => client.id !== id));
    },
    [setClients]
  );

  const addNPSRecord = useCallback(
    (clientId: string, record: Omit<NPSRecord, "id" | "client_id">) => {
      setClients((prev) =>
        prev.map((client) => {
          if (client.id !== clientId) return client;
          
          // Check if a record for this month/year already exists
          const existingIndex = client.npsHistory.findIndex(
            (r) => r.month === record.month && r.year === record.year
          );
          
          let newHistory: NPSRecord[];
          if (existingIndex >= 0) {
            // Update existing record
            newHistory = client.npsHistory.map((r, i) =>
              i === existingIndex ? { ...r, ...record, client_id: clientId } : r
            );
          } else {
            // Add new record
            newHistory = [...client.npsHistory, { ...record, id: crypto.randomUUID(), client_id: clientId }];
          }
          
          return { ...client, npsHistory: newHistory };
        })
      );
    },
    [setClients]
  );

  const deleteNPSRecord = useCallback(
    (clientId: string, recordId: string) => {
      setClients((prev) =>
        prev.map((client) => {
          if (client.id !== clientId) return client;
          return {
            ...client,
            npsHistory: client.npsHistory.filter((r) => r.id !== recordId),
          };
        })
      );
    },
    [setClients]
  );

  const getStats = useCallback(() => {
    const activeClients = clients.filter((c) => c.status === "active");
    const totalMRR = activeClients.reduce((sum, c) => sum + c.monthlyValue, 0);
    const avgTicket = activeClients.length > 0 ? Math.round(totalMRR / activeClients.length) : 0;
    
    // Calculate global average NPS from all clients' histories
    const allNPSScores = clients.flatMap((c) => c.npsHistory.map((r) => r.score));
    const avgNPS = allNPSScores.length > 0 
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

  // Get clients sorted by latest NPS (for quick registration view)
  const clientsWithNPSInfo = useMemo(() => {
    return clients.map((client) => ({
      ...client,
      latestNPS: getLatestNPS(client.npsHistory),
      avgNPS: calculateClientNPS(client.npsHistory),
    }));
  }, [clients]);

  return {
    clients,
    clientsWithNPSInfo,
    addClient,
    updateClient,
    deleteClient,
    addNPSRecord,
    deleteNPSRecord,
    getStats,
  };
}