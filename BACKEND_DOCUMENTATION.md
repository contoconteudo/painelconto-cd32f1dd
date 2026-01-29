# Conto CMS - Documentação de Integração Backend v2.0

> Última atualização: 29 de Janeiro de 2026

---

## 📋 Visão Geral

O **Conto CMS** é um sistema de gestão para agências, focado em:
- **Planejamento Estratégico**: Objetivos e metas com tracking de progresso
- **CRM**: Gestão de leads e pipeline comercial
- **Clientes**: Gestão de carteira e monitoramento de NPS
- **Multi-tenancy**: Suporte a múltiplas empresas (Espaços)

### Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Autenticação**: Supabase Auth (email/senha)
- **Segurança**: Row Level Security (RLS) com funções auxiliares

---

## 🔧 Configuração

### Credenciais (Novo Projeto - Janeiro 2026)

```
URL: https://jqthecutclccbakzadax.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdGhlY3V0Y2xjY2Jha3phZGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc3MDksImV4cCI6MjA4NTI1MzcwOX0.qI8irQ1ldRmqMThdm9HW4c7dVIDJrNCPz09gWVDTJRM
```

O cliente está configurado em `src/integrations/supabase/client.ts`.

### Schema do Banco

O schema completo está em `supabase/schema.sql`. Execute no SQL Editor do Supabase.

---

## 🗄️ Estrutura de Dados

### Tipos (Enums)

```sql
-- Roles de usuário
app_role: 'admin' | 'gestor' | 'comercial' | 'analista'

-- Status de lead (em português)
lead_status: 'novo' | 'contato' | 'reuniao_agendada' | 'reuniao_feita' | 'proposta' | 'negociacao' | 'ganho' | 'perdido'

-- Temperatura do lead
lead_temperature: 'cold' | 'warm' | 'hot'

-- Status de cliente (em português)
client_status: 'ativo' | 'inativo' | 'churn'

-- Status de objetivo (em português)
objective_status: 'em_andamento' | 'concluido' | 'atrasado' | 'pausado'
```

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuários (sincronizado com auth.users) |
| `user_roles` | Roles dos usuários |
| `user_permissions` | Permissões granulares (módulos e espaços) |
| `spaces` | Empresas/espaços do sistema |
| `leads` | Leads do CRM |
| `clients` | Clientes ativos |
| `nps_records` | Registros de NPS por cliente |
| `objectives` | Objetivos estratégicos |
| `progress_logs` | Logs de progresso dos objetivos |

