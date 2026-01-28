import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useCompany } from "@/contexts/CompanyContext";
import { Lead, LeadStage } from "@/types";
import { AUTOMATION_CONFIG } from "@/lib/constants";

interface LeadRow {
  id: string;
  user_id: string;
  space_id: string | null;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  value: number | null;
  temperature: string | null;
  origin: string | null;
  stage: string | null;
  last_contact: string | null;
  stage_changed_at: string | null;
  notes: string | null;
  created_at: string;
}

export function useLeads() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mapear dados do Supabase para o tipo Lead
  const mapLead = (row: LeadRow): Lead => ({
    id: row.id,
    name: row.name,
    company: row.company || "",
    email: row.email || "",
    phone: row.phone || "",
    value: row.value || 0,
    temperature: (row.temperature as Lead["temperature"]) || "warm",
    origin: row.origin || "",
    stage: (row.stage as LeadStage) || "new",
    lastContact: row.last_contact?.split("T")[0] || "",
    notes: row.notes || "",
    createdAt: row.created_at?.split("T")[0] || "",
    stageChangedAt: row.stage_changed_at || row.created_at,
    project_id: "default",
    user_id: row.user_id,
    company_id: row.space_id || "",
  });

  // Carregar leads do banco
  const fetchLeads = useCallback(async () => {
    if (!user?.id) {
      setAllLeads([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar leads:", error);
        setAllLeads([]);
      } else {
        setAllLeads((data as LeadRow[] || []).map(mapLead));
      }
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
      setAllLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Filtrar leads pelo espaço atual
  const leads = useMemo(() => {
    return allLeads.filter((lead) => lead.company_id === currentCompany);
  }, [allLeads, currentCompany]);

  const addLead = useCallback(
    async (data: Omit<Lead, "id" | "createdAt" | "stageChangedAt" | "project_id" | "user_id" | "company_id">) => {
      if (!user?.id) return null;

      const now = new Date().toISOString();

      try {
        const { data: newData, error } = await supabase
          .from("leads")
          .insert({
            user_id: user.id,
            space_id: currentCompany || null,
            name: data.name,
            company: data.company,
            email: data.email,
            phone: data.phone,
            value: data.value,
            temperature: data.temperature,
            origin: data.origin,
            stage: data.stage || "new",
            last_contact: data.lastContact || null,
            notes: data.notes,
            stage_changed_at: now,
          } as any)
          .select()
          .single();

        if (error) {
          console.error("Erro ao criar lead:", error);
          return null;
        }

        const newLead = mapLead(newData as LeadRow);
        setAllLeads((prev) => [newLead, ...prev]);
        return newLead;
      } catch (err) {
        console.error("Erro ao criar lead:", err);
        return null;
      }
    },
    [user?.id, currentCompany]
  );

  const updateLead = useCallback(
    async (id: string, data: Partial<Omit<Lead, "id" | "createdAt" | "project_id" | "user_id" | "company_id">>) => {
      try {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.company !== undefined) updateData.company = data.company;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.value !== undefined) updateData.value = data.value;
        if (data.temperature !== undefined) updateData.temperature = data.temperature;
        if (data.origin !== undefined) updateData.origin = data.origin;
        if (data.stage !== undefined) {
          updateData.stage = data.stage;
          updateData.stage_changed_at = new Date().toISOString();
        }
        if (data.lastContact !== undefined) updateData.last_contact = data.lastContact;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const { error } = await (supabase.from("leads") as any).update(updateData).eq("id", id);

        if (error) {
          console.error("Erro ao atualizar lead:", error);
          return;
        }

        setAllLeads((prev) =>
          prev.map((lead) => (lead.id === id ? { ...lead, ...data } : lead))
        );
      } catch (err) {
        console.error("Erro ao atualizar lead:", err);
      }
    },
    []
  );

  const deleteLead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);

      if (error) {
        console.error("Erro ao deletar lead:", error);
        return;
      }

      setAllLeads((prev) => prev.filter((lead) => lead.id !== id));
    } catch (err) {
      console.error("Erro ao deletar lead:", err);
    }
  }, []);

  const moveLeadToStage = useCallback(
    async (id: string, stage: LeadStage) => {
      const now = new Date().toISOString();

      try {
        const { error } = await (supabase.from("leads") as any)
          .update({
            stage,
            last_contact: now,
            stage_changed_at: now,
            updated_at: now,
          })
          .eq("id", id);

        if (error) {
          console.error("Erro ao mover lead:", error);
          return;
        }

        setAllLeads((prev) =>
          prev.map((lead) =>
            lead.id === id
              ? { ...lead, stage, lastContact: now.split("T")[0], stageChangedAt: now }
              : lead
          )
        );
      } catch (err) {
        console.error("Erro ao mover lead:", err);
      }
    },
    []
  );

  const getLeadsByStage = useCallback(
    (stage: LeadStage) => {
      return leads.filter((lead) => lead.stage === stage);
    },
    [leads]
  );

  const getPipelineStats = useCallback(() => {
    const activeLeads = leads.filter((l) => l.stage !== "lost");
    const totalValue = activeLeads.reduce((sum, l) => sum + l.value, 0);
    const proposalsSent = leads.filter((l) =>
      ["proposal", "negotiation", "won"].includes(l.stage)
    ).length;
    const won = leads.filter((l) => l.stage === "won");
    const conversionRate =
      leads.length > 0 ? Math.round((won.length / leads.length) * 100) : 0;
    const inNegotiation = leads.filter(
      (l) => l.stage !== "won" && l.stage !== "lost"
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

  // Automação: mover leads de "proposal" para "followup"
  useEffect(() => {
    if (!user?.id) return;

    const checkAndMoveLeads = async () => {
      const now = new Date().getTime();
      const thresholdMs = AUTOMATION_CONFIG.PROPOSAL_TO_FOLLOWUP_HOURS * 60 * 60 * 1000;

      const leadsToMove = allLeads.filter((lead) => {
        if (lead.stage !== "proposal") return false;
        const stageTime = new Date(lead.stageChangedAt).getTime();
        return now - stageTime >= thresholdMs;
      });

      for (const lead of leadsToMove) {
        await moveLeadToStage(lead.id, "followup");
      }
    };

    checkAndMoveLeads();
    const interval = setInterval(checkAndMoveLeads, AUTOMATION_CONFIG.AUTOMATION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [allLeads, user?.id, moveLeadToStage]);

  return {
    leads,
    isLoading,
    addLead,
    updateLead,
    deleteLead,
    moveLeadToStage,
    getLeadsByStage,
    getPipelineStats,
    refetch: fetchLeads,
  };
}
