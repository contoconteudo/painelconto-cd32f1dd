import { useMemo } from "react";
import { useLeads } from "./useLeads";
import { useClients } from "./useClients";
import { useObjectives } from "./useObjectives";

export interface AppNotification {
  id: string;
  type: "warning" | "info" | "success" | "error";
  title: string;
  message: string;
  category: "leads" | "clients" | "objectives" | "goals";
}

export function useNotifications() {
  const { leads } = useLeads();
  const { clients } = useClients();
  const { objectives } = useObjectives();

  const notifications = useMemo(() => {
    const alerts: AppNotification[] = [];

    // Check for cold leads that haven't been contacted recently
    const coldLeads = leads.filter(
      (lead) => lead.temperature === "cold" && lead.stage !== "won" && lead.stage !== "lost"
    );
    if (coldLeads.length > 0) {
      alerts.push({
        id: "cold-leads",
        type: "warning",
        title: "Leads Esfriando",
        message: `${coldLeads.length} lead(s) marcado(s) como frio(s). Considere fazer follow-up.`,
        category: "leads",
      });
    }

    // Check for leads in negotiation stage for too long
    const staleNegotiations = leads.filter((lead) => {
      if (lead.stage !== "negotiation") return false;
      const daysSinceChange = Math.floor(
        (Date.now() - new Date(lead.stageChangedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceChange > 7;
    });
    if (staleNegotiations.length > 0) {
      alerts.push({
        id: "stale-negotiations",
        type: "warning",
        title: "Negociações Paradas",
        message: `${staleNegotiations.length} lead(s) em negociação há mais de 7 dias.`,
        category: "leads",
      });
    }

    // Check for hot leads that need immediate attention
    const hotLeads = leads.filter(
      (lead) => lead.temperature === "hot" && lead.stage !== "won" && lead.stage !== "lost"
    );
    if (hotLeads.length > 0) {
      alerts.push({
        id: "hot-leads",
        type: "info",
        title: "Leads Quentes",
        message: `${hotLeads.length} lead(s) quente(s) aguardando ação.`,
        category: "leads",
      });
    }

    // Check for clients with low NPS (latest score)
    const lowNpsClients = clients.filter((client) => {
      if (client.status !== "active" || client.npsHistory.length === 0) return false;
      const latestNPS = client.npsHistory.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })[0];
      return latestNPS.score <= 6;
    });
    if (lowNpsClients.length > 0) {
      alerts.push({
        id: "low-nps",
        type: "error",
        title: "NPS Crítico",
        message: `${lowNpsClients.length} cliente(s) ativo(s) com NPS ≤ 6. Risco de churn!`,
        category: "clients",
      });
    }

    // Check for clients at churn risk
    const churnRiskClients = clients.filter((client) => client.status === "inactive");
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
      (obj) => obj.status === "at_risk" || obj.status === "behind"
    );
    if (atRiskObjectives.length > 0) {
      alerts.push({
        id: "objectives-risk",
        type: "warning",
        title: "Objetivos em Risco",
        message: `${atRiskObjectives.length} objetivo(s) precisam de atenção.`,
        category: "objectives",
      });
    }

    // Check objectives deadline approaching (within 30 days)
    const upcomingDeadlines = objectives.filter((obj) => {
      const daysToDeadline = Math.floor(
        (new Date(obj.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysToDeadline > 0 && daysToDeadline <= 30 && obj.currentValue < obj.targetValue;
    });
    if (upcomingDeadlines.length > 0) {
      alerts.push({
        id: "deadline-approaching",
        type: "info",
        title: "Prazos Próximos",
        message: `${upcomingDeadlines.length} objetivo(s) com prazo em até 30 dias.`,
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