### profiles
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### user_roles
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
```

### user_permissions
```sql
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  modules TEXT[] DEFAULT '{}',
  spaces TEXT[] DEFAULT '{}'
);
```

### spaces
```sql
CREATE TABLE public.spaces (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-primary',
  icon TEXT DEFAULT 'Building',
  created_by UUID,
  created_at TIMESTAMPTZ
);
```

### leads
```sql
CREATE TABLE public.leads (
  id UUID PRIMARY KEY,
  space_id TEXT REFERENCES public.spaces(id),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  status lead_status DEFAULT 'novo',
  source TEXT,
  value NUMERIC DEFAULT 0,
  temperature lead_temperature DEFAULT 'warm',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### clients
```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY,
  space_id TEXT REFERENCES public.spaces(id),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  segment TEXT,
  status client_status DEFAULT 'ativo',
  monthly_value NUMERIC DEFAULT 0,
  contract_start DATE,
  package TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### nps_records
```sql
CREATE TABLE public.nps_records (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  space_id TEXT REFERENCES public.spaces(id),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  recorded_at TIMESTAMPTZ,
  created_by UUID
);
```

### objectives
```sql
CREATE TABLE public.objectives (
  id UUID PRIMARY KEY,
  space_id TEXT REFERENCES public.spaces(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '%',
  start_date DATE,
  end_date DATE,
  status objective_status DEFAULT 'em_andamento',
  is_commercial BOOLEAN DEFAULT FALSE,
  value_type TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### progress_logs
```sql
CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY,
  objective_id UUID REFERENCES public.objectives(id),
  value NUMERIC NOT NULL,
  notes TEXT,
  logged_at TIMESTAMPTZ,
  created_by UUID
);
```

---

## 🔐 Sistema de Permissões

### Roles

| Role | Descrição | Módulos Padrão |
|------|-----------|----------------|
| `admin` | Acesso total | Todos |
| `gestor` | Gerencia estratégia e equipe | dashboard, strategy, crm, clients, settings |
| `comercial` | Foco em vendas | dashboard, crm, clients, settings |
| `analista` | Acesso restrito | dashboard, settings |

### Módulos Disponíveis

- `dashboard` - Visão geral e métricas
- `strategy` - Objetivos estratégicos
- `crm` - Gestão de leads
- `clients` - Gestão de clientes
- `settings` - Configurações pessoais
- `admin` - Painel administrativo

### Funções de Segurança

```sql
-- Verifica se usuário tem uma role específica
public.has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN

-- Verifica se usuário é admin
public.is_admin(_user_id UUID) RETURNS BOOLEAN

-- Retorna espaços permitidos do usuário
public.get_user_spaces(_user_id UUID) RETURNS TEXT[]
```

### Políticas RLS

- **Admins**: Acesso total a todos os dados
- **Usuários**: Apenas dados dos espaços em `user_permissions.spaces`
- **Exclusão**: Apenas admins podem excluir registros

---

## 🪝 Hooks do Frontend

| Hook | Descrição |
|------|-----------|
| `useAuth` | Autenticação (signIn, signUp, signOut, resetPassword) |
| `useUserSession` | Sessão centralizada com cache via React Query |
| `useUserRole` | Role e permissões do usuário |
| `useSpaces` | CRUD de espaços |
| `useLeads` | CRUD de leads (filtrado por espaço) |
| `useClients` | CRUD de clientes + NPS |
| `useObjectives` | CRUD de objetivos + progress logs |
| `usePermissions` | Verificação de permissões CRUD |

---

## 🎯 Metas Comerciais Automáticas

Objetivos podem ser configurados como "comerciais" com alimentação automática:

| value_type | Descrição |
|------------|-----------|
| `crm_pipeline` | Soma do valor dos leads em negociação |
| `crm_won` | Soma do valor dos leads ganhos |
| `clients_mrr` | MRR total de clientes ativos |
| `clients_count` | Quantidade de clientes ativos |

---

## 📱 Modo DEMO

O sistema possui um modo DEMO (`DEMO_MODE = true` em `src/data/mockData.ts`) que:
- Desativa chamadas ao Supabase
- Usa dados mock em memória (persistentes durante navegação)
- Simula usuário admin com acesso total
- Útil para desenvolvimento e demonstrações

**Para ativar produção**: altere `DEMO_MODE` para `false` em `src/data/mockData.ts`.

---

## 🚀 Primeiro Acesso (Produção)

1. **Execute o schema SQL** no Supabase SQL Editor (`supabase/schema.sql`)

2. **Crie um usuário** no Auth do Supabase (Authentication > Users)

3. **Defina como admin**:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_USER_ID', 'admin');

INSERT INTO public.user_permissions (user_id, modules, spaces)
VALUES (
  'SEU_USER_ID',
  ARRAY['dashboard', 'strategy', 'crm', 'clients', 'settings', 'admin'],
  ARRAY['conto']
);
```

4. **Desative o modo DEMO** em `src/data/mockData.ts`

5. **Acesse o sistema** e faça login

---

## 🐛 Troubleshooting

### Erro "no rows returned"
- Verifique se o schema foi executado completamente
- Verifique se há espaços criados na tabela `spaces`

### Erro de permissão / Dados não aparecem
- Verifique as políticas RLS no Supabase
- Certifique-se que o usuário tem role em `user_roles`
- Certifique-se que o usuário tem espaços em `user_permissions.spaces`

### Usuário não aparece na lista de admins
- O trigger `on_auth_user_created` deve estar ativo
- Verifique se o profile foi criado na tabela `profiles`

---

## ✅ Checklist de Produção

- [x] Schema SQL v2.0 criado
- [x] Tipos em português (lead_status, client_status, objective_status)
- [x] Hooks integrados com Supabase
- [x] RLS configurado com funções de segurança
- [x] Trigger para criar profiles automaticamente
- [x] Metas comerciais automáticas implementadas
- [x] Credenciais atualizadas (projeto Janeiro 2026)
- [ ] Primeiro admin configurado
- [ ] Espaços iniciais criados
- [ ] DEMO_MODE desativado
- [ ] Testes de fluxo completos

---

*Documentação gerada pelo Conto CMS v2.0*