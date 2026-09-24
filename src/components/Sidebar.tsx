import React from 'react';
import { Area, ScheduleBlock, Goal } from '../types';
import { QuasarLogo } from './QuasarLogo';
import { renderAreaIcon } from './NewAreaModal';
import {
  CalendarDays,
  CalendarRange,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from './motion';

interface SidebarProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  areas: Area[];
  schedule: ScheduleBlock[];
  goals: Record<string, Goal[]>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenNewArea: () => void;
  onOpenSearch: () => void;
  onOpenQuickCreate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  areas,
  schedule,
  goals,
  isCollapsed,
  onToggleCollapse,
  onOpenNewArea,
  onOpenSearch,
  onOpenQuickCreate
}) => {
  // Compute pending count per area (uncompleted tasks + uncompleted goals)
  const getPendingCount = (areaId: string) => {
    let count = 0;
    // tasks pending
    schedule.forEach((block) => {
      if (block.areaId === areaId) {
        count += block.tasks.filter((t) => !t.done).length;
      }
    });
    // goals pending
    const areaGoals = goals[areaId] || [];
    count += areaGoals.filter((g) => !g.done).length;
    return count;
  };

  return (
    <FadeUp>
      <aside
        className={`hidden sm:flex flex-col flex-shrink-0 border-r border-line bg-bg-elev/95 backdrop-blur-md transition-all duration-300 z-30 select-none ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        style={{ height: '100vh' }}
      >
        {/* Brand Header */}
        <div className={`flex items-center h-16 px-4 border-b border-line ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div
            onClick={() => onNavigate('hoje')}
            className="cursor-pointer"
            title="Orbit Home"
          >
            <QuasarLogo size={isCollapsed ? 'sm' : 'md'} showText={!isCollapsed} />
          </div>
        </div>

        {/* Quick Search & Add Bar */}
        <div className="p-4 space-y-2 border-b border-line/40">
          <button
            onClick={onOpenSearch}
            className={`flex items-center gap-2.5 w-full rounded-xl bg-bg border border-line text-text-dim hover:text-text hover:border-line-strong transition-all ${
              isCollapsed ? 'p-3 justify-center' : 'px-3.5 py-2.5 text-sm'
            }`}
            title="Buscar ou comandos (Ctrl+K)"
          >
            <Search size={16} className="flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Buscar...</span>
                <kbd className="font-mono text-xs text-text-faint bg-bg-elev px-1.5 py-0.5 rounded border border-line">
                  /
                </kbd>
              </div>
            )}
          </button>

          <button
            onClick={onOpenQuickCreate}
            className={`btn-primary flex items-center gap-2 w-full rounded-xl transition-all ${
              isCollapsed ? 'p-3 justify-center' : 'px-3.5 py-2.5 text-sm font-medium'
            }`}
            title="Nova tarefa ou meta (n)"
          >
            <Plus size={16} className="flex-shrink-0" />
            {!isCollapsed && <span>Novo item</span>}
          </button>
        </div>

        {/* Main Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {/* Fixed Views */}
          <div className="space-y-1">
            {/* Hoje */}
            <button
              onClick={() => onNavigate('hoje')}
              className={`group relative flex items-center gap-3.5 w-full rounded-xl transition-all ${
                isCollapsed ? 'p-3 justify-center' : 'px-3 py-3 text-sm font-semibold'
              } ${
                activeView === 'hoje'
                  ? 'bg-accent/15 text-accent-plasma'
                  : 'text-text-dim hover:text-text hover:bg-bg-elev-2'
              }`}
              title="Hoje"
            >
              {/* Active vertical bar indicator */}
              {activeView === 'hoje' && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r bg-accent-plasma shadow-[0_0_8px_var(--accent)]" />
              )}
              <CalendarDays size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Hoje</span>}
            </button>

            {/* Semana */}
            <button
              onClick={() => onNavigate('cronograma')}
              className={`group relative flex items-center gap-3.5 w-full rounded-xl transition-all ${
                isCollapsed ? 'p-3 justify-center' : 'px-3 py-3 text-sm font-semibold'
              } ${
                activeView === 'cronograma'
                  ? 'bg-accent/15 text-accent-plasma'
                  : 'text-text-dim hover:text-text hover:bg-bg-elev-2'
              }`}
              title="Semana (Cronograma)"
            >
              {activeView === 'cronograma' && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r bg-accent-plasma shadow-[0_0_8px_var(--accent)]" />
              )}
              <CalendarRange size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Semana</span>}
            </button>
          </div>

          {/* Dynamic Areas Section */}
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-3 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-text-faint">
                <span>Áreas em Órbita</span>
              </div>
            )}

            <StaggerContainer className="space-y-1">
              {areas.map((area) => {
                const isActive = activeView === area.id;
                const pending = getPendingCount(area.id);

                return (
                  <StaggerItem key={area.id}>
                    <button
                      onClick={() => onNavigate(area.id)}
                      className={`group relative flex items-center gap-3.5 w-full rounded-xl transition-all ${
                        isCollapsed ? 'p-3 justify-center' : 'px-3 py-3 text-sm font-medium'
                      } ${
                        isActive
                          ? 'bg-bg-elev-2 text-text font-semibold'
                          : 'text-text-dim hover:text-text hover:bg-bg-elev-2/60'
                      }`}
                      title={`${area.label} (${pending} pendentes)`}
                    >
                      {/* Active Indicator with Area Color */}
                      {isActive && (
                        <div
                          className="absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r shadow-sm"
                          style={{ backgroundColor: area.color }}
                        />
                      )}

                      {/* Area icon/dot */}
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: `${area.color}25`,
                          color: area.color
                        }}
                      >
                        {renderAreaIcon(area.icon, 14)}
                      </div>

                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{area.label}</span>
                            {area.beta && (
                              <span className="font-mono text-xs uppercase px-1.5 rounded bg-line text-text-faint">
                                beta
                              </span>
                            )}
                          </div>

                          {pending > 0 && (
                            <span className="font-mono text-xs text-text-faint bg-bg px-2 py-0.5 rounded-full border border-line/60">
                              {pending}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </StaggerItem>
                );
              })}

              {/* "+ Nova área" button */}
              <StaggerItem>
                <button
                  onClick={onOpenNewArea}
                  className={`flex items-center gap-3.5 w-full rounded-xl text-text-faint hover:text-text hover:bg-bg-elev-2 transition-all ${
                    isCollapsed ? 'p-3 justify-center' : 'px-3 py-3 text-sm'
                  }`}
                  title="Criar nova área"
                >
                  <Plus size={18} className="flex-shrink-0 text-accent-plasma" />
                  {!isCollapsed && <span className="font-medium">Nova área</span>}
                </button>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </nav>

        {/* Sidebar Footer: Settings & Collapse Toggle */}
        <div className="p-3 border-t border-line space-y-1">
          <button
            onClick={() => onNavigate('config')}
            className={`group relative flex items-center gap-3.5 w-full rounded-xl transition-all ${
              isCollapsed ? 'p-3 justify-center' : 'px-3 py-3 text-sm font-medium'
            } ${
              activeView === 'config'
                ? 'bg-accent/15 text-accent-plasma'
                : 'text-text-dim hover:text-text hover:bg-bg-elev-2'
            }`}
            title="Configurações"
          >
            {activeView === 'config' && (
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r bg-accent-plasma" />
            )}
            <Settings size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Configurações</span>}
          </button>

          {/* Collapse / Expand Toggle */}
          <button
            onClick={onToggleCollapse}
            className={`flex items-center justify-center w-full rounded-xl transition-colors text-text-faint hover:text-text hover:bg-bg-elev-2 ${
              isCollapsed ? 'p-3' : 'px-3 py-3'
            }`}
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </FadeUp>
  );
};
