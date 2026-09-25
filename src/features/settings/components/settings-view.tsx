"use client";

import { Palette, User } from "lucide-react";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

export function SettingsView() {
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
    </div>
  );
}
