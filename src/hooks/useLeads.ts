import { useLocalStorage } from "./useLocalStorage";
import { Lead, LeadStage, LeadTemperature } from "@/types";
import { useCallback } from "react";

const STORAGE_KEY = "conto-leads";

const initialLeads: Lead[] = [
  { id: "1", name: "Maria Silva", company: "Tech Startup", email: "maria@tech.com", phone: "(11) 99999-1111", value: 3500, temperature: "hot", origin: "Tráfego Pago", stage: "new", lastContact: "2026-01-26", notes: "", createdAt: "2026-01-20" },
  { id: "2", name: "Pedro Costa", company: "E-commerce X", email: "pedro@ecomm.com", phone: "(11) 99999-2222", value: 2800, temperature: "warm", origin: "Indicação", stage: "new", lastContact: "2026-01-25", notes: "", createdAt: "2026-01-18" },
  { id: "3", name: "Carla Mendes", company: "Clínica Saúde", email: "carla@clinica.com", phone: "(11) 99999-3333", value: 5500, temperature: "hot", origin: "Orgânico", stage: "new", lastContact: "2026-01-26", notes: "", createdAt: "2026-01-22" },
  { id: "4", name: "João Santos", company: "Corp Inc", email: "joao@corp.com", phone: "(11) 99999-4444", value: 4500, temperature: "warm", origin: "LinkedIn", stage: "contact", lastContact: "2026-01-24", notes: "", createdAt: "2026-01-15" },
  { id: "5", name: "Ana Lima", company: "Agency Pro", email: "ana@agency.com", phone: "(11) 99999-5555", value: 5500, temperature: "hot", origin: "Evento", stage: "contact", lastContact: "2026-01-26", notes: "", createdAt: "2026-01-10" },
  { id: "6", name: "Roberto Alves", company: "Startup Y", email: "roberto@startup.com", phone: "(11) 99999-6666", value: 5500, temperature: "hot", origin: "Outbound", stage: "proposal", lastContact: "2026-01-23", notes: "", createdAt: "2026-01-08" },
  { id: "7", name: "Fernanda Dias", company: "Loja Virtual", email: "fernanda@loja.com", phone: "(11) 99999-7777", value: 3000, temperature: "cold", origin: "Indicação", stage: "negotiation", lastContact: "2026-01-19", notes: "", createdAt: "2026-01-05" },
  { id: "8", name: "Lucas Pereira", company: "Tech Solutions", email: "lucas@tech.com", phone: "(11) 99999-8888", value: 5500, temperature: "hot", origin: "Tráfego Pago", stage: "won", lastContact: "2026-01-25", notes: "Fechou contrato Completão", createdAt: "2026-01-02" },
];

export function useLeads() {
  const [leads, setLeads] = useLocalStorage<Lead[]>(STORAGE_KEY, initialLeads);

  const addLead = useCallback(
    (data: Omit<Lead, "id" | "createdAt">) => {
      const newLead: Lead = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().split("T")[0],
      };
      setLeads((prev) => [...prev, newLead]);
      return newLead;
    },
    [setLeads]
  );

  const updateLead = useCallback(
    (id: string, data: Partial<Omit<Lead, "id" | "createdAt">>) => {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === id ? { ...lead, ...data } : lead))
      );
    },
    [setLeads]
  );

  const deleteLead = useCallback(
    (id: string) => {
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    },
    [setLeads]
  );

  const moveLeadToStage = useCallback(
    (id: string, stage: LeadStage) => {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? { ...lead, stage, lastContact: new Date().toISOString().split("T")[0] }
            : lead
        )
      );
    },
    [setLeads]
  );

  const getLeadsByStage = useCallback(
    (stage: LeadStage) => {
      return leads.filter((lead) => lead.stage === stage);
    },
    [leads]
  );

  const getPipelineStats = useCallback(() => {
    const activeLeads = leads.filter((l) => l.stage !== "lost");
    const totalValue = activeLeads.reduce((sum, l) => sum + l.value, 0);
    const proposalsSent = leads.filter((l) => ["proposal", "negotiation", "won"].includes(l.stage)).length;
    const won = leads.filter((l) => l.stage === "won");
    const conversionRate = leads.length > 0 ? Math.round((won.length / leads.length) * 100) : 0;
    const inNegotiation = leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length;

    return {
      totalLeads: activeLeads.length,
      totalValue,
      proposalsSent,
      conversionRate,
      inNegotiation,
      wonCount: won.length,
      wonValue: won.reduce((sum, l) => sum + l.value, 0),
    };
  }, [leads]);

  return {
    leads,
    addLead,
    updateLead,
    deleteLead,
    moveLeadToStage,
    getLeadsByStage,
    getPipelineStats,
  };
}
