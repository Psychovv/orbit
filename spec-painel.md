# Spec — Painel Pessoal (cronograma + metas)

## 1. Contexto e objetivo

Construir uma **web app pessoal de planejamento**, de uso diário, para acompanhar:

- Cronograma de estudos da faculdade (dividido em blocos por dia, com tarefas/exercícios marcáveis)
- Estudo de guitarra
- Leitura / hobbies
- Planejamento financeiro (área simples, em beta — não é um app financeiro completo)

O usuário já validou uma primeira versão funcional (single-file HTML, sem sidebar, tema escuro fixo, fonte serifada). Esta spec pede uma **segunda versão, mais robusta e polida**, com:

1. Sidebar de navegação (em vez de tabs horizontais)
2. Alternância de tema claro/escuro (persistente)
3. Tipografia mais arredondada/amigável (trocar a fonte serifada por uma sans rounded)
4. Mais profundidade de produto: filtros, sequência de dias (streak), busca, atalhos de teclado, estados vazios cuidados, e uma reorganização de informação mais rica

Esta spec é para ser entregue a um agente de codificação (Claude Code ou equivalente) construir do zero. É intencionalmente detalhada — o agente tem liberdade para ajustar detalhes de implementação, mas deve manter o modelo de dados, a arquitetura de informação e os princípios de UX descritos abaixo.

---

## 2. Stack e formato de entrega

- **Formato**: aplicação web de página única (self-contained), sem dependências de backend próprio.
- **Persistência**: os dados do usuário (tarefas, metas, progresso, preferência de tema) devem persistir entre sessões e entre dispositivos. Se o ambiente de destino for o Claude Artifacts (runtime `claude.use('artifact')` ou `claude.use('db')`), usar essa capability. Se for um ambiente genérico (deploy próprio), usar `localStorage` como fallback mínimo, mas preferencialmente uma persistência real (arquivo JSON local + pequeno backend, ou IndexedDB) já que o usuário quer acessar de celular e PC.
- **Sem frameworks pesados obrigatórios**: pode ser vanilla JS/HTML/CSS, ou React se o ambiente já suportar — decisão do agente, mas o resultado final precisa carregar rápido e funcionar offline-first sempre que possível.
- **Idioma da interface**: português do Brasil, tom direto e conversacional (nada de "Efetuar login", preferir "Entrar"; nada de labels genéricas tipo "Submit").
- **Responsivo**: precisa funcionar bem em celular (a sidebar deve colapsar para um menu inferior ou drawer em telas < 640px) e desktop.

---

## 3. Modelo de dados

Manter compatível com esta estrutura (pode expandir campos, não remover os que já existem):

```json
{
  "theme": "dark" | "light",
  "activeView": "hoje" | "cronograma" | "<areaId>",
  "areas": [
    { "id": "facul", "label": "Faculdade", "color": "#5b8def", "icon": "graduation-cap" },
    { "id": "guitarra", "label": "Guitarra", "color": "#e0954f", "icon": "music" },
    { "id": "leitura", "label": "Leitura", "color": "#8a7fd4", "icon": "book" },
    { "id": "financeiro", "label": "Financeiro", "color": "#4bae8f", "icon": "wallet", "beta": true }
  ],
  "schedule": [
    {
      "id": "s1",
      "areaId": "facul",
      "weekday": "quinta",
      "title": "Finalizar a 1ª Lista (Hidrostática)",
      "tasks": [
        { "id": "t1", "label": "Exercícios 9 e 10 — manômetro diferencial e macaco hidráulico", "done": false, "note": "" }
      ]
    }
  ],
  "goals": {
    "facul": [
      { "id": "g1", "label": "Dominar a prova de Física até quinta que vem", "done": false, "due": "2026-10-01", "priority": "alta" }
    ],
    "guitarra": [],
    "leitura": [],
    "financeiro": []
  },
  "streaks": {
    "facul": { "current": 3, "longest": 5, "lastCompletedDate": "2026-09-22" }
  }
}
```

Notas sobre o modelo:
- `areas` deixa de ser hardcoded no código — o usuário pode **criar novas áreas** (ex.: "Trabalho", "Saúde") pela interface, escolhendo nome, cor e ícone.
- `schedule` continua por dia da semana, mas cada dia pode ter **múltiplos blocos** (de áreas diferentes no mesmo dia — hoje o usuário pode ter facul de manhã e guitarra à noite).
- `goals` ganha `due` (data real, não string livre) e `priority` (alta/média/baixa) para permitir ordenação.
- `streaks` é novo: contabiliza dias seguidos em que pelo menos uma tarefa da área foi concluída, por área.

---

## 4. Arquitetura de informação e layout

### 4.1 Estrutura geral

