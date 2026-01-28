/**
 * Dados e tipos mockados para demonstração.
 * 
 * ⚠️ NOTA: Estes dados NÃO são usados em produção.
 * Mantido apenas para compatibilidade de tipos e referência.
 */

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

// Lista vazia - dados vêm do Supabase
export const MOCK_USERS: MockUser[] = [];

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

// Função placeholder para obter empresas (dados vêm do Supabase)
export const getCompanies = () => [];
export const ALL_COMPANIES: { id: string; label: string; description: string; color: string }[] = [];

// Dados mockados vazios - não usados em produção
export const MOCK_LEADS: never[] = [];
export const MOCK_CLIENTS: never[] = [];
export const MOCK_OBJECTIVES: never[] = [];
