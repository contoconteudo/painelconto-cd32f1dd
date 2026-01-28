-- ============================================
-- CONTO CMS - SCHEMA DO BANCO DE DADOS
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- na ordem apresentada (do começo ao fim).
-- ============================================

-- ============================================
-- PASSO 1: CRIAR ENUM DE ROLES
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'comercial', 'analista');

-- ============================================
-- PASSO 2: CRIAR TABELA DE PROFILES
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 3: CRIAR TABELA DE ROLES
-- ============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 4: CRIAR TABELA DE PERMISSÕES
-- ============================================

CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  modules TEXT[] DEFAULT '{}',
  spaces TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 5: CRIAR TABELA DE ESPAÇOS
-- ============================================

CREATE TABLE public.spaces (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT 'bg-primary',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 6: CRIAR TABELA DE LEADS
-- ============================================

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  value NUMERIC DEFAULT 0,
  temperature TEXT DEFAULT 'warm' CHECK (temperature IN ('hot', 'warm', 'cold')),
  origin TEXT DEFAULT '',
  stage TEXT DEFAULT 'new' CHECK (stage IN ('new', 'contact', 'meeting_scheduled', 'meeting_done', 'proposal', 'followup', 'negotiation', 'won', 'lost')),
  last_contact DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  stage_changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 7: CRIAR TABELA DE CLIENTES
-- ============================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  segment TEXT DEFAULT '',
  package TEXT DEFAULT '',
  monthly_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churn')),
  start_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 8: CRIAR TABELA DE NPS
-- ============================================

CREATE TABLE public.nps_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, month, year)
);

ALTER TABLE public.nps_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 9: CRIAR TABELA DE OBJETIVOS
-- ============================================

CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  value_type TEXT DEFAULT 'quantity' CHECK (value_type IN ('financial', 'quantity', 'percentage')),
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  deadline DATE NOT NULL,
  status TEXT DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'behind')),
  is_commercial BOOLEAN DEFAULT FALSE,
  data_sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 10: CRIAR TABELA DE PROGRESS LOGS
-- ============================================

CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  value NUMERIC NOT NULL,
  description TEXT DEFAULT '',
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE (objective_id, month, year)
);

ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 11: CRIAR FUNÇÕES DE SEGURANÇA
-- ============================================

-- Função para verificar se usuário tem uma role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- ============================================
-- PASSO 12: TRIGGER PARA CRIAR PROFILE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PASSO 13: POLÍTICAS RLS - PROFILES
-- ============================================

-- Usuários podem ver próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Usuários podem atualizar próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- PASSO 14: POLÍTICAS RLS - USER ROLES
-- ============================================

-- Admins podem ver todas as roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Usuários podem ver própria role
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins podem gerenciar roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- PASSO 15: POLÍTICAS RLS - USER PERMISSIONS
-- ============================================

-- Admins podem ver todas as permissões
CREATE POLICY "Admins can view all permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Usuários podem ver próprias permissões
CREATE POLICY "Users can view own permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins podem gerenciar permissões
CREATE POLICY "Admins can manage permissions"
  ON public.user_permissions FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- PASSO 16: POLÍTICAS RLS - SPACES
-- ============================================

-- Usuários autenticados podem ver espaços
CREATE POLICY "Authenticated users can view spaces"
  ON public.spaces FOR SELECT
  TO authenticated
  USING (TRUE);

-- Admins podem gerenciar espaços
CREATE POLICY "Admins can manage spaces"
  ON public.spaces FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- PASSO 17: POLÍTICAS RLS - LEADS
-- ============================================

-- Usuários podem ver leads dos espaços permitidos
CREATE POLICY "Users can view leads in allowed spaces"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  );

-- Usuários podem criar leads em espaços permitidos
CREATE POLICY "Users can create leads in allowed spaces"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  );

-- Usuários podem atualizar leads em espaços permitidos
CREATE POLICY "Users can update leads in allowed spaces"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  );

-- Apenas admins podem deletar leads
CREATE POLICY "Only admins can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- PASSO 18: POLÍTICAS RLS - CLIENTS
-- ============================================

CREATE POLICY "Users can view clients in allowed spaces"
  ON public.clients FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create clients in allowed spaces"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update clients in allowed spaces"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Only admins can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- PASSO 19: POLÍTICAS RLS - NPS RECORDS
-- ============================================

CREATE POLICY "Users can view nps for visible clients"
  ON public.nps_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = nps_records.client_id
      AND (
        public.is_admin(auth.uid()) OR
        c.space_id = ANY(
          (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can create nps for visible clients"
  ON public.nps_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = nps_records.client_id
      AND (
        public.is_admin(auth.uid()) OR
        c.space_id = ANY(
          (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can update nps for visible clients"
  ON public.nps_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = nps_records.client_id
      AND (
        public.is_admin(auth.uid()) OR
        c.space_id = ANY(
          (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Only admins can delete nps"
  ON public.nps_records FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- PASSO 20: POLÍTICAS RLS - OBJECTIVES
-- ============================================

CREATE POLICY "Users can view objectives in allowed spaces"
  ON public.objectives FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create objectives in allowed spaces"
  ON public.objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update objectives in allowed spaces"
  ON public.objectives FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(
      (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Only admins can delete objectives"
  ON public.objectives FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- PASSO 21: POLÍTICAS RLS - PROGRESS LOGS
-- ============================================

CREATE POLICY "Users can view progress logs for visible objectives"
  ON public.progress_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives o
      WHERE o.id = progress_logs.objective_id
      AND (
        public.is_admin(auth.uid()) OR
        o.space_id = ANY(
          (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can create progress logs for visible objectives"
  ON public.progress_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.objectives o
      WHERE o.id = progress_logs.objective_id
      AND (
        public.is_admin(auth.uid()) OR
        o.space_id = ANY(
          (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can update progress logs for visible objectives"
  ON public.progress_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives o
      WHERE o.id = progress_logs.objective_id
      AND (
        public.is_admin(auth.uid()) OR
        o.space_id = ANY(
          (SELECT spaces FROM public.user_permissions WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Only admins can delete progress logs"
  ON public.progress_logs FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- PASSO 22: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leads_space_id ON public.leads(space_id);
CREATE INDEX IF NOT EXISTS idx_clients_space_id ON public.clients(space_id);
CREATE INDEX IF NOT EXISTS idx_objectives_space_id ON public.objectives(space_id);
CREATE INDEX IF NOT EXISTS idx_nps_client_id ON public.nps_records(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_objective_id ON public.progress_logs(objective_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);

-- ============================================
-- PASSO 23: CRIAR PRIMEIRO ADMIN
-- ============================================
-- IMPORTANTE: Execute após criar seu primeiro usuário no Auth!
-- Substitua 'SEU_USER_ID_AQUI' pelo ID do usuário criado.

-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('SEU_USER_ID_AQUI', 'admin');

-- ============================================
-- PASSO 24: CRIAR ESPAÇOS INICIAIS
-- ============================================
-- Execute após configurar o admin

-- INSERT INTO public.spaces (id, label, description, color, created_by)
-- VALUES 
--   ('conto', 'Conto', 'Agência Conto', 'bg-primary', 'SEU_USER_ID_AQUI'),
--   ('amplia', 'Amplia', 'Agência Amplia', 'bg-blue-600', 'SEU_USER_ID_AQUI');

-- ============================================
-- FIM DO SCRIPT
-- ============================================
