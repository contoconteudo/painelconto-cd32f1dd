# 🔒 Documentação de Segurança - Conto CMS

## Visão Geral

Este documento descreve as medidas de segurança implementadas no Conto CMS e as diretrizes para manter a segurança em produção.

---

## 1. Proteção de Credenciais

### ✅ Implementado

| Item | Status | Arquivo |
|------|--------|---------|
| Variáveis de ambiente | ✅ | `src/integrations/supabase/client.ts` |
| .env.example documentado | ✅ | `.env.example` |
| Sem secrets hardcoded | ✅ | Todo o codebase |

### Como funciona

```typescript
// ✅ CORRETO - Usando import.meta.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ❌ ERRADO - Nunca faça isso
const SUPABASE_URL = "https://xxx.supabase.co";
```

### Variáveis necessárias

| Variável | Exposição | Descrição |
|----------|-----------|-----------|
| `VITE_SUPABASE_URL` | Pública | URL do projeto (prefixo VITE_ expõe ao frontend) |
| `VITE_SUPABASE_ANON_KEY` | Pública | Chave anon (segura com RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ SECRETA | Apenas Edge Functions |

---

## 2. Autenticação e Autorização

### Modelo Atual (Mock)

⚠️ **Atenção**: O sistema atual usa autenticação mockada para demonstração. As senhas estão em `mockData.ts` apenas para o modo de desenvolvimento.

### Quando migrar para Supabase Auth

1. Remover `MOCK_USERS` de `mockData.ts`
2. Implementar `supabase.auth.signInWithPassword()`
3. Criar tabela `user_roles` separada (NUNCA na tabela profiles)
4. Implementar função `has_role()` com SECURITY DEFINER

### Níveis de Acesso

| Role | Dashboard | CRM | Clientes | Estratégia | Admin | DELETE |
|------|-----------|-----|----------|------------|-------|--------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| gestor | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| comercial | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| analista | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Implementação de Permissões

```typescript
// src/hooks/usePermissions.ts
export function usePermissions() {
  const { isAdmin, role } = useUserRole();

  return {
    canCreate: !!role,      // Qualquer autenticado
    canEdit: !!role,        // Qualquer autenticado
    canDelete: isAdmin,     // APENAS admin
    isAdmin,
    role,
  };
}
```

---

## 3. Row Level Security (RLS)

### Status Atual

O backend ainda não está ativo. Quando implementar Supabase:

### Políticas Recomendadas

```sql
-- Tabela: leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- SELECT: apenas próprios dados
CREATE POLICY "Users can view own leads" ON leads
FOR SELECT USING (auth.uid() = user_id);

-- INSERT: apenas autenticados
CREATE POLICY "Users can insert own leads" ON leads
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: apenas próprio dono
CREATE POLICY "Users can update own leads" ON leads
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: apenas admins
CREATE POLICY "Only admins can delete" ON leads
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
```

### Função has_role (SECURITY DEFINER)

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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
```

---

## 4. Validação de Inputs

### Implementado

- ✅ Validação client-side com Zod em formulários
- ✅ Sanitização básica de strings
- ✅ Limites de caracteres nos inputs

### Exemplo de Schema

```typescript
// src/lib/validations.ts
const leadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(255),
  value: z.number().min(0).max(999999999),
});
```

### A Implementar (Backend)

- [ ] Validação server-side em Edge Functions
- [ ] Rate limiting em operações críticas
- [ ] Sanitização de HTML (se aceitar rich text)

---

## 5. Headers de Segurança

### Configurados no .htaccess

| Header | Valor | Proteção |
|--------|-------|----------|
| X-XSS-Protection | 1; mode=block | XSS em browsers antigos |
| X-Content-Type-Options | nosniff | MIME sniffing |
| X-Frame-Options | SAMEORIGIN | Clickjacking |
| Referrer-Policy | strict-origin-when-cross-origin | Vazamento de dados |
| Permissions-Policy | camera=(), microphone=() | APIs sensíveis |

### HSTS (Ativar após confirmar HTTPS)

```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

---

## 6. Build de Produção

### Configurações de Segurança

```typescript
// vite.config.ts
build: {
  minify: "terser",
  terserOptions: {
    compress: {
      drop_console: true,    // Remove console.logs
      drop_debugger: true,   // Remove debuggers
    },
  },
  sourcemap: false,          // Não expõe código fonte
}
```

---

## 7. Checklist de Segurança

### Antes de cada deploy

- [ ] Verificar se não há senhas/keys no código
- [ ] Confirmar que .env não está no Git
- [ ] Testar redirecionamento HTTPS
- [ ] Verificar se .htaccess foi incluído
- [ ] Testar acesso a rotas protegidas sem login
- [ ] Confirmar que botão DELETE só aparece para admin

### Quando ativar Supabase

- [ ] Habilitar RLS em TODAS as tabelas
- [ ] Criar políticas para cada operação (SELECT/INSERT/UPDATE/DELETE)
- [ ] Criar tabela user_roles SEPARADA
- [ ] Implementar has_role() com SECURITY DEFINER
- [ ] Mover service_role key para Edge Functions
- [ ] Configurar URLs permitidas no dashboard

---

## 8. Vulnerabilidades Conhecidas

### Aceitas (Modo Demo)

| Vulnerabilidade | Risco | Mitigação |
|-----------------|-------|-----------|
| Senhas em mockData.ts | Baixo | Removidas quando Supabase ativo |
| Permissões client-side | Médio | RLS no backend quando ativo |

### A Resolver (Backend)

| Item | Prioridade | Status |
|------|------------|--------|
| Rate limiting | Alta | Pendente |
| Logs de auditoria | Média | Pendente |
| Backup automático | Média | Supabase oferece |

---

## 9. Contato de Segurança

Em caso de vulnerabilidade descoberta, contate imediatamente o administrador do sistema.

---

*Última atualização: Janeiro/2025*
