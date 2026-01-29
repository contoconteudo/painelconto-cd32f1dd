import { useState, useEffect, useCallback, useMemo } from "react";
import { Client, NPSRecord, ClientStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

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

  // Carregar clientes do banco
  const loadClients = useCallback(async () => {
    if (!currentCompany) {
      setClients([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select(
          "id, space_id, name, company, email, phone, segment, status, monthly_value, contract_start, package, notes, created_by, created_at, updated_at"
        )
        .eq("space_id", currentCompany)
        .order("created_at", { ascending: false });

      if (clientsError) {
        console.error("Erro ao carregar clientes:", clientsError);
        toast.error("Erro ao carregar clientes.");
        return;
      }

      // Buscar NPS de todos os clientes
      const clientIds = (clientsData || []).map(c => c.id);
      let npsRecords: Record<string, NPSRecord[]> = {};

      if (clientIds.length > 0) {
        const { data: npsData } = await supabase
          .from("nps_records")
          .select("id, client_id, space_id, score, feedback, recorded_at, created_by")
          .eq("space_id", currentCompany)
          .in("client_id", clientIds);

        // Agrupar NPS por cliente
        (npsData || []).forEach(nps => {
          if (!nps.client_id) return;
          if (!npsRecords[nps.client_id]) {
            npsRecords[nps.client_id] = [];
          }
          npsRecords[nps.client_id].push({
            id: nps.id,
            client_id: nps.client_id,
            space_id: nps.space_id,
            score: nps.score,
            feedback: nps.feedback,
            recorded_at: nps.recorded_at,
            created_by: nps.created_by,
          });
        });
      }

      const mappedClients: Client[] = (clientsData || []).map(c => ({
        id: c.id,
        space_id: c.space_id,
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        segment: c.segment,
        status: c.status as ClientStatus,
        monthly_value: c.monthly_value,
        contract_start: c.contract_start,
        package: c.package || null,
        notes: c.notes,
        created_by: c.created_by,
        created_at: c.created_at,
        updated_at: c.updated_at,
        npsHistory: npsRecords[c.id] || [],
      }));

      setClients(mappedClients);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro inesperado ao carregar clientes.");
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const addClient = useCallback(async (
    data: Omit<Client, "id" | "created_at" | "updated_at" | "npsHistory">
  ): Promise<Client | null> => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para criar um cliente.");
      return null;
    }
    
    if (!currentCompany) {
      toast.error("Nenhum espaço selecionado. Selecione um espaço no menu.");
      return null;
    }

    try {
      const { data: newClient, error } = await supabase
        .from("clients")
        .insert({
          space_id: currentCompany,
          name: data.name,
          company: data.company || null,
          email: data.email || null,
          phone: data.phone || null,
          segment: data.segment || null,
          status: data.status || 'ativo',
          monthly_value: data.monthly_value || null,
          contract_start: data.contract_start || null,
          package: data.package || null,
          notes: data.notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar cliente:", error);
        toast.error("Erro ao criar cliente: " + (error.message || "Tente novamente."));
        return null;
      }

      const mappedClient: Client = {
        ...newClient,
        status: newClient.status as ClientStatus,
        npsHistory: [],
      };

      setClients(prev => [mappedClient, ...prev]);
      toast.success("Cliente criado com sucesso!");
      return mappedClient;
    } catch (error) {
      console.error("Erro inesperado ao criar cliente:", error);
      toast.error("Erro inesperado. Verifique sua conexão.");
      return null;
    }
  }, [user?.id, currentCompany]);

  const updateClient = useCallback(async (
    id: string, 
    data: Partial<Omit<Client, "id" | "created_at" | "updated_at">>
  ) => {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.segment !== undefined) updateData.segment = data.segment;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.monthly_value !== undefined) updateData.monthly_value = data.monthly_value;
    if (data.contract_start !== undefined) updateData.contract_start = data.contract_start;
    if (data.package !== undefined) updateData.package = data.package;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente. Tente novamente.");
      return;
    }

    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...data } : client
    ));
    toast.success("Cliente atualizado com sucesso!");
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente. Tente novamente.");
      return;
    }

    setClients(prev => prev.filter(client => client.id !== id));
    toast.success("Cliente excluído com sucesso!");
  }, []);

  const addNPSRecord = useCallback(async (
    clientId: string, 
    record: { score: number; feedback?: string }
  ) => {
    if (!currentCompany || !user?.id) {
      toast.error("Erro de autenticação.");
      return;
    }

    try {
      const { data: newRecord, error } = await supabase
        .from("nps_records")
        .insert({
          client_id: clientId,
          space_id: currentCompany,
          score: record.score,
          feedback: record.feedback || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar NPS:", error);
        toast.error("Erro ao registrar NPS.");
        return;
      }

      const mappedRecord: NPSRecord = {
        id: newRecord.id,
        client_id: clientId,
        space_id: newRecord.space_id,
        score: newRecord.score,
        feedback: newRecord.feedback,
        recorded_at: newRecord.recorded_at,
        created_by: newRecord.created_by,
      };

      setClients(prev => prev.map(client => {
        if (client.id !== clientId) return client;
        return { 
          ...client, 
          npsHistory: [...(client.npsHistory || []), mappedRecord] 
        };
      }));
      
      toast.success("NPS registrado com sucesso!");
      return mappedRecord;
    } catch (error) {
      console.error("Erro inesperado ao criar NPS:", error);
      toast.error("Erro inesperado.");
      return null;
    }
  }, [currentCompany, user?.id]);

  const deleteNPSRecord = useCallback(async (clientId: string, recordId: string) => {
    const { error } = await supabase
      .from("nps_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      console.error("Erro ao excluir NPS:", error);
      toast.error("Erro ao excluir NPS.");
      return;
    }

    setClients(prev => prev.map(client => {
      if (client.id !== clientId) return client;
      return {
        ...client,
        npsHistory: (client.npsHistory || []).filter(r => r.id !== recordId),
      };
    }));
    
    toast.success("NPS removido com sucesso!");
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
