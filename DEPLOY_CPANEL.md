# Deploy no cPanel - Painel Conto

Guia completo para deploy do Painel Conto em hospedagem cPanel/Apache.

## 📋 Pré-requisitos

- Hospedagem cPanel com Apache
- Node.js 18+ instalado localmente
- Acesso FTP ou Gerenciador de Arquivos do cPanel
- Certificado SSL configurado (HTTPS)

## 🚀 Passo a Passo

### 1. Build de Produção

```bash
# No terminal local
npm run build
```

Isso gera a pasta `dist/` com os arquivos otimizados.

### 2. Configurar Variáveis de Ambiente

O app usa variáveis de ambiente em tempo de build. Antes do build, crie o arquivo `.env`:

```env
VITE_SUPABASE_URL=https://pzeverrrrptauqcdeulx.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
VITE_APP_ENV=production
```

### 3. Upload dos Arquivos

**Via Gerenciador de Arquivos cPanel:**

1. Acesse cPanel → Gerenciador de Arquivos
2. Navegue até `public_html` (ou subpasta desejada)
3. Delete arquivos antigos (se houver)
4. Faça upload de TODO o conteúdo da pasta `dist/`
5. Certifique-se de que `.htaccess` foi enviado

**Via FTP:**

```bash
# Usando lftp ou similar
lftp -u usuario ftp.seudominio.com.br
> cd public_html
> mirror -R dist/ .
```

### 4. Verificar .htaccess

O arquivo `.htaccess` já está configurado com:

- ✅ Redirecionamento HTTPS
- ✅ Headers de segurança (XSS, CORS, CSP)
- ✅ Roteamento SPA (todas as rotas → index.html)
- ✅ Cache otimizado para assets
- ✅ Compressão GZIP
- ✅ Bloqueio de arquivos sensíveis

### 5. Configurar HTTPS

No cPanel:
1. Vá em "SSL/TLS Status"
2. Certifique-se de que o certificado está ativo
3. Ative "Force HTTPS Redirect" se disponível

### 6. Testar Deploy

```bash
# Verificar se o site está acessível
curl -I https://seudominio.com.br

# Verificar headers de segurança
curl -I https://seudominio.com.br | grep -E "(X-Frame|X-Content|Content-Security)"
```

## 🔧 Troubleshooting

### Erro 404 em Rotas

Verifique se o `.htaccess` foi enviado corretamente:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L,QSA]
```

### Erro de CORS

Adicione seu domínio às configurações do Supabase:
1. Supabase Dashboard → Settings → API
2. Em "Allowed Origins", adicione seu domínio

### Cache Antigo

Limpe o cache do navegador ou adicione query string:

```
https://seudominio.com.br/?v=1.0.1
```

### Fontes não Carregam

Verifique o CSP no .htaccess. Fonts do Google precisam estar permitidas:

```apache
Header set Content-Security-Policy "... font-src 'self' https://fonts.gstatic.com; ..."
```

## 📁 Estrutura Esperada no Servidor

```
public_html/
├── .htaccess           # Configurações Apache
├── index.html          # Entry point
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── favicon.ico
├── robots.txt
├── assets/            # JS/CSS compilados
│   ├── index-[hash].js
│   └── index-[hash].css
└── icons/             # Ícones PWA
    ├── icon-192.png
    └── icon-512.png
```

## 🔄 Atualizações

Para atualizar o app:

1. Faça as alterações no código
2. Rode `npm run build`
3. Faça upload APENAS do conteúdo de `dist/`
4. O `.htaccess` só precisa ser reenviado se modificado

## 📊 Monitoramento

Recomendamos configurar:

- **Uptime Robot** ou similar para monitoramento
- **Google Search Console** para SEO
- **Sentry** para tracking de erros (opcional)

---

Em caso de dúvidas, consulte a documentação do seu provedor de hospedagem.