```
┌─────────────┬──────────────────────────────────────────┐
│             │  Topbar: saudação + data + toggle tema     │
│  SIDEBAR    ├──────────────────────────────────────────┤
│             │                                            │
│  - Hoje     │              CONTEÚDO DA VIEW              │
│  - Semana   │                                            │
│  ──────     │                                            │
│  Áreas:     │                                            │
│  ● Facul    │                                            │
│  ● Guitarra │                                            │
│  ● Leitura  │                                            │
│  ● Financ.  │                                            │
│  + Nova área│                                            │
│  ──────     │                                            │
│  ⚙ Config   │                                            │
└─────────────┴──────────────────────────────────────────┘
```

### 4.2 Sidebar (novo, substitui as tabs horizontais)

- Fixa à esquerda em desktop (largura ~230–260px), colapsável para apenas ícones (~64px) com um botão de toggle no rodapé da sidebar.
- Em mobile (<640px): vira uma barra inferior fixa com os itens principais (Hoje, Semana, ícone de mais áreas) — **não** um hambúrguer escondido, pois o uso é diário e precisa ser rápido de alcançar com o polegar.
- Itens fixos no topo: **Hoje** (visão do dia) e **Semana** (o cronograma completo, equivalente à antiga aba "cronograma").
- Depois, lista dinâmica de **Áreas** (uma por linha, com uma bolinha/ícone na cor da área e um contador pequeno de pendências, ex. "Guitarra · 2").
- Botão **"+ Nova área"** ao final da lista de áreas, abre modal para criar área custom (nome, cor à escolha via color picker, ícone de uma lib de ícones leve).
- Rodapé da sidebar: acesso a **Configurações** (tema, exportar/importar dados, resetar).
- Item ativo destacado com um indicador lateral (barra vertical na cor da área) — não apenas mudança de cor de fundo genérica.

### 4.3 Topbar

- Saudação contextual por horário: "Bom dia", "Boa tarde", "Boa noite" + nome do dia por extenso.
- Toggle de tema claro/escuro no canto direito — ícone de sol/lua, transição suave de cores (não instantânea, ~200ms), sem F.O.U.C ao carregar (aplicar tema antes do primeiro paint, lendo da persistência).
- Indicador de sincronização/salvamento (mantém o padrão da v1: texto discreto tipo "salvo" que aparece e desaparece).

### 4.4 View "Hoje"

Mantém a essência da v1 mas com mais hierarquia:

1. **Cabeçalho de progresso do dia**: um anel de progresso (donut, SVG simples) mostrando % de tarefas do dia concluídas, com o número no centro. Ao lado, texto tipo "3 de 7 concluídas hoje".
2. **Streaks**: pequenos chips por área mostrando sequência atual (ex. "🔥 3 dias" em Guitarra) — só aparece se streak ≥ 2, para não poluir quando ainda não há histórico.
3. **Blocos do dia**: os blocos de `schedule` cujo `weekday` bate com hoje (pode ter mais de um, de áreas diferentes) — cada um com o nome da área, cor, título do bloco e lista de tarefas.
4. **Metas com prazo próximo**: metas de qualquer área com `due` nos próximos 7 dias, ordenadas por proximidade, com destaque visual se `due` já passou (atrasada) e prioridade alta.
5. Estado vazio (nenhum bloco pra hoje): ilustração leve/mensagem que **convida a ação** — não apenas "nada aqui", mas algo como um atalho direto "adiantar um dia da semana" que leva pra view Semana.

### 4.5 View "Semana" (equivalente à antiga "cronograma")

- Mantém a ideia de colunas por dia da semana, mas revisar o layout para não depender só de scroll horizontal em desktop — usar grid responsivo que mostra todos os 7 dias visíveis sem scroll em telas ≥ 1200px, e scroll horizontal com snap apenas em telas menores.
- Dia atual sempre com destaque visual (borda ou fundo levemente diferenciado), mas sem bloquear interação com os outros dias — o usuário quer poder adiantar.
- Cada coluna mostra todos os blocos daquele dia (pode ser de mais de uma área).
- Ação de **arrastar uma tarefa para outro dia** (drag and drop) é desejável — permite reorganizar o cronograma sem abrir modal. Se drag and drop for complexo demais para o tempo disponível, ao menos oferecer um botão rápido "mover para amanhã" em cada tarefa.
- Filtro no topo da view: chips para filtrar por área (mostrar só Facul, só Guitarra, etc.) e um toggle "esconder concluídas".

### 4.6 View de Área (Facul / Guitarra / Leitura / Financeiro / áreas custom)

