/**
 * Constantes centralizadas do sistema.
 * Alinhadas com o schema real do Supabase.
 */

import { LeadStatus, ClientStatus, ObjectiveStatus } from "@/types";

// ============================================
// CONFIGURAÇÕES DE LEADS/CRM
// ============================================

// Status de leads em português (conforme banco)
export const LEAD_STATUSES: Record<LeadStatus, { name: string; color: string }> = {
  novo: { name: "Novo", color: "bg-muted-foreground" },
  contato: { name: "Contato Realizado", color: "bg-primary" },
  reuniao_agendada: { name: "Agendou Reunião", color: "bg-primary/70" },
  reuniao_feita: { name: "Reunião Feita", color: "bg-accent" },
  proposta: { name: "Proposta Enviada", color: "bg-warning" },
  negociacao: { name: "Negociação", color: "bg-success" },
  ganho: { name: "Ganho", color: "bg-success" },
  perdido: { name: "Perdido", color: "bg-destructive" },
};

// Alias para compatibilidade (deprecated)
export const LEAD_STAGES = LEAD_STATUSES;

export const LEAD_SOURCES = [
  "Tráfego Pago",
  "Orgânico",
  "Indicação",
  "LinkedIn",
  "Evento",
  "Outbound",
  "Site",
  "Outro",
] as const;

// Alias para compatibilidade
export const LEAD_ORIGINS = LEAD_SOURCES;

// Ordem das etapas no pipeline
export const PIPELINE_STATUSES: LeadStatus[] = [
  "novo",
  "contato",
  "reuniao_agendada",
  "reuniao_feita",
  "proposta",
  "negociacao",
  "ganho",
  "perdido",
];

// Alias para compatibilidade
export const PIPELINE_STAGES = PIPELINE_STATUSES;

// ============================================
// CONFIGURAÇÕES DE CLIENTES
// ============================================

// Status de clientes em português (conforme banco)
export const CLIENT_STATUSES: Record<ClientStatus, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  inativo: { label: "Inativo", className: "bg-warning/10 text-warning border-warning/20" },
  churn: { label: "Churn", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const CLIENT_SEGMENTS = [
  "Tecnologia",
  "Saúde",
  "Varejo",
  "Serviços",
  "Educação",
  "Indústria",
  "Financeiro",
  "Outro",
] as const;

// ============================================
// CONFIGURAÇÕES DE OBJETIVOS
// ============================================

// Categorias de objetivos (unidades de medida)
export const OBJECTIVE_UNITS = [
  { value: "%", label: "Porcentagem (%)" },
  { value: "R$", label: "Financeiro (R$)" },
  { value: "un", label: "Quantidade" },
] as const;

// Status de objetivos em português (conforme banco)
export const OBJECTIVE_STATUSES: Record<ObjectiveStatus, { label: string; className: string; barColor: string }> = {
  em_andamento: { label: "Em andamento", className: "bg-primary/10 text-primary", barColor: "bg-primary" },
  concluido: { label: "Concluído", className: "bg-success/10 text-success", barColor: "bg-success" },
  atrasado: { label: "Atrasado", className: "bg-destructive/10 text-destructive", barColor: "bg-destructive" },
  pausado: { label: "Pausado", className: "bg-warning/10 text-warning", barColor: "bg-warning" },
};

// Categorias de objetivos
export const OBJECTIVE_CATEGORIES = [
  "Financeiro",
  "Comercial",
  "Marketing",
  "Operacional",
  "RH",
  "Produto",
  "Outro",
] as const;

// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

// ============================================
// CONFIGURAÇÕES DE NPS
// ============================================

export const NPS_CONFIG = {
  PROMOTER_MIN: 9, // 9-10 são promotores
  PASSIVE_MIN: 7, // 7-8 são passivos
  // 0-6 são detratores
} as const;

export function getNPSCategory(score: number): "promoter" | "passive" | "detractor" {
  if (score >= NPS_CONFIG.PROMOTER_MIN) return "promoter";
  if (score >= NPS_CONFIG.PASSIVE_MIN) return "passive";
  return "detractor";
}

export function getNPSColor(score: number): string {
  if (score >= NPS_CONFIG.PROMOTER_MIN) return "text-success";
  if (score >= NPS_CONFIG.PASSIVE_MIN) return "text-warning";
  return "text-destructive";
}

// ============================================
// HELPERS DE FORMATAÇÃO
// ============================================

export function formatValue(value: number, unit: string): string {
  if (unit === "R$") {
    return `R$ ${value.toLocaleString('pt-BR')}`;
  }
  if (unit === "%") {
    return `${value}%`;
  }
  return value.toString();
}
