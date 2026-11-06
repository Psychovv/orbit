# Arquitetura do Orbit

Como o sistema está organizado hoje: camadas, modos de dados, autenticação, banco e integrações. Este documento descreve o **comportamento atual**, não um plano de produto.

## Visão geral

O Orbit é um app Next.js 16 (App Router), multiusuário no modo `http`: tarefas, finanças, hábitos e um hub (`/`). A mesma UI serve dois modos de persistência, escolhidos em build/runtime pela variável `NEXT_PUBLIC_DATA_SOURCE`:

| Modo | Persistência | Login | Uso típico |
|---|---|---|---|
| `local` (padrão se omitido) | `localStorage` no navegador | Não | Demo / offline rápido |
| `http` | API Route Handlers + SQLite/Turso | JWT obrigatório | Dev com DB local ou produção (Vercel) |

O switch fica em [`src/config/data-source.ts`](../src/config/data-source.ts): monta um objeto `repositories` com implementações **local** ou **http**. Features e hooks nunca falam com `localStorage` ou Drizzle direto — só com a interface do repositório.

```
UI (app + features/*/components)
        │
        ▼
hooks (TanStack Query) ──► repositories (local | http)
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
     localStorage (+ migração v1)         Route Handlers (/api/…)
                                                  │
                                                  ▼
                                         src/server (auth, db, pluggy)
```

## Organização do código

```
src/
  app/                 Rotas, layouts, providers, Route Handlers
  features/            Domínios de produto (tasks, finance, habits, …)
  shared/              UI, efeitos, date-utils, local-store, schemas Zod
  server/              Só servidor: auth, Drizzle, Pluggy, rate limit
  config/              data-source (local ↔ http)
  proxy.ts             Guarda JWT (Next.js 16 “proxy”, antigo middleware)
```

### Features

Cada domínio em `src/features/<nome>/` tende a ter:

| Pasta | Papel |
|---|---|
| `domain/` | Regras puras + schemas Zod (testáveis sem React) |
| `data/` | Interfaces de repositório + `*.local.ts` + `*.http.ts` |
| `hooks/` | TanStack Query / mutações |
| `components/` | UI do módulo |

Domínios atuais: `tasks`, `finance`, `habits`, `home`, `assistant`, `profile`, `settings`.

### App Router

- Grupo `(app)/` — shell autenticável: hub, tasks, finance, habits, settings.
- `login/` — só relevante no modo `http`.
- `api/` — CRUD, backup, parse de voz (Gemini), webhooks Pluggy.

Estado de visão (semana, mês, filtros) fica na **URL**, não só em estado React.

## Autenticação (modo `http`)

- Dono: `AUTH_EMAIL` + `AUTH_PASSWORD` (env), sempre com id `owner`.
- Demais usuários: cadastro em `/signup` (tabela `users`, senha com scrypt em [`src/server/passwords.ts`](../src/server/passwords.ts)). `SIGNUP_INVITE_CODE` opcional fecha o cadastro com um código.
- Google (opcional): OpenID Connect com PKCE em `/api/auth/google` → `/api/auth/google/callback` ([`src/server/google-oauth.ts`](../src/server/google-oauth.ts)). State, nonce e verifier ficam num cookie assinado de 10 min. O `id_token` é validado (assinatura, emissor, audiência, nonce, `email_verified`) e a conta é achada por `google_sub`, depois por e-mail (vincula), ou criada. Os botões são links, não forms, por causa da CSP `form-action 'self'`.
- Sessão: JWT HS256 (`jose`), cookie httpOnly `orbit-session`, validade 30 dias. O `sub` é o id do usuário.
- Rotas usam `requireUser()` ([`src/server/auth-guard.ts`](../src/server/auth-guard.ts)) e passam o `userId` aos repositórios. No modo `local`, tudo é do `owner`.
- [`src/proxy.ts`](../src/proxy.ts) valida o cookie em quase todas as rotas quando `NEXT_PUBLIC_DATA_SOURCE=http`.
- Caminhos públicos: `/login`, `/signup`, `/api/auth/*`, `/api/webhooks/pluggy`, PWA (`sw.js`, manifest).
- No modo `local`, o proxy não exige login.

