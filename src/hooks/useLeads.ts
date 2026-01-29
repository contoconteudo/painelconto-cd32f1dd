import { useState, useEffect, useCallback } from "react";
import { Lead, LeadStatus, LeadTemperature } from "@/types";
// import { supabase } from "@/integrations/supabase/client"; // Comentado para DEMO
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { DEMO_MODE, MOCK_LEADS } from "@/data/mockData";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  // Carregar leads - MODO DEMO
  const loadLeads = useCallback(async () => {
    setIsLoading(true);

    // MODO DEMO: retorna dados mock filtrados por espaço
    if (DEMO_MODE) {
      const filteredLeads = currentCompany 
        ? MOCK_LEADS.filter(l => l.space_id === currentCompany)
        : MOCK_LEADS;
      setLeads(filteredLeads);
      setIsLoading(false);
      return;
    }

    // Código real comentado para DEMO
    /*
    if (!currentCompany) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id, space_id, name, company, email, phone, status, source, value, temperature, notes, created_by, created_at, updated_at")
        .eq("space_id", currentCompany)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar leads:", error);
        toast.error("Erro ao carregar leads.");
        return;
      }

      const mappedLeads: Lead[] = (data || []).map(l => ({
        id: l.id,
        space_id: l.space_id,
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        status: l.status as LeadStatus,
        source: l.source,
        value: l.value,
        temperature: (l.temperature as LeadTemperature) || 'warm',
        notes: l.notes,
        created_by: l.created_by,
        created_at: l.created_at,
        updated_at: l.updated_at,
      }));

      setLeads(mappedLeads);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      toast.error("Erro inesperado ao carregar leads.");
    } finally {
      setIsLoading(false);
    }
    */
    setIsLoading(false);
  }, [currentCompany]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const addLead = useCallback(async (
    data: Omit<Lead, "id" | "created_at" | "updated_at">
  ): Promise<Lead | null> => {
    // MODO DEMO: adiciona localmente
    if (DEMO_MODE) {
      const newLead: Lead = {
        ...data,
        id: `lead-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLeads(prev => [newLead, ...prev]);
      toast.success("Lead criado com sucesso! (DEMO)");
      return newLead;
    }

    toast.error("Modo produção desativado.");
    return null;
  }, []);

  const updateLead = useCallback(async (
    id: string, 
    data: Partial<Omit<Lead, "id" | "created_at" | "updated_at">>
  ) => {
    // MODO DEMO: atualiza localmente
    if (DEMO_MODE) {
      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, ...data, updated_at: new Date().toISOString() } : lead
      ));
      toast.success("Lead atualizado! (DEMO)");
      return;
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    // MODO DEMO: remove localmente
    if (DEMO_MODE) {
      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success("Lead excluído! (DEMO)");
      return;
    }
  }, []);

  const moveLeadToStatus = useCallback(async (id: string, status: LeadStatus) => {
    // MODO DEMO: atualiza status localmente
    if (DEMO_MODE) {
      setLeads(prev => prev.map(lead =>
        lead.id === id ? { ...lead, status } : lead
      ));
      return;
    }
  }, []);

  const getLeadsByStatus = useCallback((status: LeadStatus) => {
    return leads.filter(lead => lead.status === status);
  }, [leads]);

  const getPipelineStats = useCallback(() => {
    const activeLeads = leads.filter(l => l.status !== "perdido");
    const totalValue = activeLeads.reduce((sum, l) => sum + (l.value || 0), 0);
    const proposalsSent = leads.filter(l => 
      ["proposta", "negociacao", "ganho"].includes(l.status)
    ).length;
    const won = leads.filter(l => l.status === "ganho");
    const conversionRate = leads.length > 0 
      ? Math.round((won.length / leads.length) * 100) 
      : 0;
    const inNegotiation = leads.filter(l => 
      l.status !== "ganho" && l.status !== "perdido"
    ).length;

    return {
      totalLeads: activeLeads.length,
      totalValue,
      proposalsSent,
      conversionRate,
      inNegotiation,
      wonCount: won.length,
      wonValue: won.reduce((sum, l) => sum + (l.value || 0), 0),
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
    refreshLeads: loadLeads,
  };
}
