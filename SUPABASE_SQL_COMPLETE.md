# SQL Completo para Supabase - Painel Conto

Execute cada bloco SQL **separadamente e em ordem** no SQL Editor do Supabase.

## 📋 Conexão

```
URL: https://kaqndnjmcrmifqufyoop.supabase.co
```

---

## 1️⃣ ENUMS (Tipos Personalizados)

```sql
-- =============================================
-- PASSO 1: CRIAR ENUMS
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'comercial', 'analista', 'user');

CREATE TYPE public.lead_stage AS ENUM (
  'new', 
  'contact', 
  'meeting_scheduled', 
  'meeting_done', 
  'proposal', 
  'followup', 
  'negotiation', 
  'won', 
  'lost'
);

CREATE TYPE public.lead_temperature AS ENUM ('hot', 'warm', 'cold');

CREATE TYPE public.client_status AS ENUM ('active', 'inactive', 'churn');

CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'paused');

CREATE TYPE public.objective_value_type AS ENUM ('financial', 'quantity', 'percentage');

CREATE TYPE public.objective_status AS ENUM ('on_track', 'at_risk', 'behind');
```

---

## 2️⃣ TABELA DE ROLES (user_roles)

```sql
-- =============================================
-- PASSO 2: TABELA USER_ROLES
-- =============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

---

## 3️⃣ FUNÇÃO has_role + POLÍTICAS RLS

```sql
-- =============================================
-- PASSO 3: FUNÇÃO has_role E POLÍTICAS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## 4️⃣ TABELA DE PERFIS (profiles)

```sql
-- =============================================
-- PASSO 4: TABELA PROFILES
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## 5️⃣ TRIGGER: Criar perfil no signup

```sql
-- =============================================
-- PASSO 5: TRIGGER AUTO-CREATE PROFILE
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 6️⃣ TABELA DE ESPAÇOS (spaces)

```sql
-- =============================================
-- PASSO 6: TABELA SPACES
-- =============================================

CREATE TABLE public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#c4378f',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spaces_user_id ON public.spaces(user_id);

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own spaces"
  ON public.spaces FOR ALL
  USING (auth.uid() = user_id);
```

---

## 7️⃣ TABELA DE LEADS

```sql
-- =============================================
-- PASSO 7: TABELA LEADS
-- =============================================

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  value DECIMAL(15,2) DEFAULT 0,
  temperature public.lead_temperature DEFAULT 'warm',
  origin TEXT,
  stage public.lead_stage DEFAULT 'new',
  last_contact TIMESTAMPTZ,
  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_space_id ON public.leads(space_id);
CREATE INDEX idx_leads_stage ON public.leads(stage);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own leads"
  ON public.leads FOR ALL
  USING (auth.uid() = user_id);
```

---

## 8️⃣ TABELA DE CLIENTES

```sql
-- =============================================
-- PASSO 8: TABELA CLIENTS
-- =============================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  segment TEXT,
  package TEXT,
  monthly_value DECIMAL(15,2) DEFAULT 0,
  status public.client_status DEFAULT 'active',
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_space_id ON public.clients(space_id);
CREATE INDEX idx_clients_status ON public.clients(status);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = user_id);
```

---

## 9️⃣ TABELA DE HISTÓRICO NPS

```sql
-- =============================================
-- PASSO 9: TABELA NPS_RECORDS
-- =============================================

CREATE TABLE public.nps_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nps_client_id ON public.nps_records(client_id);
CREATE INDEX idx_nps_user_id ON public.nps_records(user_id);
CREATE UNIQUE INDEX idx_nps_unique_month ON public.nps_records(client_id, month, year);

ALTER TABLE public.nps_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own NPS records"
  ON public.nps_records FOR ALL
  USING (auth.uid() = user_id);
```

---

## 🔟 TABELA DE OBJETIVOS

