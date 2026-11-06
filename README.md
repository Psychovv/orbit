# Orbit

Orbit é um aplicativo web de organização pessoal e planejamento financeiro, com tema claro e escuro.

## Funcionalidades

### Tarefas

- Visão da semana, de segunda a domingo, com navegação entre semanas e visão mensal.
- Categorias personalizáveis (criar, editar nome/ícone/cor e excluir).
- Criação, conclusão e exclusão de tarefas por texto ou voz com a Orbit AI.
- Sessão de foco e streak de conclusão.

### Finanças

- Saldo, receitas, despesas e taxa de economia do mês.
- Teto de gastos por categoria, com barra de progresso.
- Extrato com filtro por tipo, busca por descrição e método de pagamento (PIX, cartão, boleto e outros).
- Lançamentos por texto ou voz com a Orbit AI.
- Importação de extratos via Open Finance (MeuPluggy), só no modo `http`: conexões em Configurações, sincronização manual ou por webhook. Webhooks são administrados com `pnpm pluggy webhook:list | webhook:create <url> | webhook:update <id> | webhook:delete <id>`.

### Hábitos

- Check-in diário (sim/não ou meta numérica, ex.: ml de água).
- Frequência diária, dias específicos da semana ou meta semanal.
- Streak e visão semanal da matriz de check-ins.
- Criação e check-in por texto ou voz com a Orbit AI.
- Incluídos no backup JSON (exportar / importar).

### Conta e dados

- Multiusuário no modo `http`: cadastro em `/signup` (opcionalmente com código de convite), cada usuário vê só os próprios dados. Login e cadastro também com Google (opcional). O dono entra pelas variáveis `AUTH_*`; Open Finance é só dele.
- Perfil (nome, foto, bio) compartilhado entre Home e Configurações.
- Exportar / importar backup JSON em Configurações.
- Tema claro e escuro.
- Rotas `/` (hub), `/tasks`, `/finance`, `/habits` e `/settings`. Visão, data, categoria e mês ficam na URL.

### Fontes de dados

| `NEXT_PUBLIC_DATA_SOURCE` | Comportamento |
|---|---|
| `local` (padrão se omitido) | Dados no `localStorage`, sem login obrigatório |
| `http` | API + SQLite/Turso + autenticação JWT |

No modo local, dados do formato antigo (`*_v1`) são migrados automaticamente. Há opção de restaurar os dados de demonstração.

## Estrutura

```
src/
  app/          rotas, layout, providers e Route Handlers
  features/     tasks, finance, habits, home, assistant, profile, settings
  shared/       ui, efeitos visuais e utilitários
  server/       auth, db (Drizzle), Pluggy, rate limit
  config/       escolha da fonte de dados (NEXT_PUBLIC_DATA_SOURCE)
  proxy.ts      guarda JWT no modo http
```

## Documentação

| Doc | Conteúdo |
|---|---|
| [`documents/architecture.md`](documents/architecture.md) | Camadas, modos local/http, auth, banco, Pluggy, CI e deploy |
| [`documents/env-setup.md`](documents/env-setup.md) | Variáveis de ambiente (Gemini, Auth, Turso, Pluggy) |
| [`.env.example`](.env.example) | Modelo comentado das variáveis |

## Tecnologias

- [Next.js](https://nextjs.org/) 16 (App Router, Turbopack)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Motion](https://motion.dev/)
- [Lucide](https://lucide.dev/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [TanStack Query](https://tanstack.com/query) e [Zod](https://zod.dev/)
- [Drizzle](https://orm.drizzle.team/) + LibSQL/Turso
- [Vitest](https://vitest.dev/) para testes
- [Google Gemini](https://aistudio.google.com/) para a Orbit AI

## Como executar

Requisitos: Node.js 20 ou mais recente e pnpm 10.33.4 (versão declarada em `package.json`).

Se o pnpm ainda não estiver instalado:

```bash
corepack enable
corepack prepare pnpm@10.33.4 --activate
```

Na raiz do projeto:

```bash
pnpm install
cp .env.example .env.local
```

No `.env.local`, preencha pelo menos `GEMINI_API_KEY` se for usar a Orbit AI. No modo `http` (padrão do `.env.development`), configure também `AUTH_*` — guia completo em [`documents/env-setup.md`](documents/env-setup.md). Reinicie o servidor depois de alterar o arquivo.

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

Build de produção (`drizzle-kit push` + Next):

```bash
pnpm build
pnpm start
```

Qualidade:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

CI no GitHub Actions: jobs paralelos de lint, typecheck e test (veja `.github/workflows/ci.yml`).
