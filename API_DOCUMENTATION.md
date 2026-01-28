# API Documentation - Painel Conto

Documentação completa da API REST do Painel Conto.

## 🌐 Base URL

```
Produção: https://pzeverrrrptauqcdeulx.supabase.co/functions/v1
```

## 🔐 Autenticação

Todas as rotas autenticadas requerem o header `Authorization`:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

O token JWT é obtido após login via Supabase Auth.

### Headers Obrigatórios

```http
Content-Type: application/json
Authorization: Bearer <token>
apikey: <SUPABASE_ANON_KEY>
```

---

## 👤 Admin Users API

Gerenciamento de usuários (apenas admins).

### Listar Todos os Usuários

```http
GET /api-admin-users
Authorization: Bearer <admin_token>
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Nome do Usuário",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 10
}
```

### Buscar Usuário por ID

```http
GET /api-admin-users?id=<user_id>
Authorization: Bearer <admin_token>
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "role": "user",
    "permissions": ["dashboard", "crm"],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Criar Usuário

```http
POST /api-admin-users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "novo@example.com",
  "password": "senha123",
  "name": "Novo Usuário",
  "role": "comercial"
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "email": "novo@example.com",
    "name": "Novo Usuário",
    "role": "comercial"
  }
}
```

### Atualizar Usuário

```http
PUT /api-admin-users?id=<user_id>
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "role": "gestor"
}
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Nome Atualizado",
    "role": "gestor",
    "updated_at": "2024-01-02T00:00:00Z"
  }
}
```

### Deletar Usuário

```http
DELETE /api-admin-users?id=<user_id>
Authorization: Bearer <admin_token>
```

**Response 204:** No Content

---

## 📊 Leads API

Gerenciamento de leads do usuário autenticado.

### Listar Leads

```http
GET /api-leads
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| stage | string | Filtrar por estágio (prospeccao, qualificacao, etc) |
| temperature | string | Filtrar por temperatura (hot, warm, cold) |
| space_id | uuid | Filtrar por espaço |
| page | number | Página (default: 1) |
| limit | number | Itens por página (default: 20) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Lead Exemplo",
      "email": "lead@example.com",
      "phone": "(11) 99999-9999",
      "company": "Empresa X",
      "stage": "prospeccao",
      "temperature": "warm",
      "value": 5000.00,
      "source": "website",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 50,
  "page": 1,
  "totalPages": 3
}
```

### Buscar Lead por ID

```http
GET /api-leads?id=<lead_id>
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Lead Exemplo",
    "email": "lead@example.com",
    "phone": "(11) 99999-9999",
    "company": "Empresa X",
    "stage": "proposta",
    "temperature": "hot",
    "value": 15000.00,
    "source": "indicacao",
    "notes": "Notas sobre o lead",
    "next_contact": "2024-01-15T14:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-10T00:00:00Z"
  }
}
```

### Criar Lead

```http
POST /api-leads
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Novo Lead",
  "email": "novo@example.com",
  "phone": "(11) 88888-8888",
  "company": "Nova Empresa",
  "stage": "prospeccao",
  "temperature": "cold",
  "value": 3000.00,
  "source": "linkedin",
  "space_id": "uuid-do-espaco"
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Novo Lead",
    "user_id": "uuid-do-usuario",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Atualizar Lead

```http
PUT /api-leads?id=<lead_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "stage": "negociacao",
  "temperature": "hot",
  "value": 20000.00,
  "notes": "Reunião marcada para próxima semana"
}
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "stage": "negociacao",
    "temperature": "hot",
    "value": 20000.00,
    "updated_at": "2024-01-15T00:00:00Z"
  }
}
```

### Deletar Lead

```http
DELETE /api-leads?id=<lead_id>
Authorization: Bearer <token>
```

**Response 204:** No Content

---

## 💰 Plans API

Gerenciamento de planos de assinatura.

### Listar Planos Ativos (Público)

```http
GET /api-plans
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Plano Básico",
      "description": "Ideal para começar",
      "price": 49.90,
      "currency": "BRL",
      "interval": "month",
      "features": ["5 usuários", "1000 leads", "Suporte email"],
      "is_active": true
    },
    {
      "id": "uuid",
      "name": "Plano Pro",
      "description": "Para equipes em crescimento",
      "price": 149.90,
      "currency": "BRL",
      "interval": "month",
      "features": ["20 usuários", "Leads ilimitados", "Suporte prioritário", "API access"],
      "is_active": true
    }
  ]
}
```

