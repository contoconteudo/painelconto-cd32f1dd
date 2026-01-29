import { useState, useEffect, useCallback, useMemo } from "react";
import { Client, NPSRecord, ClientStatus } from "@/types";
// import { supabase } from "@/integrations/supabase/client"; // Comentado para DEMO
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { DEMO_MODE, MOCK_CLIENTS } from "@/data/mockData";

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
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  // Carregar clientes - MODO DEMO
  const loadClients = useCallback(async () => {
    setIsLoading(true);

    // MODO DEMO: retorna dados mock filtrados por espaço
    if (DEMO_MODE) {
      const filteredClients = currentCompany 
        ? MOCK_CLIENTS.filter(c => c.space_id === currentCompany)
        : MOCK_CLIENTS;
      setClients(filteredClients);
      setIsLoading(false);
      return;
    }

    // Código real comentado para DEMO
    setIsLoading(false);
  }, [currentCompany]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const addClient = useCallback(async (
    data: Omit<Client, "id" | "created_at" | "updated_at" | "npsHistory">
  ): Promise<Client | null> => {
    // MODO DEMO: adiciona localmente
    if (DEMO_MODE) {
      const newClient: Client = {
        ...data,
        id: `client-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        npsHistory: [],
      };
      setClients(prev => [newClient, ...prev]);
      toast.success("Cliente criado com sucesso! (DEMO)");
      return newClient;
    }

    toast.error("Modo produção desativado.");
    return null;
  }, []);

  const updateClient = useCallback(async (
    id: string, 
    data: Partial<Omit<Client, "id" | "created_at" | "updated_at">>
  ) => {
    // MODO DEMO: atualiza localmente
    if (DEMO_MODE) {
      setClients(prev => prev.map(client => 
        client.id === id ? { ...client, ...data, updated_at: new Date().toISOString() } : client
      ));
      toast.success("Cliente atualizado! (DEMO)");
      return;
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    // MODO DEMO: remove localmente
    if (DEMO_MODE) {
      setClients(prev => prev.filter(client => client.id !== id));
      toast.success("Cliente excluído! (DEMO)");
      return;
    }
  }, []);

  const addNPSRecord = useCallback(async (
    clientId: string, 
    record: { score: number; feedback?: string }
  ) => {
    // MODO DEMO: adiciona NPS localmente
    if (DEMO_MODE) {
      const newRecord: NPSRecord = {
        id: `nps-${Date.now()}`,
        client_id: clientId,
        space_id: currentCompany || "conto",
        score: record.score,
        feedback: record.feedback || null,
        recorded_at: new Date().toISOString(),
        created_by: user?.id || "demo-admin-001",
      };

      setClients(prev => prev.map(client => {
        if (client.id !== clientId) return client;
        return { 
          ...client, 
          npsHistory: [...(client.npsHistory || []), newRecord] 
        };
      }));
      
      toast.success("NPS registrado! (DEMO)");
      return newRecord;
    }

    return null;
  }, [currentCompany, user?.id]);

  const deleteNPSRecord = useCallback(async (clientId: string, recordId: string) => {
    // MODO DEMO: remove NPS localmente
    if (DEMO_MODE) {
      setClients(prev => prev.map(client => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          npsHistory: (client.npsHistory || []).filter(r => r.id !== recordId),
        };
      }));
      
      toast.success("NPS removido! (DEMO)");
      return;
    }
  }, []);

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
    refreshClients: loadClients,
  };
}
