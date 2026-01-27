# Conto Management System (CMS) - Documentação para Integração Backend

> Última atualização: Janeiro 2026

---

## 📋 Visão Geral do Sistema

O **Conto Management System (CMS)** é uma plataforma de gestão estratégica interna para agências de marketing. O sistema foca em:

1. **Planejamento Estratégico**: Gerenciamento de objetivos anuais com acompanhamento mensal de progresso
2. **CRM Comercial**: Pipeline de vendas com quadro Kanban e automações
3. **Gestão de Clientes**: Cadastro de clientes com histórico de NPS mensal

### Stack Atual (Frontend)

- **Framework**: React 18 + Vite + TypeScript
- **UI**: Tailwind CSS + Shadcn UI
- **Persistência atual**: localStorage (temporário - a ser substituído pelo backend)
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form + Zod

---

## 🗄️ Estrutura de Dados

### 1. Leads (CRM)

Representa oportunidades de negócio no pipeline comercial.

```typescript
interface Lead {
  id: string;                    // UUID
  name: string;                  // Nome do contato
  company: string;               // Nome da empresa
  email: string;                 // E-mail do contato
  phone: string;                 // Telefone
  value: number;                 // Valor mensal potencial (R$)
  temperature: LeadTemperature;  // "hot" | "warm" | "cold"
  origin: string;                // Origem do lead (ver lista abaixo)
  stage: LeadStage;              // Etapa no pipeline (ver lista abaixo)
  lastContact: string;           // Data do último contato (YYYY-MM-DD)
  notes: string;                 // Observações
  createdAt: string;             // Data de criação (YYYY-MM-DD)
  stageChangedAt: string;        // Timestamp da última mudança de etapa (ISO 8601)
}

type LeadTemperature = "hot" | "warm" | "cold";

type LeadStage = 
  | "new"              // Novo
  | "contact"          // Contato Realizado
  | "meeting_scheduled"// Agendou Reunião
  | "meeting_done"     // Reunião Feita
  | "proposal"         // Proposta Enviada
  | "followup"         // Follow Up (automático após 24h em proposal)
  | "negotiation"      // Negociação
  | "won"              // Ganho
  | "lost";            // Perdido
```

**Origens de Lead aceitas:**
- Tráfego Pago
- Orgânico
- Indicação
- LinkedIn
- Evento
- Outbound
- Site
- Outro

**Automação implementada:**
- Leads em `proposal` por mais de 24 horas são automaticamente movidos para `followup`

---

### 2. Clientes

Representa clientes ativos ou inativos da agência.

```typescript
interface Client {
  id: string;                // UUID
  company: string;           // Nome da empresa
  contact: string;           // Nome do contato principal
  email: string;             // E-mail
  phone: string;             // Telefone
  segment: string;           // Segmento de atuação (ver lista abaixo)
  package: string;           // Pacote contratado (ver lista abaixo)
  monthlyValue: number;      // Valor mensal (R$)
  status: ClientStatus;      // "active" | "inactive" | "churn"
  npsHistory: NPSRecord[];   // Histórico de NPS mensal
  startDate: string;         // Data de início do contrato (YYYY-MM-DD)
  notes: string;             // Observações
}

type ClientStatus = "active" | "inactive" | "churn";

interface NPSRecord {
  id: string;           // UUID
  month: number;        // Mês (1-12)
  year: number;         // Ano
  score: number;        // Nota NPS (0-10)
  notes: string;        // Observações
  recordedAt: string;   // Data do registro (YYYY-MM-DD)
}
```

**Segmentos aceitos:**
- Tecnologia
- Saúde
- Varejo
- Serviços
- Educação
- Indústria
- Financeiro
- Outro

**Pacotes aceitos:**
- PF/Básico
- Start
- Completão
- Enterprise

**Classificação NPS:**
- 9-10: Promotor
- 7-8: Passivo
- 0-6: Detrator

---

### 3. Objetivos Estratégicos

Representa metas anuais ou semestrais da agência.

