import { useLocalStorage } from "./useLocalStorage";
import { Client, ClientStatus, NPSRecord } from "@/types";
import { useCallback, useMemo } from "react";

const STORAGE_KEY = "conto-clients";

const initialClients: Client[] = [
  { 
    id: "1", 
    company: "Tech Solutions", 
    contact: "Lucas Pereira", 
    email: "lucas@tech.com", 
    phone: "(11) 99999-1234", 
    segment: "Tecnologia", 
    package: "Completão", 
    monthlyValue: 5500, 
    status: "active", 
    npsHistory: [
      { id: "nps-1-1", month: 10, year: 2025, score: 9, notes: "", recordedAt: "2025-10-15" },
      { id: "nps-1-2", month: 11, year: 2025, score: 9, notes: "", recordedAt: "2025-11-15" },
      { id: "nps-1-3", month: 12, year: 2025, score: 8, notes: "", recordedAt: "2025-12-15" },
    ],
    startDate: "2025-07-15", 
    notes: "" 
  },
  { 
    id: "2", 
    company: "Clínica Saúde+", 
    contact: "Dr. Marcos Silva", 
    email: "marcos@clinica.com", 
    phone: "(11) 98888-5678", 
    segment: "Saúde", 
    package: "Start", 
    monthlyValue: 3500, 
    status: "active", 
    npsHistory: [
      { id: "nps-2-1", month: 11, year: 2025, score: 8, notes: "", recordedAt: "2025-11-01" },
      { id: "nps-2-2", month: 12, year: 2025, score: 8, notes: "", recordedAt: "2025-12-01" },
    ],
    startDate: "2025-08-01", 
    notes: "" 
  },
  { 
    id: "3", 
    company: "E-commerce Fashion", 
    contact: "Ana Costa", 
    email: "ana@fashion.com", 
    phone: "(11) 97777-9012", 
    segment: "Varejo", 
    package: "Completão", 
    monthlyValue: 5500, 
    status: "active", 
    npsHistory: [
      { id: "nps-3-1", month: 9, year: 2025, score: 10, notes: "Muito satisfeita", recordedAt: "2025-09-20" },
      { id: "nps-3-2", month: 10, year: 2025, score: 10, notes: "", recordedAt: "2025-10-20" },
      { id: "nps-3-3", month: 11, year: 2025, score: 9, notes: "", recordedAt: "2025-11-20" },
      { id: "nps-3-4", month: 12, year: 2025, score: 10, notes: "", recordedAt: "2025-12-20" },
    ],
    startDate: "2025-05-20", 
    notes: "" 
  },
  { 
    id: "4", 
    company: "Escritório Advocacia", 
    contact: "Dr. Roberto Alves", 
    email: "roberto@adv.com", 
    phone: "(11) 96666-3456", 
    segment: "Serviços", 
    package: "PF/Básico", 
    monthlyValue: 1500, 
    status: "active", 
    npsHistory: [
      { id: "nps-4-1", month: 12, year: 2025, score: 7, notes: "Quer mais entregas", recordedAt: "2025-12-10" },
    ],
    startDate: "2025-09-10", 
    notes: "" 
  },
  { 
    id: "5", 
    company: "Startup Innovation", 
    contact: "Carla Mendes", 
    email: "carla@startup.com", 
    phone: "(11) 95555-7890", 
    segment: "Tecnologia", 
    package: "Start", 
    monthlyValue: 3500, 
    status: "inactive", 
    npsHistory: [
      { id: "nps-5-1", month: 11, year: 2025, score: 6, notes: "Insatisfeita com entregas", recordedAt: "2025-11-05" },
      { id: "nps-5-2", month: 12, year: 2025, score: 5, notes: "Considerando cancelar", recordedAt: "2025-12-05" },
    ],
    startDate: "2025-10-05", 
    notes: "" 
  },
];

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
  const [clients, setClients] = useLocalStorage<Client[]>(STORAGE_KEY, initialClients);

  const addClient = useCallback(
    (data: Omit<Client, "id">) => {
      const newClient: Client = {
        ...data,
        id: crypto.randomUUID(),
      };
      setClients((prev) => [...prev, newClient]);
      return newClient;
    },
    [setClients]
  );

  const updateClient = useCallback(
    (id: string, data: Partial<Omit<Client, "id">>) => {
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
    (clientId: string, record: Omit<NPSRecord, "id">) => {
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
              i === existingIndex ? { ...r, ...record } : r
            );
          } else {
            // Add new record
            newHistory = [...client.npsHistory, { ...record, id: crypto.randomUUID() }];
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
    calculateClientNPS,
    getLatestNPS,
  };
}
