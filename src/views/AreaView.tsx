import React, { useState } from 'react';
import { Area, Goal, Priority, ScheduleBlock } from '../types';
import { renderAreaIcon } from '../components/NewAreaModal';
import { formatFriendlyDate, isOverdue } from '../utils/date';
import {
  Plus,
  Flame,
  CheckCircle2,
  Circle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from '../components/motion';

interface AreaViewProps {
  area: Area;
  goals: Goal[];
  streakCurrent: number;
  schedule: ScheduleBlock[];
  onToggleGoal: (goalId: string, areaId: string) => void;
  onDeleteGoal: (goalId: string, areaId: string) => void;
  onAddSubtask: (goalId: string, areaId: string, label: string) => void;
  onToggleSubtask: (goalId: string, areaId: string, subtaskId: string) => void;
  onOpenNewGoalModal: (areaId: string) => void;
  onNavigateToWeek: () => void;
}

export const AreaView: React.FC<AreaViewProps> = ({
  area,
  goals,
  streakCurrent,
  schedule,
  onToggleGoal,
  onDeleteGoal,
  onAddSubtask,
  onToggleSubtask,
  onOpenNewGoalModal,
  onNavigateToWeek
}) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});

  // Filter and sort open vs completed goals
  const openGoals = goals.filter((g) => !g.done);
  const completedGoals = goals.filter((g) => !g.done === false);

  // Priority weights: alta = 3, media = 2, baixa = 1
  const priorityWeight = (p: Priority) => {
    if (p === 'alta') return 3;
    if (p === 'media') return 2;
    return 1;
  };

  openGoals.sort((a, b) => {
    // 1. By priority descending
    const diffPriority = priorityWeight(b.priority) - priorityWeight(a.priority);
    if (diffPriority !== 0) return diffPriority;
    // 2. By due date ascending (earlier first)
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });

  const totalGoals = goals.length;
  const completedCount = completedGoals.length;

  // Filter schedule blocks belonging to this area
  const areaScheduleBlocks = schedule.filter((b) => b.areaId === area.id);

  const handleSubtaskSubmit = (goalId: string) => {
    const val = (newSubtaskInputs[goalId] || '').trim();
    if (val) {
      onAddSubtask(goalId, area.id, val);
      setNewSubtaskInputs((prev) => ({ ...prev, [goalId]: '' }));
    }
  };

  return (
    <FadeUp>
      <div className="space-y-8 max-w-4xl mx-auto pb-24">
        {/* Area Header Card */}
        <div
          className="card-cosmic p-8 sm:p-10 relative overflow-hidden"
          style={{
            borderTop: `4px solid ${area.color}`
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
                style={{
                  backgroundColor: area.color,
                  boxShadow: `0 8px 24px ${area.color}35`
                }}
              >
                {renderAreaIcon(area.icon, 32)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-title font-bold text-3xl sm:text-4xl text-text">
                    {area.label}
                  </h2>
                  {area.beta && (
                    <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-full bg-accent/15 text-accent-plasma font-semibold border border-accent/25">
                      beta
                    </span>
                  )}
                </div>

                {/* Stats Summary */}
                <div className="flex items-center gap-4 mt-2 text-sm text-text-dim font-mono">
                  <span>{totalGoals} metas</span>
                  <span>·</span>
                  <span>{completedCount} concluídas</span>
                  {streakCurrent > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Flame size={16} />
                        {streakCurrent} dias seguidos
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => onOpenNewGoalModal(area.id)}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold self-start sm:self-auto"
            >
              <Plus size={18} />
              <span>Nova Meta</span>
            </button>
          </div>
        </div>

        {/* Goals Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-title font-bold text-lg text-text flex items-center gap-2">
              <span>Metas e Objetivos</span>
              <span className="font-mono text-sm text-text-dim">({openGoals.length} em aberto)</span>
            </h3>
          </div>

          {/* Empty State for Goals */}
          {totalGoals === 0 ? (
            <div className="card-cosmic p-10 text-center space-y-4 border-dashed">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-white"
                style={{ backgroundColor: `${area.color}30`, color: area.color }}
              >
                {renderAreaIcon(area.icon, 32)}
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-title font-bold text-lg text-text">
                  Nenhuma meta criada em {area.label}
                </h4>
                <p className="text-sm text-text-dim mt-2">
                  Defina marcos claros, prazos e prioridades para impulsionar sua evolução nesta área.
                </p>
              </div>
              <button
                onClick={() => onOpenNewGoalModal(area.id)}
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium mt-2"
              >
                <Plus size={16} />
                <span>Criar Primeira Meta</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Open Goals List */}
              <StaggerContainer>
                {openGoals.map((goal) => {
                  const overdue = isOverdue(goal.due);
                  const subtasks = goal.subtasks || [];
                  const subtasksDone = subtasks.filter((s) => s.done).length;

                  return (
                    <StaggerItem key={goal.id}>
                      <div className="card-cosmic p-5 sm:p-6 hover:border-line-strong transition-all space-y-4 mb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <button
                              onClick={() => onToggleGoal(goal.id, area.id)}
                              className="mt-0.5 text-text-dim hover:text-success transition-colors flex-shrink-0"
                              title="Marcar como concluída"
                            >
                              <Circle size={22} />
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-title font-bold text-base sm:text-lg text-text">
                                  {goal.label}
                                </h4>

                                {/* Priority badge */}
                                <span
                                  className={`font-mono text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                                    goal.priority === 'alta'
                                      ? 'bg-danger/15 text-danger border border-danger/30'
                                      : goal.priority === 'media'
                                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                      : 'bg-line text-text-dim'
                                  }`}
                                >
                                  {goal.priority}
                                </span>

                                {/* Due Date badge */}
                                {goal.due && (
                                  <span
                                    className={`font-mono text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                                      overdue
                                        ? 'bg-danger/20 text-danger font-semibold'
                                        : 'bg-bg text-text-dim border border-line'
                                    }`}
                                  >
                                    <Calendar size={14} />
                                    {formatFriendlyDate(goal.due)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => onDeleteGoal(goal.id, area.id)}
                            className="p-2 rounded-lg text-text-faint hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Excluir meta"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Checklist of Subtasks inside Goal */}
                        <div className="pl-9 pt-2 space-y-3 border-t border-line/40">
                          {subtasks.length > 0 && (
                            <div className="flex items-center justify-between text-xs font-mono text-text-dim mb-2">
                              <span>
                                Subtarefas ({subtasksDone}/{subtasks.length})
                              </span>
                              <span>{Math.round((subtasksDone / subtasks.length) * 100)}%</span>
                            </div>
                          )}

                          <div className="space-y-2">
                            {subtasks.map((st) => (
                              <div
                                key={st.id}
                                onClick={() => onToggleSubtask(goal.id, area.id, st.id)}
                                className="flex items-center gap-3 text-sm cursor-pointer select-none group"
                              >
                                <input
                                  type="checkbox"
                                  checked={st.done}
                                  onChange={() => {}}
                                  className="task-checkbox"
                                  style={{ width: '18px', height: '18px', '--accent': area.color } as React.CSSProperties}
                                />
                                <span
                                  className={
                                    st.done
                                      ? 'line-through text-text-faint'
                                      : 'text-text group-hover:text-accent-plasma'
                                  }
                                >
                                  {st.label}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Add new subtask input */}
                          <div className="flex items-center gap-3 pt-2">
                            <input
                              type="text"
                              value={newSubtaskInputs[goal.id] || ''}
                              onChange={(e) =>
                                setNewSubtaskInputs((prev) => ({
                                  ...prev,
                                  [goal.id]: e.target.value
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSubtaskSubmit(goal.id);
                                }
                              }}
                              placeholder="+ Adicionar etapa ou subtarefa..."
                              className="bg-bg/80 border border-line rounded-lg px-3 py-2 text-sm text-text placeholder-text-faint focus:outline-none focus:border-accent-light w-full max-w-sm"
                            />
                            {(newSubtaskInputs[goal.id] || '').trim() && (
                              <button
                                type="button"
                                onClick={() => handleSubtaskSubmit(goal.id)}
                                className="px-3 py-2 rounded-lg bg-bg-elev-2 text-sm font-mono text-text-dim hover:text-text border border-line"
                              >
                                Adicionar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>

              {/* Completed Goals Accordion */}
              {completedGoals.length > 0 && (
                <div className="pt-4">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 text-sm font-mono text-text-dim hover:text-text transition-colors p-2"
                  >
                    {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>Metas Concluídas ({completedGoals.length})</span>
                  </button>

                  {showCompleted && (
                    <div className="space-y-3 mt-3">
                      <StaggerContainer>
                        {completedGoals.map((goal) => (
                          <StaggerItem key={goal.id}>
                            <div className="card-cosmic p-4 opacity-60 flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => onToggleGoal(goal.id, area.id)}
                                  className="text-success"
                                  title="Reabrir meta"
                                >
                                  <CheckCircle2 size={20} />
                                </button>
                                <span className="text-sm line-through text-text-faint">
                                  {goal.label}
                                </span>
                              </div>
                              <button
                                onClick={() => onDeleteGoal(goal.id, area.id)}
                                className="text-text-faint hover:text-danger p-2"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </StaggerItem>
                        ))}
                      </StaggerContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Area Schedule Blocks overview */}
        {areaScheduleBlocks.length > 0 && (
          <div className="card-cosmic p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-title font-semibold text-base text-text flex items-center gap-2">
                <Calendar size={18} className="text-accent-plasma" />
                <span>Presença no Cronograma Semanal</span>
              </h4>
              <button
                onClick={onNavigateToWeek}
                className="text-sm font-mono text-text-dim hover:text-accent-plasma"
              >
                Abrir semana completa
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {areaScheduleBlocks.map((block) => (
                <div
                  key={block.id}
                  className="p-4 rounded-xl bg-bg/60 border border-line text-sm"
                >
                  <span className="font-mono text-xs uppercase text-text-dim block capitalize">
                    {block.weekday}
                  </span>
                  <p className="font-medium text-text mt-1 truncate">{block.title}</p>
                  <span className="font-mono text-xs text-text-faint mt-1.5 block">
                    {block.tasks.filter((t) => t.done).length}/{block.tasks.length} tarefas feitas
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FadeUp>
  );
};
