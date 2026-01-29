/**
 * Hook para gerenciar clientes.
 * Integra com Supabase para CRUD de clientes e NPS.
 */

import { useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { Client, NPSRecord, ClientStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { DEMO_MODE, demoStore } from "@/data/mockData";

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
  const [isLoading, setIsLoading] = useState(false);

  // DEMO: usar useSyncExternalStore para reagir a mudanças no demoStore
  const demoClients = useSyncExternalStore(
    (callback) => demoStore.subscribe(callback),
    () => demoStore.clients,
    () => demoStore.clients
  );

  // Filtrar clientes pelo espaço atual
  const clients = useMemo(() => {
    if (DEMO_MODE) {
      return currentCompany 
        ? demoClients.filter(c => c.space_id === currentCompany)
        : demoClients;
    }
    return [];
  }, [demoClients, currentCompany]);

  const addClient = useCallback(async (
    data: Omit<Client, "id" | "created_at" | "updated_at" | "npsHistory">
  ): Promise<Client | null> => {
    if (DEMO_MODE) {
      const newClient: Client = {
        ...data,
        id: `client-${Date.now()}`,
        space_id: data.space_id || currentCompany || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        npsHistory: [],
      };
      demoStore.addClient(newClient);
      toast.success("Cliente criado com sucesso!");
      return newClient;
    }

    setIsLoading(true);
    try {
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
      toast.success("Cliente criado com sucesso!");
      return { ...newClient, npsHistory: [] } as Client;
    } catch (error: any) {
      toast.error("Erro ao criar cliente: " + error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, user?.id]);

  const updateClient = useCallback(async (
    id: string, 
    data: Partial<Omit<Client, "id" | "created_at" | "updated_at">>
  ) => {
    if (DEMO_MODE) {
      demoStore.updateClient(id, { ...data, updated_at: new Date().toISOString() });
      toast.success("Cliente atualizado!");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Cliente atualizado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar cliente: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    if (DEMO_MODE) {
      demoStore.deleteClient(id);
      toast.success("Cliente excluído!");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Cliente excluído!");
    } catch (error: any) {
      toast.error("Erro ao excluir cliente: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addNPSRecord = useCallback(async (
    clientId: string, 
    record: { score: number; feedback?: string; month?: number; year?: number }
  ) => {
    const month = record.month ?? new Date().getMonth();
    const year = record.year ?? new Date().getFullYear();
    const recordedDate = new Date(year, month, 1);

    if (DEMO_MODE) {
      const newRecord: NPSRecord = {
        id: `nps-${Date.now()}`,
        client_id: clientId,
        space_id: currentCompany || "",
        score: record.score,
        feedback: record.feedback || null,
        recorded_at: recordedDate.toISOString(),
        created_by: user?.id || "",
      };

      const client = demoClients.find(c => c.id === clientId);
      if (client) {
        demoStore.updateClient(clientId, {
          npsHistory: [...(client.npsHistory || []), newRecord],
        });
      }
      
      toast.success("NPS registrado!");
      return newRecord;
    }

    try {
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
      toast.success("NPS registrado!");
      return data as NPSRecord;
    } catch (error: any) {
      toast.error("Erro ao registrar NPS: " + error.message);
      return null;
    }
  }, [currentCompany, user?.id, demoClients]);

  const deleteNPSRecord = useCallback(async (clientId: string, recordId: string) => {
    if (DEMO_MODE) {
      const client = demoClients.find(c => c.id === clientId);
      if (client) {
        demoStore.updateClient(clientId, {
          npsHistory: (client.npsHistory || []).filter(r => r.id !== recordId),
        });
      }
      toast.success("NPS removido!");
      return;
    }

    try {
      const { error } = await supabase
        .from("nps_records")
        .delete()
        .eq("id", recordId);

      if (error) throw error;
      toast.success("NPS removido!");
    } catch (error: any) {
      toast.error("Erro ao remover NPS: " + error.message);
    }
  }, [demoClients]);

  const getStats = useCallback(() => {
    const activeClients = clients.filter(c => c.status === "ativo");
    const totalMRR = activeClients.reduce((sum, c) => sum + (c.monthly_value || 0), 0);
    const avgTicket = activeClients.length > 0 
      ? Math.round(totalMRR / activeClients.length) 
      : 0;
    
    const allNPSScores = clients.flatMap(c => 
      (c.npsHistory || []).filter(r => r.score !== null).map(r => r.score as number)
    );
    const avgNPS = allNPSScores.length > 0 
      ? Math.round((allNPSScores.reduce((sum, s) => sum + s, 0) / allNPSScores.length) * 10) / 10 
      : 0;

    return {
      activeCount: activeClients.length,
      inactiveCount: clients.filter(c => c.status === "inativo").length,
      churnCount: clients.filter(c => c.status === "churn").length,
      totalMRR,
      avgTicket,
      avgNPS,
    };
  }, [clients]);

  const clientsWithNPSInfo = useMemo(() => {
    return clients.map(client => ({
      ...client,
      latestNPS: getLatestNPS(client.npsHistory || []),
      avgNPS: calculateClientNPS(client.npsHistory || []),
    }));
  }, [clients]);

  return {
    clients,
    clientsWithNPSInfo,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    addNPSRecord,
    deleteNPSRecord,
    getStats,
    refreshClients: () => {},
  };
}
