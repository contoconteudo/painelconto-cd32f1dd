import { useState, useEffect, useCallback, useMemo } from "react";
import { Lead, LeadStage } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  // Carregar leads do banco - COM FAIL-SAFE
  const loadLeads = useCallback(async () => {
    // Se não tem empresa selecionada, retorna vazio imediatamente
    if (!currentCompany) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("space_id", currentCompany)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar leads:", error);
        return;
      }

      const mappedLeads: Lead[] = (data || []).map(l => ({
        id: l.id,
        project_id: "default",
        user_id: l.user_id,
        company_id: l.space_id,
        name: l.name,
        company: l.company,
        email: l.email || "",
        phone: l.phone || "",
        value: l.value || 0,
        temperature: l.temperature as Lead["temperature"],
        origin: l.origin || "",
        stage: l.stage as LeadStage,
        lastContact: l.last_contact || "",
        notes: l.notes || "",
        createdAt: l.created_at?.split("T")[0] || "",
        stageChangedAt: l.stage_changed_at || "",
      }));

      setLeads(mappedLeads);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  // Carregar leads na inicialização e quando mudar o espaço
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const addLead = useCallback(async (
    data: Omit<Lead, "id" | "createdAt" | "stageChangedAt" | "project_id" | "user_id" | "company_id">
  ): Promise<Lead | null> => {
    if (!user?.id || !currentCompany) return null;

    const now = new Date().toISOString();
    
    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({
        space_id: currentCompany,
        user_id: user.id,
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        value: data.value,
        temperature: data.temperature,
        origin: data.origin,
        stage: data.stage,
        last_contact: data.lastContact || now.split("T")[0],
        notes: data.notes,
        stage_changed_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar lead:", error);
      return null;
    }

    const mappedLead: Lead = {
      id: newLead.id,
      project_id: "default",
      user_id: newLead.user_id,
      company_id: newLead.space_id,
      name: newLead.name,
      company: newLead.company,
      email: newLead.email || "",
      phone: newLead.phone || "",
      value: newLead.value || 0,
      temperature: newLead.temperature as Lead["temperature"],
      origin: newLead.origin || "",
      stage: newLead.stage as LeadStage,
      lastContact: newLead.last_contact || "",
      notes: newLead.notes || "",
      createdAt: newLead.created_at?.split("T")[0] || "",
      stageChangedAt: newLead.stage_changed_at || "",
    };

    setLeads(prev => [mappedLead, ...prev]);
    return mappedLead;
  }, [user?.id, currentCompany]);

  const updateLead = useCallback(async (
    id: string, 
    data: Partial<Omit<Lead, "id" | "createdAt" | "project_id" | "user_id" | "company_id">>
  ) => {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.origin !== undefined) updateData.origin = data.origin;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.lastContact !== undefined) updateData.last_contact = data.lastContact;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.stageChangedAt !== undefined) updateData.stage_changed_at = data.stageChangedAt;

    const { error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar lead:", error);
      return;
    }

    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...data } : lead
    ));
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir lead:", error);
      return;
    }

    setLeads(prev => prev.filter(lead => lead.id !== id));
  }, []);

  const moveLeadToStage = useCallback(async (id: string, stage: LeadStage) => {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from("leads")
      .update({ 
        stage, 
        last_contact: now.split("T")[0],
        stage_changed_at: now 
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao mover lead:", error);
      return;
    }

    setLeads(prev => prev.map(lead =>
      lead.id === id
        ? { ...lead, stage, lastContact: now.split("T")[0], stageChangedAt: now }
        : lead
    ));
  }, []);

  const getLeadsByStage = useCallback((stage: LeadStage) => {
    return leads.filter(lead => lead.stage === stage);
  }, [leads]);

  const getPipelineStats = useCallback(() => {
    const activeLeads = leads.filter(l => l.stage !== "lost");
    const totalValue = activeLeads.reduce((sum, l) => sum + l.value, 0);
    const proposalsSent = leads.filter(l => 
      ["proposal", "negotiation", "won"].includes(l.stage)
    ).length;
    const won = leads.filter(l => l.stage === "won");
    const conversionRate = leads.length > 0 
      ? Math.round((won.length / leads.length) * 100) 
      : 0;
    const inNegotiation = leads.filter(l => 
      l.stage !== "won" && l.stage !== "lost"
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

  return {
    leads,
    isLoading,
    addLead,
    updateLead,
    deleteLead,
    moveLeadToStage,
    getLeadsByStage,
    getPipelineStats,
    refreshLeads: loadLeads,
  };
}
