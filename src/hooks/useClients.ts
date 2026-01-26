import { useLocalStorage } from "./useLocalStorage";
import { Client, ClientStatus } from "@/types";
import { useCallback } from "react";

const STORAGE_KEY = "conto-clients";

const initialClients: Client[] = [
  { id: "1", company: "Tech Solutions", contact: "Lucas Pereira", email: "lucas@tech.com", phone: "(11) 99999-1234", segment: "Tecnologia", package: "Completão", monthlyValue: 5500, status: "active", nps: 9, startDate: "2025-07-15", notes: "" },
  { id: "2", company: "Clínica Saúde+", contact: "Dr. Marcos Silva", email: "marcos@clinica.com", phone: "(11) 98888-5678", segment: "Saúde", package: "Start", monthlyValue: 3500, status: "active", nps: 8, startDate: "2025-08-01", notes: "" },
  { id: "3", company: "E-commerce Fashion", contact: "Ana Costa", email: "ana@fashion.com", phone: "(11) 97777-9012", segment: "Varejo", package: "Completão", monthlyValue: 5500, status: "active", nps: 10, startDate: "2025-05-20", notes: "" },
  { id: "4", company: "Escritório Advocacia", contact: "Dr. Roberto Alves", email: "roberto@adv.com", phone: "(11) 96666-3456", segment: "Serviços", package: "PF/Básico", monthlyValue: 1500, status: "active", nps: 7, startDate: "2025-09-10", notes: "" },
  { id: "5", company: "Startup Innovation", contact: "Carla Mendes", email: "carla@startup.com", phone: "(11) 95555-7890", segment: "Tecnologia", package: "Start", monthlyValue: 3500, status: "inactive", nps: 6, startDate: "2025-10-05", notes: "" },
];

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

  const getStats = useCallback(() => {
    const activeClients = clients.filter((c) => c.status === "active");
    const totalMRR = activeClients.reduce((sum, c) => sum + c.monthlyValue, 0);
    const avgTicket = activeClients.length > 0 ? Math.round(totalMRR / activeClients.length) : 0;
    const avgNPS = clients.length > 0 
      ? Math.round((clients.reduce((sum, c) => sum + c.nps, 0) / clients.length) * 10) / 10 
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

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    getStats,
  };
}
