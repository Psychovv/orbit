# Desempenho, design tokens e custo de IA

Este documento lista melhorias de desempenho do Orbit **sem mudar a identidade visual** (roxo `#844DFE`, fundo cósmico, vidro fosco, confete). Ele cobre três frentes:

1. Desempenho de renderização e carregamento.
2. Design tokens (organizar cores e estilos para ficar mais leve e fácil de manter).
3. Tokens de IA (reduzir o custo e a latência das chamadas ao Gemini).

As prioridades estão marcadas como **Alta**, **Média** e **Baixa** pelo impacto percebido pelo usuário.

---

## 1. Renderização e carregamento

### 1.1 Blur sobre canvas animado — **Alta**

É o maior custo de GPU do app hoje. O `CosmicBackground` redesenha um `<canvas>` em tela cheia a 60 fps, e por cima dele há **13 superfícies com `backdrop-blur`**: header, sidebar, barra de navegação do calendário, as 7 colunas da semana (`DayColumn`), `GlowCard`, calendário mensal e overlays. Como o que está atrás muda a cada quadro, o navegador precisa recalcular o blur de todas essas áreas em todo quadro. Em notebooks sem GPU dedicada e em celulares isso vira queda de fps, aquecimento e bateria.

O que fazer, preservando o visual:

- Manter `backdrop-blur` só no **header e na sidebar** (onde o efeito aparece de verdade, ao rolar conteúdo por baixo).
- Nas colunas, cards e barras, trocar por fundo semitransparente mais opaco, sem blur (ex.: `dark:bg-[#100e1e]/90`). Como as estrelas são esparsas e pequenas, a diferença visual é mínima.
- Nos nebulosos do fundo (`blur-[150px]` em divs de 550 px), trocar `filter: blur` por `radial-gradient`. O resultado é igual e custa quase nada.

### 1.2 Canvas de estrelas — **Alta**

Arquivo: `src/components/magic/cosmic-background.tsx`.

| Problema | Correção |
| --- | --- |
| `shadowBlur` por estrela a cada quadro (operação cara no canvas 2D) | Pré-renderizar o brilho num sprite (canvas offscreen) uma vez e usar `drawImage`. |
| `ctx.save()/restore()` para cada estrela | Agrupar estrelas por cor e ajustar só `globalAlpha`. |
| Roda a 60 fps para um efeito de cintilar lento | Limitar a ~30 fps (pular quadros com base em `now`). Visualmente idêntico. |
| Sem respeito a `prefers-reduced-motion` | Nesse caso, desenhar um quadro estático e não animar. |
| `resize` sem debounce recria todas as estrelas | Debounce de ~150 ms. |
| Não considera `devicePixelRatio` | Escalar o canvas pelo DPR (limitado a 2). Fica mais nítido em telas retina sem custo excessivo. |
| Continua animando com a aba visível mas o usuário em outro app | Pausar em `visibilitychange`. |

Opcional: mover o desenho para um `OffscreenCanvas` num Web Worker, tirando todo o trabalho da thread principal.

### 1.3 Flash dos dados de demonstração — **Alta**

`page.tsx` inicializa o estado com `INITIAL_TASKS` e só depois do `useEffect` troca pelos dados do localStorage. Resultado: no primeiro quadro o usuário vê as tarefas de demonstração e elas "pulam" para as reais. Além disso, as quatro listas de demonstração (≈500 linhas) vão no bundle de todo mundo.

- Renderizar um skeleton enquanto os dados não carregam (com TanStack Query isso sai de graça pelo `isPending`, ver `arquitetura.md`).
- Carregar `initial-data.ts` com `import()` dinâmico só quando não houver dados salvos.

### 1.4 Tudo é Client Component — **Média**

`app/page.tsx` tem `"use client"`, então a árvore inteira (27 arquivos com `"use client"`) vai para o bundle do navegador e nada é renderizado como Server Component. Com a separação em rotas proposta em `arquitetura.md`:

- `(app)/layout.tsx` como Server Component, com ilhas cliente só onde há interação (sidebar, toggle de tema, canvas).
- Finanças não é baixado por quem está em Tarefas, e vice-versa.
- Footer, títulos e textos estáticos deixam de ser hidratados.

### 1.5 Código que só é usado sob demanda — **Média**

Carregar com `next/dynamic` ou `import()`:

- Modais: `AddTaskModal`, `ManageCategoriesModal`, `DayDetailModal`, `AddTransactionModal`.
- Overlay da Orbit AI (inclui a lógica de reconhecimento de voz).
- `canvas-confetti`: importar na primeira vez que uma tarefa for concluída.
- `MonthCalendarView`: só quando o usuário troca para "Mês".

### 1.6 Motion — **Média**

