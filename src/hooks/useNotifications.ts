import { useMemo } from "react";
import { useLeads } from "./useLeads";
import { useClients } from "./useClients";
import { useObjectives } from "./useObjectives";
import { NPS_CONFIG } from "@/lib/constants";

export interface AppNotification {
  id: string;
  type: "warning" | "info" | "success" | "error";
  title: string;
  message: string;
  category: "leads" | "clients" | "objectives" | "goals";
}

const STALE_DAYS = 7;
const DEADLINE_WARNING_DAYS = 30;

export function useNotifications() {
  const { leads } = useLeads();
  const { clients } = useClients();
  const { objectives } = useObjectives();

  const notifications = useMemo(() => {
    const alerts: AppNotification[] = [];

    // Check for leads in negotiation status for too long
    const staleNegotiations = leads.filter((lead) => {
      if (lead.status !== "negociacao") return false;
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceUpdate > STALE_DAYS;
    });
    if (staleNegotiations.length > 0) {
      alerts.push({
        id: "stale-negotiations",
        type: "warning",
        title: "Negociações Paradas",
        message: `${staleNegotiations.length} lead(s) em negociação há mais de ${STALE_DAYS} dias.`,
        category: "leads",
      });
    }

    // Check for new leads that need action
    const newLeads = leads.filter((lead) => lead.status === "novo");
    if (newLeads.length > 0) {
      alerts.push({
        id: "new-leads",
        type: "info",
        title: "Novos Leads",
        message: `${newLeads.length} lead(s) novo(s) aguardando ação.`,
        category: "leads",
      });
    }

    // Check for clients with low NPS (latest score)
    const lowNpsClients = clients.filter((client) => {
      if (client.status !== "ativo" || !client.npsHistory || client.npsHistory.length === 0) return false;
      const latestNPS = [...client.npsHistory].sort((a, b) => 
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      )[0];
      return latestNPS.score !== null && latestNPS.score < NPS_CONFIG.PASSIVE_MIN;
    });
    if (lowNpsClients.length > 0) {
      alerts.push({
        id: "low-nps",
        type: "error",
        title: "NPS Crítico",
        message: `${lowNpsClients.length} cliente(s) ativo(s) com NPS < ${NPS_CONFIG.PASSIVE_MIN}. Risco de churn!`,
        category: "clients",
      });
    }

    // Check for clients at churn risk
    const churnRiskClients = clients.filter((client) => client.status === "inativo");
    if (churnRiskClients.length > 0) {
      alerts.push({
        id: "churn-risk",
        type: "warning",
        title: "Risco de Churn",
        message: `${churnRiskClients.length} cliente(s) inativo(s). Tente reativar!`,
        category: "clients",
      });
    }

    // Check for objectives at risk or behind
    const atRiskObjectives = objectives.filter(
      (obj) => obj.status === "atrasado"
    );
    if (atRiskObjectives.length > 0) {
      alerts.push({
        id: "objectives-risk",
        type: "warning",
        title: "Objetivos Atrasados",
        message: `${atRiskObjectives.length} objetivo(s) precisam de atenção.`,
        category: "objectives",
      });
    }

    // Check objectives deadline approaching
    const upcomingDeadlines = objectives.filter((obj) => {
      if (!obj.end_date) return false;
      const daysToDeadline = Math.floor(
        (new Date(obj.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysToDeadline > 0 && daysToDeadline <= DEADLINE_WARNING_DAYS && obj.current_value < (obj.target_value || 0);
    });
    if (upcomingDeadlines.length > 0) {
      alerts.push({
        id: "deadline-approaching",
        type: "info",
        title: "Prazos Próximos",
        message: `${upcomingDeadlines.length} objetivo(s) com prazo em até ${DEADLINE_WARNING_DAYS} dias.`,
        category: "objectives",
      });
    }

    return alerts;
  }, [leads, clients, objectives]);

  return {
    notifications,
    unreadCount: notifications.length,
  };
}
