/**
 * Hook para gerenciar Leads - MODO MOCK
 * 
 * TODO: Conectar Supabase depois
 * Atualmente usa localStorage para persistência.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { useCompany } from "@/contexts/CompanyContext";
import { Lead, LeadStage } from "@/types";
import { MOCK_LEADS } from "@/data/mockData";
import { AUTOMATION_CONFIG, STORAGE_KEYS } from "@/lib/constants";

// Obter leads do localStorage
const getStoredLeads = (): Lead[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (stored) {
      return JSON.parse(stored);
    }
    // Salvar leads mock se não existir
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(MOCK_LEADS));
    return MOCK_LEADS;
  } catch {
    return MOCK_LEADS;
  }
};

// Salvar leads no localStorage
const saveLeads = (leads: Lead[]) => {
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
};

export function useLeads() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [allLeads, setAllLeads] = useState<Lead[]>(getStoredLeads);
  const [isLoading, setIsLoading] = useState(false);

  // Salvar sempre que mudar
  useEffect(() => {
    saveLeads(allLeads);
  }, [allLeads]);

  // Filtrar leads pelo espaço atual
  const leads = useMemo(() => {
    return allLeads.filter((lead) => lead.company_id === currentCompany);
  }, [allLeads, currentCompany]);

  const addLead = useCallback(
    async (data: Omit<Lead, "id" | "createdAt" | "stageChangedAt" | "project_id" | "user_id" | "company_id">) => {
      if (!user?.id) return null;

      const now = new Date().toISOString();
      const newLead: Lead = {
        ...data,
        id: `lead-${Date.now()}`,
        project_id: "default",
        user_id: user.id,
        company_id: currentCompany,
        createdAt: now.split("T")[0],
        stageChangedAt: now,
        stage: data.stage || "new",
      };

      setAllLeads((prev) => [newLead, ...prev]);
      return newLead;
    },
    [user?.id, currentCompany]
  );

  const updateLead = useCallback(
    async (id: string, data: Partial<Omit<Lead, "id" | "createdAt" | "project_id" | "user_id" | "company_id">>) => {
      setAllLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== id) return lead;
          
          const updated = { ...lead, ...data };
          
          // Atualizar stageChangedAt se o stage mudou
          if (data.stage && data.stage !== lead.stage) {
            updated.stageChangedAt = new Date().toISOString();
          }
          
          return updated;
        })
      );
    },
    []
  );

  const deleteLead = useCallback(async (id: string) => {
    setAllLeads((prev) => prev.filter((lead) => lead.id !== id));
  }, []);

  const moveLeadToStage = useCallback(
    async (id: string, stage: LeadStage) => {
      const now = new Date().toISOString();
      setAllLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? { ...lead, stage, lastContact: now.split("T")[0], stageChangedAt: now }
            : lead
        )
      );
    },
    []
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
    const proposalsSent = leads.filter((l) =>
      ["proposal", "negotiation", "won"].includes(l.stage)
    ).length;
    const won = leads.filter((l) => l.stage === "won");
    const conversionRate =
      leads.length > 0 ? Math.round((won.length / leads.length) * 100) : 0;
    const inNegotiation = leads.filter(
      (l) => l.stage !== "won" && l.stage !== "lost"
    ).length;

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

  // Automação: mover leads de "proposal" para "followup"
  useEffect(() => {
    if (!user?.id) return;

    const checkAndMoveLeads = () => {
      const now = new Date().getTime();
      const thresholdMs = AUTOMATION_CONFIG.PROPOSAL_TO_FOLLOWUP_HOURS * 60 * 60 * 1000;

      setAllLeads((prev) =>
        prev.map((lead) => {
          if (lead.stage !== "proposal") return lead;
          const stageTime = new Date(lead.stageChangedAt).getTime();
          if (now - stageTime >= thresholdMs) {
            return {
              ...lead,
              stage: "followup" as LeadStage,
              stageChangedAt: new Date().toISOString(),
            };
          }
          return lead;
        })
      );
    };

    checkAndMoveLeads();
    const interval = setInterval(checkAndMoveLeads, AUTOMATION_CONFIG.AUTOMATION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user?.id]);

  // Refetch (compatibilidade)
  const refetch = useCallback(() => {
    setAllLeads(getStoredLeads());
  }, []);

  return {
    leads,
    isLoading,
    addLead,
    updateLead,
    deleteLead,
    moveLeadToStage,
    getLeadsByStage,
    getPipelineStats,
    refetch,
  };
}
