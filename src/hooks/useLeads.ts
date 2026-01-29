import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { Lead, LeadStatus } from "@/types";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { DEMO_MODE, demoStore } from "@/data/mockData";

export function useLeads() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  // Usar useSyncExternalStore para reagir a mudanças no demoStore
  const allLeads = useSyncExternalStore(
    (callback) => demoStore.subscribe(callback),
    () => demoStore.leads,
    () => demoStore.leads
  );

  // Filtrar leads pelo espaço atual
  const leads = useMemo(() => {
    if (!DEMO_MODE) return [];
    return currentCompany 
      ? allLeads.filter(l => l.space_id === currentCompany)
      : allLeads;
  }, [allLeads, currentCompany]);

  const [isLoading, setIsLoading] = useState(false);

  const addLead = useCallback(async (
    data: Omit<Lead, "id" | "created_at" | "updated_at">
  ): Promise<Lead | null> => {
    if (DEMO_MODE) {
      const newLead: Lead = {
        ...data,
        id: `lead-${Date.now()}`,
        space_id: data.space_id || currentCompany || "conto",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      demoStore.addLead(newLead);
      toast.success("Lead criado com sucesso! (DEMO)");
      return newLead;
    }
    toast.error("Modo produção desativado.");
    return null;
  }, [currentCompany]);

  const updateLead = useCallback(async (
    id: string, 
    data: Partial<Omit<Lead, "id" | "created_at" | "updated_at">>
  ) => {
    if (DEMO_MODE) {
      demoStore.updateLead(id, { ...data, updated_at: new Date().toISOString() });
      toast.success("Lead atualizado! (DEMO)");
      return;
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    if (DEMO_MODE) {
      demoStore.deleteLead(id);
      toast.success("Lead excluído! (DEMO)");
      return;
    }
  }, []);

  const moveLeadToStatus = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    if (DEMO_MODE) {
      demoStore.updateLead(leadId, { status: newStatus, updated_at: new Date().toISOString() });
      return;
    }
  }, []);

  const getLeadsByStatus = useCallback((status: LeadStatus) => {
    return leads.filter(lead => lead.status === status);
  }, [leads]);

  const getPipelineStats = useCallback(() => {
    const activeStatuses: LeadStatus[] = ["novo", "contato", "reuniao_agendada", "reuniao_feita", "proposta", "negociacao"];
    const activeLeads = leads.filter(l => activeStatuses.includes(l.status));
    const wonLeads = leads.filter(l => l.status === "ganho");
    const proposalLeads = leads.filter(l => ["proposta", "negociacao", "ganho"].includes(l.status));
    const totalLeads = leads.length;
    
    return {
      totalLeads: activeLeads.length,
      totalValue: activeLeads.reduce((sum, l) => sum + (l.value || 0), 0),
      inNegotiation: activeLeads.length,
      proposalsSent: proposalLeads.length,
      conversionRate: totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0,
      wonCount: wonLeads.length,
      wonValue: wonLeads.reduce((sum, l) => sum + (l.value || 0), 0),
    };
  }, [leads]);

  return {
    leads,
    isLoading,
    addLead,
    updateLead,
    deleteLead,
    moveLeadToStatus,
    getLeadsByStatus,
    getPipelineStats,
  };
}