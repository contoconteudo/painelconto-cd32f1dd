# Conto CMS - Documentação de Integração Backend

> Última atualização: 28 de Janeiro de 2026

---

## 📋 Visão Geral

O **Conto CMS** está integrado com o **Supabase** para autenticação, banco de dados e controle de acesso.

### Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Autenticação**: Supabase Auth (email/senha)
- **Segurança**: Row Level Security (RLS) com funções auxiliares

---

## 🔧 Configuração

### Credenciais

O cliente Supabase está configurado em `src/integrations/supabase/client.ts`.

### Schema do Banco

O schema completo está em `supabase/schema.sql`. Execute no SQL Editor do Supabase.

---

## 🗄️ Estrutura de Dados

### profiles
Sincronizado automaticamente com `auth.users` via trigger.

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
Armazena a role de cada usuário. Roles disponíveis: `admin`, `gestor`, `comercial`, `analista`.

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
```

### user_permissions
Módulos e espaços permitidos para cada usuário.

```sql
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  modules TEXT[] DEFAULT '{}',
  spaces TEXT[] DEFAULT '{}'
);
```

### spaces
Representa empresas/unidades de negócio isoladas.

```sql
CREATE TABLE public.spaces (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ
);
```

### leads
Pipeline comercial.

```sql
CREATE TABLE public.leads (
  id UUID PRIMARY KEY,
  space_id TEXT REFERENCES public.spaces(id),
  user_id UUID,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  value NUMERIC,
  temperature TEXT, -- 'hot', 'warm', 'cold'
  origin TEXT,
  stage TEXT, -- 'new', 'contact', 'meeting_scheduled', etc.
  last_contact DATE,
  notes TEXT,
  created_at TIMESTAMPTZ,
  stage_changed_at TIMESTAMPTZ
);
```

### clients
Clientes ativos.

```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY,
  space_id TEXT REFERENCES public.spaces(id),
  user_id UUID,
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  segment TEXT,
  package TEXT,
  monthly_value NUMERIC,
  status TEXT, -- 'active', 'inactive', 'churn'
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ
);
```

### nps_records
Histórico de NPS por cliente.

```sql
CREATE TABLE public.nps_records (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  month INTEGER,
  year INTEGER,
  score INTEGER,
  notes TEXT,
  recorded_at TIMESTAMPTZ,
  UNIQUE (client_id, month, year)
);
```

### objectives
Metas estratégicas.

```sql
CREATE TABLE public.objectives (
  id UUID PRIMARY KEY,
  space_id TEXT REFERENCES public.spaces(id),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  value_type TEXT, -- 'financial', 'quantity', 'percentage'
  target_value NUMERIC NOT NULL,
  current_value NUMERIC,
  deadline DATE NOT NULL,
  status TEXT, -- 'on_track', 'at_risk', 'behind'
  is_commercial BOOLEAN,
  data_sources TEXT[],
  created_at TIMESTAMPTZ
);
```

### progress_logs
Logs de progresso por mês.

```sql
CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY,
  objective_id UUID REFERENCES public.objectives(id),
  month INTEGER,
  year INTEGER,
  value NUMERIC,
  description TEXT,
  date DATE,
  UNIQUE (objective_id, month, year)
);
```

---

## 🔐 Segurança (RLS)

### Funções de Segurança

```sql
-- Verifica se usuário tem uma role
public.has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN

-- Verifica se é admin
public.is_admin(_user_id UUID) RETURNS BOOLEAN
```

### Políticas

- **Admins**: Acesso total a todos os dados
- **Usuários**: Apenas dados dos espaços permitidos
- **Exclusão**: Apenas admins podem excluir registros

---

## 🪝 Hooks do Frontend

| Hook | Descrição |
|------|-----------|
| `useAuth` | Autenticação (signIn, signUp, signOut, resetPassword) |
| `useUserRole` | Role e permissões do usuário |
| `useSpaces` | CRUD de espaços |
| `useLeads` | CRUD de leads (filtrado por espaço) |
| `useClients` | CRUD de clientes + NPS |
| `useObjectives` | CRUD de objetivos + progress logs |

---

## 🚀 Primeiro Acesso

1. **Execute o schema SQL** no Supabase SQL Editor
2. **Crie um usuário** no Auth do Supabase
3. **Defina como admin**:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('SEU_USER_ID', 'admin');
   ```
4. **Crie espaços iniciais**:
   ```sql
   INSERT INTO public.spaces (id, label, description, color, created_by)
   VALUES 
     ('conto', 'Conto', 'Agência Conto', 'bg-primary', 'SEU_USER_ID'),
     ('amplia', 'Amplia', 'Agência Amplia', 'bg-blue-600', 'SEU_USER_ID');
   ```
5. **Acesse o sistema** e faça login

---

## 🐛 Troubleshooting

### Erro "no rows returned"
- Verifique se o schema foi executado completamente
- Verifique se há espaços criados

### Erro de permissão
- Verifique as políticas RLS
- Certifique-se que o usuário tem role e permissões configuradas

### Usuário não aparece na lista de admins
- O trigger `on_auth_user_created` deve estar ativo
- Verifique se o profile foi criado na tabela `profiles`

---

## ✅ Checklist de Produção

- [x] Schema SQL criado
- [x] Hooks integrados com Supabase
- [x] RLS configurado com funções de segurança
- [x] Trigger para criar profiles automaticamente
- [x] Dados mockados removidos
- [ ] Primeiro admin configurado
- [ ] Espaços iniciais criados
- [ ] Testes de fluxo completos

---

*Documentação gerada pelo Conto CMS*
