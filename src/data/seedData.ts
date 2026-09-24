import { AppState } from '../types';

export const INITIAL_STATE: AppState = {
  theme: 'dark',
  activeView: 'hoje',
  areas: [
    { id: 'facul', label: 'Faculdade', color: '#818cf8', icon: 'graduation-cap' },
    { id: 'guitarra', label: 'Guitarra', color: '#f59e0b', icon: 'music' },
    { id: 'leitura', label: 'Leitura', color: '#a855f7', icon: 'book' },
    { id: 'financeiro', label: 'Financeiro', color: '#10b981', icon: 'wallet', beta: true }
  ],
  schedule: [
    {
      id: 's_qui',
      areaId: 'facul',
      weekday: 'quinta',
      title: 'Finalizar a 1ª Lista (Hidrostática)',
      tasks: [
        {
          id: 't_qui_1',
          label: 'Exercícios 9 e 10 — manômetro diferencial e macaco hidráulico',
          done: false,
          note: 'Lembrar da relação de pressões: P1 = P2 + ρgh e força F1/A1 = F2/A2'
        },
        {
          id: 't_qui_2',
          label: 'Exercícios 11 a 17 — Princípio de Arquimedes e empuxo',
          done: false,
          note: 'Empuxo E = ρ_fluido · V_deslocado · g'
        }
      ]
    },
    {
      id: 's_sex',
      areaId: 'facul',
      weekday: 'sexta',
      title: 'Iniciar a 2ª Lista (Cinemática dos Fluidos)',
      tasks: [
        {
          id: 't_sex_1',
          label: 'Exercícios 1 a 3 — vazão volume/massa/peso',
          done: false,
          note: 'Q = A · v; vazão mássica Qm = ρ · Q'
        },
        {
          id: 't_sex_2',
          label: 'Exercícios 4 e 5 — Equação de Bernoulli',
          done: false,
          note: 'P + 1/2 ρ v² + ρ g z = constante'
        }
      ]
    },
    {
      id: 's_sab',
      areaId: 'facul',
      weekday: 'sabado',
      title: 'Finalizar a 2ª Lista',
      tasks: [
        {
          id: 't_sab_1',
          label: 'Exercícios 6 e 7 — sifão, tubos convergentes',
          done: false,
          note: 'Cuidado com a pressão negativa no topo do sifão'
        },
        {
          id: 't_sab_2',
          label: 'Exercício 9 — tubo de Pitot',
          done: false,
          note: ''
        },
        {
          id: 't_sab_3',
          label: 'Exercício 10 — tubo de Venturi',
          done: false,
          note: ''
        }
      ]
    },
    {
      id: 's_dom',
      areaId: 'facul',
      weekday: 'domingo',
      title: 'Iniciar a 3ª Lista (Escalas Termométricas e Dilatação)',
      tasks: [
        {
          id: 't_dom_1',
          label: 'Exercícios 1 a 4 — conversão de escalas',
          done: false,
          note: 'C/5 = (F-32)/9 = (K-273)/5'
        },
        {
          id: 't_dom_2',
          label: 'Exercícios 5 a 8 — dilatação linear e volumétrica',
          done: false,
          note: 'ΔL = L0 · α · ΔT e ΔV = V0 · γ · ΔT (γ ≈ 3α)'
        }
      ]
    },
    {
      id: 's_seg',
      areaId: 'facul',
      weekday: 'segunda',
      title: 'Continuar a 3ª Lista (Calorimetria)',
      tasks: [
        {
          id: 't_seg_1',
          label: 'Exercícios 9 a 16 — calor sensível e calor específico',
          done: false,
          note: 'Q = m · c · ΔT'
        },
        {
          id: 't_seg_2',
          label: 'Exercícios 12, 14 e 16 — equilíbrio térmico, fusão e vaporização',
          done: false,
          note: 'Q_latente = m · L; soma dos calores trocados = 0'
        }
      ]
    },
    {
      id: 's_ter',
      areaId: 'facul',
      weekday: 'terca',
      title: 'Finalizar a 3ª Lista (Transferência de Calor)',
      tasks: [
        {
          id: 't_ter_1',
          label: 'Exercício 17 — radiação térmica',
          done: false,
          note: 'Lei de Stefan-Boltzmann: P = ε σ A T⁴'
        },
        {
          id: 't_ter_2',
          label: 'Exercícios 18 e 19 — condução térmica',
          done: false,
          note: 'Lei de Fourier: Φ = k A (T1 - T2) / L'
        },
        {
          id: 't_ter_3',
          label: 'Exercício 20 — emissão em estrelas',
          done: false,
          note: 'Lei de Wien: λ_max · T = 2.898 × 10⁻³ m·K'
        }
      ]
    },
    {
      id: 's_qua',
      areaId: 'facul',
      weekday: 'quarta',
      title: 'Revisão geral (véspera da prova)',
      tasks: [
        {
          id: 't_qua_1',
          label: 'Refazer exercícios difíceis das listas 1 e 2',
          done: false,
          note: 'Focar nos que envolvem manômetro e vazão'
        },
        {
          id: 't_qua_2',
          label: 'Revisar Formulário F02',
          done: false,
          note: 'Memorizar convenções de sinais'
        },
        {
          id: 't_qua_3',
          label: 'Revisar Q=mcΔT e calor latente',
          done: false,
          note: 'Gráfico curva de aquecimento da água'
        }
      ]
    }
  ],
  goals: {
    facul: [
      {
        id: 'g_facul_1',
        label: 'Dominar a prova de Física até quinta que vem',
        done: false,
        due: '2026-10-01',
        priority: 'alta',
        subtasks: [
          { id: 'st_1', label: 'Revisar teoria das 3 listas', done: true },
          { id: 'st_2', label: 'Refazer questões marcadas com dúvida', done: false },
          { id: 'st_3', label: 'Memorizar formulário F02', done: false }
        ]
      }
    ],
    guitarra: [
      {
        id: 'g_guit_1',
        label: 'Praticar escalas 15 min por dia',
        done: false,
        due: '',
        priority: 'media',
        subtasks: [
          { id: 'st_g1', label: 'Escala Pentatônica nos 5 shapes', done: false },
          { id: 'st_g2', label: 'Treino de palhetada alternada com metrônomo 90bpm', done: false }
        ]
      }
    ],
    leitura: [],
    financeiro: [
      {
        id: 'g_fin_1',
        label: 'Organizar gastos do mês',
        done: false,
        due: '2026-09-30',
        priority: 'media'
      }
    ]
  },
  streaks: {
    facul: { current: 3, longest: 5, lastCompletedDate: '2026-09-22' },
    guitarra: { current: 2, longest: 4, lastCompletedDate: '2026-09-23' }
  },
  completionHistory: {
    '2026-09-19': 3,
    '2026-09-20': 4,
    '2026-09-21': 2,
    '2026-09-22': 3,
    '2026-09-23': 1
  }
};