- Cabeçalho da área com nome, cor, ícone grande, e um resumo (ex. "12 metas · 8 concluídas · streak de 3 dias").
- Lista de metas dessa área, com:
  - Ordenação por prioridade e depois por prazo.
  - Agrupamento visual: "Em aberto" e "Concluídas" (concluídas colapsadas por padrão, expansível).
  - Cada meta pode ter subtarefas simples (checklist dentro da meta) — opcional, mas valorizado se o agente tiver tempo: útil para metas tipo "Dominar a prova de Física" que têm várias frentes.
- Botão "+ Nova meta" abre um modal com campos: descrição, prazo (date picker), prioridade (select).
- Se a área for `beta: true` (como Financeiro), mostrar um selo discreto "beta" ao lado do título, sem ser deselegante — é uma informação, não uma desculpa.

### 4.7 Busca e atalhos

- Campo de busca acessível via atalho de teclado (`/` ou `Cmd+K` / `Ctrl+K`) que abre um command palette simples: busca por texto em tarefas e metas de todas as áreas, navega direto pro item ao selecionar.
- Atalho `n` (ou botão flutuante "+") abre rapidamente o modal de nova tarefa/meta, perguntando primeiro em qual área/dia.
- Tecla `Esc` fecha qualquer modal aberto.

---

## 5. Sistema de temas (claro/escuro)

Implementar via CSS custom properties com duas paletas completas, trocadas por um atributo em `<html data-theme="dark|light">`. Persistir a preferência escolhida (padrão: seguir `prefers-color-scheme` do sistema na primeira visita).

### Paleta escura (referência, pode refinar)
```
--bg: #14161a
--bg-elev: #1b1e24
--bg-elev-2: #21252d
--line: #2b2f38
--text: #e8e9ec
--text-dim: #9ba0ab
--text-faint: #656b78
```

### Paleta clara (nova, criar com o mesmo cuidado)
```
--bg: #faf9f7 (ou branco levemente quente, evitar branco puro #fff que cansa a vista)
--bg-elev: #ffffff
--bg-elev-2: #f2f0ec
--line: #e4e1da
--text: #1c1d20
--text-dim: #5c5f66
--text-faint: #98999e
```

As cores de área (`facul`, `guitarra`, `leitura`, `financeiro` e futuras áreas custom) devem funcionar em ambos os temas — testar contraste mínimo AA em texto sobre fundo colorido/soft-colorido nos dois modos. Pode ser necessário ter uma variante "soft" diferente para claro (mais opaca) e escuro (mais transparente).

Transição de tema: aplicar `transition: background-color .2s ease, color .2s ease` nos elementos principais para a troca não ser um flash brusco.

---

## 6. Tipografia

Trocar a fonte serifada da v1 por uma **sans-serif arredondada** (rounded), mais amigável e "fofa" sem perder legibilidade profissional. Sugestões de família (usar a que estiver disponível/importável no ambiente, nesta ordem de preferência):

1. **Quicksand** ou **Comfortaa** para títulos/números grandes (tem bastante personalidade redonda)
2. **Nunito** ou **Nunito Sans** para corpo de texto e UI (rounded mas com ótima legibilidade em tamanhos pequenos)
3. Fallback do sistema: `ui-rounded, "SF Pro Rounded", "Segoe UI", sans-serif`

Manter uma fonte monoespaçada só para elementos técnicos pequenos (datas, contadores, labels de metadado) — pode manter algo como `"JetBrains Mono"` ou `"SF Mono"`, já que rounded mono tende a ficar estranho em números.

Escala tipográfica sugerida (ajustar conforme necessidade):
- Título de página: 26–28px, peso 600
- Título de seção: 15–16px, peso 600
- Corpo/label de tarefa: 14–15px, peso 400–500
- Metadado (datas, contadores): 11–12px, mono

Espaçamento de letras neutro (não usar all-caps trackeado como padrão — a v1 já evita isso corretamente, manter esse cuidado).

---

## 7. Interações e microanimações

- Ao marcar uma tarefa como concluída: pequena animação de "check" (scale + fade, ~150ms) e, se for a última tarefa pendente do bloco/dia, uma confirmação sutil (não confete exagerado — algo discreto, como um leve highlight de borda que desaparece).
- Progresso (barras, anel) anima suavemente ao mudar de valor, não pula instantaneamente.
- Hover em cards eleva levemente (sombra sutil ou borda mais clara), sem exagero de shadow genérico.
- Estados de foco visíveis em todos os elementos interativos (acessibilidade via teclado).
- Respeitar `prefers-reduced-motion`: desativar animações não essenciais para quem tiver essa preferência ativada no sistema.

---

## 8. Funcionalidades extras a incluir (complexidade adicional)

Priorizadas por valor/esforço — implementar pelo menos os itens 1 a 4; os demais são "nice to have":

