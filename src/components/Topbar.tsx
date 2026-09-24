import React from 'react';
import { getGreeting, getTodayWeekday, WEEKDAY_LABELS } from '../utils/date';
import { QuasarLogo } from './QuasarLogo';
import {
  Sun,
  Moon,
  Search
} from 'lucide-react';

interface TopbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isSaving: boolean;
  onOpenSearch: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  theme,
  onToggleTheme,
  isSaving,
  onOpenSearch
}) => {
  const greeting = getGreeting();
  const weekday = getTodayWeekday();
  const weekdayLabel = WEEKDAY_LABELS[weekday];

  return (
    <header className="h-16 border-b border-line bg-bg/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Mobile Brand & Greeting */}
      <div className="flex items-center gap-3">
        <div className="sm:hidden">
          <QuasarLogo size="sm" showText={false} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-title font-bold text-base sm:text-lg text-text leading-tight">
              {greeting}
            </h1>
            <span className="hidden xs:inline-block text-xs font-mono text-text-dim">
              · {weekdayLabel}
            </span>
          </div>
          <span className="xs:hidden text-[11px] font-mono text-text-dim">
            {weekdayLabel}
          </span>
        </div>
      </div>

      {/* Right: Sync indicator, Search Trigger & Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Status Badge (Auto fades) */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] transition-all duration-300 ${
            isSaving
              ? 'opacity-100 bg-accent/10 text-accent-plasma'
              : 'opacity-70 text-text-faint'
          }`}
          title="Todos os dados persistem localmente e em tempo real"
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isSaving ? 'bg-accent-plasma animate-ping' : 'bg-success'
            }`}
          />
          <span className="hidden sm:inline">
            {isSaving ? 'salvando...' : 'salvo'}
          </span>
        </div>

        {/* Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-xl text-text-dim hover:text-text hover:bg-bg-elev border border-transparent hover:border-line transition-all"
          title="Buscar ou comandos (Ctrl+K)"
        >
          <Search size={16} />
        </button>

        {/* Theme Toggle (Sun/Moon with smooth transition) */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-text-dim hover:text-text hover:bg-bg-elev border border-transparent hover:border-line transition-all group"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? (
            <Sun
              size={17}
              className="text-amber-400 group-hover:rotate-45 transition-transform duration-300"
            />
          ) : (
            <Moon
              size={17}
              className="text-accent group-hover:-rotate-12 transition-transform duration-300"
            />
          )}
        </button>
      </div>
    </header>
  );
};
