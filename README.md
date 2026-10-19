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

### Conta e dados

- Perfil (nome, foto, bio) compartilhado entre Home e Configurações.
- Exportar / importar backup JSON em Configurações.
- Tema claro e escuro.
- Rotas `/` (hub), `/tasks`, `/finance` e `/settings`. Visão, data, categoria e mês ficam na URL.

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
  features/     tasks, finance, assistant, profile, settings
  shared/       ui, efeitos visuais e utilitários
  server/       auth, db (Drizzle), rate limit
  config/       escolha da fonte de dados (NEXT_PUBLIC_DATA_SOURCE)
```

Plano de backend: [`documents/plano_implementacao_backend.md`](documents/plano_implementacao_backend.md).  
Roadmap: [`documents/roadmap.md`](documents/roadmap.md).

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

No `.env.local`, preencha `GEMINI_API_KEY` com uma chave do [Google AI Studio](https://aistudio.google.com/app/apikey). Sem essa chave o app abre, mas a Orbit AI (tarefas e finanças) não responde. Se o servidor já estiver rodando, reinicie-o depois de alterar o arquivo.

Para o modo nuvem (`http`), configure também `AUTH_*` e `DATABASE_*` — detalhes em [`documents/plano_implementacao_backend.md`](documents/plano_implementacao_backend.md).

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

Build de produção:

```bash
pnpm build
pnpm start
```

Lint:

```bash
pnpm lint
```

Tipos e testes:

```bash
pnpm typecheck
pnpm test
```
