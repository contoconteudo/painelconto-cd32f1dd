# Painel Conto - Sistema de Gestão Comercial

Sistema completo de gestão comercial, CRM e estratégia desenvolvido com React, TypeScript e Supabase.

## 🚀 Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Estado**: Zustand + React Query
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Mobile**: Capacitor (Android/iOS)
- **PWA**: Service Worker + Web App Manifest

## 📋 Funcionalidades

- ✅ Dashboard com métricas em tempo real
- ✅ CRM completo com pipeline Kanban
- ✅ Gestão de clientes com NPS
- ✅ Objetivos estratégicos bimestrais
- ✅ Sistema de permissões por role
- ✅ Multi-espaços (workspaces)
- ✅ PWA instalável
- ✅ App Android via Capacitor

## 🛠️ Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/painel-conto.git
cd painel-conto

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Iniciar desenvolvimento
npm run dev
```

## 📦 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Build de produção
npm run preview      # Preview do build

# Linting
npm run lint         # Executar ESLint

# Mobile (Capacitor)
npm run build        # Build para mobile
npx cap sync         # Sincronizar com Capacitor
npx cap open android # Abrir projeto Android
```

## 🌐 Deploy

### cPanel / Apache
Veja [DEPLOY_CPANEL.md](./DEPLOY_CPANEL.md) para instruções completas.

### Build Mobile (APK)
Veja [MOBILE_BUILD.md](./MOBILE_BUILD.md) para gerar APK Android.

## 🗄️ Banco de Dados

O schema do banco de dados e as Edge Functions estão documentados em [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## 📡 API REST

Documentação completa da API em [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) em todas as tabelas
- CORS configurado nas Edge Functions
- Headers de segurança via .htaccess
- CSP (Content Security Policy) configurado

## 📱 PWA

O app é instalável como PWA:
1. Acesse o app no navegador mobile
2. No menu do navegador, selecione "Adicionar à tela inicial"
3. O app funcionará offline e terá ícone próprio

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

Desenvolvido com ❤️ por Conto
