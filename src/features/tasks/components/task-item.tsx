"use client";

import React from "react";
import { motion } from "motion/react";
import type { Task, TaskCategory } from "../domain/task.schema";
import { isCompleted } from "../domain/task.selectors";
import { Check, Clock, Trash2 } from "lucide-react";
import { triggerCosmicCelebration } from "@/shared/effects/confetti";
import { cn } from "@/shared/lib/utils";

interface TaskItemProps {
  task: Task;
  category?: TaskCategory;
  onToggleComplete: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, category, onToggleComplete, onDelete }: TaskItemProps) {
  const completed = isCompleted(task);

  const handleToggle = () => {
    if (!completed) {
      triggerCosmicCelebration();
    }
    onToggleComplete(task);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl p-3.5 transition-all duration-200 border",
        completed
          ? "bg-zinc-50/70 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-zinc-800/40 opacity-60"
          : "bg-white dark:bg-[#121020] border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-[#844DFE]/40 dark:hover:border-[#844DFE]/30"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox with #844DFE completion */}
        <button
          onClick={handleToggle}
          className={cn(
            "relative mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer",
            completed
              ? "bg-[#844DFE] border-[#844DFE] text-white shadow-xs"
              : "border-zinc-300 dark:border-zinc-600 bg-white/50 dark:bg-zinc-800/50 hover:border-[#844DFE] dark:hover:border-[#844DFE]"
          )}
          aria-label={completed ? "Desmarcar tarefa" : "Concluir tarefa"}
        >
          {completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </motion.div>
          )}
        </button>

        {/* Task Title & Description with normal, spacious word-wrap */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium leading-relaxed whitespace-normal break-words transition-colors",
              completed
                ? "line-through text-zinc-400 dark:text-zinc-500"
                : "text-zinc-900 dark:text-zinc-100"
            )}
          >
            {task.title}
          </p>

          {task.description && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 whitespace-normal break-words leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Delete action button */}
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer shrink-0"
          title="Excluir tarefa"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Discreet metadata row: Category tag & optional time */}
      <div className="flex items-center justify-between gap-2 pt-1 pl-7.5">
        {/* Discreet Category Tag */}
        {category ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/50">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: category.color || "#844DFE" }}
            />
            <span>{category.name}</span>
          </span>
        ) : (
          <span className="text-[11px] text-zinc-400">Geral</span>
        )}

        {/* Time (if present) */}
        {task.time && (
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>{task.time}</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
