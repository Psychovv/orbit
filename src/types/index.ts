export type Weekday = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

export interface Task {
  id: string;
  label: string;
  done: boolean;
  note?: string;
  completedAt?: string; // ISO date string
}

export interface ScheduleBlock {
  id: string;
  areaId: string;
  weekday: Weekday;
  title: string;
  tasks: Task[];
}

export interface GoalSubtask {
  id: string;
  label: string;
  done: boolean;
}

export type Priority = 'alta' | 'media' | 'baixa';

export interface Goal {
  id: string;
  label: string;
  done: boolean;
  due?: string; // YYYY-MM-DD
  priority: Priority;
  subtasks?: GoalSubtask[];
  completedAt?: string;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastCompletedDate: string; // YYYY-MM-DD
}

export interface Area {
  id: string;
  label: string;
  color: string;
  icon: string;
  beta?: boolean;
}

export interface AppState {
  theme: 'dark' | 'light';
  activeView: string; // 'hoje' | 'cronograma' | 'config' | areaId
  areas: Area[];
  schedule: ScheduleBlock[];
  goals: Record<string, Goal[]>;
  streaks: Record<string, StreakInfo>;
  completionHistory: Record<string, number>; // 'YYYY-MM-DD' -> count of completed tasks
}

export interface FocusState {
  isOpen: boolean;
  blockId?: string;
  blockTitle?: string;
  areaColor?: string;
  areaName?: string;
  tasks?: Task[];
}
