# 🎯 Painel Conto - Sistema de Gestão Comercial

Sistema modular de gestão comercial, CRM e estratégia desenvolvido com React, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

- **Dashboard**: Visão geral de métricas e KPIs
- **CRM**: Gestão de leads e pipeline de vendas
- **Clientes**: Cadastro e acompanhamento de clientes com NPS
- **Estratégia**: Definição e acompanhamento de objetivos
- **Configurações**: Gestão de espaços e preferências
- **Admin**: Gestão de usuários e permissões

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Roteamento**: React Router v6
- **Estado**: TanStack Query + Context API
- **Mobile**: Capacitor (Android/iOS)
- **PWA**: Suporte a instalação progressiva

## 📋 Pré-requisitos

- Node.js 18+
- npm ou pnpm

## 🔧 Instalação

```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]
cd [NOME_DO_PROJETO]

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Análise estática do código |
| `npm run build:mobile` | Build otimizado para mobile |
| `npm run cap:sync` | Sincroniza web com nativo |
| `npm run cap:add:android` | Adiciona plataforma Android |
| `npm run cap:open:android` | Abre Android Studio |

## 🔐 Credenciais de Acesso (Mock)

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | `admin@conto.com.br` | `123456` |
| Gestor | `gestor@conto.com.br` | `gestor123` |
| Comercial | `comercial@conto.com.br` | `comercial123` |

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── auth/         # Autenticação
│   ├── clients/      # Gestão de clientes
│   ├── crm/          # CRM e leads
│   ├── dashboard/    # Cards do dashboard
│   ├── layout/       # Layout e navegação
│   ├── objectives/   # Objetivos estratégicos
│   └── ui/           # Componentes Shadcn/UI
├── contexts/         # Context providers
├── data/             # Dados mockados
├── hooks/            # Custom hooks
├── lib/              # Utilitários
├── pages/            # Páginas/rotas
└── types/            # Definições TypeScript
```

## 📱 Build Mobile (APK)

Consulte o guia completo em [MOBILE_BUILD.md](./MOBILE_BUILD.md).

```bash
# Resumo rápido
npm run build
npx cap sync android
npx cap open android
```

## 🚀 Deploy no cPanel

Consulte o guia completo em [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md).

```bash
# Resumo rápido
npm run build
# Upload da pasta dist/ para public_html
```

## 📚 Documentação Adicional

- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - Instruções de deploy no cPanel
- [MOBILE_BUILD.md](./MOBILE_BUILD.md) - Geração de APK Android
- [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md) - Documentação do backend
- [SECURITY.md](./SECURITY.md) - Considerações de segurança

## 🔒 Segurança

- Credenciais via variáveis de ambiente (`import.meta.env.VITE_*`)
- Console.logs removidos em produção
- Headers de segurança no `.htaccess`
- Validação de inputs com Zod
- Verificação de permissões client-side

## 📄 Licença

Proprietário - Todos os direitos reservados.