- Usar `LazyMotion` com `domAnimation` e o componente `m` no lugar de `motion`. Reduz bastante o JavaScript inicial da biblioteca, sem mudar nenhuma animação.
- `TaskItem` usa a prop `layout` em todos os itens. Animações de layout medem o DOM a cada render; com muitas tarefas na semana isso pesa. Aplicar `layout` só quando a lista realmente muda de ordem, ou remover.
- `TaskItem` declara `exit`, mas a lista em `DayColumn` não está dentro de `AnimatePresence`, então a animação de saída nunca roda. Ou envolver com `AnimatePresence`, ou remover o `exit`.

### 1.7 Re-renders e cálculos repetidos — **Média**

Qualquer mudança (ex.: abrir um modal) re-renderiza `page.tsx` e toda a árvore, porque os handlers são recriados a cada render e nenhum filho é memoizado.

- Ativar o **React Compiler** (`reactCompiler: true` em `next.config.ts` + `babel-plugin-react-compiler`). Ele memoiza automaticamente componentes e callbacks, sem espalhar `useMemo`/`useCallback` pelo código. Suportado pelo Next 16 (ver `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/reactCompiler.md`).
- `TasksModule` filtra `filteredTasks` 7 vezes (uma por dia). Agrupar uma vez num `Map<data, Task[]>`, como o `MonthCalendarView` já faz.
- `OrbitSidebar` faz `tasks.filter` para cada categoria a cada render. Calcular contagens uma vez (`Map<categoryId, number>`).
- `pendingTasks={tasks.map(...)}` cria um array novo a cada render do `TasksModule`. Montar isso só no momento de enviar para a IA.

### 1.8 Persistência — **Baixa**

Cada alteração faz `JSON.stringify` do array inteiro e grava no localStorage de forma síncrona. Com poucas centenas de itens não se nota, mas cresce linearmente. Agrupar gravações com debounce (~300 ms) ou gravar em `requestIdleCallback`. Isso deixa de importar quando os dados forem para o backend.

### 1.9 Limpeza — **Baixa**

- Remover `public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` se não forem usados, e `test-models.js`/`test-models.mjs` da raiz.
- Conferir se `public/image.png` é usado; se for, servir via `next/image`.

### Como medir

Antes e depois de cada mudança:

- Chrome DevTools → Performance: gravar 5 s parado na tela de Tarefas e olhar "GPU" e fps. É onde os itens 1.1 e 1.2 aparecem.
- Lighthouse (modo mobile) para LCP, TBT e JavaScript total.
- `pnpm build` para ver o tamanho do JavaScript de cada rota.
- React DevTools Profiler com "Highlight updates" para ver re-renders.

---

## 2. Design tokens

Hoje o `globals.css` define variáveis (`--primary`, `--card`, `--border`…), mas **elas não são usadas pelos componentes**. As cores estão escritas à mão em cada classe:

| Valor | Ocorrências |
| --- | --- |
| `#844DFE` (roxo principal) | 172 |
| `#b494ff` (roxo claro, texto no escuro) | 25 |
| `#100e1e`, `#121020`, `#090812`, `#18152c`… (superfícies escuras) | ~20 |
| Prefixo `dark:` | 453 |

Consequências: ajustar um tom exige buscar e substituir em dezenas de arquivos; já existem variações acidentais (hover em `#723ce6` e `#7239ea`); e cada elemento carrega pares `claro dark:escuro` enormes no HTML.

### 2.1 Mapear as variáveis no Tailwind 4

Com `@theme inline` as variáveis viram utilitários (`bg-primary`, `text-primary-soft`, `bg-surface`…), e o tema escuro passa a ser só a troca das variáveis em `.dark`, sem `dark:` em cada classe.

```css
:root {
  --primary: #844DFE;
  --primary-hover: #723ce6;
  --primary-soft: #844DFE;        /* texto de destaque */
  --surface: rgb(255 255 255 / 0.8);
  --surface-raised: #ffffff;
  --border-subtle: rgb(228 228 231 / 0.8);
  /* … */
}
.dark {
  --primary-soft: #b494ff;
  --surface: rgb(16 14 30 / 0.8);  /* #100e1e */
  --surface-raised: #121020;
  --border-subtle: rgb(39 39 42 / 0.8);
}

@theme inline {
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-soft: var(--primary-soft);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-border-subtle: var(--border-subtle);
}
```

Exemplo de ganho, na coluna do dia:

```
antes:  bg-white/80 dark:bg-[#100e1e]/80 border-zinc-200/80 dark:border-zinc-800/80
depois: bg-surface border-border-subtle
```

Os valores continuam exatamente os mesmos, então a identidade visual não muda.

### 2.2 Padrões repetidos viram utilitários ou variantes

Alguns blocos de classes aparecem muitas vezes com pequenas variações:

