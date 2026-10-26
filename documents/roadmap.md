# Roadmap — Orbit

Prioridades alinhadas ao estado atual (tarefas, finanças, hábitos, Orbit AI, Meu Pluggy).

## Feito recentemente

- [x] Hábitos com streak, matriz semanal e backup
- [x] Open Finance (Meu Pluggy): conexões, sync e saldos ao vivo
- [x] CI em jobs paralelos (lint / typecheck / test)
- [x] Alertas no hub: teto de orçamento e streak de hábitos em risco

## Curto prazo

1. **Recorrência de verdade** — série de tarefas, editar só esta / todas, pular ocorrência, data fim.
2. **Lixeira** — UI de restore (API/hooks já existem) para tarefas e lançamentos.
3. **Heatmap anual de hábitos** — visão estilo GitHub contribution graph.
4. **Lembretes** — notificação no horário da tarefa (PWA + push ou e-mail).
5. **Profundidade financeira** — gráficos multi-mês, contas recorrentes, metas de economia.

## Médio prazo

- Undo em lote da Orbit AI
- Rate limit compartilhado (Upstash/Redis) no deploy Vercel
- Limite de tamanho da foto no perfil
- Relatório mensal gerado pela Orbit AI
- Dividir `orbit-sidebar.tsx` em seções menores

## Mais adiante

- PWA offline no modo local, com sync ao voltar para http
- Multi-usuário leve (só se sair do single-owner)

## Docs relacionadas

- Env / Gemini: [`env-setup.md`](./env-setup.md)
