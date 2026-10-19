"use client";

import React, { useRef, useState } from "react";
import { Database, Download, Palette, RotateCcw, Upload, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { dataSource, resetLocalData } from "@/config/data-source";
import { ProfileForm } from "@/features/profile/components/profile-form";
import {
  buildOrbitBackup,
  downloadOrbitBackup,
  restoreOrbitBackup,
} from "@/features/settings/data/backup";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { toast } from "@/shared/ui/toast";

export function SettingsView() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);

  const handleResetData = () => {
    if (
      window.confirm(
        "Deseja restaurar tarefas, finanças e perfil para os dados de demonstração? Isso apaga os dados locais atuais."
      )
    ) {
      resetLocalData();
      queryClient.resetQueries();
    }
  };

  const handleExport = async () => {
    setBusy("export");
    try {
      const backup = await buildOrbitBackup();
      downloadOrbitBackup(backup);
      toast({ message: "Backup exportado", description: "Arquivo JSON baixado." });
    } catch (error) {
      toast({
        message: "Falha ao exportar",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleImportFile = async (file: File) => {
    if (
      !window.confirm(
        "Importar este backup substitui tarefas, finanças e perfil atuais. Continuar?"
      )
    ) {
      return;
    }

    setBusy("import");
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      await restoreOrbitBackup(raw);
      await queryClient.resetQueries();
      toast({ message: "Backup importado", description: "Dados restaurados com sucesso." });
    } catch (error) {
      toast({
        message: "Falha ao importar",
        description:
          error instanceof Error ? error.message : "Arquivo inválido ou corrompido.",
      });
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2 sm:py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Perfil e preferências da interface.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md p-4 sm:p-5 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <User className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Perfil</h2>
        </div>
        <ProfileForm />
      </section>

      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md p-4 sm:p-5 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <Palette className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Aparência</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Tema</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Alterna entre modo claro e escuro.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#100e1e]/70 backdrop-blur-md p-4 sm:p-5 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <Database className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Dados</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Exportar backup
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Baixa um JSON com tarefas, finanças e perfil.
              </p>
            </div>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void handleExport()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {busy === "export" ? "Exportando…" : "Exportar"}
            </button>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Importar backup
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Substitui os dados atuais pelo arquivo exportado.
              </p>
            </div>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {busy === "import" ? "Importando…" : "Importar"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
              }}
            />
          </div>

          {dataSource === "local" ? (
            <div className="flex items-start justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Restaurar dados de demonstração
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Apaga tarefas, finanças e perfil locais e volta o conteúdo inicial de demo.
                  Disponível só no modo local.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetData}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
