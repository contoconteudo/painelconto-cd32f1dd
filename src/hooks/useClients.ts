import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useCompany } from "@/contexts/CompanyContext";
import { Client, NPSRecord, ClientStatus } from "@/types";

interface ClientRow {
  id: string;
  user_id: string;
  space_id: string | null;
  company: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  segment: string | null;
  package: string | null;
  monthly_value: number | null;
  status: string | null;
  start_date: string | null;
  notes: string | null;
  created_at: string;
}

interface NPSRow {
  id: string;
  client_id: string;
  user_id: string;
  month: number;
  year: number;
  score: number;
  notes: string | null;
  recorded_at: string;
}

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
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mapear dados do Supabase para o tipo Client
  const mapClient = (row: ClientRow, npsRecords: NPSRow[] = []): Client => ({
    id: row.id,
    company: row.company,
    contact: row.contact || "",
    email: row.email || "",
    phone: row.phone || "",
    segment: row.segment || "",
    package: row.package || "",
    monthlyValue: row.monthly_value || 0,
    status: (row.status as ClientStatus) || "active",
    startDate: row.start_date || "",
    notes: row.notes || "",
    project_id: "default",
    user_id: row.user_id,
    company_id: row.space_id || "",
    npsHistory: npsRecords.map((nps) => ({
      id: nps.id,
      client_id: nps.client_id,
      month: nps.month,
      year: nps.year,
      score: nps.score,
      notes: nps.notes || "",
      recordedAt: nps.recorded_at,
    })),
  });

  // Carregar clientes do banco
  const fetchClients = useCallback(async () => {
    if (!user?.id) {
      setAllClients([]);
      setIsLoading(false);
      return;
    }

    try {
      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (clientsError) {
        console.error("Erro ao carregar clientes:", clientsError);
        setAllClients([]);
        setIsLoading(false);
        return;
      }

      // Buscar registros NPS
      const { data: npsData, error: npsError } = await supabase
        .from("nps_records")
        .select("*")
        .eq("user_id", user.id);

      if (npsError) {
        console.error("Erro ao carregar NPS:", npsError);
      }

      // Agrupar NPS por cliente
      const npsByClient: Record<string, NPSRow[]> = {};
      ((npsData as NPSRow[]) || []).forEach((nps) => {
        if (!npsByClient[nps.client_id]) {
          npsByClient[nps.client_id] = [];
        }
        npsByClient[nps.client_id].push(nps);
      });

      setAllClients(
        ((clientsData as ClientRow[]) || []).map((c) => mapClient(c, npsByClient[c.id] || []))
      );
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setAllClients([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filtrar clientes pelo espaço atual
  const clients = useMemo(() => {
    return allClients.filter((client) => client.company_id === currentCompany);
  }, [allClients, currentCompany]);

  const addClient = useCallback(
    async (data: Omit<Client, "id" | "project_id" | "user_id" | "company_id" | "npsHistory">) => {
      if (!user?.id) return null;

      try {
        const { data: newData, error } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            space_id: currentCompany || null,
            company: data.company,
            contact: data.contact,
            email: data.email,
            phone: data.phone,
            segment: data.segment,
            package: data.package,
            monthly_value: data.monthlyValue,
            status: data.status,
            start_date: data.startDate || null,
            notes: data.notes,
          } as any)
          .select()
          .single();

        if (error) {
          console.error("Erro ao criar cliente:", error);
          return null;
        }

        const newClient = mapClient(newData as ClientRow, []);
        setAllClients((prev) => [newClient, ...prev]);
        return newClient;
      } catch (err) {
        console.error("Erro ao criar cliente:", err);
        return null;
      }
    },
    [user?.id, currentCompany]
  );

  const updateClient = useCallback(
    async (id: string, data: Partial<Omit<Client, "id" | "project_id" | "user_id" | "company_id">>) => {
      try {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

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

        const { error } = await (supabase.from("clients") as any).update(updateData).eq("id", id);

        if (error) {
          console.error("Erro ao atualizar cliente:", error);
          return;
        }

        setAllClients((prev) =>
          prev.map((client) => (client.id === id ? { ...client, ...data } : client))
        );
      } catch (err) {
        console.error("Erro ao atualizar cliente:", err);
      }
    },
    []
  );

  const deleteClient = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) {
        console.error("Erro ao deletar cliente:", error);
        return;
      }

      setAllClients((prev) => prev.filter((client) => client.id !== id));
    } catch (err) {
      console.error("Erro ao deletar cliente:", err);
    }
  }, []);

  const addNPSRecord = useCallback(
    async (clientId: string, record: Omit<NPSRecord, "id" | "client_id" | "recordedAt">) => {
      if (!user?.id) return;

      try {
        // Verificar se já existe registro para este mês/ano
        const { data: existing } = await supabase
          .from("nps_records")
          .select("id")
          .eq("client_id", clientId)
          .eq("month", record.month)
          .eq("year", record.year)
          .maybeSingle();

        if (existing) {
          // Atualizar existente
          const { error } = await (supabase.from("nps_records") as any)
            .update({
              score: record.score,
              notes: record.notes,
              recorded_at: new Date().toISOString(),
            })
            .eq("id", (existing as any).id);

          if (error) {
            console.error("Erro ao atualizar NPS:", error);
            return;
          }
        } else {
          // Criar novo
          const { error } = await supabase.from("nps_records").insert({
            client_id: clientId,
            user_id: user.id,
            month: record.month,
            year: record.year,
            score: record.score,
            notes: record.notes,
          } as any);

          if (error) {
            console.error("Erro ao criar NPS:", error);
            return;
          }
        }

        // Recarregar dados
        await fetchClients();
      } catch (err) {
        console.error("Erro ao adicionar NPS:", err);
      }
    },
    [user?.id, fetchClients]
  );

  const deleteNPSRecord = useCallback(
    async (clientId: string, recordId: string) => {
      try {
        const { error } = await supabase.from("nps_records").delete().eq("id", recordId);

        if (error) {
          console.error("Erro ao deletar NPS:", error);
          return;
        }

        setAllClients((prev) =>
          prev.map((client) => {
            if (client.id !== clientId) return client;
            return {
              ...client,
              npsHistory: client.npsHistory.filter((r) => r.id !== recordId),
            };
          })
        );
      } catch (err) {
        console.error("Erro ao deletar NPS:", err);
      }
    },
    []
  );

  const getStats = useCallback(() => {
    const activeClients = clients.filter((c) => c.status === "active");
    const totalMRR = activeClients.reduce((sum, c) => sum + c.monthlyValue, 0);
    const avgTicket = activeClients.length > 0 ? Math.round(totalMRR / activeClients.length) : 0;

    const allNPSScores = clients.flatMap((c) => c.npsHistory.map((r) => r.score));
    const avgNPS =
      allNPSScores.length > 0
        ? Math.round((allNPSScores.reduce((sum, s) => sum + s, 0) / allNPSScores.length) * 10) / 10
        : 0;

    return {
      activeCount: activeClients.length,
      inactiveCount: clients.filter((c) => c.status === "inactive").length,
      churnCount: clients.filter((c) => c.status === "churn").length,
      totalMRR,
      avgTicket,
      avgNPS,
    };
  }, [clients]);

  // Get clients sorted by latest NPS
  const clientsWithNPSInfo = useMemo(() => {
    return clients.map((client) => ({
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
    refetch: fetchClients,
  };
}
