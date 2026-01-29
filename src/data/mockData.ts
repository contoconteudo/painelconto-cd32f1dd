/**
 * Dados Mock para modo DEMO
 * Usados enquanto o banco de dados está sendo reconfigurado.
 * 
 * IMPORTANTE: Este módulo mantém estado global para persistir dados
 * durante a navegação no modo DEMO.
 */

import type { Lead, Client, Objective, NPSRecord, ProgressLog, LeadStatus, ClientStatus, ObjectiveStatus } from "@/types";

// Flag para ativar/desativar modo demo
export const DEMO_MODE = true;

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

// Usuário admin simulado
export const MOCK_ADMIN_USER: MockUser = {
  id: "demo-admin-001",
  email: "admin@demo.conto.com.br",
  full_name: "Admin Demo",
  role: "admin",
  modules: ["dashboard", "crm", "clients", "objectives", "strategy", "settings", "admin"],
  companies: ["conto", "amplia"],
};

// ============================================
// DADOS INICIAIS
// ============================================

// Espaços iniciais
const INITIAL_SPACES: MockSpace[] = [
  { id: "conto", label: "Conto", description: "Agência Conto", color: "bg-blue-500", icon: "Building" },
  { id: "amplia", label: "Amplia", description: "Amplia Marketing", color: "bg-purple-500", icon: "Rocket" },
];

// Leads iniciais
const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-001",
    space_id: "conto",
    name: "João Silva",
    company: "Tech Solutions Ltda",
    email: "joao@techsolutions.com",
    phone: "(11) 99999-1234",
    status: "novo" as LeadStatus,
    source: "Google Ads",
    value: 15000,
    temperature: "hot",
    notes: "Interessado em gestão de redes sociais",
    created_by: "demo-admin-001",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "lead-002",
    space_id: "conto",
    name: "Maria Oliveira",
    company: "Startup Hub",
    email: "maria@startuphub.io",
    phone: "(11) 98888-5678",
    status: "reuniao_agendada" as LeadStatus,
    source: "Indicação",
    value: 25000,
    temperature: "warm",
    notes: "Reunião marcada para próxima semana",
    created_by: "demo-admin-001",
    created_at: "2025-01-10T14:30:00Z",
    updated_at: "2025-01-20T09:00:00Z",
  },
  {
    id: "lead-003",
    space_id: "conto",
    name: "Carlos Santos",
    company: "E-commerce Brasil",
    email: "carlos@ecommercebr.com",
    phone: "(21) 97777-9999",
    status: "proposta" as LeadStatus,
    source: "LinkedIn",
    value: 45000,
    temperature: "hot",
    notes: "Proposta enviada, aguardando retorno",
    created_by: "demo-admin-001",
    created_at: "2025-01-05T11:00:00Z",
    updated_at: "2025-01-22T16:00:00Z",
  },
  {
    id: "lead-004",
    space_id: "conto",
    name: "Ana Costa",
    company: "Digital Agency",
    email: "ana@digitalagency.com",
    phone: "(31) 96666-4444",
    status: "negociacao" as LeadStatus,
    source: "Site",
    value: 35000,
    temperature: "hot",
    notes: "Em negociação de valores",
    created_by: "demo-admin-001",
    created_at: "2025-01-08T08:00:00Z",
    updated_at: "2025-01-25T10:00:00Z",
  },
];

// Clients iniciais
const INITIAL_CLIENTS: Client[] = [
  {
    id: "client-001",
    space_id: "conto",
    name: "Pedro Mendes",
    company: "Mendes & Associados",
    email: "pedro@mendes.adv.br",
    phone: "(11) 3333-1111",
    segment: "Advocacia",
    status: "ativo" as ClientStatus,
    monthly_value: 8500,
    contract_start: "2024-06-01",
    package: "Premium",
    notes: "Cliente desde 2024, muito satisfeito",
    created_by: "demo-admin-001",
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    npsHistory: [
      { id: "nps-001", client_id: "client-001", space_id: "conto", score: 9, feedback: "Excelente atendimento!", recorded_at: "2024-12-15T00:00:00Z", created_by: "demo-admin-001" },
      { id: "nps-002", client_id: "client-001", space_id: "conto", score: 10, feedback: "Superou expectativas", recorded_at: "2025-01-15T00:00:00Z", created_by: "demo-admin-001" },
    ],
  },
  {
    id: "client-002",
    space_id: "conto",
    name: "Lucia Ferreira",
    company: "Clínica Bem Estar",
    email: "lucia@clinicabemestar.com",
    phone: "(11) 4444-2222",
    segment: "Saúde",
    status: "ativo" as ClientStatus,
    monthly_value: 12000,
    contract_start: "2024-03-15",
    package: "Enterprise",
    notes: "Expandiu contrato em outubro",
    created_by: "demo-admin-001",
    created_at: "2024-03-15T00:00:00Z",
    updated_at: "2024-10-01T00:00:00Z",
    npsHistory: [
      { id: "nps-003", client_id: "client-002", space_id: "conto", score: 8, feedback: "Bom serviço", recorded_at: "2024-09-01T00:00:00Z", created_by: "demo-admin-001" },
    ],
  },
  {
    id: "client-003",
    space_id: "conto",
    name: "Roberto Almeida",
    company: "Construtora RAL",
    email: "roberto@construtoraral.com.br",
    phone: "(11) 5555-3333",
    segment: "Construção",
    status: "ativo" as ClientStatus,
    monthly_value: 6500,
    contract_start: "2024-09-01",
    package: "Starter",
    notes: "Potencial para upgrade",
    created_by: "demo-admin-001",
    created_at: "2024-09-01T00:00:00Z",
    updated_at: "2025-01-10T00:00:00Z",
    npsHistory: [],
  },
  {
    id: "client-004",
    space_id: "conto",
    name: "Fernanda Lima",
    company: "FitLife Academia",
    email: "fernanda@fitlife.com.br",
    phone: "(11) 6666-4444",
    segment: "Fitness",
    status: "inativo" as ClientStatus,
    monthly_value: 4000,
    contract_start: "2023-12-01",
    package: "Starter",
    notes: "Pausou contrato temporariamente",
    created_by: "demo-admin-001",
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2025-01-05T00:00:00Z",
    npsHistory: [
      { id: "nps-004", client_id: "client-004", space_id: "conto", score: 6, feedback: "Precisa melhorar comunicação", recorded_at: "2024-11-01T00:00:00Z", created_by: "demo-admin-001" },
    ],
  },
];