```typescript
interface Objective {
  id: string;                          // UUID
  name: string;                        // Nome do objetivo
  description: string;                 // Descrição detalhada
  valueType: ObjectiveValueType;       // Tipo de valor
  targetValue: number;                 // Meta a ser atingida
  currentValue: number;                // Valor atual (manual ou automático)
  deadline: string;                    // Prazo final (YYYY-MM-DD)
  status: ObjectiveStatus;             // Calculado automaticamente
  createdAt: string;                   // Data de criação (YYYY-MM-DD)
  progressLogs: ProgressLog[];         // Histórico de atualizações
  isCommercial: boolean;               // Se true, valor é calculado automaticamente
  dataSources: CommercialDataSource[]; // Fontes de dados automáticos
}

type ObjectiveValueType = "financial" | "quantity" | "percentage";
type ObjectiveStatus = "on_track" | "at_risk" | "behind";
type CommercialDataSource = "crm" | "clients";

interface ProgressLog {
  id: string;           // UUID
  month: number;        // Mês (1-12)
  year: number;         // Ano
  value: number;        // Valor registrado
  description: string;  // Descrição da atualização
  date: string;         // Data do registro (YYYY-MM-DD)
}
```

**Cálculo de Status (automático):**
- O status é calculado comparando o progresso atual com o progresso esperado baseado no tempo decorrido até o deadline
- **on_track**: progresso >= esperado - 10%
- **at_risk**: progresso >= esperado - 25%
- **behind**: progresso < esperado - 25%

**Metas Comerciais Automáticas:**
- Quando `isCommercial = true`, o `currentValue` é calculado automaticamente:
  - `dataSources: ["crm"]`: Soma o valor dos leads com `stage = "won"`
  - `dataSources: ["clients"]`: Soma o `monthlyValue` dos clientes com `status = "active"`
  - Pode usar ambas as fontes simultaneamente

---

## 🔌 API Endpoints Sugeridos

### Leads

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/leads` | Lista todos os leads |
| GET | `/api/leads/:id` | Busca lead por ID |
| POST | `/api/leads` | Cria novo lead |
| PUT | `/api/leads/:id` | Atualiza lead |
| PATCH | `/api/leads/:id/stage` | Move lead de etapa |
| DELETE | `/api/leads/:id` | Remove lead |
| GET | `/api/leads/stats` | Estatísticas do pipeline |

**Estatísticas do Pipeline (GET /api/leads/stats):**
```typescript
{
  totalLeads: number;      // Total de leads ativos (excluindo lost)
  totalValue: number;      // Soma dos valores dos leads ativos
  proposalsSent: number;   // Leads em proposal, negotiation ou won
  conversionRate: number;  // Percentual de leads won / total
  inNegotiation: number;   // Leads não finalizados (não won/lost)
  wonCount: number;        // Total de leads ganhos
  wonValue: number;        // Valor total dos leads ganhos
}
```

---

### Clientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/clients` | Lista todos os clientes |
| GET | `/api/clients/:id` | Busca cliente por ID |
| POST | `/api/clients` | Cria novo cliente |
| PUT | `/api/clients/:id` | Atualiza cliente |
| DELETE | `/api/clients/:id` | Remove cliente |
| POST | `/api/clients/:id/nps` | Adiciona registro NPS |
| DELETE | `/api/clients/:id/nps/:recordId` | Remove registro NPS |
| GET | `/api/clients/stats` | Estatísticas de clientes |

**Estatísticas de Clientes (GET /api/clients/stats):**
```typescript
{
  activeCount: number;    // Clientes ativos
  inactiveCount: number;  // Clientes inativos
  churnCount: number;     // Clientes em churn
  totalMRR: number;       // Receita mensal recorrente (soma dos ativos)
  avgTicket: number;      // Ticket médio (MRR / ativos)
  avgNPS: number;         // NPS médio global
}
```

---

