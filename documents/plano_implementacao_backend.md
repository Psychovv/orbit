# Plano de Implementação: Backend e Autenticação (Nuvem)

Este documento detalha a arquitetura de backend do **Orbit**, implementada para rodar na **Vercel** com banco de dados remoto e autenticação.

## Arquitetura (Stack)

| Camada | Ferramenta | Motivo |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Já em uso |
| **Autenticação** | JWT customizado com `jose` | Leve, sem dependência externa, ideal para 1 usuário |
| **Banco de Dados** | SQLite remoto via **Turso** (ou `file:local.db` em dev) | Free tier generoso (9GB), edge-ready |
| **ORM** | **Drizzle** | Zero overhead em serverless, sem engine binário |
| **Proteção de Rotas** | `proxy.ts` (Next.js 16) | Valida JWT em toda request antes de chegar à app |

---

## Estrutura dos Arquivos Criados

```
src/
├── proxy.ts                          # Guarda de autenticação (Next.js 16 proxy)
├── server/
│   ├── auth.ts                       # Gerenciamento de sessão JWT
│   ├── auth-guard.ts                 # Helper para API routes
│   └── db/
│       ├── schema.ts                 # Schema Drizzle (4 tabelas)
│       ├── index.ts                  # Cliente DB singleton
│       └── repositories/
│           ├── tasks.server.ts       # Repositório de tarefas (Drizzle)
│           └── finance.server.ts     # Repositório de finanças (Drizzle)
├── app/
│   ├── login/
│   │   ├── page.tsx                  # Página de login
│   │   └── actions.ts               # Server Action de login
│   └── api/
│       ├── auth/logout/route.ts      # Logout
│       ├── tasks/
│       │   ├── crud/route.ts         # GET/POST tarefas
│       │   ├── crud/[id]/route.ts    # PATCH/DELETE tarefa
│       │   └── categories/...        # CRUD categorias
│       └── finance/
│           ├── crud/route.ts         # GET/POST transações
│           ├── crud/[id]/route.ts    # PATCH/DELETE/PUT transação
│           └── categories/...        # CRUD categorias
├── features/
│   ├── tasks/data/tasks.http.ts      # Repositório HTTP (frontend → API)
│   └── finance/data/finance.http.ts  # Repositório HTTP (frontend → API)
└── config/
    └── data-source.ts                # Switch local ↔ http
```

---

## Como Ativar o Backend

### 1. Configurar o Banco de Dados (Turso)

```bash
# Instalar CLI do Turso
curl -sSfL https://get.tur.so/install.sh | bash

# Criar conta e banco
turso auth login
turso db create orbit
turso db show orbit --url     # Copie a URL
turso db tokens create orbit  # Copie o token
```

### 2. Configurar Variáveis de Ambiente

No `.env.local`:
```env
GEMINI_API_KEY="sua-chave-gemini"
NEXT_PUBLIC_DATA_SOURCE="http"

# Auth
AUTH_SECRET="gere-com-openssl-rand-base64-32"
AUTH_EMAIL="seu@email.com"
AUTH_PASSWORD="sua-senha-segura"

# Banco de dados
DATABASE_URL="libsql://orbit-seu-usuario.turso.io"
DATABASE_AUTH_TOKEN="token-do-turso"
```

### 3. Rodar as Migrations

```bash
npx drizzle-kit push
```

### 4. Testar Localmente

```bash
pnpm dev
# Acesse http://localhost:3000 → será redirecionado para /login
```

### 5. Deploy na Vercel

1. No painel da Vercel, adicione as variáveis de ambiente
2. Ajuste o Build Command para: `npx drizzle-kit push && next build`
3. Push para produção

---

## Segurança Implementada

- [x] **JWT com cookie HttpOnly** — sessão segura, inacessível via JS
- [x] **Proxy (middleware)** protegendo todas as rotas exceto `/login`
- [x] **Auth guard** em todas as API routes
- [x] **Validação Zod** em todos os inputs
- [x] **Rate limiting** por IP nas rotas de IA
- [x] **Security headers** (X-Frame-Options, CSP, etc.)
- [x] **Credenciais server-side only** — nunca expostas ao client

---

## Modos de Operação

| Variável `NEXT_PUBLIC_DATA_SOURCE` | Comportamento |
|---|---|
| `"local"` | localStorage (modo atual, offline, sem auth) |
| `"http"` | Backend + DB + auth obrigatória |
