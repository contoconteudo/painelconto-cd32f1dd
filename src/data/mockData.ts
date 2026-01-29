/**
 * Configuração de Modo DEMO / Produção
 * 
 * PARA ATIVAR PRODUÇÃO:
 * 1. Mude DEMO_MODE para `false`
 * 2. Execute o schema SQL no Supabase (supabase/schema.sql)
 * 3. Crie o primeiro usuário admin via Supabase Auth
 * 4. Configure as permissões do admin na tabela user_roles e user_permissions
 */

import type { Lead, Client, Objective, NPSRecord, ProgressLog, LeadStatus, ClientStatus, ObjectiveStatus } from "@/types";

// ============================================
// FLAG PRINCIPAL - MUDAR PARA FALSE EM PRODUÇÃO
// ============================================
export const DEMO_MODE = false;

// ============================================
// TIPOS EXPORTADOS
// ============================================
export type AppRole = "admin" | "gestor" | "comercial" | "analista";
export type ModulePermission = "dashboard" | "crm" | "clients" | "objectives" | "strategy" | "settings" | "admin";
export type CompanyAccess = string;

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  modules: ModulePermission[];
  companies: CompanyAccess[];
}

export interface MockSpace {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: string;
}

// Usuário demo (usado apenas quando DEMO_MODE = true)
export const MOCK_ADMIN_USER: MockUser = {
  id: "demo-admin-001",
  email: "admin@demo.conto.com.br",
  full_name: "Admin Demo",
  role: "admin",
  modules: ["dashboard", "crm", "clients", "objectives", "strategy", "settings", "admin"],
  companies: [],
};

// Espaços demo vazios
const INITIAL_SPACES: MockSpace[] = [];
const INITIAL_LEADS: Lead[] = [];
const INITIAL_CLIENTS: Client[] = [];
const INITIAL_OBJECTIVES: Objective[] = [];

// ============================================
// STORE GLOBAL PARA MODO DEMO
// Mantém estado entre navegações (apenas em DEMO)
// ============================================

class DemoDataStore {
  private _spaces: MockSpace[] = [...INITIAL_SPACES];
  private _leads: Lead[] = [...INITIAL_LEADS];
  private _clients: Client[] = [...INITIAL_CLIENTS];
  private _objectives: Objective[] = [...INITIAL_OBJECTIVES];
  private _listeners: Set<() => void> = new Set();

  // Espaços
  get spaces(): MockSpace[] {
    return this._spaces;
  }

  addSpace(space: MockSpace) {
    this._spaces = [...this._spaces, space];
    this.notifyListeners();
  }

  deleteSpace(id: string) {
    this._spaces = this._spaces.filter(s => s.id !== id);
    this.notifyListeners();
  }

  // Leads
  get leads(): Lead[] {
    return this._leads;
  }

  addLead(lead: Lead) {
    this._leads = [lead, ...this._leads];
    this.notifyListeners();
  }

  updateLead(id: string, data: Partial<Lead>) {
    this._leads = this._leads.map(l => l.id === id ? { ...l, ...data } : l);
    this.notifyListeners();
  }

  deleteLead(id: string) {
    this._leads = this._leads.filter(l => l.id !== id);
    this.notifyListeners();
  }

  // Clients
  get clients(): Client[] {
    return this._clients;
  }

  addClient(client: Client) {
    this._clients = [client, ...this._clients];
    this.notifyListeners();
  }

  updateClient(id: string, data: Partial<Client>) {
    this._clients = this._clients.map(c => c.id === id ? { ...c, ...data } : c);
    this.notifyListeners();
  }

  deleteClient(id: string) {
    this._clients = this._clients.filter(c => c.id !== id);
    this.notifyListeners();
  }

  // Objectives
  get objectives(): Objective[] {
    return this._objectives;
  }

  addObjective(objective: Objective) {
    this._objectives = [objective, ...this._objectives];
    this.notifyListeners();
  }

  updateObjective(id: string, data: Partial<Objective>) {
    this._objectives = this._objectives.map(o => o.id === id ? { ...o, ...data } : o);
    this.notifyListeners();
  }

  deleteObjective(id: string) {
    this._objectives = this._objectives.filter(o => o.id !== id);
    this.notifyListeners();
  }

  // Sistema de listeners para React
  subscribe(listener: () => void) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private notifyListeners() {
    this._listeners.forEach(listener => listener());
  }
}

// Instância singleton
export const demoStore = new DemoDataStore();

// Exportações legadas para compatibilidade
export const MOCK_SPACES = INITIAL_SPACES;
export const MOCK_LEADS = INITIAL_LEADS;
export const MOCK_CLIENTS = INITIAL_CLIENTS;
export const MOCK_OBJECTIVES = INITIAL_OBJECTIVES;

// ============================================
// CONFIGURAÇÃO DE MÓDULOS E PERMISSÕES
// ============================================

export const ALL_MODULES: { id: ModulePermission; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Visão geral e métricas do sistema" },
  { id: "strategy", label: "Estratégia", description: "Objetivos e metas estratégicas" },
  { id: "crm", label: "CRM", description: "Gestão de leads e oportunidades" },
  { id: "clients", label: "Clientes", description: "Gestão de clientes ativos" },
  { id: "settings", label: "Configurações", description: "Configurações pessoais" },
];

// Permissões padrão por role
export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, ModulePermission[]> = {
  admin: ["dashboard", "strategy", "crm", "clients", "settings", "admin"],
  gestor: ["dashboard", "strategy", "crm", "clients", "settings"],
  comercial: ["dashboard", "crm", "clients", "settings"],
  analista: ["dashboard", "settings"],
};

// Storage keys
export const USER_PERMISSIONS_KEY = "conto-user-permissions";
export const MOCK_STORAGE_KEYS = {
  CURRENT_USER: "conto-mock-current-user",
  REGISTERED_USERS: "conto-mock-registered-users",
};

// Helpers
export const getCompanies = () => demoStore.spaces;
export const ALL_COMPANIES = INITIAL_SPACES;
