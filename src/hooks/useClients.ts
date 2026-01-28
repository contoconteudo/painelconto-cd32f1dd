import { useState, useEffect, useCallback, useMemo } from "react";
import { Client, NPSRecord, ClientStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "./useAuth";

// Helper function to calculate average NPS from history
export function calculateClientNPS(npsHistory: NPSRecord[]): number {
  if (npsHistory.length === 0) return 0;
  const sum = npsHistory.reduce((acc, record) => acc + record.score, 0);
  return Math.round((sum / npsHistory.length) * 10) / 10;
}

// Helper function to get the latest NPS score
export function getLatestNPS(npsHistory: NPSRecord[]): number | null {
  if (npsHistory.length === 0) return null;
  const sorted = [...npsHistory].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
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

    try {
      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("space_id", currentCompany)
        .order("created_at", { ascending: false });

      if (clientsError) {
        console.error("Erro ao carregar clientes:", clientsError);
        return;
      }

      // Buscar NPS de todos os clientes
      const clientIds = (clientsData || []).map(c => c.id);
      let npsRecords: Record<string, NPSRecord[]> = {};

      if (clientIds.length > 0) {
        const { data: npsData } = await supabase
          .from("nps_records")
          .select("*")
          .in("client_id", clientIds);

        // Agrupar NPS por cliente
        (npsData || []).forEach(nps => {
          if (!npsRecords[nps.client_id]) {
            npsRecords[nps.client_id] = [];
          }
          npsRecords[nps.client_id].push({
            id: nps.id,
            client_id: nps.client_id,
            month: nps.month,
            year: nps.year,
            score: nps.score,
            notes: nps.notes || "",
            recordedAt: nps.recorded_at,
          });
        });
      }

      const mappedClients: Client[] = (clientsData || []).map(c => ({
        id: c.id,
        project_id: "default",
        user_id: c.user_id,
        company_id: c.space_id,
        company: c.company,
        contact: c.contact,
        email: c.email || "",
        phone: c.phone || "",
        segment: c.segment || "",
        package: c.package || "",
        monthlyValue: c.monthly_value || 0,
        status: c.status as ClientStatus,
        npsHistory: npsRecords[c.id] || [],
        startDate: c.start_date || "",
        notes: c.notes || "",
      }));

      setClients(mappedClients);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const addClient = useCallback(async (
    data: Omit<Client, "id" | "project_id" | "user_id" | "company_id" | "npsHistory">
  ): Promise<Client | null> => {
    if (!user?.id || !currentCompany) return null;

    const { data: newClient, error } = await supabase
      .from("clients")
      .insert({
        space_id: currentCompany,
        user_id: user.id,
        company: data.company,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        segment: data.segment,
        package: data.package,
        monthly_value: data.monthlyValue,
        status: data.status,
        start_date: data.startDate,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar cliente:", error);
      return null;
    }

    const mappedClient: Client = {
      id: newClient.id,
      project_id: "default",
      user_id: newClient.user_id,
      company_id: newClient.space_id,
      company: newClient.company,
      contact: newClient.contact,
      email: newClient.email || "",
      phone: newClient.phone || "",
      segment: newClient.segment || "",
      package: newClient.package || "",
      monthlyValue: newClient.monthly_value || 0,
      status: newClient.status as ClientStatus,
      npsHistory: [],
      startDate: newClient.start_date || "",
      notes: newClient.notes || "",
    };

    setClients(prev => [mappedClient, ...prev]);
    return mappedClient;
  }, [user?.id, currentCompany]);

  const updateClient = useCallback(async (
    id: string, 
    data: Partial<Omit<Client, "id" | "project_id" | "user_id" | "company_id">>
  ) => {
    const updateData: Record<string, unknown> = {};
    
    if (data.company !== undefined) updateData.company = data.company;
    if (data.contact !== undefined) updateData.contact = data.contact;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.segment !== undefined) updateData.segment = data.segment;
    if (data.package !== undefined) updateData.package = data.package;
    if (data.monthlyValue !== undefined) updateData.monthly_value = data.monthlyValue;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar cliente:", error);
      return;
    }

    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...data } : client
    ));
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir cliente:", error);
      return;
    }

    setClients(prev => prev.filter(client => client.id !== id));
  }, []);

  const addNPSRecord = useCallback(async (
    clientId: string, 
    record: Omit<NPSRecord, "id" | "client_id">
  ) => {
    // Verificar se já existe registro para esse mês/ano
    const { data: existing } = await supabase
      .from("nps_records")
      .select("id")
      .eq("client_id", clientId)
      .eq("month", record.month)
      .eq("year", record.year)
      .maybeSingle();

    if (existing) {
      // Atualizar existente
      const { error } = await supabase
        .from("nps_records")
        .update({ 
          score: record.score, 
          notes: record.notes 
        })
        .eq("id", existing.id);

      if (error) {
        console.error("Erro ao atualizar NPS:", error);
        return;
      }

      setClients(prev => prev.map(client => {
        if (client.id !== clientId) return client;
        const newHistory = client.npsHistory.map(r => 
          r.month === record.month && r.year === record.year
            ? { ...r, score: record.score, notes: record.notes }
            : r
        );
        return { ...client, npsHistory: newHistory };
      }));
    } else {
      // Inserir novo
      const { data: newRecord, error } = await supabase
        .from("nps_records")
        .insert({
          client_id: clientId,
          month: record.month,
          year: record.year,
          score: record.score,
          notes: record.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar NPS:", error);
        return;
      }

      const mappedRecord: NPSRecord = {
        id: newRecord.id,
        client_id: clientId,
        month: newRecord.month,
        year: newRecord.year,
        score: newRecord.score,
        notes: newRecord.notes || "",
        recordedAt: newRecord.recorded_at,
      };

      setClients(prev => prev.map(client => {
        if (client.id !== clientId) return client;
        return { ...client, npsHistory: [...client.npsHistory, mappedRecord] };
      }));
    }
  }, []);

  const deleteNPSRecord = useCallback(async (clientId: string, recordId: string) => {
    const { error } = await supabase
      .from("nps_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      console.error("Erro ao excluir NPS:", error);
      return;
    }

    setClients(prev => prev.map(client => {
      if (client.id !== clientId) return client;
      return {
        ...client,
        npsHistory: client.npsHistory.filter(r => r.id !== recordId),
      };
    }));
  }, []);

  const getStats = useCallback(() => {
    const activeClients = clients.filter(c => c.status === "active");
    const totalMRR = activeClients.reduce((sum, c) => sum + c.monthlyValue, 0);
    const avgTicket = activeClients.length > 0 
      ? Math.round(totalMRR / activeClients.length) 
      : 0;
    
    const allNPSScores = clients.flatMap(c => c.npsHistory.map(r => r.score));
    const avgNPS = allNPSScores.length > 0 
      ? Math.round((allNPSScores.reduce((sum, s) => sum + s, 0) / allNPSScores.length) * 10) / 10 
      : 0;

    return {
      activeCount: activeClients.length,
      inactiveCount: clients.filter(c => c.status === "inactive").length,
      churnCount: clients.filter(c => c.status === "churn").length,
      totalMRR,
      avgTicket,
      avgNPS,
    };
  }, [clients]);

  const clientsWithNPSInfo = useMemo(() => {
    return clients.map(client => ({
      ...client,
      latestNPS: getLatestNPS(client.npsHistory),
      avgNPS: calculateClientNPS(client.npsHistory),
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
