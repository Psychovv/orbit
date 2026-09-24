# Arquitetura do Orbit — diagnóstico e evolução do front

Este documento avalia a arquitetura atual e propõe como reorganizar o front para receber, mais adiante, um backend NestJS com banco de dados, autenticação e múltiplos usuários. **Não é um plano para implementar o backend agora.** O objetivo é deixar o front pronto para que essa troca seja um "plugar o adapter HTTP", e não uma reescrita.

---

## 1. Como o sistema está hoje

```
src/
  app/
    layout.tsx            ThemeProvider + fontes
    page.tsx              "use client" — TODO o estado do app vive aqui
    api/tasks/parse-voice     Route Handler → Gemini
    api/finance/parse-voice   Route Handler → Gemini
  components/
    tasks/ finance/ sidebar/ header/ ui/ magic/
  lib/
    storage.ts            OrbitStorage (localStorage)
    initial-data.ts       dados de demonstração
    date-utils.ts
  types/orbit.ts          tipos de domínio
```

Fluxo de dados atual:

1. `page.tsx` cria 4 `useState` (tarefas, categorias, transações, categorias financeiras) com os dados de demonstração.
2. Um `useEffect` lê o `localStorage` e substitui o estado.
3. Quatro `useEffect` regravam o array inteiro no `localStorage` a cada mudança.
4. Handlers (`handleAddTask`, `handleDeleteTransaction`…) são passados por props até os módulos, e dos módulos até os itens.
5. A IA devolve "intenções" (`create`, `completeIds`, `deleteIds`) e o componente `TasksModule` executa essas intenções chamando os handlers.

### O que está bom

- Separação por domínio em `components/tasks` e `components/finance` já existe.
- Tipos centralizados em `types/orbit.ts`.
- A chave da IA fica no servidor (Route Handlers), nunca no cliente.
- Datas de tarefa como `YYYY-MM-DD` (sem hora) é a escolha certa para um calendário.
- `pnpm-workspace.yaml` já existe, o que facilita virar monorepo.

### Problemas que bloqueiam a evolução

| Problema | Onde | Por que atrapalha o backend |
| --- | --- | --- |
| Estado global num único componente cliente | `app/page.tsx` | Não há camada de dados; trocar localStorage por API exige mexer em todos os handlers e props. |
| Persistência acoplada | `OrbitStorage` chamado direto da página | Não existe interface para trocar a fonte de dados. |
| Regra de negócio dentro de componentes | `TasksModule.handleVoiceResult`, métricas em `FinanceModule` | Vai precisar ser duplicada ou movida para o backend às pressas. |
| IDs gerados no cliente | `task-${Date.now()}-${random}` | O banco vai gerar IDs (UUID); o front precisa lidar com ID temporário + ID real. |
| Modelo com dados de apresentação | `TaskCategory.bgLight`, `textDark`, `borderLight`… | Classes Tailwind não devem ir para o banco. Hoje todas têm o mesmo valor. |
| Campo derivado persistido | `Task.day` (dia da semana) | Pode ser calculado a partir de `date`; persistir cria inconsistência. |
| Dinheiro como `number` de ponto flutuante | `Transaction.amount` | `0.1 + 0.2` quebra somas; banco deve guardar centavos (inteiro) ou `decimal`. |
| Faltam campos de ciclo de vida | todos os tipos | Sem `userId`, `updatedAt`, `completedAt`, `deletedAt`. |
| Validação inexistente | Route Handlers | `body` é usado sem validar; `any` em 12 lugares; erro interno vaza em `details`. |
| Tudo em uma única rota | `/` com `activeModule` em estado | Sem deep link, sem voltar do navegador, sem code splitting (ver seção 3). |
| Mapa de dia da semana duplicado 3x | `tasks-module.tsx` | Sinal de que falta uma camada de domínio. |
| Botões de IA quase idênticos | `voice-task-button.tsx`, `voice-finance-button.tsx` (~260 linhas cada) | Duplicação da captura de voz, UI do overlay e chamada HTTP. |

---

## 2. Arquitetura alvo do front