Comparação das credenciais do dono usa `timingSafeEqual` ([`src/server/auth.ts`](../src/server/auth.ts)).

## Banco de dados (modo `http`)

- ORM: **Drizzle** + cliente **LibSQL**.
- Dev padrão (`.env.development`): `DATABASE_URL=file:local.db`.
- Produção: Turso (`libsql://…`) + `DATABASE_AUTH_TOKEN`.
- Schema: [`src/server/db/schema.ts`](../src/server/db/schema.ts).
- Aplicar schema: `pnpm db:push` (também roda no `pnpm build` via `drizzle-kit push --force`).

### Tabelas principais

| Grupo | Tabelas |
|---|---|
| Tarefas | `tasks`, `task_categories` |
| Finanças manuais | `transactions`, `finance_categories` |
| Open Finance | `bank_connections`, `bank_accounts`, `card_bills`, `dismissed_bank_transactions` |
| Hábitos | `habits`, `habit_checkins` |
| Conta | `users`, `profiles` (id = id do usuário) |

Tarefas, categorias, lançamentos, hábitos e check-ins têm `user_id` (default `owner`, para os dados de antes do multiusuário). Os repositórios server são criados por usuário (`createServerTasksRepository(userId)` etc.) e filtram toda leitura e escrita por ele; o restore usa `setWhere` para não sobrescrever id de outro usuário.

Dinheiro no banco é **inteiro em centavos** (`amount_cents`, `balance_cents`, …). Datas de calendário são `YYYY-MM-DD` (sem timezone embutido).

Repositórios server: `src/server/db/repositories/*.server.ts`. O front HTTP chama `/api/...`; o servidor usa esses repositórios.

## Open Finance (Pluggy / MeuPluggy)

Só faz sentido no modo `http`, com `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`, e só para o dono: as credenciais são de uma conta MeuPluggy pessoal. As tabelas bancárias não têm `user_id`, e o sync só lê e grava lançamentos do `owner`.

- Cliente e sync: `src/server/pluggy/`.
- UI de conexões: Configurações; APIs sob `/api/finance/bank/…`.
- Webhook: `POST /api/webhooks/pluggy` — autenticado por segredo (`PLUGGY_WEBHOOK_SECRET`), **não** por sessão JWT.
- CLI de admin: `pnpm pluggy` ([`scripts/pluggy.mts`](../scripts/pluggy.mts)) — listar/criar/atualizar/deletar webhooks sem imprimir secrets.

Importações usam `external_id` (único). Lançamentos que o usuário “dispensa” entram em `dismissed_bank_transactions` e não voltam no sync.

## Orbit AI (Gemini)

- Chave só no servidor: `GEMINI_API_KEY`.
- Entrada: Route Handlers de parse de voz/texto (`/api/tasks/parse-voice`, `/api/finance/parse-voice`).
- Se o modelo falhar ou o pedido for trivial, há **fallback local** em `features/assistant/domain/local-commands.ts` (determinístico).
- Rate limit em memória por IP: `src/server/rate-limit.ts` (por instância; em multi-instância Vercel não é compartilhado).

## Backup

- Export / import JSON em Configurações.
- Modo local: grava direto no `localStorage`.
- Modo http: `/api/backup`.
- Inclui tarefas, finanças, hábitos (e check-ins) e perfil. Versão do formato em `features/settings/domain/backup.ts`.

## Segurança (headers)

[`next.config.ts`](../next.config.ts) aplica CSP e headers (`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, etc.). Microfone liberado para a Orbit AI; câmera/geolocalização bloqueadas.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml): jobs paralelos **Lint**, **Typecheck** e **Test**, com um job gate **CI** que só passa se os três forem sucesso.

## Deploy (visão prática)

1. Vercel (ou similar) com Node 20+.
2. Env de produção: `NEXT_PUBLIC_DATA_SOURCE=http`, `AUTH_*`, `DATABASE_URL` + `DATABASE_AUTH_TOKEN` (Turso), `GEMINI_API_KEY`, e opcionalmente Pluggy.
3. **Não** apontar o Turso de produção no `.env.local` de desenvolvimento — o `.env.development` já isola com `file:local.db`.
4. Build executa `drizzle-kit push` antes do `next build`.

Detalhes de variáveis: [`env-setup.md`](./env-setup.md).