// Objectives iniciais
const INITIAL_OBJECTIVES: Objective[] = [
  {
    id: "obj-001",
    space_id: "conto",
    title: "Faturamento Q1 2025",
    description: "Atingir meta de faturamento do primeiro trimestre",
    category: "Financeiro",
    target_value: 150000,
    current_value: 98500,
    unit: "R$",
    start_date: "2025-01-01",
    end_date: "2025-03-31",
    status: "em_andamento" as ObjectiveStatus,
    is_commercial: true,
    value_type: "monetary",
    created_by: "demo-admin-001",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-28T00:00:00Z",
    progressLogs: [
      { id: "log-001", objective_id: "obj-001", value: 45000, notes: "Janeiro parcial", logged_at: "2025-01-15T00:00:00Z", created_by: "demo-admin-001" },
      { id: "log-002", objective_id: "obj-001", value: 53500, notes: "Fechamento janeiro", logged_at: "2025-01-28T00:00:00Z", created_by: "demo-admin-001" },
    ],
  },
  {
    id: "obj-002",
    space_id: "conto",
    title: "Novos Clientes",
    description: "Conquistar 10 novos clientes no bimestre",
    category: "Comercial",
    target_value: 10,
    current_value: 4,
    unit: "clientes",
    start_date: "2025-01-01",
    end_date: "2025-02-28",
    status: "em_andamento" as ObjectiveStatus,
    is_commercial: true,
    value_type: "quantity",
    created_by: "demo-admin-001",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-25T00:00:00Z",
    progressLogs: [
      { id: "log-003", objective_id: "obj-002", value: 2, notes: "2 novos clientes assinaram", logged_at: "2025-01-10T00:00:00Z", created_by: "demo-admin-001" },
      { id: "log-004", objective_id: "obj-002", value: 2, notes: "Mais 2 fechamentos", logged_at: "2025-01-22T00:00:00Z", created_by: "demo-admin-001" },
    ],
  },
  {
    id: "obj-003",
    space_id: "conto",
    title: "NPS Médio",
    description: "Manter NPS médio acima de 8.5",
    category: "Satisfação",
    target_value: 85,
    current_value: 82,
    unit: "%",
    start_date: "2025-01-01",
    end_date: "2025-12-31",
    status: "em_andamento" as ObjectiveStatus,
    is_commercial: false,
    value_type: "percentage",
    created_by: "demo-admin-001",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-20T00:00:00Z",
    progressLogs: [
      { id: "log-005", objective_id: "obj-003", value: 82, notes: "NPS médio atual", logged_at: "2025-01-20T00:00:00Z", created_by: "demo-admin-001" },
    ],
  },
];

// ============================================
// ESTADO GLOBAL MUTÁVEL PARA MODO DEMO
// Isso permite persistir dados entre navegações
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

  // Listener system for React components
  subscribe(listener: () => void) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private notifyListeners() {
    this._listeners.forEach(listener => listener());
  }
}

// Instância singleton do store
export const demoStore = new DemoDataStore();

// Exportar referências para compatibilidade
export const MOCK_SPACES = INITIAL_SPACES;
export const MOCK_LEADS = INITIAL_LEADS;
export const MOCK_CLIENTS = INITIAL_CLIENTS;
export const MOCK_OBJECTIVES = INITIAL_OBJECTIVES;

// ============================================
// PERMISSÕES - Módulos disponíveis para seleção
// ============================================
export const ALL_MODULES: { id: ModulePermission; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Visão geral e métricas do sistema" },
  { id: "strategy", label: "Estratégia", description: "Objetivos e metas estratégicas" },
  { id: "crm", label: "CRM", description: "Gestão de leads e oportunidades" },
  { id: "clients", label: "Clientes", description: "Gestão de clientes ativos" },
  { id: "settings", label: "Configurações", description: "Configurações pessoais" },
];

// Permissões padrão sugeridas por role
export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, ModulePermission[]> = {
  admin: ["dashboard", "strategy", "crm", "clients", "settings", "admin"],
  gestor: ["dashboard", "strategy", "crm", "clients", "settings"],
  comercial: ["dashboard", "crm", "clients", "settings"],
  analista: ["dashboard", "settings"],
};

// Storage key para permissões de usuários
export const USER_PERMISSIONS_KEY = "conto-user-permissions";

// Storage keys para mock (mantidos para compatibilidade)
export const MOCK_STORAGE_KEYS = {
  CURRENT_USER: "conto-mock-current-user",
  REGISTERED_USERS: "conto-mock-registered-users",
};

// Função placeholder para obter empresas
export const getCompanies = () => demoStore.spaces;
export const ALL_COMPANIES = INITIAL_SPACES;