A ideia central: **componentes não sabem de onde vêm os dados.** Eles usam hooks de domínio (`useTasks`, `useCreateTask`), que usam um repositório, que tem duas implementações: `local` (hoje) e `http` (quando o Nest existir).

```
UI (componentes)  →  hooks de feature  →  Repository (interface)  →  LocalStorageRepo | HttpRepo
                          ↑
                  cache/estado do servidor (TanStack Query)
```

### 2.1 Estrutura de pastas proposta (feature-based)

```
src/
  app/
    layout.tsx                    html, fontes, providers (server)
    providers.tsx                 "use client": Theme + QueryClient
    (app)/                        route group da área logada
      layout.tsx                  shell: sidebar, header, fundo cósmico
      tasks/page.tsx
      finance/page.tsx
      loading.tsx / error.tsx
    (auth)/                       futuro: login, cadastro
    api/                          temporário — IA migra para o Nest depois
  features/
    tasks/
      components/                 day-column, task-item, modais…
      hooks/                      use-tasks.ts, use-task-mutations.ts
      data/
        tasks.repository.ts       interface
        tasks.local.ts            implementação localStorage
        tasks.http.ts             implementação HTTP (futuro)
      domain/
        task.schema.ts            schema zod + tipo inferido
        task.selectors.ts         agrupar por dia, contar concluídas…
        week-day.ts               dia da semana a partir da data (uma vez só)
    finance/
      components/ hooks/ data/ domain/
      domain/money.ts             centavos ⇄ BRL, formatação
      domain/metrics.ts           receitas, gastos, fatura (hoje no FinanceModule)
    assistant/                    Orbit AI unificado
      components/assistant-dialog.tsx
      hooks/use-speech-recognition.ts
      hooks/use-assistant.ts
      domain/actions.ts           tipos das ações que a IA propõe
  shared/
    ui/                           button, dialog, input, badge, progress
    effects/                      cosmic-background, confetti, glow-card
    lib/                          cn, date-utils, api-client, env
  config/
    data-source.ts                escolhe local | http via env
```

Regra de dependência: `app → features → shared`.

- Uma feature só importa o `domain/` de outra (tipos e funções puras) ou os componentes e hooks públicos de `assistant`, que existe para ser usado pelas outras. Nunca `data/` de outra feature.
- `config/data-source.ts` é o único ponto que conhece as implementações dos repositórios (composition root); os hooks de feature leem os repositórios dali.
- Componentes do shell (sidebar, header) ficam em `app/(app)/_components`, porque juntam mais de uma feature.

> Status: os passos da seção 4 foram aplicados. `loading.tsx` não foi criado — as páginas usam `Suspense` com `ViewSkeleton`, e a IA usa `assistant-button.tsx` + `hooks/use-*-assistant.ts` em cada feature em vez de um `use-assistant.ts` único.

### 2.2 Contratos com zod (a peça mais importante)

Os schemas viram a fonte única da verdade para tipos, validação de formulário, validação da resposta da IA e, no futuro, DTOs do Nest.

```ts
// features/tasks/domain/task.schema.ts
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  categoryId: z.string().nullable(),
  priority: z.enum(["baixa", "media", "alta"]),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.pick({
  title: true, description: true, date: true, time: true, categoryId: true, priority: true,
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
```

Mudanças de modelo recomendadas já no front (com migração do localStorage `v1 → v2`):

- `completed: boolean` → `completedAt: string | null` (dá histórico e estatística de graça; `completed` vira derivado).
- Remover `day` do modelo; calcular a partir de `date`.
- `TaskCategory`: manter só `id`, `name`, `color`, `icon`. As classes Tailwind saem do modelo e viram lógica de apresentação.
- `Transaction.amount` → `amountCents: number` (inteiro). Formatação fica em `domain/money.ts`.
- `categoryId` aceitando `null` ("Geral") em vez de string vazia.
- Adicionar `createdAt`/`updatedAt` em tudo.

Quando o backend existir, esses schemas vão para `packages/contracts` e são importados pelo front e pelo Nest (via `nestjs-zod` ou equivalente).

### 2.3 Camada de repositório