### Buscar Plano por ID

```http
GET /api-plans?id=<plan_id>
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Plano Pro",
    "description": "Para equipes em crescimento",
    "price": 149.90,
    "currency": "BRL",
    "interval": "month",
    "features": ["20 usuários", "Leads ilimitados", "Suporte prioritário"],
    "stripe_price_id": "price_xxxxx",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Criar Plano (Admin)

```http
POST /api-plans
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Plano Enterprise",
  "description": "Para grandes empresas",
  "price": 499.90,
  "currency": "BRL",
  "interval": "month",
  "features": ["Usuários ilimitados", "API dedicada", "SLA 99.9%"]
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Plano Enterprise",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Atualizar Plano (Admin)

```http
PUT /api-plans?id=<plan_id>
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "price": 549.90,
  "features": ["Usuários ilimitados", "API dedicada", "SLA 99.99%", "Suporte 24/7"]
}
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "price": 549.90,
    "updated_at": "2024-01-15T00:00:00Z"
  }
}
```

### Desativar Plano (Admin)

```http
DELETE /api-plans?id=<plan_id>
Authorization: Bearer <admin_token>
```

**Response 204:** No Content

---

## ❌ Códigos de Erro

| Código | Significado |
|--------|-------------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou ausente |
| 403 | Forbidden - Sem permissão para esta ação |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Recurso já existe |
| 422 | Unprocessable Entity - Validação falhou |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error |

**Formato de Erro:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token de autenticação inválido"
  }
}
```

---

## 📝 Exemplos de Código

### JavaScript (fetch)

```javascript
const API_URL = 'https://pzeverrrrptauqcdeulx.supabase.co/functions/v1';
const ANON_KEY = 'sua-anon-key';

// Login
const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY
    },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Listar Leads
const getLeads = async (token) => {
  const response = await fetch(`${API_URL}/api-leads`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': ANON_KEY
    }
  });
  return response.json();
};

// Criar Lead
const createLead = async (token, leadData) => {
  const response = await fetch(`${API_URL}/api-leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': ANON_KEY
    },
    body: JSON.stringify(leadData)
  });
  return response.json();
};
```

### cURL

```bash
# Login
curl -X POST "https://pzeverrrrptauqcdeulx.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "senha123"}'

# Listar Leads
curl "https://pzeverrrrptauqcdeulx.supabase.co/functions/v1/api-leads" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "apikey: SUA_ANON_KEY"

# Criar Lead
curl -X POST "https://pzeverrrrptauqcdeulx.supabase.co/functions/v1/api-leads" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Novo Lead", "email": "lead@example.com"}'
```

### Python (requests)

```python
import requests

API_URL = "https://pzeverrrrptauqcdeulx.supabase.co/functions/v1"
ANON_KEY = "sua-anon-key"

def get_headers(token=None):
    headers = {
        "apikey": ANON_KEY,
        "Content-Type": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

# Listar Leads
def get_leads(token):
    response = requests.get(
        f"{API_URL}/api-leads",
        headers=get_headers(token)
    )
    return response.json()

# Criar Lead
def create_lead(token, lead_data):
    response = requests.post(
        f"{API_URL}/api-leads",
        headers=get_headers(token),
        json=lead_data
    )
    return response.json()

# Exemplo de uso
if __name__ == "__main__":
    token = "seu-jwt-token"
    
    # Listar
    leads = get_leads(token)
    print(leads)
    
    # Criar
    new_lead = create_lead(token, {
        "name": "Lead Python",
        "email": "python@example.com",
        "temperature": "warm"
    })
    print(new_lead)
```

---

## 🔄 Rate Limiting

| Endpoint | Limite |
|----------|--------|
| Públicos (/api-plans GET) | 100 req/min/IP |
| Autenticados | 1000 req/min/usuário |
| Admin | 500 req/min/usuário |

---

## 📞 Suporte

Em caso de dúvidas ou problemas com a API:

- Email: suporte@conto.com.br
- Documentação: https://docs.conto.com.br
