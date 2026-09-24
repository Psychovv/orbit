import type { Task, TaskCategory } from "../domain/task.schema";

export const DEMO_TASK_CATEGORIES: TaskCategory[] = [
  {
    id: "guitarra",
    name: "Guitarra",
    color: "#844DFE",
    icon: "🎸"
  },
  {
    id: "estudos",
    name: "Estudos",
    color: "#3b82f6",
    icon: "📚"
  },
  {
    id: "faculdade",
    name: "Faculdade",
    color: "#6366f1",
    icon: "🎓"
  },
  {
    id: "exercicios",
    name: "Exercícios",
    color: "#f59e0b",
    icon: "⚡"
  },
  {
    id: "projetos",
    name: "Projetos",
    color: "#06b6d4",
    icon: "🚀"
  },
  {
    id: "rotina",
    name: "Rotina",
    color: "#10b981",
    icon: "🌿"
  }
];

export const DEMO_TASKS: Task[] = [
  {
    id: "task-prev-1",
    title: "Setup inicial do ambiente e repositório Git",
    description: "Configuração do Next.js, Tailwind v4 e estrutura do projeto",
    date: "2026-09-16",
    time: "10:00",
    categoryId: "projetos",
    priority: "alta",
    completedAt: "2026-09-16T12:00:00.000Z",
    createdAt: "2026-09-16T10:00:00Z",
    updatedAt: "2026-09-16T10:00:00Z"
  },
  {
    id: "task-prev-2",
    title: "Apresentação do seminário de Banco de Dados",
    description: "Modelagem relacional e queries analíticas avançadas",
    date: "2026-09-18",
    time: "14:00",
    categoryId: "faculdade",
    priority: "alta",
    completedAt: "2026-09-18T12:00:00.000Z",
    createdAt: "2026-09-18T14:00:00Z",
    updatedAt: "2026-09-18T14:00:00Z"
  },
  {
    id: "task-1",
    title: "Treinar escalas pentatônicas e sweep picking",
    description: "45 minutos com metrônomo a 120bpm focado em precisão",
    date: "2026-09-21",
    time: "19:00",
    categoryId: "guitarra",
    priority: "alta",
    completedAt: "2026-09-21T12:00:00.000Z",
    createdAt: "2026-09-21T10:00:00Z",
    updatedAt: "2026-09-21T10:00:00Z"
  },
  {
    id: "task-2",
    title: "Leitura do artigo de Inteligência Artificial",
    description: "Capítulo 4 sobre redes neurais e arquitetura transformers",
    date: "2026-09-21",
    time: "14:30",
    categoryId: "faculdade",
    priority: "media",
    completedAt: "2026-09-21T12:00:00.000Z",
    createdAt: "2026-09-21T10:00:00Z",
    updatedAt: "2026-09-21T10:00:00Z"
  },
  {
    id: "task-3",
    title: "Treino Upper Body (Peito e Costas)",
    description: "Focar em progressão de carga e descanso adequado",
    date: "2026-09-21",
    time: "07:30",
    categoryId: "exercicios",
    priority: "alta",
    completedAt: "2026-09-21T12:00:00.000Z",
    createdAt: "2026-09-21T10:00:00Z",
    updatedAt: "2026-09-21T10:00:00Z"
  },
  {
    id: "task-4",
    title: "Estudo de TypeScript avançado e Generics",
    description: "Resolver 5 exercícios no Type-Challenges",
    date: "2026-09-22",
    time: "20:00",
    categoryId: "estudos",
    priority: "alta",
    completedAt: "2026-09-22T12:00:00.000Z",
    createdAt: "2026-09-22T10:00:00Z",
    updatedAt: "2026-09-22T10:00:00Z"
  },
  {
    id: "task-5",
    title: "Tirar solo de 'Comfortably Numb'",
    description: "Segundo solo completo, treinar bends de 1.5 tom",
    date: "2026-09-22",
    time: "18:30",
    categoryId: "guitarra",
    priority: "media",
    completedAt: null,
    createdAt: "2026-09-22T10:00:00Z",
    updatedAt: "2026-09-22T10:00:00Z"
  },
  {
    id: "task-6",
    title: "Entrega do trabalho de Sistemas Operacionais",
    description: "Submeter relatório e código compilado no portal",
    date: "2026-09-23",
    time: "23:59",
    categoryId: "faculdade",
    priority: "alta",
    completedAt: null,
    createdAt: "2026-09-23T10:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z"
  },
  {
    id: "task-7",
    title: "Corrida intervalada 5km",
    description: "Tiros de 400m na esteira ou parque",
    date: "2026-09-23",
    time: "07:00",
    categoryId: "exercicios",
    priority: "media",
    completedAt: null,
    createdAt: "2026-09-23T10:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z"
  },
  {
    id: "task-8",
    title: "Prototipar nova feature do Orbit",
    description: "Modelagem das tabelas do painel financeiro",
    date: "2026-09-24",
    time: "21:00",
    categoryId: "projetos",
    priority: "alta",
    completedAt: null,
    createdAt: "2026-09-23T10:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z"
  },
  {
    id: "task-9",
    title: "Revisão dos acordes com nona e décima primeira",
    description: "Harmonia funcional no braço da guitarra",
    date: "2026-09-24",
    time: "19:30",
    categoryId: "guitarra",
    priority: "baixa",
    completedAt: null,
    createdAt: "2026-09-23T10:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z"
  },
  {
    id: "task-10",
    title: "Revisão semanal de matéria e resumos",
    description: "Organizar flashcards no Anki",
    date: "2026-09-25",
    time: "16:00",
    categoryId: "estudos",
    priority: "media",
    completedAt: null,
    createdAt: "2026-09-23T10:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z"
  },
  {
    id: "task-11",
    title: "Troca de cordas da guitarra e hidratação da escala",
    description: "Encordoamento 0.010 Ernie Ball",
    date: "2026-09-26",
    time: "11:00",
    categoryId: "guitarra",
    priority: "media",
    completedAt: null,
    createdAt: "2026-09-23T10:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z"
  },
  {
    id: "task-12",
    title: "Organização geral do quarto e mesa de estudos",
    description: "Limpar setup e cabos",
    date: "2026-09-27",
    time: "15:00",
    categoryId: "rotina",
    priority: "baixa",
    completedAt: null,
    createdAt: "2026-09-23T10:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z"
  },
  {
    id: "task-next-1",
    title: "Gravar demo do solo da música nova",
    description: "Gravação multitrack com Reaper e Neural DSP",
    date: "2026-09-29",
    time: "19:00",
    categoryId: "guitarra",
    priority: "media",
    completedAt: null,
    createdAt: "2026-09-23T10:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z"
  },
  {
    id: "task-next-2",
    title: "Entrega do Sprint Review do projeto Orbit",
    description: "Apresentação do calendário interativo e fluxo semanal",
    date: "2026-10-01",
    time: "16:00",
    categoryId: "projetos",
    priority: "alta",
    completedAt: null,
    createdAt: "2026-09-23T10:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z"
  }
];
