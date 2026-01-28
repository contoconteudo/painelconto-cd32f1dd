# Integração Backend - Conto Management System

## 📋 Resumo Executivo

O **Conto Management System (CMS)** é uma plataforma de gestão interna para agências focada em:

1. **Planejamento Estratégico** - Objetivos e metas com acompanhamento mensal
2. **CRM Comercial** - Pipeline de leads com automação de follow-up
3. **Gestão de Clientes** - Carteira de clientes com histórico de NPS
4. **Multi-tenant** - Múltiplos "Espaços" (empresas) com isolamento de dados

---

## 🏗️ Arquitetura Frontend

```
src/
├── components/          # Componentes React
│   ├── auth/           # ProtectedRoute
│   ├── clients/        # CRUD de clientes
│   ├── crm/            # CRM e leads
│   ├── dashboard/      # Cards e métricas
│   ├── layout/         # Header, Sidebar, Mobile
│   └── objectives/     # Objetivos estratégicos
├── contexts/
│   └── CompanyContext  # Espaço atual selecionado
├── hooks/
│   ├── useAuth.ts      # Autenticação → Supabase Auth
│   ├── useClients.ts   # CRUD clientes → Supabase
│   ├── useLeads.ts     # CRUD leads → Supabase
│   ├── useObjectives.ts # CRUD objetivos → Supabase
│   ├── useSpaces.ts    # Espaços → Supabase
│   └── useUserRole.ts  # Roles → user_roles
├── integrations/
│   └── supabase/
│       └── client.ts   # Cliente Supabase (PRONTO)
├── lib/
│   ├── constants.ts    # Configurações
│   ├── storage.ts      # Abstração Web/Native
│   └── platform.ts     # Detecção de plataforma
├── pages/              # Rotas da aplicação
└── types/
    └── index.ts        # Tipos centralizados
```

---

## 🗄️ Schema do Banco de Dados (Supabase)

### Enums

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'comercial', 'analista');
CREATE TYPE public.lead_temperature AS ENUM ('hot', 'warm', 'cold');
CREATE TYPE public.lead_stage AS ENUM (
  'new', 'contact', 'meeting_scheduled', 'meeting_done',
  'proposal', 'followup', 'negotiation', 'won', 'lost'
);
CREATE TYPE public.client_status AS ENUM ('active', 'inactive', 'churn');
CREATE TYPE public.objective_value_type AS ENUM ('financial', 'quantity', 'percentage');
CREATE TYPE public.objective_status AS ENUM ('on_track', 'at_risk', 'behind');
```

### Tabelas

#### 1. `spaces` - Espaços/Empresas

```sql
CREATE TABLE public.spaces (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-primary',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO spaces (id, label, description, color) VALUES
  ('conto', 'Conto', 'Agência Conto', 'bg-primary'),
  ('amplia', 'Amplia', 'Agência Amplia', 'bg-blue-600');
```

#### 2. `profiles` - Perfis de Usuário

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar perfil no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 3. `user_roles` - Roles (TABELA SEPARADA - Segurança)

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'analista',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Função auxiliar (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
```

#### 4. `user_permissions` - Permissões Granulares

```sql
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  modules TEXT[] DEFAULT '{}',
  spaces TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);
```

#### 5. `leads` - Pipeline Comercial

```sql
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT REFERENCES public.spaces(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  value DECIMAL(12,2) DEFAULT 0,
  temperature public.lead_temperature DEFAULT 'cold',
  origin TEXT,
  stage public.lead_stage DEFAULT 'new',
  last_contact DATE,
  notes TEXT,
  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `clients` - Carteira de Clientes

```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT REFERENCES public.spaces(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  company TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  segment TEXT,
  package TEXT,
  monthly_value DECIMAL(12,2) DEFAULT 0,
  status public.client_status DEFAULT 'active',
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `nps_records` - Histórico NPS

```sql
CREATE TABLE public.nps_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, month, year)
);
```

#### 8. `objectives` - Metas Estratégicas

```sql
CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT REFERENCES public.spaces(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  value_type public.objective_value_type DEFAULT 'quantity',
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,
  deadline DATE NOT NULL,
  status public.objective_status DEFAULT 'on_track',
  is_commercial BOOLEAN DEFAULT false,
  data_sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 9. `progress_logs` - Progresso Mensal

```sql
CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  description TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (objective_id, month, year)
);
```

---

## 🔒 Políticas RLS

```sql
-- Função auxiliar para verificar acesso ao espaço
CREATE OR REPLACE FUNCTION public.can_access_space(_space_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
    OR _space_id = ANY(SELECT unnest(spaces) FROM public.user_permissions WHERE user_id = auth.uid())
$$;

-- Exemplo: RLS para leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads in their spaces"
ON public.leads FOR SELECT TO authenticated
USING (public.can_access_space(space_id));

CREATE POLICY "Users can create leads in their spaces"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (public.can_access_space(space_id) AND user_id = auth.uid());

CREATE POLICY "Users can update own leads"
ON public.leads FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own leads"
ON public.leads FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
```

---

## 🔄 Migração dos Hooks

### Exemplo: useLeads.ts

```typescript
// ANTES (localStorage)
const [leads, setLeads] = useLocalStorage<Lead[]>(STORAGE_KEYS.LEADS, []);

// DEPOIS (Supabase + React Query)
const { data: leads } = useQuery({
  queryKey: ['leads', currentSpace],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('space_id', currentSpace)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
});
```

---

## ✅ Checklist de Implementação

### Fase 1: Setup
- [ ] Criar projeto Supabase
- [ ] Configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
- [ ] Executar SQL de criação de tabelas
- [ ] Habilitar RLS em todas as tabelas

### Fase 2: Autenticação
- [ ] Migrar useAuth.ts → Supabase Auth
- [ ] Migrar useUserRole.ts → user_roles
- [ ] Testar login/logout/signup

### Fase 3: Dados
- [ ] Migrar useSpaces.ts
- [ ] Migrar useLeads.ts
- [ ] Migrar useClients.ts
- [ ] Migrar useObjectives.ts

### Fase 4: Validação
- [ ] Testar isolamento de dados por espaço
- [ ] Testar permissões de módulos
- [ ] Configurar automação lead → followup

---

## 🔧 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```
