/**
 * Tipos centralizados do sistema.
 * Alinhados com o schema real do banco de dados Supabase.
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Status de cliente - valores em português conforme banco
export type ClientStatus = 'ativo' | 'inativo' | 'churn';

// Status de lead - valores em português conforme banco
export type LeadStatus = 'novo' | 'contato' | 'reuniao_agendada' | 'reuniao_feita' | 'proposta' | 'negociacao' | 'ganho' | 'perdido';

// Status de objetivo - valores em português conforme banco
export type ObjectiveStatus = 'em_andamento' | 'concluido' | 'atrasado' | 'pausado';

// Client - alinhado com tabela clients do Supabase
export interface Client {
  id: string;
  space_id: string;
  name: string; // Nome do contato principal
  company: string | null; // Empresa (opcional)
  email: string | null;
  phone: string | null;
  segment: string | null;
  status: ClientStatus;
  monthly_value: number | null;
  contract_start: string | null; // Data de início do contrato
  package: string | null; // Pacote contratado
  notes: string | null;
  created_by: string | null; // user_id de quem criou
  created_at: string;
  updated_at: string;
  // Campos calculados no frontend
  npsHistory?: NPSRecord[];
}

// Temperatura do lead
export type LeadTemperature = 'cold' | 'warm' | 'hot';

// Lead - alinhado com tabela leads do Supabase
export interface Lead {
  id: string;
  space_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: string | null; // Origem do lead
  value: number | null;
  temperature: LeadTemperature; // Temperatura do lead
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// NPS Record - alinhado com tabela nps_records do Supabase
export interface NPSRecord {
  id: string;
  client_id: string | null;
  space_id: string;
  score: number | null;
  feedback: string | null; // Era "notes"
  recorded_at: string;
  created_by: string | null;
}

// Objective - alinhado com tabela objectives do Supabase
export interface Objective {
  id: string;
  space_id: string;
  title: string; // Era "name"
  description: string | null;
  category: string | null; // Era "valueType"
  target_value: number | null;
  current_value: number;
  unit: string; // Unidade de medida (%, R$, etc.)
  start_date: string | null;
  end_date: string | null; // Era "deadline"
  status: ObjectiveStatus;
  is_commercial: boolean; // Se é meta comercial
  value_type: string | null; // Tipo de valor (monetário, percentual, etc.)
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Campos calculados no frontend
  progressLogs?: ProgressLog[];
}

// Progress Log - alinhado com tabela progress_logs do Supabase
export interface ProgressLog {
  id: string;
  objective_id: string | null;
  value: number;
  notes: string | null; // Era "description"
  logged_at: string; // Era "date"
  created_by: string | null;
}

// Tipos legados para compatibilidade temporária durante migração
// @deprecated - usar LeadStatus
export type LeadStage = LeadStatus;
// @deprecated - usar ClientStatus com valores em português
export type LegacyClientStatus = 'active' | 'inactive' | 'churn';

// Constantes de mapeamento para compatibilidade de UI
export const CLIENT_STATUS_MAP: Record<string, ClientStatus> = {
  active: 'ativo',
  inactive: 'inativo',
  churn: 'churn',
  ativo: 'ativo',
  inativo: 'inativo',
};

export const LEAD_STATUS_MAP: Record<string, LeadStatus> = {
  new: 'novo',
  contact: 'contato',
  meeting_scheduled: 'reuniao_agendada',
  meeting_done: 'reuniao_feita',
  proposal: 'proposta',
  followup: 'negociacao',
  negotiation: 'negociacao',
  won: 'ganho',
  lost: 'perdido',
  novo: 'novo',
  contato: 'contato',
  reuniao_agendada: 'reuniao_agendada',
  reuniao_feita: 'reuniao_feita',
  proposta: 'proposta',
  negociacao: 'negociacao',
  ganho: 'ganho',
  perdido: 'perdido',
};
