# Supabase Setup - Painel Conto

Configuração completa do banco de dados Supabase para o Painel Conto.

## 📋 Informações de Conexão

```
URL: https://pzeverrrrptauqcdeulx.supabase.co
Anon Key: (configurar em .env)
```

## 🗄️ Schema do Banco de Dados

Execute os SQLs abaixo no SQL Editor do Supabase (em ordem).

### 1. Criar Enum para Roles

```sql
-- Criar tipo enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'comercial', 'analista', 'user');

-- Criar tipo enum para estágios de lead
CREATE TYPE public.lead_stage AS ENUM ('prospeccao', 'qualificacao', 'proposta', 'negociacao', 'fechamento', 'perdido');

-- Criar tipo enum para temperatura de lead
CREATE TYPE public.lead_temperature AS ENUM ('hot', 'warm', 'cold');

-- Criar tipo enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'paused');
```

### 2. Tabela de Perfis de Usuário

```sql
-- Tabela de perfis (estende auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por email
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver próprio perfil
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Política: usuários podem atualizar próprio perfil
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Tabela de Roles

```sql
-- Tabela de roles de usuário (separada por segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Índice para busca por user_id
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (SECURITY DEFINER evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
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

-- Política: usuários podem ver próprias roles
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Política: admins podem gerenciar todas as roles
CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
```

### 4. Tabela de Espaços (Workspaces)

```sql
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

-- Índice
CREATE INDEX idx_spaces_user_id ON public.spaces(user_id);

-- RLS
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem CRUD próprios espaços
CREATE POLICY "Users can manage own spaces"
    ON public.spaces FOR ALL
    USING (auth.uid() = user_id);
```

### 5. Tabela de Leads

```sql
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    stage lead_stage DEFAULT 'prospeccao',
    temperature lead_temperature DEFAULT 'warm',
    value DECIMAL(15,2),
    source TEXT,
    notes TEXT,
    next_contact TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_space_id ON public.leads(space_id);
CREATE INDEX idx_leads_stage ON public.leads(stage);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem gerenciar próprios leads
CREATE POLICY "Users can manage own leads"
    ON public.leads FOR ALL
    USING (auth.uid() = user_id);
```

### 6. Tabela de Clientes

```sql
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    nps_date TIMESTAMPTZ,
    contract_value DECIMAL(15,2),
    contract_start DATE,
    contract_end DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_space_id ON public.clients(space_id);

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem gerenciar próprios clientes
CREATE POLICY "Users can manage own clients"
    ON public.clients FOR ALL
    USING (auth.uid() = user_id);
```

### 7. Tabela de Objetivos

```sql
CREATE TABLE public.objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_value DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) DEFAULT 0,
    unit TEXT DEFAULT 'unidades',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_objectives_user_id ON public.objectives(user_id);
CREATE INDEX idx_objectives_space_id ON public.objectives(space_id);
CREATE INDEX idx_objectives_dates ON public.objectives(start_date, end_date);

-- RLS
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem gerenciar próprios objetivos
CREATE POLICY "Users can manage own objectives"
    ON public.objectives FOR ALL
    USING (auth.uid() = user_id);
```

### 8. Tabela de Planos

```sql
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

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ver planos ativos
CREATE POLICY "Anyone can view active plans"
    ON public.plans FOR SELECT
    USING (is_active = TRUE);

-- Política: admins podem gerenciar planos
CREATE POLICY "Admins can manage plans"
    ON public.plans FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
```

### 9. Tabela de Assinaturas

```sql
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status subscription_status DEFAULT 'active',
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver próprias assinaturas
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Política: admins podem gerenciar todas
CREATE POLICY "Admins can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
```

### 10. Atribuir Role Admin

Após criar seu usuário, execute:

```sql
-- Substitua 'SEU_USER_ID' pelo ID do usuário admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_USER_ID', 'admin');
```

## 🚀 Deploy de Edge Functions

### Instalação do Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# npm
npm install -g supabase

# Login
supabase login
```

### Estrutura das Functions

```
supabase/
└── functions/
    ├── api-admin-users/
    │   └── index.ts
    ├── api-leads/
    │   └── index.ts
    └── api-plans/
        └── index.ts
```

### Deploy

```bash
# Linkar projeto
supabase link --project-ref pzeverrrrptauqcdeulx

# Deploy de todas as functions
supabase functions deploy

# Deploy de function específica
supabase functions deploy api-leads
```

## 🔒 Configurações de Segurança

### URL Configuration

No Dashboard do Supabase (Authentication → URL Configuration):

1. **Site URL**: `https://seudominio.com.br`
2. **Redirect URLs**: 
   - `https://seudominio.com.br`
   - `https://seudominio.com.br/*`

### Rate Limiting

Considere configurar rate limiting para as Edge Functions:
- 100 requests/minuto por IP para APIs públicas
- 1000 requests/minuto para usuários autenticados

---

Para mais detalhes, consulte a [documentação oficial do Supabase](https://supabase.com/docs).
