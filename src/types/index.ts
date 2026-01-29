/**
 * Tipos centralizados do sistema.
 * Alinhados com o schema do banco de dados Supabase.
 */

// Status de cliente
export type ClientStatus = 'ativo' | 'inativo' | 'churn';

// Status de lead
export type LeadStatus = 'novo' | 'contato' | 'reuniao_agendada' | 'reuniao_feita' | 'proposta' | 'negociacao' | 'ganho' | 'perdido';

// Status de objetivo
export type ObjectiveStatus = 'em_andamento' | 'concluido' | 'atrasado' | 'pausado';

// Temperatura do lead
export type LeadTemperature = 'cold' | 'warm' | 'hot';

// Client - alinhado com tabela clients do Supabase
export interface Client {
  id: string;
  space_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  segment: string | null;
  status: ClientStatus;
  monthly_value: number | null;
  contract_start: string | null;
  package: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  npsHistory?: NPSRecord[];
}

// Lead - alinhado com tabela leads do Supabase
export interface Lead {
  id: string;
  space_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: string | null;
  value: number | null;
  temperature: LeadTemperature;
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
  feedback: string | null;
  recorded_at: string;
  created_by: string | null;
}

// Objective - alinhado com tabela objectives do Supabase
export interface Objective {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_value: number | null;
  current_value: number;
  unit: string;
  start_date: string | null;
  end_date: string | null;
  status: ObjectiveStatus;
  is_commercial: boolean;
  value_type: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  progressLogs?: ProgressLog[];
}

// Progress Log - alinhado com tabela progress_logs do Supabase
export interface ProgressLog {
  id: string;
  objective_id: string | null;
  value: number;
  notes: string | null;
  logged_at: string;
  created_by: string | null;
}

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
