import type { DayOfWeek } from "@/shared/lib/date-utils";

export interface WeekDayInfo {
  key: DayOfWeek;
  name: string;
  shortName: string;
  description: string;
}

export const WEEK_DAYS: WeekDayInfo[] = [
  { key: "seg", name: "Segunda-feira", shortName: "SEG", description: "Início de órbita" },
  { key: "ter", name: "Terça-feira", shortName: "TER", description: "Aceleração" },
  { key: "qua", name: "Quarta-feira", shortName: "QUA", description: "Ponto médio orbital" },
  { key: "qui", name: "Quinta-feira", shortName: "QUI", description: "Consolidação" },
  { key: "sex", name: "Sexta-feira", shortName: "SEX", description: "Finalização de missões" },
  { key: "sab", name: "Sábado", shortName: "SÁB", description: "Exploração & Lazer" },
  { key: "dom", name: "Domingo", shortName: "DOM", description: "Recarga & Planejamento" },
];