```sql
-- =============================================
-- PASSO 10: TABELA OBJECTIVES
-- =============================================

CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  value_type public.objective_value_type DEFAULT 'quantity',
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  deadline DATE NOT NULL,
  status public.objective_status DEFAULT 'on_track',
  is_commercial BOOLEAN DEFAULT FALSE,
  data_sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_objectives_user_id ON public.objectives(user_id);
CREATE INDEX idx_objectives_space_id ON public.objectives(space_id);
CREATE INDEX idx_objectives_deadline ON public.objectives(deadline);

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own objectives"
  ON public.objectives FOR ALL
  USING (auth.uid() = user_id);
```

---

## 1️⃣1️⃣ TABELA DE LOGS DE PROGRESSO

```sql
-- =============================================
-- PASSO 11: TABELA PROGRESS_LOGS
-- =============================================

CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  description TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_objective_id ON public.progress_logs(objective_id);
CREATE INDEX idx_progress_user_id ON public.progress_logs(user_id);
CREATE UNIQUE INDEX idx_progress_unique_month ON public.progress_logs(objective_id, month, year);

ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress logs"
  ON public.progress_logs FOR ALL
  USING (auth.uid() = user_id);
```

---

## 1️⃣2️⃣ TABELA DE PLANOS

```sql
-- =============================================
-- PASSO 12: TABELA PLANS
-- =============================================

CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  interval TEXT DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## 1️⃣3️⃣ TABELA DE ASSINATURAS

```sql
-- =============================================
-- PASSO 13: TABELA SUBSCRIPTIONS
-- =============================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status public.subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## 1️⃣4️⃣ DADOS INICIAIS (Planos)

```sql
-- =============================================
-- PASSO 14: INSERIR PLANOS
-- =============================================

INSERT INTO public.plans (name, description, price, features) VALUES
('Básico', 'Ideal para pequenas empresas', 97.00, '["Até 50 leads", "1 espaço", "Suporte por email"]'),
('Profissional', 'Para empresas em crescimento', 197.00, '["Até 500 leads", "5 espaços", "Suporte prioritário", "Relatórios avançados"]'),
('Enterprise', 'Para grandes operações', 497.00, '["Leads ilimitados", "Espaços ilimitados", "Suporte 24/7", "API access", "White-label"]');
```

---

## 1️⃣5️⃣ CONFIGURAR PRIMEIRO ADMIN

**Após criar seu primeiro usuário (via signup no app):**

```sql
-- =============================================
-- PASSO 15: ATRIBUIR ROLE ADMIN
-- =============================================

-- 1. Primeiro, encontre o ID do seu usuário:
SELECT id, email FROM auth.users;

-- 2. Copie o ID e substitua abaixo:
INSERT INTO public.user_roles (user_id, role)
VALUES ('COLE_O_ID_AQUI', 'admin');
```

---

## ✅ Checklist de Execução

- [ ] Passo 1: Enums criados
- [ ] Passo 2: Tabela user_roles criada
- [ ] Passo 3: Função has_role + políticas RLS
- [ ] Passo 4: Tabela profiles criada
- [ ] Passo 5: Trigger de auto-create profile
- [ ] Passo 6: Tabela spaces criada
- [ ] Passo 7: Tabela leads criada
- [ ] Passo 8: Tabela clients criada
- [ ] Passo 9: Tabela nps_records criada
- [ ] Passo 10: Tabela objectives criada
- [ ] Passo 11: Tabela progress_logs criada
- [ ] Passo 12: Tabela plans criada
- [ ] Passo 13: Tabela subscriptions criada
- [ ] Passo 14: Planos inseridos
- [ ] Passo 15: Admin configurado (após signup)

---

## 🔧 Resolução de Problemas

Se algum passo falhar:

**"type already exists"** → O enum já foi criado, pule para o próximo passo.

**"relation already exists"** → A tabela já existe, pule para o próximo passo.

**"function already exists"** → Execute com `CREATE OR REPLACE FUNCTION`.

**"policy already exists"** → Execute: `DROP POLICY "nome_da_policy" ON public.tabela;` e tente novamente.

**"violates foreign key"** → Execute os passos anteriores primeiro.
