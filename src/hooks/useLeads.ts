/**
 * Hook para gerenciar leads do CRM.
 * Integra diretamente com Supabase.
 */

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead, LeadStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const QUERY_KEY = "leads";

export function useLeads() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar leads do espaço atual
  const { data: leads = [], isLoading } = useQuery({
    queryKey: [QUERY_KEY, currentCompany],
    queryFn: async () => {
      if (!currentCompany) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("space_id", currentCompany)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!currentCompany,
  });

  // Mutation para adicionar lead
  const addMutation = useMutation({
    mutationFn: async (data: Omit<Lead, "id" | "created_at" | "updated_at">) => {
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
      return newLead as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      toast.success("Lead criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar lead: " + error.message);
    },
  });

  // Mutation para atualizar lead
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const { error } = await supabase
        .from("leads")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      toast.success("Lead atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar lead: " + error.message);
    },
  });

  // Mutation para deletar lead
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      toast.success("Lead excluído!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir lead: " + error.message);
    },
  });

  const addLead = useCallback(async (
    data: Omit<Lead, "id" | "created_at" | "updated_at">
  ): Promise<Lead | null> => {
    try {
      return await addMutation.mutateAsync(data);
    } catch {
      return null;
    }
  }, [addMutation]);

  const updateLead = useCallback(async (
    id: string, 
    data: Partial<Omit<Lead, "id" | "created_at" | "updated_at">>
  ) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteLead = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const moveLeadToStatus = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    await updateMutation.mutateAsync({ 
      id: leadId, 
      data: { status: newStatus } 
    });
  }, [updateMutation]);

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
