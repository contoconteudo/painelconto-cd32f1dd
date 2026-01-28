# 🚀 Guia de Deploy - Conto CMS

## Pré-requisitos

- Acesso ao cPanel
- Domínio configurado com SSL/HTTPS
- Node.js 18+ (para build local)
- Supabase configurado (quando backend for ativado)

---

## 📋 Variáveis de Ambiente Necessárias

### Obrigatórias (quando backend ativo)

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Dashboard Supabase > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon) | Dashboard Supabase > Settings > API |

### ⚠️ NUNCA exponha no frontend

| Variável | Descrição | Uso |
|----------|-----------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin | Apenas em Edge Functions |

---

## 🔧 Passos para Deploy no cPanel

### 1. Build Local

```bash
# Clone o repositório
git clone [seu-repo] && cd [pasta]

# Instale dependências
npm install

# Crie o arquivo .env (se usando Supabase)
cp .env.example .env
# Edite .env com suas credenciais

# Build de produção
npm run build
```

### 2. Upload para cPanel

1. Acesse **File Manager** no cPanel
2. Navegue até `public_html` (ou subpasta do domínio)
3. **Delete** todo conteúdo existente (se atualização)
4. **Upload** todo conteúdo da pasta `dist/`:
   - `index.html`
   - `assets/` (pasta inteira)
   - `.htaccess` (arquivo oculto - ative "Show Hidden Files")
5. Verifique se `.htaccess` foi incluído

### 3. Verificação

- [ ] Acesse `https://seudominio.com.br`
- [ ] Teste navegação entre rotas (ex: `/crm`, `/clientes`)
- [ ] Verifique se refresh em rotas profundas funciona
- [ ] Confirme redirecionamento HTTP → HTTPS
- [ ] Teste login/logout

---

## 🔒 Checklist de Segurança Pré-Deploy

### Código

- [x] Credenciais Supabase via `import.meta.env` (não hardcoded)
- [x] Console.logs removidos em produção (via terser)
- [x] Source maps desabilitados em produção
- [x] Validação de inputs com Zod
- [x] Permissões verificadas client-side (isAdmin para delete)

### .htaccess

- [x] Redirecionamento HTTPS forçado
- [x] Arquivos sensíveis bloqueados (.env, .git)
- [x] Headers de segurança (X-Frame-Options, X-Content-Type, etc.)
- [x] Client-side routing configurado
- [x] Listagem de diretórios desabilitada

### Supabase (quando ativo)

- [ ] RLS habilitado em TODAS as tabelas
- [ ] Políticas RLS por usuário (user_id = auth.uid())
- [ ] Tabela `user_roles` separada (não em profiles)
- [ ] Função `has_role()` com SECURITY DEFINER
- [ ] Service key APENAS em Edge Functions

---

## 📁 Estrutura do Build Final

```
dist/
├── index.html          # Entry point
├── .htaccess           # Configurações Apache
└── assets/
    ├── index-[hash].js     # Bundle principal
    ├── vendor-[hash].js    # React/Router
    ├── ui-[hash].js        # Radix UI
    └── index-[hash].css    # Estilos
```

---

## 🛠️ Troubleshooting

### Página em branco após deploy

1. Verifique se `base` em `vite.config.ts` está correto
2. Confirme que `.htaccess` foi uploadado
3. Abra Console do navegador para erros

### Erro 404 em rotas

- `.htaccess` não foi uploadado ou não está funcionando
- Teste criando arquivo `test.txt` e acessando via URL

### Assets não carregam

- Verifique caminho `base` se usando subpasta
- Confirme que pasta `assets/` está no servidor

### CORS errors com Supabase

- Adicione seu domínio nas configurações do Supabase
- Dashboard > Authentication > URL Configuration

---

## 📊 Configurações Recomendadas do Supabase

### Ao ativar o backend, configure:

**Authentication > URL Configuration:**
- Site URL: `https://seudominio.com.br`
- Redirect URLs: `https://seudominio.com.br/*`

**Authentication > Providers:**
- Habilite apenas os necessários (Email/Password é suficiente)

**Database > Tables:**
- Todas com RLS habilitado
- Políticas de SELECT/INSERT/UPDATE/DELETE por user_id

---

## 🔄 Atualizações Futuras

```bash
# Pull das atualizações
git pull origin main

# Rebuild
npm run build

# Upload apenas o conteúdo de dist/
```

---

## 📞 Suporte

Em caso de problemas:
1. Verifique o Console do navegador (F12)
2. Verifique logs do cPanel (Error Log)
3. Confirme configurações de SSL/HTTPS
