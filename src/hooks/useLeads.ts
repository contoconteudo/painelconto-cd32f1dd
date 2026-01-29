import { useState, useEffect, useCallback } from "react";
import { Lead, LeadStatus, LeadTemperature } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  // Carregar leads do banco
  const loadLeads = useCallback(async () => {
    if (!currentCompany) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("leads")
        .select(
          "id, space_id, name, company, email, phone, status, source, value, temperature, notes, created_by, created_at, updated_at"
        )
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
  }, [currentCompany]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const addLead = useCallback(async (
    data: Omit<Lead, "id" | "created_at" | "updated_at">
  ): Promise<Lead | null> => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para criar um lead.");
      return null;
    }
    
    if (!currentCompany) {
      toast.error("Nenhum espaço selecionado.");
      return null;
    }
    
    try {
      const { data: newLead, error } = await supabase
        .from("leads")
        .insert({
          space_id: currentCompany,
          name: data.name,
          company: data.company || null,
          email: data.email || null,
          phone: data.phone || null,
          status: data.status || 'novo',
          source: data.source || null,
          value: data.value || null,
          temperature: data.temperature || 'warm',
          notes: data.notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar lead:", error);
        toast.error("Erro ao criar lead: " + (error.message || "Tente novamente."));
        return null;
      }

      const mappedLead: Lead = {
        ...newLead,
        status: newLead.status as LeadStatus,
      };

      setLeads(prev => [mappedLead, ...prev]);
      toast.success("Lead criado com sucesso!");
      return mappedLead;
    } catch (error) {
      console.error("Erro inesperado ao criar lead:", error);
      toast.error("Erro inesperado. Verifique sua conexão.");
      return null;
    }
  }, [user?.id, currentCompany]);

  const updateLead = useCallback(async (
    id: string, 
    data: Partial<Omit<Lead, "id" | "created_at" | "updated_at">>
  ) => {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar lead:", error);
      toast.error("Erro ao atualizar lead. Tente novamente.");
      return;
    }

    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...data } : lead
    ));
    toast.success("Lead atualizado com sucesso!");
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir lead:", error);
      toast.error("Erro ao excluir lead. Tente novamente.");
      return;
    }

    setLeads(prev => prev.filter(lead => lead.id !== id));
    toast.success("Lead excluído com sucesso!");
  }, []);

  const moveLeadToStatus = useCallback(async (id: string, status: LeadStatus) => {
    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Erro ao mover lead:", error);
      toast.error("Erro ao mover lead.");
      return;
    }

    setLeads(prev => prev.map(lead =>
      lead.id === id ? { ...lead, status } : lead
    ));
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
