# Configuração de ambiente

Variáveis do Orbit: o que cada uma faz, onde colocar e como montar os modos **local** e **http**.

Arquivos relevantes:

| Arquivo | Commitado? | Papel |
|---|---|---|
| `.env.example` | Sim | Modelo sem secrets |
| `.env.development` | Sim | Defaults de `pnpm dev` (modo http + SQLite local) |
| `.env.local` | **Não** | Secrets da sua máquina (Gemini, Auth, Pluggy, …) |
| Vercel / host | — | Secrets de **produção** |

Nunca commit secrets. `.env*` está no `.gitignore`, com exceção de `.env.example` e `.env.development`.

## Começo rápido

```bash
cp .env.example .env.local
# edite .env.local — no mínimo GEMINI_API_KEY se quiser a Orbit AI
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000). Reinicie o `pnpm dev` depois de mudar qualquer variável.

Com o `.env.development` do repositório, o `pnpm dev` já sobe em modo **`http`** com `DATABASE_URL=file:local.db`. Para forçar só `localStorage`, defina no `.env.local`:

```env
NEXT_PUBLIC_DATA_SOURCE=local
```

(`NEXT_PUBLIC_*` é embutida no bundle do cliente; mude e reinicie o servidor.)

---

## Variáveis

### Fonte de dados

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | Não | `local` ou `http`. Omitida → `local`. Em `.env.development` já vem `http`. |

### Orbit AI (Gemini)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GEMINI_API_KEY` | Para a IA | Chave do [Google AI Studio](https://aistudio.google.com/app/apikey). Sem ela o app abre; pedidos de voz/texto da IA falham (há fallback local para frases simples). |

1. Crie uma API key no AI Studio (começa com `AIza…`).
2. No `.env.local`:

```env
GEMINI_API_KEY="AIza..."
```

### Autenticação (modo `http`)

| Variável | Obrigatória no `http` | Descrição |
|---|---|---|
| `AUTH_SECRET` | Sim (prod) | Segredo HMAC do JWT. Gere com `openssl rand -base64 32`. |
| `AUTH_EMAIL` | Sim | E-mail do dono (usuário `owner`). |
| `AUTH_PASSWORD` | Sim | Senha do dono. |
| `SIGNUP_INVITE_CODE` | Não | Se definido, `/signup` exige esse código. Sem ele, qualquer pessoa pode criar conta. |

| `GOOGLE_CLIENT_ID` | Para login com Google | Client ID OAuth (tipo "Aplicativo da Web") do Google Cloud. |
| `GOOGLE_CLIENT_SECRET` | Para login com Google | Client secret do mesmo cliente OAuth. |

O dono entra pelas variáveis acima; os demais usuários se cadastram em `/signup` e ficam na tabela `users`. Sem `AUTH_EMAIL` / `AUTH_PASSWORD`, só os usuários cadastrados conseguem entrar. Em dev, se `AUTH_SECRET` faltar, o código usa um fallback fraco — **não use isso em produção**.

### Banco (modo `http`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim no `http` | Dev: `file:local.db`. Prod: URL Turso `libsql://…`. |
| `DATABASE_AUTH_TOKEN` | Turso | Token do banco remoto. Não use no arquivo local de SQLite. |

Aplicar schema:

```bash
pnpm db:push
```

O `pnpm build` também roda `drizzle-kit push --force` antes do build Next.

**Atenção:** não coloque o Turso de produção no `.env.local`. O `.env.development` já isola o dev em `file:local.db`.

### Login com Google (opcional, modo `http`)

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie (ou escolha) um projeto e configure a **tela de consentimento OAuth** (tipo Externo; escopos `openid` e `email`).
2. Crie uma credencial **ID do cliente OAuth** → **Aplicativo da Web**.
3. Em **URIs de redirecionamento autorizados**, adicione um por domínio:
   - `https://SEU-DOMINIO/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` (dev)
4. Copie o client ID e o secret para `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

Sem essas duas variáveis o botão "Continuar com Google" não aparece. Regras:

- E-mail do Google igual a `AUTH_EMAIL` → entra como dono.
- E-mail de uma conta já cadastrada com senha → o Google é vinculado a ela.
- E-mail novo → cria a conta (com `SIGNUP_INVITE_CODE` definido, só pela tela de cadastro com o código).

Previews da Vercel têm domínio próprio; o Google só aceita URIs cadastrados, então o login com Google funciona nos domínios que você adicionar.

### Pluggy / MeuPluggy (opcional, modo `http`)

Só o dono (login por `AUTH_EMAIL`) usa o Open Finance: as credenciais são de uma conta MeuPluggy pessoal. Os outros usuários recebem 403 nas rotas `/api/finance/bank/*`.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PLUGGY_CLIENT_ID` | Para Open Finance | Client ID da aplicação Pluggy. |
| `PLUGGY_CLIENT_SECRET` | Para Open Finance | Client secret (só servidor). |
| `PLUGGY_WEBHOOK_SECRET` | Para webhooks | Header compartilhado; mín. 32 chars (`openssl rand -hex 32`). Use valores **diferentes** em dev e prod. |
| `PLUGGY_WEBHOOK_ALLOWED_IPS` | Não | Lista opcional de IPs permitidos (separados por vírgula). |

Admin de webhooks (lê `.env.local` via `--env-file`):

```bash
pnpm pluggy webhook:list
pnpm pluggy webhook:create https://seu-dominio/api/webhooks/pluggy
pnpm pluggy webhook:update <webhookId>   # reenvia o segredo atual
pnpm pluggy webhook:delete <webhookId>
```

A URL do webhook precisa ser HTTPS e terminar em `/api/webhooks/pluggy`.

---

## Cenários

### Só front local (sem login, sem SQLite)

```env
NEXT_PUBLIC_DATA_SOURCE=local
GEMINI_API_KEY="..."   # opcional
```

### Dev “nuvem” na máquina (padrão do repo)

Já coberto por `.env.development` + secrets no `.env.local`:

```env
# .env.local
GEMINI_API_KEY="..."
AUTH_SECRET="..."
AUTH_EMAIL="voce@email.com"
AUTH_PASSWORD="..."
# Pluggy opcional
```

### Produção (Vercel)

Defina no painel do projeto (não no git):

```env
NEXT_PUBLIC_DATA_SOURCE=http
GEMINI_API_KEY=...
AUTH_SECRET=...
AUTH_EMAIL=...
AUTH_PASSWORD=...
SIGNUP_INVITE_CODE=...   # opcional: fecha o cadastro com um código
GOOGLE_CLIENT_ID=...     # opcional: login com Google
GOOGLE_CLIENT_SECRET=...
DATABASE_URL=libsql://orbit-....turso.io
DATABASE_AUTH_TOKEN=...
# Pluggy opcional
PLUGGY_CLIENT_ID=...
PLUGGY_CLIENT_SECRET=...
PLUGGY_WEBHOOK_SECRET=...
```

Turso (resumo):

```bash
# CLI: https://docs.turso.tech/
turso auth login
turso db create orbit
turso db show orbit --url
turso db tokens create orbit
```

---

## Checklist rápido

- [ ] `.env.local` existe e não está no git
- [ ] `GEMINI_API_KEY` se for usar a IA
- [ ] Modo `http`: `AUTH_*` + `DATABASE_URL` (e token se Turso)
- [ ] Pluggy: client id/secret; webhook secret distinto por ambiente
- [ ] Servidor reiniciado após editar env
- [ ] Produção: variáveis só no host, Turso de prod fora do laptop

Arquitetura (camadas, auth, schema, Pluggy): [`architecture.md`](./architecture.md).
