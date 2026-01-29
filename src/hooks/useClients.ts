/**
 * Hook para gerenciar clientes.
 * Integra diretamente com Supabase.
 */

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Client, NPSRecord } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const QUERY_KEY = "clients";
const NPS_QUERY_KEY = "nps_records";

// Helper function to calculate average NPS from history
export function calculateClientNPS(npsHistory: NPSRecord[]): number {
  if (!npsHistory || npsHistory.length === 0) return 0;
  const validScores = npsHistory.filter(r => r.score !== null);
  if (validScores.length === 0) return 0;
  const sum = validScores.reduce((acc, record) => acc + (record.score || 0), 0);
  return Math.round((sum / validScores.length) * 10) / 10;
}

// Helper function to get the latest NPS score
export function getLatestNPS(npsHistory: NPSRecord[]): number | null {
  if (!npsHistory || npsHistory.length === 0) return null;
  const sorted = [...npsHistory].sort((a, b) => 
    new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  return sorted[0].score;
}

export function useClients() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar clientes do espaço atual
  const { data: clients = [], isLoading } = useQuery({
    queryKey: [QUERY_KEY, currentCompany],
    queryFn: async () => {
      if (!currentCompany) return [];
      
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("space_id", currentCompany)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!currentCompany,
  });

  // Query para buscar NPS records
  const { data: npsRecords = [] } = useQuery({
    queryKey: [NPS_QUERY_KEY, currentCompany],
    queryFn: async () => {
      if (!currentCompany) return [];
      
      const { data, error } = await supabase
        .from("nps_records")
        .select("*")
        .eq("space_id", currentCompany)
        .order("recorded_at", { ascending: false });

      if (error) throw error;
      return data as NPSRecord[];
    },
    enabled: !!currentCompany,
  });

  // Combinar clientes com histórico de NPS
  const clientsWithNPS = useMemo(() => {
    return clients.map(client => ({
      ...client,
      npsHistory: npsRecords.filter(r => r.client_id === client.id),
    }));
  }, [clients, npsRecords]);

  // Mutation para adicionar cliente
  const addMutation = useMutation({
    mutationFn: async (data: Omit<Client, "id" | "created_at" | "updated_at" | "npsHistory">) => {
      const { data: newClient, error } = await supabase
        .from("clients")
        .insert({
          ...data,
          space_id: data.space_id || currentCompany,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return newClient as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar cliente: " + error.message);
    },
  });

  // Mutation para atualizar cliente
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const { error } = await supabase
        .from("clients")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      toast.success("Cliente atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar cliente: " + error.message);
    },
  });

  // Mutation para deletar cliente
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
      toast.success("Cliente excluído!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir cliente: " + error.message);
    },
  });

  // Mutation para adicionar NPS
  const addNPSMutation = useMutation({
    mutationFn: async ({ clientId, record }: { 
      clientId: string; 
      record: { score: number; feedback?: string; month?: number; year?: number } 
    }) => {
      const month = record.month ?? new Date().getMonth();
      const year = record.year ?? new Date().getFullYear();
      const recordedDate = new Date(year, month, 1);

      const { data, error } = await supabase
        .from("nps_records")
        .insert({
          client_id: clientId,
          space_id: currentCompany,
          score: record.score,
          feedback: record.feedback,
          recorded_at: recordedDate.toISOString(),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as NPSRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NPS_QUERY_KEY, currentCompany] });
      toast.success("NPS registrado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao registrar NPS: " + error.message);
    },
  });

  // Mutation para deletar NPS
  const deleteNPSMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from("nps_records")
        .delete()
        .eq("id", recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NPS_QUERY_KEY, currentCompany] });
      toast.success("NPS removido!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover NPS: " + error.message);
    },
  });

  const addClient = useCallback(async (
    data: Omit<Client, "id" | "created_at" | "updated_at" | "npsHistory">
  ): Promise<Client | null> => {
    try {
      return await addMutation.mutateAsync(data);
    } catch {
      return null;
    }
  }, [addMutation]);

  const updateClient = useCallback(async (
    id: string, 
    data: Partial<Omit<Client, "id" | "created_at" | "updated_at">>
  ) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteClient = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const addNPSRecord = useCallback(async (
    clientId: string, 
    record: { score: number; feedback?: string; month?: number; year?: number }
  ) => {
    try {
      return await addNPSMutation.mutateAsync({ clientId, record });
    } catch {
      return null;
    }
  }, [addNPSMutation]);

  const deleteNPSRecord = useCallback(async (_clientId: string, recordId: string) => {
    await deleteNPSMutation.mutateAsync(recordId);
  }, [deleteNPSMutation]);

  const getStats = useCallback(() => {
    const activeClients = clientsWithNPS.filter(c => c.status === "ativo");
    const totalMRR = activeClients.reduce((sum, c) => sum + (c.monthly_value || 0), 0);
    const avgTicket = activeClients.length > 0 
      ? Math.round(totalMRR / activeClients.length) 
      : 0;
    
    const allNPSScores = npsRecords
      .filter(r => r.score !== null)
      .map(r => r.score as number);
    const avgNPS = allNPSScores.length > 0 
      ? Math.round((allNPSScores.reduce((sum, s) => sum + s, 0) / allNPSScores.length) * 10) / 10 
      : 0;

    return {
      activeCount: activeClients.length,
      inactiveCount: clientsWithNPS.filter(c => c.status === "inativo").length,
      churnCount: clientsWithNPS.filter(c => c.status === "churn").length,
      totalMRR,
      avgTicket,
      avgNPS,
    };
  }, [clientsWithNPS, npsRecords]);

  const clientsWithNPSInfo = useMemo(() => {
    return clientsWithNPS.map(client => ({
      ...client,
      latestNPS: getLatestNPS(client.npsHistory || []),
      avgNPS: calculateClientNPS(client.npsHistory || []),
    }));
  }, [clientsWithNPS]);

  const refreshClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentCompany] });
    queryClient.invalidateQueries({ queryKey: [NPS_QUERY_KEY, currentCompany] });
  }, [queryClient, currentCompany]);

  return {
    clients: clientsWithNPS,
    clientsWithNPSInfo,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    addNPSRecord,
    deleteNPSRecord,
    getStats,
    refreshClients,
  };
}
