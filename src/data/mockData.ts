/**
 * Dados mockados para demonstração do sistema.
 * Estes dados serão substituídos por dados reais do backend futuramente.
 * 
 * ⚠️ AVISO DE SEGURANÇA:
 * As senhas neste arquivo são apenas para demonstração local.
 * Em produção com Supabase Auth, as senhas são gerenciadas pelo backend
 * e NUNCA ficam expostas no frontend.
 */

import { Lead, Client, Objective, NPSRecord } from "@/types";

// ============================================
// USUÁRIOS MOCKADOS
// ============================================

export type AppRole = "admin" | "gestor" | "comercial" | "analista";
export type ModulePermission = "dashboard" | "crm" | "clients" | "objectives" | "strategy" | "settings" | "admin";
export type CompanyAccess = "conto" | "amplia";

export interface MockUser {
  id: string;
  email: string;
  password: string; // ⚠️ APENAS PARA DEMO - Removido quando usar Supabase Auth
  full_name: string;
  role: AppRole;
  modules: ModulePermission[]; // Módulos específicos que este usuário pode acessar
  companies: CompanyAccess[]; // Espaços que este usuário pode acessar
  created_at: string;
}

/**
 * ⚠️ CREDENCIAIS DE DEMONSTRAÇÃO
 * 
 * Estas credenciais são usadas apenas no modo de demonstração local.
 * Quando o Supabase Auth for ativado:
 * 1. Este array deve ser removido
 * 2. Autenticação será feita via supabase.auth.signIn()
 * 3. Roles serão carregadas da tabela user_roles no banco
 * 
 * Para produção, substitua useAuth.ts por integração real com Supabase.
 */
const DEMO_MODE_ONLY = import.meta.env.DEV || !import.meta.env.VITE_SUPABASE_URL;

// Admin tem acesso a TUDO automaticamente, os demais só têm o que o admin liberar
export const MOCK_USERS: MockUser[] = DEMO_MODE_ONLY ? [
  {
    id: "user-admin-001",
    email: "admin@conto.com.br",
    password: "admin123",
    full_name: "Administrador",
    role: "admin",
    modules: ["dashboard", "strategy", "crm", "clients", "settings", "admin"],
    companies: ["conto", "amplia"], // Admin sempre tem acesso a todos
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "user-gestor-001",
    email: "gestor@conto.com.br",
    password: "gestor123",
    full_name: "Maria Gestora",
    role: "gestor",
    modules: ["dashboard", "strategy", "crm", "clients"],
    companies: ["conto", "amplia"], // Acesso aos dois espaços
    created_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "user-comercial-001",
    email: "comercial@conto.com.br",
    password: "comercial123",
    full_name: "João Vendas",
    role: "comercial",
    modules: ["dashboard", "crm", "clients"],
    companies: ["conto"], // Apenas Conto
    created_at: "2024-02-01T00:00:00Z",
  },
  {
    id: "user-analista-001",
    email: "analista@conto.com.br",
    password: "analista123",
    full_name: "Ana Analista",
    role: "analista",
    modules: ["dashboard"],
    companies: ["amplia"], // Apenas Amplia
    created_at: "2024-02-15T00:00:00Z",
  },
  {
    id: "user-novo-001",
    email: "novo@conto.com.br",
    password: "novo123",
    full_name: "Usuário Novo",
    role: "analista",
    modules: [],
    companies: [], // Sem acesso até admin liberar
    created_at: "2025-01-28T00:00:00Z",
  },
] : [];

// ============================================
// ESPAÇOS DISPONÍVEIS
// ============================================

export const ALL_COMPANIES: { id: CompanyAccess; label: string; description: string; color: string }[] = [
  { id: "conto", label: "Conto", description: "Agência Conto", color: "bg-primary" },
  { id: "amplia", label: "Amplia", description: "Agência Amplia", color: "bg-blue-600" },
];

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

// Permissões padrão sugeridas por role (usado como template ao criar usuário)
export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, ModulePermission[]> = {
  admin: ["dashboard", "strategy", "crm", "clients", "settings", "admin"],
  gestor: ["dashboard", "strategy", "crm", "clients", "settings"],
  comercial: ["dashboard", "crm", "clients", "settings"],
  analista: ["dashboard", "settings"],
};