### Objetivos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/objectives` | Lista todos os objetivos |
| GET | `/api/objectives/:id` | Busca objetivo por ID |
| POST | `/api/objectives` | Cria novo objetivo |
| PUT | `/api/objectives/:id` | Atualiza objetivo |
| DELETE | `/api/objectives/:id` | Remove objetivo |
| POST | `/api/objectives/:id/progress` | Adiciona log de progresso |
| PUT | `/api/objectives/:id/progress/:month/:year` | Atualiza log de progresso |
| GET | `/api/objectives/stats` | Estatísticas de objetivos |

**Estatísticas de Objetivos (GET /api/objectives/stats):**
```typescript
{
  total: number;     // Total de objetivos
  onTrack: number;   // Objetivos no prazo
  atRisk: number;    // Objetivos em risco
  behind: number;    // Objetivos atrasados
}
```

---

## 🔐 Autenticação (Sugestão)

O sistema atualmente não possui autenticação. Recomendações para implementação:

1. **JWT tokens** com refresh token
2. **Roles sugeridos**: admin, manager, user
3. **Row Level Security (RLS)** no Supabase para multi-tenancy

---

## 🔄 Webhooks / Automações Sugeridas (n8n)

1. **Lead para Follow-up automático**
   - Trigger: Lead fica em `proposal` por 24h
   - Action: Mover para `followup` + notificar responsável

2. **Alerta de negociação parada**
   - Trigger: Lead em `negotiation` por 7+ dias
   - Action: Enviar alerta

3. **NPS baixo**
   - Trigger: Cliente registra NPS ≤ 6
   - Action: Criar tarefa de acompanhamento

4. **Meta em risco**
   - Trigger: Objetivo muda para `at_risk` ou `behind`
   - Action: Notificar gestores

---

## 📊 Dashboard (KPIs Exibidos)

O dashboard principal exibe:

### Métricas Comerciais
- Leads em negociação (quantidade)
- Valor em pipeline (R$)
- Propostas enviadas (quantidade)
- Taxa de conversão (%)

### Progresso Estratégico
- Lista de objetivos com barra de progresso
- Status visual (verde/amarelo/vermelho)
- Percentual de conclusão

---

## 🗃️ Chaves de localStorage (Para Migração)

Os dados atuais estão armazenados nas seguintes chaves:

```typescript
const STORAGE_KEYS = {
  LEADS: "conto-leads",
  CLIENTS: "conto-clients",
  OBJECTIVES: "conto-objectives",
};
```

Para migrar os dados existentes, basta ler esses valores do localStorage do navegador do usuário e inserir no banco de dados.

---

## 📁 Estrutura de Arquivos Relevantes

```
src/
├── types/
│   └── index.ts          # Definições de tipos TypeScript
├── hooks/
│   ├── useLeads.ts       # CRUD de leads + automações
│   ├── useClients.ts     # CRUD de clientes + NPS
│   ├── useObjectives.ts  # CRUD de objetivos + progresso
│   └── useLocalStorage.ts# Hook de persistência (substituir)
├── lib/
│   ├── constants.ts      # Constantes e configurações
│   └── validations.ts    # Schemas Zod para validação
└── pages/
    ├── Dashboard.tsx     # Tela inicial
    ├── CRM.tsx           # Quadro Kanban de leads
    ├── Clientes.tsx      # Lista de clientes
    └── Estrategia.tsx    # Objetivos estratégicos
```

---

## ✅ Checklist de Integração

- [ ] Criar tabelas no banco de dados conforme schemas acima
- [ ] Implementar endpoints REST ou GraphQL
- [ ] Configurar autenticação JWT
- [ ] Substituir hooks `useLocalStorage` por `useSWR` ou `React Query` com API
- [ ] Migrar dados existentes do localStorage
- [ ] Configurar webhooks no n8n para automações
- [ ] Implementar RLS para multi-tenancy (se necessário)

---

## 🚀 Próximos Passos Sugeridos

1. **Fase 1**: Supabase + Auth básico
2. **Fase 2**: Migração de dados + CRUD via API
3. **Fase 3**: Automações via Edge Functions ou n8n
4. **Fase 4**: Analytics/BI com Metabase ou Looker

---

*Documentação gerada automaticamente pelo Conto Management System*
