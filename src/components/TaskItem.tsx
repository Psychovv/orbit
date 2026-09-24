import React, { useState } from 'react';
import { Task, Weekday } from '../types';
import { WEEKDAYS, WEEKDAY_SHORT } from '../utils/date';
import {
  StickyNote,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ArrowRight,
  Trash2,
  Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TaskItemProps {
  task: Task;
  blockId: string;
  weekday: Weekday;
  accentColor?: string;
  onToggle: (taskId: string, blockId: string) => void;
  onUpdateNote: (taskId: string, blockId: string, note: string) => void;
  onMoveToTomorrow: (taskId: string, fromBlockId: string) => void;
  onMoveToDay?: (taskId: string, fromBlockId: string, toWeekday: Weekday) => void;
  onDelete: (taskId: string, blockId: string) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, taskId: string, blockId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  blockId,
  weekday,
  accentColor = 'var(--accent)',
  onToggle,
  onUpdateNote,
  onMoveToTomorrow,
  onMoveToDay,
  onDelete,
  isDraggable = true,
  onDragStart
}) => {
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteValue, setNoteValue] = useState(task.note || '');
  const [showMenu, setShowMenu] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const handleNoteBlur = () => {
    if (noteValue !== task.note) {
      onUpdateNote(task.id, blockId, noteValue);
    }
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id, blockId)}
      className={cn(
        "group relative rounded-xl border transition-all duration-200",
        task.done
          ? "bg-bg-elev/40 border-line/50 opacity-70"
          : "bg-bg-elev/80 border-line hover:border-line-strong hover:bg-bg-elev"
      )}
    >
      <div className="flex items-start gap-3.5 p-3.5 select-none">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id, blockId)}
          className="task-checkbox mt-0.5"
          style={{ '--accent': accentColor } as React.CSSProperties}
          aria-label={task.label}
        />

        {/* Task Label & Info */}
        <div className="flex-1 min-w-0">
          <p
            onClick={() => onToggle(task.id, blockId)}
            className={cn(
              "text-base cursor-pointer transition-all select-text font-medium leading-relaxed",
              task.done
                ? "line-through text-text-faint"
                : "text-text hover:text-accent-light"
            )}
          >
            {task.label}
          </p>

          {/* Note Preview if closed */}
          {task.note && !isNoteOpen && (
            <div
              onClick={() => setIsNoteOpen(true)}
              className="mt-1 flex items-center gap-1.5 text-xs text-text-dim hover:text-text cursor-pointer transition-colors bg-bg/50 px-2.5 py-1.5 rounded-md border border-line/40 w-fit"
            >
              <StickyNote size={14} className="text-accent-plasma flex-shrink-0" />
              <span className="truncate max-w-[360px] font-mono text-xs">{task.note}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {/* Note toggle button */}
          <button
            type="button"
            onClick={() => setIsNoteOpen(!isNoteOpen)}
            className={cn(
              "p-2 rounded-lg text-text-dim hover:text-text hover:bg-bg-elev-2 transition-colors",
              isNoteOpen || task.note ? "text-accent-light" : ""
            )}
            title={isNoteOpen ? 'Ocultar nota' : 'Adicionar/ver nota'}
          >
            <StickyNote size={16} />
          </button>

          {/* Quick "Move to tomorrow" button */}
          <button
            type="button"
            onClick={() => onMoveToTomorrow(task.id, blockId)}
            className="p-2 rounded-lg text-text-dim hover:text-accent-light hover:bg-bg-elev-2 transition-colors"
            title="Mover para amanhã"
          >
            <ArrowRight size={16} />
          </button>

          {/* More actions menu toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-text-dim hover:text-text hover:bg-bg-elev-2 transition-colors"
              title="Mais ações"
            >
              <MoreVertical size={16} />
            </button>

            {/* Context Dropdown */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => {
                    setShowMenu(false);
                    setShowDayPicker(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-line bg-bg-elev p-1.5 shadow-lg z-30 font-body text-sm">
                  <button
                    onClick={() => {
                      onMoveToTomorrow(task.id, blockId);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-text hover:bg-bg-elev-2 hover:text-accent-light transition-colors text-sm"
                  >
                    <ArrowRight size={16} />
                    <span>Mover p/ amanhã</span>
                  </button>

                  <button
                    onClick={() => setShowDayPicker(!showDayPicker)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-text hover:bg-bg-elev-2 hover:text-accent-light transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>Mover p/ dia...</span>
                    </div>
                    {showDayPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Day Picker sub-items */}
                  {showDayPicker && onMoveToDay && (
                    <div className="grid grid-cols-4 gap-1 p-1 bg-bg-elev-2 rounded-lg my-1">
                      {WEEKDAYS.map((w) => (
                        <button
                          key={w}
                          disabled={w === weekday}
                          onClick={() => {
                            onMoveToDay(task.id, blockId, w);
                            setShowMenu(false);
                            setShowDayPicker(false);
                          }}
                          className={cn(
                            "px-2 py-1.5 text-xs font-mono rounded text-center transition-colors",
                            w === weekday
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-accent hover:text-white text-text-dim"
                          )}
                        >
                          {WEEKDAY_SHORT[w]}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="my-1 border-t border-line" />

                  <button
                    onClick={() => {
                      onDelete(task.id, blockId);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-danger hover:bg-danger/10 transition-colors text-sm"
                  >
                    <Trash2 size={16} />
                    <span>Excluir tarefa</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Note Editor */}
      {isNoteOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-line/40">
          <div className="relative">
            <textarea
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Adicionar nota ou observação..."
              rows={2}
              className="w-full rounded-lg bg-bg/80 border border-line p-3 text-sm font-mono text-text placeholder-text-faint focus:outline-none focus:border-accent-light transition-all resize-y"
            />
            <div className="flex items-center justify-between text-xs text-text-faint mt-1">
              <span>Salva automaticamente ao sair</span>
              <button
                type="button"
                onClick={() => {
                  handleNoteBlur();
                  setIsNoteOpen(false);
                }}
                className="text-accent-light hover:underline font-medium"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