// Storage key para permissões de usuários
export const USER_PERMISSIONS_KEY = "conto-user-permissions";

// ============================================
// LEADS MOCKADOS
// ============================================

export const MOCK_LEADS: Lead[] = [
  {
    id: "lead-001",
    project_id: "default",
    user_id: "user-comercial-001",
    name: "Roberto Silva",
    company: "Tech Solutions",
    email: "roberto@techsolutions.com",
    phone: "(11) 99999-1111",
    value: 15000,
    temperature: "hot",
    origin: "Indicação",
    stage: "proposal",
    lastContact: "2025-01-27",
    notes: "Interessado no pacote Enterprise",
    createdAt: "2025-01-15",
    stageChangedAt: "2025-01-27T10:00:00Z",
  },
  {
    id: "lead-002",
    project_id: "default",
    user_id: "user-comercial-001",
    name: "Carla Mendes",
    company: "Inovação Digital",
    email: "carla@inovacao.com",
    phone: "(11) 98888-2222",
    value: 8500,
    temperature: "warm",
    origin: "LinkedIn",
    stage: "meeting_scheduled",
    lastContact: "2025-01-26",
    notes: "Reunião agendada para quinta",
    createdAt: "2025-01-20",
    stageChangedAt: "2025-01-26T14:00:00Z",
  },
  {
    id: "lead-003",
    project_id: "default",
    user_id: "user-comercial-001",
    name: "Fernando Costa",
    company: "StartupXYZ",
    email: "fernando@startupxyz.com",
    phone: "(21) 97777-3333",
    value: 5000,
    temperature: "cold",
    origin: "Tráfego Pago",
    stage: "contact",
    lastContact: "2025-01-20",
    notes: "Pediu para retornar em 2 semanas",
    createdAt: "2025-01-10",
    stageChangedAt: "2025-01-20T09:00:00Z",
  },
  {
    id: "lead-004",
    project_id: "default",
    user_id: "user-comercial-001",
    name: "Patricia Lima",
    company: "Consultoria Prime",
    email: "patricia@prime.com",
    phone: "(31) 96666-4444",
    value: 25000,
    temperature: "hot",
    origin: "Evento",
    stage: "negotiation",
    lastContact: "2025-01-28",
    notes: "Negociando valores finais",
    createdAt: "2025-01-05",
    stageChangedAt: "2025-01-28T11:00:00Z",
  },
  {
    id: "lead-005",
    project_id: "default",
    user_id: "user-comercial-001",
    name: "Marcos Oliveira",
    company: "Digital Agency",
    email: "marcos@digitalagency.com",
    phone: "(41) 95555-5555",
    value: 12000,
    temperature: "warm",
    origin: "Orgânico",
    stage: "meeting_done",
    lastContact: "2025-01-25",
    notes: "Reunião foi positiva, aguardando proposta",
    createdAt: "2025-01-12",
    stageChangedAt: "2025-01-25T16:00:00Z",
  },
  {
    id: "lead-006",
    project_id: "default",
    user_id: "user-comercial-001",
    name: "Julia Santos",
    company: "E-commerce Plus",
    email: "julia@ecomplus.com",
    phone: "(51) 94444-6666",
    value: 18000,
    temperature: "hot",
    origin: "Indicação",
    stage: "won",
    lastContact: "2025-01-22",
    notes: "Fechou o contrato!",
    createdAt: "2025-01-01",
    stageChangedAt: "2025-01-22T15:00:00Z",
  },
  {
    id: "lead-007",
    project_id: "default",
    user_id: "user-comercial-001",
    name: "Ricardo Ferreira",
    company: "Logística Express",
    email: "ricardo@logistica.com",
    phone: "(61) 93333-7777",
    value: 7500,
    temperature: "cold",
    origin: "Outbound",
    stage: "lost",
    lastContact: "2025-01-18",
    notes: "Optou por outro fornecedor",
    createdAt: "2024-12-15",
    stageChangedAt: "2025-01-18T10:00:00Z",
  },
  {
    id: "lead-008",
    project_id: "default",
    user_id: "user-comercial-001",
    name: "Amanda Rocha",
    company: "Finanças Smart",
    email: "amanda@financas.com",
    phone: "(71) 92222-8888",
    value: 30000,
    temperature: "hot",
    origin: "Site",
    stage: "new",
    lastContact: "2025-01-28",
    notes: "Novo lead qualificado",
    createdAt: "2025-01-28",
    stageChangedAt: "2025-01-28T08:00:00Z",
  },
];