```ts
// features/tasks/data/tasks.repository.ts
export interface TasksRepository {
  list(range: { from: string; to: string }): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, patch: Partial<CreateTaskInput> & { completedAt?: string | null }): Promise<Task>;
  remove(id: string): Promise<void>;
}
```

- `tasks.local.ts` implementa isso sobre o localStorage, **com assinatura assíncrona** mesmo sendo síncrono por baixo. Assim os componentes já lidam com loading/erro desde agora.
- `list` já recebe um intervalo de datas. Com localStorage filtra em memória; com o Nest vira `GET /tasks?from=&to=`. Isso evita que o front dependa de "ter todas as tarefas carregadas".
- `config/data-source.ts` escolhe a implementação por variável de ambiente (`NEXT_PUBLIC_DATA_SOURCE=local|http`).

### 2.4 Estado do servidor vs. estado de UI

| Tipo de estado | Ferramenta | Exemplos |
| --- | --- | --- |
| Dados persistidos | **TanStack Query** | tarefas, categorias, transações |
| Estado navegável | **URL** (rota + `searchParams`) | módulo, semana/mês, data base, categoria filtrada |
| Estado de UI local | `useState` no componente | modal aberto, texto digitado |
| Preferências de UI | localStorage via hook pequeno | sidebar recolhida, tema |

Por que TanStack Query mesmo com localStorage: cache por chave (`["tasks", from, to]`), mutations com atualização otimista e rollback, invalidação, estados de loading/erro padronizados. Na troca para HTTP, **nenhum componente muda**, só o repositório.

Com isso o `page.tsx` deixa de existir como "dono" de tudo, a sidebar não precisa mais receber o array de tarefas por prop (usa `useTaskCounts()`), e o prop drilling de handlers some.

### 2.5 Orbit AI desacoplado

Hoje a IA recebe a lista de tarefas do cliente e o cliente executa as ações. Para o futuro:

1. Criar `features/assistant` com **um** componente de diálogo, **um** hook de reconhecimento de voz e um `domain` parametrizado por "escopo" (`tasks` | `finance`).
2. Definir as ações como união discriminada validada por zod:
   ```ts
   type AssistantAction =
     | { type: "task.create"; input: CreateTaskInput }
     | { type: "task.complete"; id: string }
     | { type: "task.delete"; id: string }
     | { type: "transaction.create"; input: CreateTransactionInput };
   ```
3. Um executor (`applyActions`) que usa os mesmos hooks de mutation da UI. Ações destrutivas em lote (excluir várias) passam por confirmação.
4. Quando o backend existir, o endpoint do assistente vai para o Nest, que já tem acesso ao banco: o cliente manda só o texto, e o servidor busca as tarefas relevantes. Isso também resolve boa parte do custo de tokens (ver `desempenho.md`).

### 2.6 Route Handlers até lá

Enquanto a IA ficar no Next:

- Validar `body` com zod e retornar 400 com mensagem genérica.
- Validar a saída do modelo com o schema de ações (hoje é `JSON.parse` direto).
- Não devolver `error.message` para o cliente.
- Tipar tudo e remover os `any`.
- Rate limit simples por IP (a chave do Gemini é paga e a rota é pública).

---

## 3. Uma página só é ideal?

**Não para onde o projeto quer ir.** Hoje `/` renderiza tarefas ou finanças conforme um `useState`. Isso funciona para um protótipo, mas tem custos concretos:

| Aspecto | Página única (hoje) | Rotas `/tasks` e `/finance` |
| --- | --- | --- |
| Recarregar a página | Volta sempre para Tarefas, semana atual | Mantém módulo, semana e filtro (se estiverem na URL) |
| Botão voltar / link compartilhável | Não funciona | Funciona |
| Bundle inicial | Carrega tarefas + finanças + todos os modais | Cada rota carrega só o seu código |
| Autenticação futura | Precisa de lógica condicional na página | `(auth)` e `(app)` como route groups; `proxy.ts` redireciona |
| Estados de loading/erro | Manuais | `loading.tsx` e `error.tsx` por segmento |
| Novos módulos (metas, hábitos…) | Mais um `if` em `page.tsx` | Mais uma pasta |

