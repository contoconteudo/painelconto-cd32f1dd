/**
 * Constantes e configurações do sistema.
 * Este arquivo NÃO contém mais dados mock - o sistema usa 100% Supabase.
 */

// ============================================
// TIPOS EXPORTADOS
// ============================================
export type AppRole = "admin" | "gestor" | "comercial" | "analista";
export type ModulePermission = "dashboard" | "crm" | "clients" | "objectives" | "strategy" | "settings" | "admin";
export type CompanyAccess = string;

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

// Storage key para seleção de empresa
export const COMPANY_STORAGE_KEY = "conto-company-selection";
