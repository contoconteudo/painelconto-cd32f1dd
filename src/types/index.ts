// Tipos para Objetivos Estratégicos
export type ObjectiveValueType = "financial" | "quantity" | "percentage";
export type ObjectiveStatus = "on_track" | "at_risk" | "behind";

export interface ProgressLog {
  id: string;
  date: string;
  value: number;
  description: string;
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
}

// Tipos para Leads (CRM)
export type LeadTemperature = "hot" | "warm" | "cold";
export type LeadStage = "new" | "contact" | "proposal" | "negotiation" | "won" | "lost";

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
}

// Tipos para Clientes
export type ClientStatus = "active" | "inactive" | "churn";

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
  nps: number;
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