// ============================================
// CLIENTES MOCKADOS
// ============================================

const createNPSHistory = (clientId: string, scores: { month: number; year: number; score: number }[]): NPSRecord[] => {
  return scores.map((s, i) => ({
    id: `nps-${clientId}-${i}`,
    client_id: clientId,
    month: s.month,
    year: s.year,
    score: s.score,
    notes: s.score >= 9 ? "Cliente satisfeito" : s.score >= 7 ? "Neutro" : "Precisa de atenção",
    recordedAt: `${s.year}-${String(s.month).padStart(2, "0")}-15`,
  }));
};

export const MOCK_CLIENTS: Client[] = [
  {
    id: "client-001",
    project_id: "default",
    user_id: "user-comercial-001",
    company: "Tech Solutions",
    contact: "Roberto Silva",
    email: "roberto@techsolutions.com",
    phone: "(11) 99999-1111",
    segment: "Tecnologia",
    package: "Enterprise",
    monthlyValue: 15000,
    status: "active",
    npsHistory: createNPSHistory("client-001", [
      { month: 10, year: 2024, score: 9 },
      { month: 11, year: 2024, score: 10 },
      { month: 12, year: 2024, score: 9 },
      { month: 1, year: 2025, score: 10 },
    ]),
    startDate: "2024-06-01",
    notes: "Cliente desde junho/2024",
  },
  {
    id: "client-002",
    project_id: "default",
    user_id: "user-comercial-001",
    company: "E-commerce Plus",
    contact: "Julia Santos",
    email: "julia@ecomplus.com",
    phone: "(51) 94444-6666",
    segment: "Varejo",
    package: "Completão",
    monthlyValue: 8500,
    status: "active",
    npsHistory: createNPSHistory("client-002", [
      { month: 11, year: 2024, score: 8 },
      { month: 12, year: 2024, score: 8 },
      { month: 1, year: 2025, score: 9 },
    ]),
    startDate: "2024-09-01",
    notes: "Migrou do plano Start",
  },
  {
    id: "client-003",
    project_id: "default",
    user_id: "user-comercial-001",
    company: "Consultoria Prime",
    contact: "Patricia Lima",
    email: "patricia@prime.com",
    phone: "(31) 96666-4444",
    segment: "Serviços",
    package: "Enterprise",
    monthlyValue: 25000,
    status: "active",
    npsHistory: createNPSHistory("client-003", [
      { month: 12, year: 2024, score: 10 },
      { month: 1, year: 2025, score: 10 },
    ]),
    startDate: "2024-11-01",
    notes: "Maior cliente do portfólio",
  },
  {
    id: "client-004",
    project_id: "default",
    user_id: "user-comercial-001",
    company: "Startup Innova",
    contact: "Lucas Martins",
    email: "lucas@innova.com",
    phone: "(11) 91111-1234",
    segment: "Tecnologia",
    package: "Start",
    monthlyValue: 3500,
    status: "active",
    npsHistory: createNPSHistory("client-004", [
      { month: 1, year: 2025, score: 7 },
    ]),
    startDate: "2025-01-01",
    notes: "Cliente novo, em onboarding",
  },
  {
    id: "client-005",
    project_id: "default",
    user_id: "user-comercial-001",
    company: "Educação Online",
    contact: "Fernanda Alves",
    email: "fernanda@eduonline.com",
    phone: "(21) 92222-4567",
    segment: "Educação",
    package: "Completão",
    monthlyValue: 6000,
    status: "inactive",
    npsHistory: createNPSHistory("client-005", [
      { month: 10, year: 2024, score: 6 },
      { month: 11, year: 2024, score: 5 },
      { month: 12, year: 2024, score: 4 },
    ]),
    startDate: "2024-03-01",
    notes: "Pausou o contrato temporariamente",
  },
  {
    id: "client-006",
    project_id: "default",
    user_id: "user-comercial-001",
    company: "Saúde Total",
    contact: "Dr. André Ribeiro",
    email: "andre@saudetotal.com",
    phone: "(31) 93333-7890",
    segment: "Saúde",
    package: "Enterprise",
    monthlyValue: 12000,
    status: "active",
    npsHistory: createNPSHistory("client-006", [
      { month: 11, year: 2024, score: 9 },
      { month: 12, year: 2024, score: 9 },
      { month: 1, year: 2025, score: 8 },
    ]),
    startDate: "2024-08-01",
    notes: "Clínica com 3 unidades",
  },
  {
    id: "client-007",
    project_id: "default",
    user_id: "user-comercial-001",
    company: "Indústria Metal",
    contact: "Carlos Souza",
    email: "carlos@metal.com",
    phone: "(41) 94444-0123",
    segment: "Indústria",
    package: "PF/Básico",
    monthlyValue: 2000,
    status: "churn",
    npsHistory: createNPSHistory("client-007", [
      { month: 9, year: 2024, score: 5 },
      { month: 10, year: 2024, score: 3 },
    ]),
    startDate: "2024-04-01",
    notes: "Cancelou por corte de custos",
  },
];

