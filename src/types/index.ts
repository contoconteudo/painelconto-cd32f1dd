/**
 * Tipos centralizados do sistema.
 * 
 * NOTA: AppRole e ModulePermission estão definidos em @/data/mockData.ts
 * para facilitar a transição para o backend.
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Extracted types for external use
export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type LeadStage = 'new' | 'contact' | 'meeting_scheduled' | 'meeting_done' | 'proposal' | 'followup' | 'negotiation' | 'won' | 'lost';
export type ClientStatus = 'active' | 'inactive' | 'churn';
export type ObjectiveValueType = 'financial' | 'quantity' | 'percentage';
export type ObjectiveStatus = 'on_track' | 'at_risk' | 'behind';
export type CommercialDataSource = 'crm' | 'clients';

// Existing types remain the same but will be updated to include project_id
export interface Lead {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  temperature: LeadTemperature;
  origin: string;
  stage: LeadStage;
  lastContact: string;
  notes: string;
  createdAt: string;
  stageChangedAt: string;
}

export interface Client {
  id: string;
  project_id: string;
  user_id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  segment: string;
  package: string;
  monthlyValue: number;
  status: ClientStatus;
  npsHistory: NPSRecord[];
  startDate: string;
  notes: string;
}

export interface NPSRecord {
  id: string;
  client_id: string;
  month: number;
  year: number;
  score: number;
  notes: string;
  recordedAt: string;
}

export interface Objective {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string;
  valueType: ObjectiveValueType;
  targetValue: number;
  currentValue: number;
  deadline: string;
  status: ObjectiveStatus;
  createdAt: string;
  progressLogs: ProgressLog[];
  isCommercial: boolean;
  dataSources: CommercialDataSource[];
}

export interface ProgressLog {
  id: string;
  objective_id: string;
  month: number;
  year: number;
  value: number;
  description: string;
  date: string;
}