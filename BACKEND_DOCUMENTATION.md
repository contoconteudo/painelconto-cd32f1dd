# Guia de Integração Backend - Conto CMS

Este documento contém tudo que o desenvolvedor backend precisa para conectar o sistema ao Supabase.

## 📋 Checklist de Configuração

### 1. Executar Schema SQL
Execute o arquivo `supabase/schema.sql` no SQL Editor do Supabase para criar:
- Tipos (enums)
- Tabelas
- Funções de segurança
- Políticas RLS
- Triggers

### 2. Verificar DEMO_MODE
No arquivo `src/data/mockData.ts`, verifique se está:
```typescript
export const DEMO_MODE = false;
```
> ⚠️ **Já está configurado como false** - pronto para produção!

### 3. Criar Primeiro Administrador
1. Crie um usuário via Supabase Auth (Authentication > Users > Add user)
2. Adicione o role admin na tabela `user_roles`:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('UUID_DO_USUARIO', 'admin');
```

3. Adicione permissões na tabela `user_permissions`:
```sql
INSERT INTO user_permissions (user_id, modules, spaces)
VALUES (
  'UUID_DO_USUARIO',
  ARRAY['dashboard', 'crm', 'clients', 'objectives', 'strategy', 'settings', 'admin'],
  ARRAY[]::text[]  -- Admin tem acesso a todos os espaços automaticamente
);
```

### 4. Criar Espaços Iniciais
O schema já cria o espaço "Conto" por padrão. Para adicionar mais:
```sql
INSERT INTO spaces (id, label, description, color, icon) VALUES
('amplia', 'Amplia', 'Amplia Marketing', 'bg-purple-600', 'Rocket');
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados do usuário (sincronizado com auth.users via trigger) |
| `user_roles` | Roles dos usuários (admin, gestor, comercial, analista) |
| `user_permissions` | Módulos e espaços permitidos por usuário |
| `spaces` | Espaços/empresas isolados |
| `leads` | CRM - leads de vendas |
| `clients` | Clientes ativos |
| `nps_records` | Registros de NPS dos clientes |
| `objectives` | Metas estratégicas |
| `progress_logs` | Logs de progresso das metas |

### Enums

```sql
-- Roles de usuário
app_role: 'admin' | 'gestor' | 'comercial' | 'analista'

-- Status de lead
lead_status: 'novo' | 'contato' | 'reuniao_agendada' | 'reuniao_feita' | 'proposta' | 'negociacao' | 'ganho' | 'perdido'

-- Temperatura do lead
lead_temperature: 'cold' | 'warm' | 'hot'

-- Status de cliente
client_status: 'ativo' | 'inativo' | 'churn'

-- Status de objetivo
objective_status: 'em_andamento' | 'concluido' | 'atrasado' | 'pausado'
```

---

## 🔐 Sistema de Permissões

### Hierarquia de Roles

| Role | Permissões |
|------|------------|
| `admin` | Acesso total a todos os módulos e espaços |
| `gestor` | Dashboard, Estratégia, CRM, Clientes, Configurações |
| `comercial` | Dashboard, CRM, Clientes, Configurações |
| `analista` | Dashboard, Configurações |

### Regras de Negócio

1. **Isolamento por Espaço**: Cada lead, cliente e objetivo pertence a um `space_id`. Usuários só veem dados dos espaços que têm acesso.

2. **Admin tem acesso total**: A função `is_admin()` bypassa todas as verificações de espaço.

3. **Apenas admins podem deletar**: As políticas RLS restringem DELETE apenas para admins.

---

## 📁 Arquivos Relevantes

### Hooks (src/hooks/)

| Arquivo | Função |
|---------|--------|
| `useAuth.ts` | Login, logout, cadastro |
| `useUserSession.ts` | Sessão do usuário, roles, permissões |
| `useLeads.ts` | CRUD de leads |
| `useClients.ts` | CRUD de clientes e NPS |
| `useObjectives.ts` | CRUD de objetivos e logs |
| `useSpaces.ts` | CRUD de espaços |
| `useUserRole.ts` | Verificação de permissões |

### Tipos (src/types/index.ts)

Contém todas as interfaces TypeScript alinhadas com o schema do banco.

---

## 🔄 Fluxo de Dados

### Autenticação
```
1. Usuário faz login -> supabase.auth.signInWithPassword()
2. Trigger cria profile -> handle_new_user()
3. Hook busca dados -> useUserSession()
4. ProtectedRoute valida acesso
```

### CRUD de Dados
```
1. Hook chama supabase.from('tabela')
2. RLS valida permissão baseada em:
   - is_admin(auth.uid()) -> acesso total
   - space_id in get_user_spaces(auth.uid()) -> acesso restrito
3. Dados retornados/salvos
```

---

## ⚠️ Pontos de Atenção

1. **RLS sempre ativo**: Todas as tabelas têm Row Level Security habilitado.

2. **Nunca expor roles em profile**: Roles ficam APENAS em `user_roles`.

3. **Funções SECURITY DEFINER**: As funções `has_role()`, `is_admin()` e `get_user_spaces()` executam com privilégios elevados.

4. **Cascade delete**: Deletar um espaço remove todos os dados vinculados (leads, clients, objectives).

---

## 🧪 Testando a Integração

1. Execute o schema SQL no Supabase
2. Crie um usuário admin conforme instruções acima
3. Faça login no sistema
4. Verifique se os espaços aparecem no seletor (topo esquerdo)
5. Crie um lead e verifique se persiste no banco
6. Troque de espaço e confirme que os dados são isolados
7. Teste com usuário não-admin para validar restrições

---

## 📞 Credenciais Supabase

```
URL: https://jqthecutclccbakzadax.supabase.co
Anon Key: (configurado em src/integrations/supabase/client.ts)
```

---

## 🚀 Próximos Passos (Opcional)

1. Configurar email de confirmação no Supabase Auth
2. Adicionar políticas de rate limiting
3. Configurar backups automáticos
4. Implementar logs de auditoria
