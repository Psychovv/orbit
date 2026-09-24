"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-24">
      <AlertTriangle className="w-8 h-8 text-rose-500" />
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Algo saiu de órbita</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
        Não foi possível carregar esta tela. Tente novamente.
      </p>
      <Button variant="secondary" size="sm" onClick={retry} className="mt-2">
        <RotateCcw className="w-3.5 h-3.5" />
        Tentar de novo
      </Button>
    </div>
  );
}
