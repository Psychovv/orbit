"use client";

import React, { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

interface PendingAnswer {
  text: string;
  resolve: () => void;
}

/** Mostra a resposta de uma consulta da Orbit AI. `show` resolve quando o usuário fecha. */
export function useAssistantAnswer() {
  const [pending, setPending] = useState<PendingAnswer | null>(null);

  const show = useCallback(
    (text: string) => new Promise<void>((resolve) => setPending({ text, resolve })),
    []
  );

  const finish = () => {
    pending?.resolve();
    setPending(null);
  };

  const dialog = (
    <Dialog
      isOpen={pending !== null}
      onClose={finish}
      title="Orbit AI"
      description="Resposta da consulta"
      className="max-w-md"
      containerClassName="z-[110]"
    >
      {pending && (
        <div className="space-y-5">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand dark:text-brand-soft" />
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              {pending.text}
            </p>
          </div>
          <div className="flex justify-end border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
            <Button variant="primary" onClick={finish}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );

  return { show, dialog };
}
