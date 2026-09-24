import type { FinanceCategory, Transaction } from "../domain/finance.schema";

export const DEMO_FINANCE_CATEGORIES: FinanceCategory[] = [
  {
    id: "salario",
    name: "Salário / Proventos",
    type: "income",
    color: "#10b981",
    icon: "💰"
  },
  {
    id: "freelance",
    name: "Freelance & Consultoria",
    type: "income",
    color: "#06b6d4",
    icon: "💻"
  },
  {
    id: "investimentos-inc",
    name: "Rendimentos / Dividendos",
    type: "income",
    color: "#8b5cf6",
    icon: "📈"
  },
  {
    id: "moradia",
    name: "Moradia & Contas",
    type: "expense",
    color: "#6366f1",
    icon: "🏠",
    monthlyBudgetCents: 160000
  },
  {
    id: "alimentacao",
    name: "Alimentação & Mercado",
    type: "expense",
    color: "#f59e0b",
    icon: "🍔",
    monthlyBudgetCents: 85000
  },
  {
    id: "transporte",
    name: "Transporte & Mobilidade",
    type: "expense",
    color: "#3b82f6",
    icon: "🚗",
    monthlyBudgetCents: 35000
  },
  {
    id: "lazer",
    name: "Lazer & Cultura",
    type: "expense",
    color: "#ec4899",
    icon: "🎮",
    monthlyBudgetCents: 40000
  },
  {
    id: "educacao",
    name: "Educação & Cursos",
    type: "expense",
    color: "#a855f7",
    icon: "🎓",
    monthlyBudgetCents: 30000
  },
  {
    id: "equipamentos",
    name: "Música & Equipamentos",
    type: "expense",
    color: "#e11d48",
    icon: "🎸",
    monthlyBudgetCents: 50000
  }
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-aug-1",
    description: "Salário Mensal Tech Corp",
    amountCents: 620000,
    type: "income",
    categoryId: "salario",
    date: "2026-08-05",
    paymentMethod: "transferencia",
    notes: "Depósito líquido de Agosto",
    createdAt: "2026-08-05T12:00:00.000Z",
    updatedAt: "2026-08-05T12:00:00.000Z"
  },
  {
    id: "tx-aug-2",
    description: "Aluguel e Condomínio",
    amountCents: 140000,
    type: "expense",
    categoryId: "moradia",
    date: "2026-08-10",
    paymentMethod: "boleto",
    notes: "Mês de Agosto",
    createdAt: "2026-08-10T12:00:00.000Z",
    updatedAt: "2026-08-10T12:00:00.000Z"
  },
  {
    id: "tx-aug-3",
    description: "Supermercado Mensal",
    amountCents: 49520,
    type: "expense",
    categoryId: "alimentacao",
    date: "2026-08-12",
    paymentMethod: "cartao",
    notes: "Fatura de Agosto",
    createdAt: "2026-08-12T12:00:00.000Z",
    updatedAt: "2026-08-12T12:00:00.000Z"
  },
  {
    id: "tx-aug-4",
    description: "Fone de Ouvido Estúdio",
    amountCents: 38000,
    type: "expense",
    categoryId: "equipamentos",
    date: "2026-08-18",
    paymentMethod: "cartao",
    createdAt: "2026-08-18T12:00:00.000Z",
    updatedAt: "2026-08-18T12:00:00.000Z"
  },
  {
    id: "tx-aug-5",
    description: "Mensalidade Faculdade",
    amountCents: 28000,
    type: "expense",
    categoryId: "educacao",
    date: "2026-08-08",
    paymentMethod: "boleto",
    createdAt: "2026-08-08T12:00:00.000Z",
    updatedAt: "2026-08-08T12:00:00.000Z"
  },
  {
    id: "tx-aug-6",
    description: "Combustível",
    amountCents: 14000,
    type: "expense",
    categoryId: "transporte",
    date: "2026-08-20",
    paymentMethod: "cartao",
    createdAt: "2026-08-20T12:00:00.000Z",
    updatedAt: "2026-08-20T12:00:00.000Z"
  },
  {
    id: "tx-aug-7",
    description: "Jantar Italiano",
    amountCents: 11000,
    type: "expense",
    categoryId: "lazer",
    date: "2026-08-22",
    paymentMethod: "pix",
    createdAt: "2026-08-22T12:00:00.000Z",
    updatedAt: "2026-08-22T12:00:00.000Z"
  },
  {
    id: "tx-1",
    description: "Salário Mensal Tech Corp",
    amountCents: 620000,
    type: "income",
    categoryId: "salario",
    date: "2026-09-05",
    paymentMethod: "transferencia",
    notes: "Depósito líquido mensal",
    createdAt: "2026-09-05T12:00:00.000Z",
    updatedAt: "2026-09-05T12:00:00.000Z"
  },
  {
    id: "tx-2",
    description: "Projeto Frontend Freelancer",
    amountCents: 145000,
    type: "income",
    categoryId: "freelance",
    date: "2026-09-15",
    paymentMethod: "pix",
    notes: "Primeira etapa entregue",
    createdAt: "2026-09-15T12:00:00.000Z",
    updatedAt: "2026-09-15T12:00:00.000Z"
  },
  {
    id: "tx-3",
    description: "Aluguel e Condomínio",
    amountCents: 140000,
    type: "expense",
    categoryId: "moradia",
    date: "2026-09-10",
    paymentMethod: "boleto",
    notes: "Mês de Setembro",
    createdAt: "2026-09-10T12:00:00.000Z",
    updatedAt: "2026-09-10T12:00:00.000Z"
  },
  {
    id: "tx-4",
    description: "Supermercado Mensal",
    amountCents: 54035,
    type: "expense",
    categoryId: "alimentacao",
    date: "2026-09-12",
    paymentMethod: "cartao",
    notes: "Compras do mês no cartão",
    createdAt: "2026-09-12T12:00:00.000Z",
    updatedAt: "2026-09-12T12:00:00.000Z"
  },
  {
    id: "tx-5",
    description: "Pedal de Efeito Overdrive",
    amountCents: 38000,
    type: "expense",
    categoryId: "equipamentos",
    date: "2026-09-18",
    paymentMethod: "pix",
    notes: "Pedal Boss usado em perfeito estado",
    createdAt: "2026-09-18T12:00:00.000Z",
    updatedAt: "2026-09-18T12:00:00.000Z"
  },
  {
    id: "tx-6",
    description: "Mensalidade Faculdade",
    amountCents: 28000,
    type: "expense",
    categoryId: "educacao",
    date: "2026-09-08",
    paymentMethod: "boleto",
    createdAt: "2026-09-08T12:00:00.000Z",
    updatedAt: "2026-09-08T12:00:00.000Z"
  },
  {
    id: "tx-7",
    description: "Combustível e Estacionamento",
    amountCents: 16550,
    type: "expense",
    categoryId: "transporte",
    date: "2026-09-19",
    paymentMethod: "cartao",
    notes: "Posto Shell no cartão",
    createdAt: "2026-09-19T12:00:00.000Z",
    updatedAt: "2026-09-19T12:00:00.000Z"
  },
  {
    id: "tx-8",
    description: "Cinema e Restaurante com amigos",
    amountCents: 14500,
    type: "expense",
    categoryId: "lazer",
    date: "2026-09-20",
    paymentMethod: "pix",
    createdAt: "2026-09-20T12:00:00.000Z",
    updatedAt: "2026-09-20T12:00:00.000Z"
  },
  {
    id: "tx-9",
    description: "Dividendos FIIs e Ações",
    amountCents: 21580,
    type: "income",
    categoryId: "investimentos-inc",
    date: "2026-09-16",
    paymentMethod: "transferencia",
    createdAt: "2026-09-16T12:00:00.000Z",
    updatedAt: "2026-09-16T12:00:00.000Z"
  },
  {
    id: "tx-oct-1",
    description: "Salário Previsto Tech Corp",
    amountCents: 620000,
    type: "income",
    categoryId: "salario",
    date: "2026-10-05",
    paymentMethod: "transferencia",
    notes: "Provisão salarial",
    createdAt: "2026-10-05T12:00:00.000Z",
    updatedAt: "2026-10-05T12:00:00.000Z"
  },
  {
    id: "tx-oct-2",
    description: "Aluguel e Condomínio Previsto",
    amountCents: 140000,
    type: "expense",
    categoryId: "moradia",
    date: "2026-10-10",
    paymentMethod: "boleto",
    createdAt: "2026-10-10T12:00:00.000Z",
    updatedAt: "2026-10-10T12:00:00.000Z"
  },
  {
    id: "tx-oct-3",
    description: "Mensalidade Faculdade Prevista",
    amountCents: 28000,
    type: "expense",
    categoryId: "educacao",
    date: "2026-10-08",
    paymentMethod: "boleto",
    createdAt: "2026-10-08T12:00:00.000Z",
    updatedAt: "2026-10-08T12:00:00.000Z"
  },
  {
    id: "tx-oct-4",
    description: "Assinaturas & Cloud Services",
    amountCents: 12990,
    type: "expense",
    categoryId: "lazer",
    date: "2026-10-03",
    paymentMethod: "cartao",
    notes: "Assinaturas recorrentes",
    createdAt: "2026-10-03T12:00:00.000Z",
    updatedAt: "2026-10-03T12:00:00.000Z"
  },
  {
    id: "tx-oct-5",
    description: "Supermercado Inicial",
    amountCents: 32000,
    type: "expense",
    categoryId: "alimentacao",
    date: "2026-10-06",
    paymentMethod: "cartao",
    createdAt: "2026-10-06T12:00:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z"
  }
];
