# Roadmap — Orbit

Prioridades curtas e ideias futuras, alinhadas ao estado atual do produto (tarefas + finanças + Orbit AI, modos `local` / `http`).

## Feito nesta leva

- [x] Editar categorias de tarefas (nome, ícone, cor) — paridade com finanças
- [x] Exportar / importar backup JSON (Settings; API `/api/backup` no modo http)
- [x] Saudação da Home usa o mesmo perfil das Configurações
- [x] Auth opcional no modo `local` (proxy + `requireAuth` só exigem login quando `NEXT_PUBLIC_DATA_SOURCE=http`)

## Curto prazo

1. **Recorrência de verdade** — entidade de série, editar só esta / todas, pular ocorrência, data fim (hoje a IA só expande na criação).
2. **Lixeira / soft delete** — UI para restore de tarefas (API já tem) e o mesmo para transações.
3. **Profundidade financeira** — gráficos multi-mês, contas recorrentes, metas de economia, ciclo de fatura do cartão.
4. **Lembretes** — notificação no horário da tarefa (PWA + push ou e-mail).
5. **Home mais útil** — alertas de orçamento estourado + streak além dos cards de navegação.

## Médio prazo

- Undo em lote da Orbit AI
- Rate limit compartilhado (Upstash/Redis) no deploy Vercel
- Schema com FKs e limite de tamanho da foto no perfil
- Relatório mensal gerado pela Orbit AI
- Metas semanais por categoria ligadas ao focus/streak

## Mais adiante

- PWA offline no modo local, com sync ao voltar para http
- Multi-usuário leve (só se sair do single-owner; tabelas ainda sem `userId`)

## Docs relacionadas

- Backend e auth: [`plano_implementacao_backend.md`](./plano_implementacao_backend.md)
- Env / Gemini: [`env-setup.md`](./env-setup.md)
