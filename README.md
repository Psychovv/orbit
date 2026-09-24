# Orbit

Orbit é um aplicativo web de organização pessoal e planejamento financeiro, com tema claro e escuro.

## Funcionalidades

### Tarefas

- Visão da semana, de segunda a domingo, com navegação entre semanas e visão mensal.
- Categorias personalizáveis (Guitarra, Estudos, Faculdade, Exercícios, Projetos, Rotina).
- Criação, conclusão e exclusão de tarefas por texto ou voz com a Orbit AI.

### Finanças

- Saldo, receitas, despesas e taxa de economia do mês.
- Teto de gastos por categoria, com barra de progresso.
- Extrato com filtro por tipo, busca por descrição e método de pagamento (PIX, cartão, boleto e outros).
- Lançamentos por texto ou voz com a Orbit AI.

### Interface

- Tema claro e escuro.
- Rotas `/tasks` e `/finance` (`/` redireciona para `/tasks`). Visão, data, categoria e mês ficam na URL (`/tasks?view=month&date=2026-10-01&category=estudos`, `/finance?month=2026-08`).
- Dados salvos no navegador (`localStorage`), com opção de restaurar os dados iniciais. Dados do formato antigo (`*_v1`) são migrados automaticamente.

## Estrutura

```
src/
  app/          rotas, layout, providers e Route Handlers da IA
  features/     tasks, finance e assistant (components, hooks, data, domain)
  shared/       ui, efeitos visuais e utilitários
  config/       escolha da fonte de dados (NEXT_PUBLIC_DATA_SOURCE)
```

Detalhes e próximos passos em [`documents/arquitetura.md`](documents/arquitetura.md).

## Tecnologias

- [Next.js](https://nextjs.org/) 16 (App Router, Turbopack)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Motion](https://motion.dev/)
- [Lucide](https://lucide.dev/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [TanStack Query](https://tanstack.com/query) e [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/) para testes
- [Google Gemini](https://ai.google.dev/) para a Orbit AI

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
