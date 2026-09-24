import React from 'react';
import { AppState, ScheduleBlock, Weekday } from '../types';
import { getTodayWeekday, isDueSoon, isOverdue, formatFriendlyDate } from '../utils/date';
import { DonutProgress } from '../components/DonutProgress';
import { TaskItem } from '../components/TaskItem';
import { WeeklyRhythmChart } from '../components/WeeklyRhythmChart';
import { renderAreaIcon } from '../components/NewAreaModal';
import { FadeUp, StaggerContainer, StaggerItem } from '../components/motion';
import { cn } from '../lib/utils';
import {
  Flame,
  Calendar,
  Sparkles,
  ArrowRight,
  Maximize2,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface TodayViewProps {
  state: AppState;
  onToggleTask: (taskId: string, blockId: string) => void;
  onUpdateNote: (taskId: string, blockId: string, note: string) => void;
  onMoveToTomorrow: (taskId: string, fromBlockId: string) => void;
  onMoveToDay: (taskId: string, fromBlockId: string, toWeekday: Weekday) => void;
  onDeleteTask: (taskId: string, blockId: string) => void;
  onOpenFocusMode: (block: ScheduleBlock) => void;
  onNavigate: (viewId: string) => void;
  onToggleGoal: (goalId: string, areaId: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  state,
  onToggleTask,
  onUpdateNote,
  onMoveToTomorrow,
  onMoveToDay,
  onDeleteTask,
  onOpenFocusMode,
  onNavigate,
  onToggleGoal
}) => {
  const todayWeekday = getTodayWeekday();

  // Find all schedule blocks for today
  const todayBlocks = state.schedule.filter((b) => b.weekday === todayWeekday);

  // Compute daily task progress
  let totalTasksToday = 0;
  let completedTasksToday = 0;

  todayBlocks.forEach((block) => {
    totalTasksToday += block.tasks.length;
    completedTasksToday += block.tasks.filter((t) => t.done).length;
  });

  // Streaks for areas with current >= 2
  const activeStreaks = Object.entries(state.streaks)
    .filter(([_, info]) => info.current >= 2)
    .map(([areaId, info]) => {
      const area = state.areas.find((a) => a.id === areaId);
      return {
        areaId,
        areaName: area?.label || areaId,
        color: area?.color || 'var(--accent)',
        icon: area?.icon || 'sparkles',
        current: info.current
      };
    });

  // Upcoming and overdue goals (next 7 days or overdue)
  const urgentGoals: {
    id: string;
    label: string;
    areaId: string;
    areaName: string;
    color: string;
    due?: string;
    priority: string;
    done: boolean;
    overdue: boolean;
  }[] = [];

  Object.entries(state.goals).forEach(([areaId, list]) => {
    const area = state.areas.find((a) => a.id === areaId);
    list.forEach((g) => {
      if (!g.done && g.due) {
        const overdue = isOverdue(g.due);
        const dueSoon = isDueSoon(g.due, 7);
        if (overdue || dueSoon) {
          urgentGoals.push({
            id: g.id,
            label: g.label,
            areaId,
            areaName: area?.label || 'Área',
            color: area?.color || 'var(--accent)',
            due: g.due,
            priority: g.priority,
            done: g.done,
            overdue
          });
        }
      }
    });
  });

  // Sort urgent goals: overdue first, then earlier due date, then priority
  urgentGoals.sort((a, b) => {
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;
    if (a.due && b.due) {
      return a.due.localeCompare(b.due);
    }
    return 0;
  });

  return (
    <FadeUp>
      <div className="space-y-8 max-w-5xl mx-auto pb-20">
        {/* 1. Header: Daily Progress & Streaks */}
        <div className="card-cosmic p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-6">
            <DonutProgress completed={completedTasksToday} total={totalTasksToday} size={96} strokeWidth={9} />

            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-text-dim">
                Progresso do Dia
              </span>
              <h2 className="font-title font-bold text-2xl sm:text-3xl text-text">
                {completedTasksToday} de {totalTasksToday} concluídas hoje
              </h2>
              <p className="text-sm text-text-dim mt-0.5">
                {totalTasksToday === 0
                  ? 'Sem blocos agendados para hoje'
                  : completedTasksToday === totalTasksToday
                  ? 'Órbita completa! Todas as atividades de hoje foram concluídas.'
                  : 'Mantenha o foco em suas metas do dia.'}
              </p>
            </div>
          </div>

          {/* Streaks chips (only shown if streak >= 2) */}
          {activeStreaks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/40">
              {activeStreaks.map((s) => (
                <div
                  key={s.areaId}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-bg border border-line text-sm font-mono shadow-sm"
                  title={`Sequência ativa em ${s.areaName}`}
                >
                  <Flame size={16} className="text-amber-500 fill-amber-500/20" />
                  <span className="font-title font-bold text-sm text-text">{s.current} dias</span>
                  <span className="text-text-dim text-xs">· {s.areaName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Grid: Today's Schedule + Side Panel (Urgent Goals + Rhythm) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Blocks of Today (2 Cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-title font-bold text-lg text-text flex items-center gap-2">
                <Calendar size={20} className="text-accent-plasma" />
                <span>Blocos de Hoje</span>
              </h3>
              <button
                onClick={() => onNavigate('cronograma')}
                className="text-xs font-mono text-text-dim hover:text-accent-plasma flex items-center gap-1 transition-colors"
              >
                <span>Ver semana inteira</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* If no blocks today -> Friendly Invitation State */}
            {todayBlocks.length === 0 ? (
              <div className="card-cosmic p-10 text-center space-y-4 border-dashed">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 text-accent-plasma flex items-center justify-center mx-auto">
                  <Sparkles size={32} />
                </div>
                <div className="max-w-md mx-auto">
                  <h4 className="font-title font-bold text-base text-text">
                    Nenhum bloco agendado para hoje
                  </h4>
                  <p className="text-sm text-text-dim mt-1">
                    Que tal adiantar as tarefas dos próximos dias ou revisar conteúdos das listas?
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('cronograma')}
                  className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
                >
                  <span>Explorar Cronograma da Semana</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <StaggerContainer>
                {todayBlocks.map((block) => {
                  const area = state.areas.find((a) => a.id === block.areaId);
                  const isAllDone = block.tasks.length > 0 && block.tasks.every((t) => t.done);

                  return (
                    <StaggerItem key={block.id}>
                      <div
                        className={cn(
                          'card-cosmic overflow-hidden transition-all mb-5',
                          isAllDone && 'completed-highlight border-success/40'
                        )}
                      >
                        {/* Block Header */}
                        <div
                          className="p-5 border-b border-line flex items-center justify-between"
                          style={{
                            borderLeft: `4px solid ${area?.color || 'var(--accent)'}`
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 rounded-md flex items-center justify-center text-white flex-shrink-0"
                              style={{ backgroundColor: area?.color || 'var(--accent)' }}
                            >
                              {renderAreaIcon(area?.icon || 'sparkles', 16)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono text-xs uppercase tracking-wider text-text-dim block">
                                {area?.label || 'Área'}
                              </span>
                              <h4 className="font-title font-bold text-base text-text truncate">
                                {block.title}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Deep Space Focus Mode trigger */}
                            <button
                              onClick={() => onOpenFocusMode(block)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line bg-bg text-text-dim hover:text-accent-plasma hover:border-accent transition-colors text-sm font-mono"
                              title="Abrir sessão de estudo focada"
                            >
                              <Maximize2 size={16} />
                              <span className="hidden sm:inline">Focar</span>
                            </button>
                          </div>
                        </div>

                        {/* Task List */}
                        <div className="p-4 sm:p-5 space-y-3">
                          {block.tasks.length === 0 ? (
                            <p className="text-sm text-text-faint italic py-2 text-center">
                              Nenhuma tarefa neste bloco ainda.
                            </p>
                          ) : (
                            block.tasks.map((task) => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                blockId={block.id}
                                weekday={todayWeekday}
                                accentColor={area?.color}
                                onToggle={onToggleTask}
                                onUpdateNote={onUpdateNote}
                                onMoveToTomorrow={onMoveToTomorrow}
                                onMoveToDay={onMoveToDay}
                                onDelete={onDeleteTask}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            )}
          </div>

          {/* Right Column: Urgent Goals & Weekly Rhythm */}
          <div className="space-y-6">
            {/* Urgent / Due Soon Goals */}
            <div className="card-cosmic p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="font-title font-semibold text-base text-text flex items-center gap-2">
                  <Clock size={18} className="text-accent-plasma" />
                  <span>Metas com Prazo Próximo</span>
                </h4>
                <span className="font-mono text-sm text-text-dim">
                  {urgentGoals.length}
                </span>
              </div>

              {urgentGoals.length === 0 ? (
                <div className="p-4 text-center text-sm text-text-dim bg-bg/50 rounded-xl border border-line/40">
                  Nenhuma meta com prazo nos próximos 7 dias.
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentGoals.map((goal) => (
                    <div
                      key={goal.id}
                      onClick={() => onToggleGoal(goal.id, goal.areaId)}
                      className={cn(
                        'p-4 rounded-xl border cursor-pointer transition-all',
                        goal.overdue
                          ? 'bg-danger/10 border-danger/40 hover:border-danger'
                          : 'bg-bg/80 border-line hover:border-line-strong'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 text-text-dim hover:text-accent-light flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text truncate">
                              {goal.label}
                            </p>
                            <span
                              className="font-mono text-xs block mt-0.5"
                              style={{ color: goal.color }}
                            >
                              {goal.areaName}
                            </span>
                          </div>
                        </div>

                        {/* Due badge */}
                        {goal.due && (
                          <span
                            className={cn(
                              'font-mono text-xs px-3 py-1 rounded-full flex-shrink-0',
                              goal.overdue
                                ? 'bg-danger/20 text-danger font-semibold'
                                : 'bg-accent/10 text-accent-plasma'
                            )}
                          >
                            {formatFriendlyDate(goal.due)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Rhythm Chart */}
            <WeeklyRhythmChart history={state.completionHistory} />
          </div>
        </div>
      </div>
    </FadeUp>
  );
};
