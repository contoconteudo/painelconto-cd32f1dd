import { useLocalStorage } from "./useLocalStorage";
import { Lead, LeadStage } from "@/types";
import { useCallback, useEffect } from "react";
import { STORAGE_KEYS, AUTOMATION_CONFIG } from "@/lib/constants";

// Dados iniciais vazios - pronto para dados reais
const initialLeads: Lead[] = [];

export function useLeads() {
  const [leads, setLeads] = useLocalStorage<Lead[]>(STORAGE_KEYS.LEADS, initialLeads);

  const addLead = useCallback(
    (data: Omit<Lead, "id" | "createdAt" | "stageChangedAt">) => {
      const now = new Date().toISOString();
      const newLead: Lead = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now.split("T")[0],
        stageChangedAt: now,
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
      const now = new Date().toISOString();
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? { ...lead, stage, lastContact: now.split("T")[0], stageChangedAt: now }
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

  // Automação: mover leads de "proposal" para "followup" após período configurado
  useEffect(() => {
    const checkAndMoveLeads = () => {
      const now = new Date().getTime();
      const thresholdMs = AUTOMATION_CONFIG.PROPOSAL_TO_FOLLOWUP_HOURS * 60 * 60 * 1000;

      setLeads((prevLeads) => {
        let changed = false;
        const updatedLeads = prevLeads.map((lead) => {
          if (lead.stage === "proposal") {
            const stageTime = new Date(lead.stageChangedAt).getTime();
            if (now - stageTime >= thresholdMs) {
              changed = true;
              return { 
                ...lead, 
                stage: "followup" as LeadStage, 
                stageChangedAt: new Date().toISOString() 
              };
            }
          }
          return lead;
        });
        return changed ? updatedLeads : prevLeads;
      });
    };

    // Verificar imediatamente ao carregar
    checkAndMoveLeads();

    // Verificar no intervalo configurado
    const interval = setInterval(checkAndMoveLeads, AUTOMATION_CONFIG.AUTOMATION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [setLeads]);

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