A sensação de "app de uma tela" não se perde:

- O **shell** (sidebar, header, fundo cósmico) fica em `app/(app)/layout.tsx`. Layouts não remontam na navegação, então o canvas de estrelas continua rodando sem reiniciar.
- A transição entre módulos pode continuar com `motion` num `template.tsx`, ou migrar para o `<ViewTransition>` do React, que o Next 16 suporta (guia em `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`).
- `next/link` faz prefetch, então a troca é instantânea.

Estrutura de URL sugerida:

```
/                          → redirect para /tasks
/tasks?view=week&date=2026-09-24&category=estudos
/tasks?view=month&date=2026-09-01
/finance?month=2026-09
/settings                  (futuro: categorias, conta, dados)
/login                     (futuro)
```

Modais de criação continuam sendo modais (estado local). Se no futuro quiser URL para eles, dá para usar intercepting routes, mas não é necessário agora.

---

## 4. O que fazer agora no front (ordem sugerida)

Cada passo é independente e mantém o app funcionando.

1. **Contratos**: adicionar `zod`, criar os schemas de `Task`, `TaskCategory`, `Transaction`, `FinanceCategory`. Tipos passam a ser `z.infer`.
2. **Domínio puro**: extrair para `domain/` as funções hoje dentro de componentes (dia da semana, agrupamento por dia, métricas financeiras, formatação de moeda). Fácil de testar com Vitest.
3. **Repositórios locais assíncronos** + migração do localStorage `v1 → v2` (novo modelo).
4. **TanStack Query**: hooks `useTasks(range)`, `useCreateTask()`, etc. Remover estado e handlers de `page.tsx`.
5. **Rotas**: criar `(app)/layout.tsx`, `(app)/tasks`, `(app)/finance`; mover filtros para `searchParams`.
6. **Feature `assistant`**: unificar os dois botões de IA e validar as ações com zod.
7. **Reorganizar pastas** para `features/` e `shared/` (pode ser feito junto com os passos acima, feature por feature).
8. **Qualidade**: Vitest para `domain/`, remover `any`, `test-models.*` e SVGs não usados de `public/`.

Ao final, trocar para o backend é: implementar `*.http.ts`, apontar `NEXT_PUBLIC_DATA_SOURCE=http` e adicionar autenticação.

---

## 5. Horizonte do backend (referência, não plano)

Só para orientar decisões do front; detalhar quando for a hora.

**Monorepo** (o `pnpm-workspace.yaml` já está lá):

```
apps/web          Next (este projeto)
apps/api          NestJS
packages/contracts   schemas zod compartilhados
```

**Módulos Nest**: `AuthModule`, `UsersModule`, `TasksModule`, `TaskCategoriesModule`, `TransactionsModule`, `FinanceCategoriesModule`, `AssistantModule` (Gemini).

**Banco**: PostgreSQL com Prisma ou Drizzle. Esboço:

```
users               id uuid, email, name, timezone, created_at
task_categories     id, user_id, name, color, icon, position
tasks               id, user_id, category_id?, title, description?, date (date), time?,
                    priority, completed_at?, created_at, updated_at, deleted_at?
finance_categories  id, user_id, name, type, color, icon, monthly_budget_cents?
transactions        id, user_id, category_id, description, amount_cents (int), type,
                    date (date), payment_method, notes?, created_at, updated_at
```

Índices principais: `tasks(user_id, date)` e `transactions(user_id, date)`, porque todas as telas consultam por intervalo de datas.

**Pontos de atenção** que o front já deve respeitar:

- Fuso horário: guardar `timezone` do usuário; "hoje" é calculado no fuso dele, não no do servidor.
- Dados de demonstração viram seed do usuário novo, não fallback do front.
- Importação dos dados do localStorage para a conta na primeira autenticação.
- Autenticação: sessão/JWT emitida pelo Nest; no Next, `proxy.ts` faz só a checagem otimista de redirecionamento (a doc do Next 16 avisa que ele não deve ser a camada de autorização).
