-- ============================================
-- CONTO CMS - SCHEMA DO BANCO DE DADOS v2.0
-- ============================================
-- Novo projeto: jqthecutclccbakzadax (Janeiro 2026)
-- Execute este script no SQL Editor do Supabase.
-- ============================================

-- ============================================
-- 1. TIPOS E ENUMS
-- ============================================

-- Role de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'comercial', 'analista');

-- Status de lead
CREATE TYPE public.lead_status AS ENUM (
  'novo', 'contato', 'reuniao_agendada', 'reuniao_feita', 
  'proposta', 'negociacao', 'ganho', 'perdido'
);

-- Temperatura do lead
CREATE TYPE public.lead_temperature AS ENUM ('cold', 'warm', 'hot');

-- Status de cliente
CREATE TYPE public.client_status AS ENUM ('ativo', 'inativo', 'churn');

-- Status de objetivo
CREATE TYPE public.objective_status AS ENUM ('em_andamento', 'concluido', 'atrasado', 'pausado');

-- ============================================
-- 2. TABELA DE PROFILES
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. TABELA DE ROLES
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
-- 4. TABELA DE PERMISSÕES
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
-- 5. TABELA DE ESPAÇOS (Empresas)
-- ============================================

CREATE TABLE public.spaces (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT 'bg-primary',
  icon TEXT DEFAULT 'Building',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. TABELA DE LEADS (CRM)
-- ============================================

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  status lead_status DEFAULT 'novo' NOT NULL,
  source TEXT,
  value NUMERIC DEFAULT 0,
  temperature lead_temperature DEFAULT 'warm' NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Índice para consultas por espaço
CREATE INDEX idx_leads_space_id ON public.leads(space_id);
CREATE INDEX idx_leads_status ON public.leads(status);

-- ============================================
-- 7. TABELA DE CLIENTES
-- ============================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  segment TEXT,
  status client_status DEFAULT 'ativo' NOT NULL,
  monthly_value NUMERIC DEFAULT 0,
  contract_start DATE,
  package TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_clients_space_id ON public.clients(space_id);
CREATE INDEX idx_clients_status ON public.clients(status);

-- ============================================
-- 8. TABELA DE REGISTROS NPS
-- ============================================

CREATE TABLE public.nps_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.nps_records ENABLE ROW LEVEL SECURITY;

-- Índice
CREATE INDEX idx_nps_client_id ON public.nps_records(client_id);

-- ============================================
-- 9. TABELA DE OBJETIVOS ESTRATÉGICOS
-- ============================================

CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '%',
  start_date DATE,
  end_date DATE,
  status objective_status DEFAULT 'em_andamento' NOT NULL,
  is_commercial BOOLEAN DEFAULT FALSE,
  value_type TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

-- Índice
CREATE INDEX idx_objectives_space_id ON public.objectives(space_id);

-- ============================================
-- 10. TABELA DE LOGS DE PROGRESSO
-- ============================================

CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC NOT NULL,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- Índice
CREATE INDEX idx_progress_logs_objective_id ON public.progress_logs(objective_id);

-- ============================================
-- 11. FUNÇÕES DE SEGURANÇA
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

-- Função para obter espaços permitidos do usuário
CREATE OR REPLACE FUNCTION public.get_user_spaces(_user_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT spaces FROM public.user_permissions WHERE user_id = _user_id),
    '{}'::TEXT[]
  )
$$;

-- ============================================
-- 12. TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 13. POLÍTICAS RLS - PROFILES
-- ============================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- 14. POLÍTICAS RLS - USER ROLES
-- ============================================

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- 15. POLÍTICAS RLS - USER PERMISSIONS
-- ============================================

CREATE POLICY "Users can view own permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage permissions"
  ON public.user_permissions FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- 16. POLÍTICAS RLS - SPACES
-- ============================================

CREATE POLICY "Authenticated users can view spaces"
  ON public.spaces FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage spaces"
  ON public.spaces FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- 17. POLÍTICAS RLS - LEADS
-- ============================================

CREATE POLICY "Users can view leads in allowed spaces"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Users can create leads in allowed spaces"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Users can update leads in allowed spaces"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Only admins can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- 18. POLÍTICAS RLS - CLIENTS
-- ============================================

CREATE POLICY "Users can view clients in allowed spaces"
  ON public.clients FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Users can create clients in allowed spaces"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Users can update clients in allowed spaces"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Only admins can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- 19. POLÍTICAS RLS - NPS RECORDS
-- ============================================

CREATE POLICY "Users can view nps in allowed spaces"
  ON public.nps_records FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Users can create nps in allowed spaces"
  ON public.nps_records FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Users can update nps in allowed spaces"
  ON public.nps_records FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Only admins can delete nps"
  ON public.nps_records FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- 20. POLÍTICAS RLS - OBJECTIVES
-- ============================================

CREATE POLICY "Users can view objectives in allowed spaces"
  ON public.objectives FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Users can create objectives in allowed spaces"
  ON public.objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Users can update objectives in allowed spaces"
  ON public.objectives FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    space_id = ANY(public.get_user_spaces(auth.uid()))
  );

CREATE POLICY "Only admins can delete objectives"
  ON public.objectives FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- 21. POLÍTICAS RLS - PROGRESS LOGS
-- ============================================

CREATE POLICY "Users can view progress logs"
  ON public.progress_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives o
      WHERE o.id = progress_logs.objective_id
      AND (
        public.is_admin(auth.uid()) OR
        o.space_id = ANY(public.get_user_spaces(auth.uid()))
      )
    )
  );

CREATE POLICY "Users can create progress logs"
  ON public.progress_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.objectives o
      WHERE o.id = progress_logs.objective_id
      AND (
        public.is_admin(auth.uid()) OR
        o.space_id = ANY(public.get_user_spaces(auth.uid()))
      )
    )
  );

CREATE POLICY "Users can update progress logs"
  ON public.progress_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives o
      WHERE o.id = progress_logs.objective_id
      AND (
        public.is_admin(auth.uid()) OR
        o.space_id = ANY(public.get_user_spaces(auth.uid()))
      )
    )
  );

CREATE POLICY "Only admins can delete progress logs"
  ON public.progress_logs FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================
-- 22. DADOS INICIAIS (Opcional)
-- ============================================

-- Espaço padrão
INSERT INTO public.spaces (id, label, description, color, icon)
VALUES ('conto', 'Conto', 'Agência Conto', 'bg-blue-600', 'Building')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FIM DO SCHEMA
-- ============================================
