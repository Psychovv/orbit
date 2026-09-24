import { Sparkles } from "lucide-react";
import { AppShell } from "./_components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      footer={
        <footer className="relative z-10 border-t border-zinc-200/80 dark:border-zinc-800/80 py-6 mt-12 bg-white/60 dark:bg-[#070512]/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-[#844DFE] font-bold">ORBIT</span>
              <span>&bull;</span>
              <span>Hub Pessoal de Organização & Finanças</span>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>Sua vida em harmonia</span>
              <Sparkles className="w-3.5 h-3.5 text-[#844DFE]" />
            </div>
          </div>
        </footer>
      }
    >
      {children}
    </AppShell>
  );
}
