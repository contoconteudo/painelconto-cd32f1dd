/**
 * Database Types - Supabase
 * 
 * Interfaces TypeScript para as tabelas do banco de dados.
 * Estas tipagens garantem type-safety em todas as operações.
 */

// ============================================
// ENUMS
// ============================================

export type AppRole = 'admin' | 'gestor' | 'comercial' | 'analista' | 'user';
export type LeadStage = 'prospeccao' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechamento' | 'perdido';
export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused';

// ============================================
// DATABASE SCHEMA
// ============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      user_roles: {
        Row: UserRole;
        Insert: UserRoleInsert;
        Update: UserRoleUpdate;
      };
      leads: {
        Row: Lead;
        Insert: LeadInsert;
        Update: LeadUpdate;
      };
      clients: {
        Row: Client;
        Insert: ClientInsert;
        Update: ClientUpdate;
      };
      objectives: {
        Row: Objective;
        Insert: ObjectiveInsert;
        Update: ObjectiveUpdate;
      };
      plans: {
        Row: Plan;
        Insert: PlanInsert;
        Update: PlanUpdate;
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
      };
      spaces: {
        Row: Space;
        Insert: SpaceInsert;
        Update: SpaceUpdate;
      };
    };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
      lead_stage: LeadStage;
      lead_temperature: LeadTemperature;
      subscription_status: SubscriptionStatus;
    };
  };
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  id?: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserUpdate {
  id?: string;
  email?: string;
  name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  updated_at?: string;
}

// ============================================
// USER ROLES
// ============================================

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserRoleInsert {
  id?: string;
  user_id: string;
  role: AppRole;
  created_at?: string;
}

export interface UserRoleUpdate {
  role?: AppRole;
}

// ============================================
// LEAD TYPES
// ============================================

export interface Lead {
  id: string;
  user_id: string;
  space_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage: LeadStage;
  temperature: LeadTemperature;
  value: number | null;
  source: string | null;
  notes: string | null;
  next_contact: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadInsert {
  id?: string;
  user_id: string;
  space_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  stage?: LeadStage;
  temperature?: LeadTemperature;
  value?: number | null;
  source?: string | null;
  notes?: string | null;
  next_contact?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LeadUpdate {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  stage?: LeadStage;
  temperature?: LeadTemperature;
  value?: number | null;
  source?: string | null;
  notes?: string | null;
  next_contact?: string | null;
  updated_at?: string;
}

// ============================================
// CLIENT TYPES
// ============================================

export interface Client {
  id: string;
  user_id: string;
  space_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  nps_score: number | null;
  nps_date: string | null;
  contract_value: number | null;
  contract_start: string | null;
  contract_end: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInsert {
  id?: string;
  user_id: string;
  space_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  nps_score?: number | null;
  nps_date?: string | null;
  contract_value?: number | null;
  contract_start?: string | null;
  contract_end?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientUpdate {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  nps_score?: number | null;
  nps_date?: string | null;
  contract_value?: number | null;
  contract_start?: string | null;
  contract_end?: string | null;
  notes?: string | null;
  updated_at?: string;
}

// ============================================
// OBJECTIVE TYPES
// ============================================

export interface Objective {
  id: string;
  user_id: string;
  space_id: string | null;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  category: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ObjectiveInsert {
  id?: string;
  user_id: string;
  space_id?: string | null;
  title: string;
  description?: string | null;
  target_value: number;
  current_value?: number;
  unit?: string;
  start_date: string;
  end_date: string;
  category?: string | null;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ObjectiveUpdate {
  title?: string;
  description?: string | null;
  target_value?: number;
  current_value?: number;
  unit?: string;
  start_date?: string;
  end_date?: string;
  category?: string | null;
  is_completed?: boolean;
  updated_at?: string;
}

// ============================================
// PLAN TYPES
// ============================================

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  is_active: boolean;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanInsert {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  currency?: string;
  interval?: 'month' | 'year';
  features?: string[];
  is_active?: boolean;
  stripe_price_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlanUpdate {
  name?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  interval?: 'month' | 'year';
  features?: string[];
  is_active?: boolean;
  stripe_price_id?: string | null;
  updated_at?: string;
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInsert {
  id?: string;
  user_id: string;
  plan_id: string;
  status?: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  stripe_subscription_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionUpdate {
  plan_id?: string;
  status?: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  stripe_subscription_id?: string | null;
  updated_at?: string;
}

// ============================================
// SPACE TYPES
// ============================================

export interface Space {
  id: string;
  user_id: string;
  label: string;
  description: string | null;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpaceInsert {
  id?: string;
  user_id: string;
  label: string;
  description?: string | null;
  color?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SpaceUpdate {
  label?: string;
  description?: string | null;
  color?: string;
  is_default?: boolean;
  updated_at?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  count?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