- "Pílula roxa" (`bg-[#844DFE]/10 text-[#844DFE] dark:text-[#b494ff] border-[#844DFE]/20`) → `@utility pill-primary` ou variante do `Badge`.
- Botões de ícone da barra de navegação (setas, fechar, recolher) → variante `ghost-icon` do `Button`.
- Superfície de vidro (`bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md border …`) → `@utility glass` com uma única definição, o que também facilita aplicar a regra do item 1.1.
- Seletor segmentado Semana/Mês e barra de navegação de período, que se repetem entre Tarefas e Finanças → componentes em `shared/ui`.

### 2.3 Cores de categoria

As cores das categorias (`#3b82f6`, `#f59e0b`…) são dado do usuário e continuam vindo do modelo. Os campos `bgLight`, `textDark`, `borderLight` etc. devem sair do modelo (ver `arquitetura.md`), porque hoje são todos iguais e só aumentam o localStorage.

---

## 3. Tokens de IA (Gemini)

Os dois Route Handlers já usam o modelo `gemini-3.5-flash-lite` e prompts compactos. Ainda há ganhos grandes.

### 3.1 Não enviar todas as tarefas — **Alta**

`TasksModule` envia `tasks.map(...)` para a IA: **todas** as tarefas, incluindo as concluídas e as de meses atrás. O prompt cresce sem limite conforme o uso, e cada ID tem ~25 caracteres (`task-1727190000000-1234`).

- Enviar só uma janela relevante: tarefas pendentes de hoje −7 a +14 dias, mais as concluídas dos últimos 2 dias (para "desmarcar").
- Se o texto do usuário citar uma data explícita fora da janela, incluir aquele dia.
- Trocar os IDs por índices curtos no prompt (`1`, `2`, `3`…) e mapear de volta no servidor. Isso sozinho corta boa parte dos tokens da lista.
- Remover a data de cada tarefa quando houver muitas no mesmo dia: agrupar como `2026-09-24: 1|nao|Treinar; 2|sim|Ler`.

### 3.2 Pular a IA quando a regra local resolve — **Alta**

Em `api/tasks/parse-voice/route.ts`, `bulkTaskIds` detecta pedidos como "conclua todas as tarefas de hoje" por regex, mas isso roda **depois** da chamada ao Gemini, e o resultado da IA é descartado. Mover a verificação para antes da chamada e retornar direto: custo zero de tokens e resposta instantânea nesses casos.

Dá para estender a ideia: pedidos simples sem data relativa complicada (ex.: "comprar leite") poderiam ter um caminho rápido, mas só vale se as regras forem confiáveis.

### 3.3 Estrutura do prompt — **Média**

- Usar `systemInstruction` para as regras fixas e deixar no conteúdo só o que muda (data, categorias, tarefas, texto). As regras deixam de ser repetidas no corpo e o prefixo fixo fica elegível para o cache implícito do Gemini (que exige um tamanho mínimo de prompt, então o ganho depende do tamanho final).
- Usar `responseSchema` no `generationConfig` em vez de descrever o JSON em texto. A saída fica garantidamente no formato certo, dá para tirar o `replace` de markdown e validar direto com zod.
- Definir `maxOutputTokens` (ex.: 512) para limitar respostas degeneradas.
- Categorias: enviar só `id:nome` (já é assim em tarefas) e, em finanças, filtrar por tipo quando o texto deixar claro se é receita ou despesa.

### 3.4 Proteções de custo — **Média**

- As rotas são públicas e não têm limite. Qualquer um que descubra a URL gasta a sua cota. Adicionar rate limit por IP (e por usuário, quando houver login).
- Limitar o tamanho do `text` recebido (ex.: 500 caracteres).
- Registrar `usageMetadata` (tokens de entrada e saída) de cada resposta para acompanhar o custo real e medir o efeito das mudanças acima.

### 3.5 Com o backend

Quando o assistente for para o Nest (ver `arquitetura.md`), o cliente passa a enviar só o texto. O servidor busca no banco apenas as tarefas da janela relevante, e a lista nunca mais trafega do navegador. Isso consolida os itens 3.1 e 3.4.

---

## 4. Resumo por prioridade

**Alta**

1. Reduzir `backdrop-blur` a header e sidebar; nebulosas com gradiente.
2. Otimizar o canvas (sprite de brilho, 30 fps, reduced motion, pausa).
3. Skeleton no carregamento em vez do flash dos dados de demonstração.
4. Enviar para a IA só a janela relevante de tarefas, com IDs curtos.
5. Resolver pedidos em lote antes de chamar o Gemini.

**Média**

6. Rotas separadas com layout Server Component.
7. `next/dynamic` para modais, overlay da IA, confete e visão mensal.
8. `LazyMotion` e revisão do `layout` em `TaskItem`.
9. React Compiler e agrupamento de tarefas por dia.
10. Design tokens no `@theme` e utilitários para padrões repetidos.
11. `systemInstruction`, `responseSchema`, `maxOutputTokens`, rate limit.

**Baixa**

12. Debounce nas gravações do localStorage.
13. Limpeza de arquivos não usados.
