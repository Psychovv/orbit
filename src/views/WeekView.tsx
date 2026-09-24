import React, { useState } from 'react';
import { AppState, Weekday, ScheduleBlock } from '../types';
import { WEEKDAY_LABELS, WEEKDAY_SHORT, getTodayWeekday } from '../utils/date';
import { TaskItem } from '../components/TaskItem';
import {
  Filter,
  Eye,
  EyeOff,
  Plus,
  Maximize2
} from 'lucide-react';

interface WeekViewProps {
  state: AppState;
  onToggleTask: (taskId: string, blockId: string) => void;
  onUpdateNote: (taskId: string, blockId: string, note: string) => void;
  onMoveToTomorrow: (taskId: string, fromBlockId: string) => void;
  onMoveToDay: (taskId: string, fromBlockId: string, toWeekday: Weekday) => void;
  onDeleteTask: (taskId: string, blockId: string) => void;
  onOpenFocusMode: (block: ScheduleBlock) => void;
  onOpenQuickCreate: (defaultWeekday?: Weekday) => void;
  onDropTaskToDay: (taskId: string, fromBlockId: string, toWeekday: Weekday) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  state,
  onToggleTask,
  onUpdateNote,
  onMoveToTomorrow,
  onMoveToDay,
  onDeleteTask,
  onOpenFocusMode,
  onOpenQuickCreate,
  onDropTaskToDay
}) => {
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [draggedOverDay, setDraggedOverDay] = useState<Weekday | null>(null);

  const todayWeekday = getTodayWeekday();

  // Order of weekdays starting from Segunda to Domingo (or standard display order)
  const orderedWeekdays: Weekday[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

  const handleDragStart = (e: React.DragEvent, taskId: string, blockId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, blockId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, weekday: Weekday) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverDay !== weekday) {
      setDraggedOverDay(weekday);
    }
  };

  const handleDragLeave = (_: React.DragEvent, weekday: Weekday) => {
    if (draggedOverDay === weekday) {
      setDraggedOverDay(null);
    }
  };

  const handleDrop = (e: React.DragEvent, toWeekday: Weekday) => {
    e.preventDefault();
    setDraggedOverDay(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.taskId && data.blockId) {
        onDropTaskToDay(data.taskId, data.blockId, toWeekday);
      }
    } catch (err) {
      console.error('Failed to parse drag data', err);
    }
  };

  return (
    <div className="space-y-5 pb-20 max-w-[1600px] mx-auto">
      {/* Filters & Actions Bar */}
      <div className="card-cosmic p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Area Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-text-dim flex items-center gap-1.5 mr-1">
            <Filter size={13} />
            Filtrar:
          </span>

          <button
            onClick={() => setSelectedAreaFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-title font-medium transition-all ${
              selectedAreaFilter === null
                ? 'bg-accent text-white shadow-sm'
                : 'bg-bg border border-line text-text-dim hover:text-text'
            }`}
          >
            Todas as Áreas
          </button>

          {state.areas.map((area) => {
            const isSelected = selectedAreaFilter === area.id;
            return (
              <button
                key={area.id}
                onClick={() => setSelectedAreaFilter(isSelected ? null : area.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-title font-medium transition-all ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-bg border border-line text-text-dim hover:text-text'
                }`}
                style={{
                  backgroundColor: isSelected ? area.color : undefined
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#ffffff' : area.color }}
                />
                <span>{area.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hide Completed Toggle & Quick Add */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors ${
              hideCompleted
                ? 'bg-accent/15 border-accent text-accent-plasma'
                : 'bg-bg border-line text-text-dim hover:text-text'
            }`}
            title="Ocultar tarefas já concluídas"
          >
            {hideCompleted ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{hideCompleted ? 'Ocultando feitas' : 'Mostrar feitas'}</span>
          </button>

          <button
            onClick={() => onOpenQuickCreate()}
            className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium"
          >
            <Plus size={14} />
            <span>Novo Bloco/Tarefa</span>
          </button>
        </div>
      </div>

      {/* Week Grid: 7 Responsive Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 items-start">
        {orderedWeekdays.map((weekday) => {
          const isToday = weekday === todayWeekday;
          const isDraggedOver = draggedOverDay === weekday;

          // Find blocks for this weekday, filtered by area
          const blocks = state.schedule.filter((b) => {
            if (b.weekday !== weekday) return false;
            if (selectedAreaFilter && b.areaId !== selectedAreaFilter) return false;
            return true;
          });

          // Calculate counts for day
          let totalTasks = 0;
          let completedTasks = 0;
          blocks.forEach((b) => {
            totalTasks += b.tasks.length;
            completedTasks += b.tasks.filter((t) => t.done).length;
          });

          return (
            <div
              key={weekday}
              onDragOver={(e) => handleDragOver(e, weekday)}
              onDragLeave={(e) => handleDragLeave(e, weekday)}
              onDrop={(e) => handleDrop(e, weekday)}
              className={`rounded-2xl border transition-all duration-200 flex flex-col min-h-[520px] ${
                isToday
                  ? 'bg-bg-elev border-accent/60 shadow-[0_0_20px_rgba(168,85,247,0.12)]'
                  : isDraggedOver
                  ? 'bg-accent/10 border-accent border-dashed ring-2 ring-accent'
                  : 'bg-bg-elev/70 border-line hover:border-line-strong'
              }`}
            >
              {/* Day Column Header */}
              <div
                className={`p-3.5 border-b flex items-center justify-between rounded-t-2xl ${
                  isToday
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-line/60 bg-bg-elev-2/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-title font-bold text-sm ${
                        isToday ? 'text-accent-plasma' : 'text-text'
                      }`}
                    >
                      {WEEKDAY_SHORT[weekday]}
                    </span>
                    {isToday && (
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-accent text-white font-semibold shadow-xs">
                        Hoje
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-text-dim block capitalize">
                    {WEEKDAY_LABELS[weekday]}
                  </span>
                </div>

                {/* Counter */}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-text-dim">
                    {completedTasks}/{totalTasks}
                  </span>
                  <button
                    onClick={() => onOpenQuickCreate(weekday)}
                    className="p-1 rounded-lg text-text-dim hover:text-text hover:bg-bg-elev transition-colors"
                    title={`Adicionar item na ${WEEKDAY_LABELS[weekday]}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Day Blocks List */}
              <div className="p-2 space-y-3 flex-1 overflow-y-auto">
                {blocks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-text-faint font-mono">
                    Sem tarefas agendadas
                  </div>
                ) : (
                  blocks.map((block) => {
                    const area = state.areas.find((a) => a.id === block.areaId);

                    const visibleTasks = hideCompleted
                      ? block.tasks.filter((t) => !t.done)
                      : block.tasks;

                    if (hideCompleted && visibleTasks.length === 0) {
                      return null;
                    }

                    return (
                      <div
                        key={block.id}
                        className="rounded-xl border border-line bg-bg/60 p-2.5 space-y-2 hover:border-line-strong transition-all"
                        style={{
                          borderLeftWidth: '3px',
                          borderLeftColor: area?.color || 'var(--accent)'
                        }}
                      >
                        {/* Block Title & Area tag */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="min-w-0">
                            <span
                              className="font-mono text-[9px] uppercase font-semibold block truncate"
                              style={{ color: area?.color }}
                            >
                              {area?.label}
                            </span>
                            <h5 className="font-title font-bold text-xs text-text truncate">
                              {block.title}
                            </h5>
                          </div>

                          <button
                            onClick={() => onOpenFocusMode(block)}
                            className="p-1 rounded-md text-text-dim hover:text-accent-plasma hover:bg-bg-elev transition-colors"
                            title="Modo Foco neste bloco"
                          >
                            <Maximize2 size={12} />
                          </button>
                        </div>

                        {/* Tasks in Block */}
                        <div className="space-y-1.5">
                          {visibleTasks.map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              blockId={block.id}
                              weekday={weekday}
                              accentColor={area?.color}
                              onToggle={onToggleTask}
                              onUpdateNote={onUpdateNote}
                              onMoveToTomorrow={onMoveToTomorrow}
                              onMoveToDay={onMoveToDay}
                              onDelete={onDeleteTask}
                              isDraggable={true}
                              onDragStart={handleDragStart}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