// ============================================
// OBJETIVOS MOCKADOS
// ============================================

export const MOCK_OBJECTIVES: Objective[] = [
  {
    id: "obj-001",
    project_id: "default",
    user_id: "user-gestor-001",
    name: "Faturamento Q1 2025",
    description: "Atingir R$ 100.000 de faturamento no primeiro trimestre",
    valueType: "financial",
    targetValue: 100000,
    currentValue: 72000,
    deadline: "2025-03-31",
    status: "on_track",
    createdAt: "2025-01-01",
    progressLogs: [
      { id: "log-001", objective_id: "obj-001", month: 1, year: 2025, value: 72000, description: "MRR atual", date: "2025-01-28" },
    ],
    isCommercial: true,
    dataSources: ["clients"],
  },
  {
    id: "obj-002",
    project_id: "default",
    user_id: "user-gestor-001",
    name: "Novos Clientes",
    description: "Conquistar 20 novos clientes até junho",
    valueType: "quantity",
    targetValue: 20,
    currentValue: 4,
    deadline: "2025-06-30",
    status: "on_track",
    createdAt: "2025-01-01",
    progressLogs: [
      { id: "log-002", objective_id: "obj-002", month: 1, year: 2025, value: 4, description: "Clientes fechados em janeiro", date: "2025-01-28" },
    ],
    isCommercial: true,
    dataSources: ["crm"],
  },
  {
    id: "obj-003",
    project_id: "default",
    user_id: "user-gestor-001",
    name: "Taxa de Retenção",
    description: "Manter taxa de retenção acima de 90%",
    valueType: "percentage",
    targetValue: 90,
    currentValue: 85,
    deadline: "2025-12-31",
    status: "at_risk",
    createdAt: "2025-01-01",
    progressLogs: [
      { id: "log-003", objective_id: "obj-003", month: 1, year: 2025, value: 85, description: "1 churn em janeiro", date: "2025-01-28" },
    ],
    isCommercial: false,
    dataSources: [],
  },
  {
    id: "obj-004",
    project_id: "default",
    user_id: "user-gestor-001",
    name: "NPS Médio",
    description: "Alcançar NPS médio de 9+",
    valueType: "quantity",
    targetValue: 9,
    currentValue: 8.3,
    deadline: "2025-12-31",
    status: "at_risk",
    createdAt: "2025-01-01",
    progressLogs: [
      { id: "log-004", objective_id: "obj-004", month: 1, year: 2025, value: 8.3, description: "NPS médio atual", date: "2025-01-28" },
    ],
    isCommercial: false,
    dataSources: [],
  },
];

// ============================================
// STORAGE KEYS PARA PERSISTÊNCIA
// ============================================

export const MOCK_STORAGE_KEYS = {
  CURRENT_USER: "conto-mock-current-user",
  USERS: "conto-mock-users",
} as const;
