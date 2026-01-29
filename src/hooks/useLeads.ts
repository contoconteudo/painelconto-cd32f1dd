/**
 * Hook para gerenciar leads do CRM.
 * Integra com Supabase para CRUD de leads.
 */

import { useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { Lead, LeadStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { DEMO_MODE, demoStore } from "@/data/mockData";

export function useLeads() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // DEMO: usar useSyncExternalStore para reagir a mudanças no demoStore
  const demoLeads = useSyncExternalStore(
    (callback) => demoStore.subscribe(callback),
    () => demoStore.leads,
    () => demoStore.leads
  );

  // Filtrar leads pelo espaço atual
  const leads = useMemo(() => {
    if (DEMO_MODE) {
      return currentCompany 
        ? demoLeads.filter(l => l.space_id === currentCompany)
        : demoLeads;
    }
    // PRODUÇÃO: dados seriam carregados via query
    return [];
  }, [demoLeads, currentCompany]);

  const addLead = useCallback(async (
    data: Omit<Lead, "id" | "created_at" | "updated_at">
  ): Promise<Lead | null> => {
    if (DEMO_MODE) {
      const newLead: Lead = {
        ...data,
        id: `lead-${Date.now()}`,
        space_id: data.space_id || currentCompany || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      demoStore.addLead(newLead);
      toast.success("Lead criado com sucesso!");
      return newLead;
    }

    setIsLoading(true);
    try {
      const { data: newLead, error } = await supabase
        .from("leads")
        .insert({
          ...data,
          space_id: data.space_id || currentCompany,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Lead criado com sucesso!");
      return newLead as Lead;
    } catch (error: any) {
      toast.error("Erro ao criar lead: " + error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user?.id]);

  const updateLead = useCallback(async (
    id: string, 
    data: Partial<Omit<Lead, "id" | "created_at" | "updated_at">>
  ) => {
    if (DEMO_MODE) {
      demoStore.updateLead(id, { ...data, updated_at: new Date().toISOString() });
      toast.success("Lead atualizado!");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Lead atualizado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar lead: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    if (DEMO_MODE) {
      demoStore.deleteLead(id);
      toast.success("Lead excluído!");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Lead excluído!");
    } catch (error: any) {
      toast.error("Erro ao excluir lead: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const moveLeadToStatus = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    if (DEMO_MODE) {
      demoStore.updateLead(leadId, { status: newStatus, updated_at: new Date().toISOString() });
      return;
    }

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", leadId);

      if (error) throw error;
    } catch (error: any) {
      toast.error("Erro ao mover lead: " + error.message);
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
