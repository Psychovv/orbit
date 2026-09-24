# 🪐 Orbit — Hub Pessoal Cósmico

**Orbit** é um aplicativo web de organização pessoal e planejamento financeiro concebido sob uma temática espacial moderna, elegante e fluida, com paleta de destaque em `#844DFE` e suporte integrado a tema claro e tema escuro.

---

## 🌌 Principais Funcionalidades

### 1. 📅 Visão Semanal de Tarefas
* **Estrutura Central de Segunda a Domingo**: 7 colunas generosas exibindo o cronograma de missões e tarefas de cada dia.
* **Scroll Horizontal Fluido**: Navegação responsiva e confortável entre os dias da semana.
* **Categorias Personalizáveis**: Organização de tarefas através de etiquetas discretas (ex: *Guitarra*, *Estudos*, *Faculdade*, *Exercícios*, *Projetos*, *Rotina*).
* **Gestão de Status**: Marcação nítida de tarefas concluídas com celebração cósmica e sem poluição visual no topo.

### 2. 🪐 Cofre Financeiro & Orçamento
* **Métricas Principais**: Saldo operacional, total de receitas, total de despesas e taxa de economia mensal.
* **Planejamento por Categoria**: Teto de gastos mensal com barras de progresso e alertas automáticos de limite.
* **Extrato e Fluxo de Recursos**: Tabela com filtros rápidos (Todas, Receitas, Despesas), busca instantânea por descrição e suporte a métodos de pagamento (PIX, Cartão, Boleto, etc.).

### 3. ✨ Experiência Visual & Microinterações
* **Magic UI & Motion**: Background cósmico com estrelas cintilantes em canvas, meteoros ocasionais e transições fluídas entre módulos.
* **Design System**: Tipografia moderna, cards em glassmorphism com bordas sutis e respiro visual generoso.
* **Persistência Local**: Dados armazenados localmente no navegador (`localStorage`) com opção de restauração rápida.

---

## 🛠️ Tecnologias Utilizadas

* **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
* **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
* **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
* **Animações**: [Motion](https://motion.dev/) (antigo Framer Motion)
* **Ícones**: [Lucide React](https://lucide.dev/)
* **Temas**: [next-themes](https://github.com/pacocoursey/next-themes) (Dark & Light)
* **Efeitos**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 🚀 Como Executar

Instale as dependências com o `pnpm`:

```bash
pnpm install
```

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Para gerar a versão de produção:

```bash
pnpm build
pnpm start
```
