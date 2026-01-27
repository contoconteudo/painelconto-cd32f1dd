// Tipos para Objetivos Estratégicos
export type ObjectiveValueType = "financial" | "quantity" | "percentage";
export type ObjectiveStatus = "on_track" | "at_risk" | "behind";

// Fontes de dados para metas comerciais automáticas
export type CommercialDataSource = "crm" | "clients";

export interface ProgressLog {
  id: string;
  month: number; // 1-12
  year: number;
  value: number;
  description: string;
  date: string; // data do registro
}

export interface Objective {
  id: string;
  name: string;
  description: string;
  valueType: ObjectiveValueType;
  targetValue: number;
  currentValue: number;
  deadline: string;
  status: ObjectiveStatus;
  createdAt: string;
  progressLogs: ProgressLog[];
  // Campos para metas comerciais automáticas
  isCommercial: boolean;
  dataSources: CommercialDataSource[];
}

// Tipos para Leads (CRM)
export type LeadTemperature = "hot" | "warm" | "cold";
export type LeadStage = "new" | "contact" | "meeting_scheduled" | "meeting_done" | "proposal" | "followup" | "negotiation" | "won" | "lost";

export interface Lead {
  id: string;
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

// Tipos para Clientes
export type ClientStatus = "active" | "inactive" | "churn";

export interface NPSRecord {
  id: string;
  month: number; // 1-12
  year: number;
  score: number;
  notes: string;
  recordedAt: string;
}

export interface Client {
  id: string;
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

// Tipos para Metas Bimestrais
export interface BimonthlyGoal {
  id: string;
  name: string;
  period: string;
  targetValue: number;
  currentValue: number;
  valueType: ObjectiveValueType;
}
