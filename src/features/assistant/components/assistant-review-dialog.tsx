"use client";

import React, { useCallback, useState } from "react";
import { Check, CheckCircle2, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export type ReviewGroup = "create" | "update" | "complete" | "delete" | "createCategory";

export interface ReviewItem {
  id: string;
  group: ReviewGroup;
  label: string;
  detail?: string;
}

interface PendingReview {
  items: ReviewItem[];
  resolve: (approved: Set<string> | null) => void;
}

/** Pede ao usuário para revisar as ações da IA. `request` resolve com os ids aprovados ou `null` se cancelar. */
export function useAssistantReview() {
  const [pending, setPending] = useState<PendingReview | null>(null);

  const request = useCallback(
    (items: ReviewItem[]) => new Promise<Set<string> | null>((resolve) => setPending({ items, resolve })),
    []
  );

  const finish = (approved: Set<string> | null) => {
    pending?.resolve(approved);
    setPending(null);
  };

  const dialog = (
    <Dialog
      isOpen={pending !== null}
      onClose={() => finish(null)}
      title="Revisar ações da Orbit AI"
      description="Desmarque o que não deve ser aplicado."
      className="max-w-lg"
      containerClassName="z-[110]"
    >
      {pending && <ReviewBody items={pending.items} onCancel={() => finish(null)} onConfirm={finish} />}
    </Dialog>
  );

  return { request, dialog };
}

const GROUPS: { id: ReviewGroup; title: string; icon: React.ReactNode; tone: string }[] = [
  { id: "create", title: "Criar", icon: <Plus className="w-3.5 h-3.5" />, tone: "text-brand dark:text-brand-soft" },
  { id: "update", title: "Editar", icon: <Pencil className="w-3.5 h-3.5" />, tone: "text-amber-600 dark:text-amber-400" },
  {
    id: "complete",
    title: "Concluir",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  { id: "delete", title: "Excluir", icon: <Trash2 className="w-3.5 h-3.5" />, tone: "text-rose-600 dark:text-rose-400" },
  {
    id: "createCategory",
    title: "Categoria",
    icon: <Tag className="w-3.5 h-3.5" />,
    tone: "text-sky-600 dark:text-sky-400",
  },
];

function ReviewBody({
  items,
  onCancel,
  onConfirm,
}: {
  items: ReviewItem[];
  onCancel: () => void;
  onConfirm: (approved: Set<string>) => void;
}) {
  const [selected, setSelected] = useState(() => new Set(items.map((item) => item.id)));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-5">
      <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
        {GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group.id);
          if (groupItems.length === 0) return null;
          return (
            <div key={group.id} className="space-y-1.5">
              <p className={cn("flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider", group.tone)}>
                {group.icon}
                {group.title} ({groupItems.length})
              </p>
              {groupItems.map((item) => {
                const checked = selected.has(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200/80 px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800/80 dark:hover:bg-zinc-900/40"
                  >
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(item.id)} />
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        checked ? "border-brand bg-brand text-white" : "border-zinc-300 dark:border-zinc-600"
                      )}
                    >
                      {checked && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm text-zinc-800 dark:text-zinc-100",
                          !checked && "text-zinc-400 line-through dark:text-zinc-500"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.detail && <span className="block text-[11px] text-zinc-400">{item.detail}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" disabled={selected.size === 0} onClick={() => onConfirm(selected)}>
          Aplicar ({selected.size})
        </Button>
      </div>
    </div>
  );
}
