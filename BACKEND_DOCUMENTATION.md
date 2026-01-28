# Documentação Backend - Conto CMS

> **Para o desenvolvedor backend** - Contexto completo do sistema

---

## 🎯 O Que É o Sistema

O **Conto Management System** é um painel de gestão interna para agências com 4 módulos principais:

| Módulo | Função | Entidades |
|--------|--------|-----------|
| **Dashboard** | KPIs consolidados | - |
| **CRM** | Pipeline de vendas Kanban | `leads` |
| **Clientes** | Carteira com NPS mensal | `clients`, `nps_records` |
| **Estratégia** | OKRs e metas | `objectives`, `progress_logs` |
| **Admin** | Gestão de usuários | `profiles`, `user_roles`, `user_permissions` |

---

## 🔑 Hierarquia de Roles

```
ADMIN
 └── Acesso total, gerencia usuários
 
GESTOR
 └── Dashboard, Estratégia, CRM, Clientes
 └── Apenas espaços autorizados

COMERCIAL
 └── Dashboard, CRM, Clientes
 └── Apenas espaços autorizados

ANALISTA
 └── Apenas Dashboard
 └── Apenas espaços autorizados
```

**IMPORTANTE**: Roles DEVEM estar em tabela separada (`user_roles`), NUNCA na tabela de profiles.

---

## 🏢 Multi-Tenancy

O sistema suporta múltiplos "Espaços" (empresas):
- Dados 100% isolados por `space_id`
- Usuário pode ter acesso a 1 ou mais espaços
- Admin tem acesso automático a todos
- RLS filtra automaticamente

**Espaços iniciais:** `conto`, `amplia`

---

## 📊 Regras de Negócio Importantes

### 1. CRM - Automação de Follow-up

Leads em `proposal` por **48 horas** devem mover automaticamente para `followup`.

**Implementar via:**
- Edge Function com cron, OU
- Trigger PostgreSQL

### 2. Objetivos Comerciais

Quando `is_commercial = true`:
- `current_value` é **calculado automaticamente**
- `data_sources = ['crm']` → soma leads ganhos
- `data_sources = ['clients']` → soma MRR ativos
- Pode usar ambas as fontes

### 3. Cálculo de Status

```sql
progress = (current_value / target_value) * 100
expected = (dias_passados / dias_totais) * 100

IF progress >= expected - 10 THEN 'on_track'
ELSIF progress >= expected - 25 THEN 'at_risk'
ELSE 'behind'
```

### 4. NPS

- Score: 0-10
- Promotor: 9-10
- Neutro: 7-8
- Detrator: 0-6
- Único por cliente/mês/ano

---

## 📁 Arquivos Principais do Frontend

| Arquivo | O que faz |
|---------|-----------|
| `src/types/index.ts` | Tipos TypeScript |
| `src/hooks/useAuth.ts` | Autenticação (migrar) |
| `src/hooks/useUserRole.ts` | Roles/permissões (migrar) |
| `src/hooks/useLeads.ts` | CRUD leads (migrar) |
| `src/hooks/useClients.ts` | CRUD clientes (migrar) |
| `src/hooks/useObjectives.ts` | CRUD objetivos (migrar) |
| `src/hooks/useSpaces.ts` | Espaços (migrar) |
| `src/integrations/supabase/client.ts` | Cliente Supabase (PRONTO) |
| `src/lib/constants.ts` | Configurações |

---

## 🚀 Próximos Passos

1. **Criar projeto Supabase**
2. **Executar SQL** (ver BACKEND_INTEGRATION.md)
3. **Habilitar RLS** em todas as tabelas
4. **Criar admin inicial** via Supabase Dashboard
5. **Configurar variáveis** VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
6. **Migrar hooks** do localStorage para Supabase

---

## 📞 Referências

- `BACKEND_INTEGRATION.md` - SQL completo das tabelas
- `SECURITY.md` - Práticas de segurança
- `src/lib/validations.ts` - Schemas Zod
