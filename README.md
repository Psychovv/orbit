# 🌌 Orbit — Personal Life OS & Study Planner

> **Orbit** é um web app pessoal de planejamento de uso diário construído com foco em fluidez, acompanhamento sério e sereno, e estética cósmica profunda inspirada em quasares.

---

## ✨ Destaques e Funcionalidades

### 1. 🪐 Identidade & Tema Cósmico
- **Logo Quasar Minimalista**: Vetor SVG exclusivo representando um quasar em escala reduzida — núcleo luminoso de energia estelar, anel de acreção orbital inclinado e feixes de jatos relativísticos.
- **Tema Roxo Espacial (Deep Space)**:
  - **Modo Escuro**: Paleta de espaço profundo com nuances nebulosas (`#0c0a18`, `#151128`, acentos violeta/plasma `#9333ea`, `#c084fc`).
  - **Modo Claro**: Variante starlight suave e celestial sem ofuscar a visão.
  - Alternância suave (~200ms) sem flash de carregamento (F.O.U.C) antes do primeiro paint.
- **Tipografia Arredondada (Rounded Sans)**: Quicksand para títulos, Nunito para corpo e JetBrains Mono para metadados técnicos.

### 2. 📅 Visão "Hoje"
- **Anel de Progresso Diário (Donut SVG)**: Cálculo dinâmico em tempo real de tarefas concluídas hoje.
- **Streak Tracker por Área**: Mostra sequências ativas (ex: 🔥 3 dias em Faculdade) para consistência sem gamificação invasiva.
- **Blocos do Dia**: Lista de blocos e tarefas correspondentes ao dia da semana atual com checkboxes animadas e notas expansíveis.
- **Metas Urgentes**: Radar automático de metas com prazo nos próximos 7 dias ou atrasadas com badges contextuais.
- **Gráfico de Ritmo Semanal**: Histórico visual dos últimos 7 dias de atividades concluídas.

### 3. 🗓️ Visão "Semana" (Cronograma)
- **Grid Responsivo de 7 Dias**: Visualização completa de Segunda a Domingo sem exigir scroll forçado em telas desktop (≥ 1200px) e com visualização fluida em telas menores.
- **Destaque do Dia Atual**: Realce estelar na coluna de hoje sem bloquear interação com os outros dias.
- **Filtros por Área**: Chips no topo para filtrar Facul, Guitarra, Leitura, Finanças ou áreas customizadas.
- **Mover Tarefas / Drag & Drop**: Suporte nativo para arrastar tarefas entre dias e botão rápido "Mover para amanhã".

### 4. 🎯 Visão de Áreas (Faculdade, Guitarra, Leitura, Financeiro Beta & Áreas Customizadas)
- Cabeçalho dinâmico com resumo (`X metas · Y concluídas · streak de Z dias`).
- Selo discreto `beta` para a área Financeira conforme a especificação.
- Metas com **prioridade** (alta/média/baixa) e **prazo**, com ordenação inteligente.
- **Subtarefas / Checklist interno**: Cada meta pode conter checklist de etapas com progresso individual.
- **Criação de Áreas Customizadas**: O usuário pode criar novas áreas definindo nome, paleta estelar e ícones.

### 5. 🚀 Modo Foco Cósmico ("Deep Space Focus")
- Sessão de estudo imersiva e sem distrações (sem sidebar).
- **Gerador de Ruído Espacial (Web Audio API)**: Sintetiza áudio de ruído marrom cósmico e ressonância celestial diretamente no navegador em tempo real (100% offline, zero dependência de arquivos de áudio externos) com controle de volume.
- **Temporizador Pomodoro**: Modos rápidos de 15, 25, 45 e 60 minutos com controles de pausar/reiniciar.
- Checklist de tarefas do bloco marcáveis diretamente no overlay.

### 6. 🔍 Command Palette & Atalhos de Teclado
- `Ctrl + K` ou `/`: Abre o Command Palette para busca instantânea em tarefas, metas e navegação direta.
- `n`: Abre o modal rápido para criar nova tarefa no cronograma ou nova meta.
- `Esc`: Fecha qualquer modal ativo ou overlay de foco.

### 7. 💾 Persistência & Backup
- **Persistência Dupla**: `localStorage` síncrono + `IndexedDB` em segundo plano para máxima retenção de dados.
- **Backup Manual JSON**: Exportação e importação completa do estado com 1 clique nas Configurações.
- **Reset de Dados**: Opção segura para retornar ao cronograma de física original da especificação.

---

## 🛠️ Tecnologias

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS v4** + CSS Custom Properties
- **Lucide Icons**
- **Web Audio API** para síntese sonora do Modo Foco

---

## 🏃 Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Pré-visualizar build de produção
npm run preview
```