1. **Streak tracker por área** — já descrito na seção 4.4/modelo de dados.
2. **Busca / command palette** — já descrito na seção 4.7.
3. **Metas com prazo e prioridade + ordenação automática** — já descrito na seção 4.6.
4. **Criação de áreas customizadas** pelo usuário (não só as 4 iniciais).
5. **Exportar/importar dados**: botão em Configurações para baixar um JSON com todo o estado (backup manual) e reimportar depois.
6. **Modo foco**: dado um bloco/dia específico, um botão "focar" que abre um overlay minimalista mostrando só aquele bloco e suas tarefas, sem distração da sidebar — útil pra sessão de estudo.
7. **Resumo semanal**: um pequeno gráfico de barras (uma barra por dia da semana, altura = nº de tarefas concluídas) na view Semana ou Hoje, dando senso de ritmo ao longo dos últimos 7 dias.
8. **Notas por tarefa**: campo opcional de nota/comentário em cada tarefa (o campo `note` já está no modelo de dados) — expansível ao clicar, não ocupando espaço por padrão.

---

## 9. Dados de exemplo (seed inicial)

Ao rodar pela primeira vez (sem dados salvos), popular com o cronograma abaixo — é o cronograma real de física que motivou o projeto, deve continuar presente como exemplo funcional:

- **Quinta** — Facul — "Finalizar a 1ª Lista (Hidrostática)": exercícios 9–10 (manômetro diferencial, macaco hidráulico); exercícios 11–17 (Princípio de Arquimedes e empuxo)
- **Sexta** — Facul — "Iniciar a 2ª Lista (Cinemática dos Fluidos)": exercícios 1–3 (vazão volume/massa/peso); exercícios 4–5 (Equação de Bernoulli)
- **Sábado** — Facul — "Finalizar a 2ª Lista": exercícios 6–7 (sifão, tubos convergentes); exercício 9 (tubo de Pitot); exercício 10 (tubo de Venturi)
- **Domingo** — Facul — "Iniciar a 3ª Lista (Escalas Termométricas e Dilatação)": exercícios 1–4 (conversão de escalas); exercícios 5–8 (dilatação linear e volumétrica)
- **Segunda** — Facul — "Continuar a 3ª Lista (Calorimetria)": exercícios 9–16 (calor sensível, calor específico); exercícios 12, 14, 16 (equilíbrio térmico, fusão, vaporização)
- **Terça** — Facul — "Finalizar a 3ª Lista (Transferência de Calor)": exercício 17 (radiação térmica); exercícios 18–19 (condução térmica); exercício 20 (emissão em estrelas)
- **Quarta** — Facul — "Revisão geral (véspera da prova)": refazer exercícios difíceis; revisar Formulário F02; revisar Q=mcΔT e calor latente

Metas iniciais:
- Facul: "Dominar a prova de Física até quinta que vem" (prioridade alta, due = próxima quinta)
- Guitarra: "Praticar escalas 15 min por dia"
- Leitura: (vazio, estado vazio deve convidar a criar a primeira meta)
- Financeiro (beta): "Organizar gastos do mês"

---

## 10. O que NÃO fazer

- Não travar dias do cronograma por ordem sequencial — o usuário quer liberdade total pra adiantar.
- Não transformar a área Financeiro em um app financeiro completo (sem lançamentos, categorias de gasto, gráficos de saldo) — ela deve continuar como uma lista de metas simples por enquanto, claramente marcada como beta.
- Não usar all-caps trackeado como padrão tipográfico, nem eyebrows genéricos acima de todo título.
- Não usar paleta clichê (bege quente + terracota, ou preto puro + verde ácido) — usar as paletas propostas na seção 5, com liberdade para refinar tons mas mantendo a lógica de cor por área.
- Não fazer confete ou celebração exagerada ao concluir tarefas — o tom do produto é de acompanhamento sério e sereno, não gamificação barata.

---

## 11. Critérios de aceite

- [ ] Sidebar funcional, colapsável, com navegação para Hoje / Semana / cada Área / Configurações
- [ ] Tema claro e escuro, ambos com boa legibilidade e contraste, toggle persistente, sem flash ao carregar
- [ ] Fonte trocada para uma sans rounded (Quicksand/Comfortaa/Nunito ou equivalente), aplicada consistentemente
- [ ] Cronograma semanal editável, sem bloqueio de ordem, com suporte a múltiplos blocos por dia
- [ ] Metas por área com prazo e prioridade, ordenação automática
- [ ] Progresso visual (anel/barra) na view Hoje
- [ ] Pelo menos streak tracker + busca/command palette implementados, dos itens da seção 8
- [ ] Dados persistem entre sessões e entre dispositivos
- [ ] Responsivo: sidebar vira navegação inferior em mobile
- [ ] Seed de dados igual ao cronograma de física da seção 9 presente na primeira execução
