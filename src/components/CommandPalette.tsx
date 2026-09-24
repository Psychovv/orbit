import React, { useState, useEffect, useRef } from 'react';
import { AppState } from '../types';
import {
  Search,
  CheckCircle2,
  Target,
  Compass,
  Layers
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onNavigate: (view: string) => void;
  onOpenQuickCreate: (type: 'task' | 'goal') => void;
  onToggleTheme: () => void;
  onExport: () => void;
}

interface SearchItem {
  id: string;
  type: 'task' | 'goal' | 'action' | 'area';
  title: string;
  subtitle?: string;
  badge?: string;
  color?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  state,
  onNavigate,
  onOpenQuickCreate,
  onToggleTheme,
  onExport
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items
  const items: SearchItem[] = [];

  // Quick actions
  items.push({
    id: 'act_hoje',
    type: 'action',
    title: 'Ir para Visão de Hoje',
    subtitle: 'Ver tarefas do dia atual e streaks',
    action: () => {
      onNavigate('hoje');
      onClose();
    }
  });

  items.push({
    id: 'act_semana',
    type: 'action',
    title: 'Ir para Visão da Semana',
    subtitle: 'Ver cronograma completo de 7 dias',
    action: () => {
      onNavigate('cronograma');
      onClose();
    }
  });

  items.push({
    id: 'act_new_task',
    type: 'action',
    title: '+ Nova Tarefa no Cronograma',
    subtitle: 'Criar tarefa em qualquer dia da semana',
    action: () => {
      onClose();
      onOpenQuickCreate('task');
    }
  });

  items.push({
    id: 'act_new_goal',
    type: 'action',
    title: '+ Nova Meta em uma Área',
    subtitle: 'Definir meta com prazo e prioridade',
    action: () => {
      onClose();
      onOpenQuickCreate('goal');
    }
  });

  items.push({
    id: 'act_toggle_theme',
    type: 'action',
    title: `Alternar Tema (atualmente ${state.theme === 'dark' ? 'Escuro' : 'Claro'})`,
    subtitle: 'Mudar para tema ' + (state.theme === 'dark' ? 'Claro' : 'Escuro'),
    action: () => {
      onToggleTheme();
      onClose();
    }
  });

  items.push({
    id: 'act_export',
    type: 'action',
    title: 'Baixar Backup JSON',
    subtitle: 'Exportar todos os dados do Orbit',
    action: () => {
      onExport();
      onClose();
    }
  });

  // Areas
  state.areas.forEach((area) => {
    items.push({
      id: `area_${area.id}`,
      type: 'area',
      title: `Área: ${area.label}`,
      subtitle: `Abrir metas e acompanhamento de ${area.label}`,
      color: area.color,
      action: () => {
        onNavigate(area.id);
        onClose();
      }
    });
  });

  // Schedule Tasks
  state.schedule.forEach((block) => {
    const area = state.areas.find((a) => a.id === block.areaId);
    block.tasks.forEach((task) => {
      items.push({
        id: `task_${task.id}`,
        type: 'task',
        title: task.label,
        subtitle: `${block.weekday.toUpperCase()} · ${area?.label || 'Bloco'} (${block.title})`,
        badge: task.done ? 'Concluída' : 'Pendente',
        color: area?.color,
        action: () => {
          onNavigate('cronograma');
          onClose();
        }
      });
    });
  });

  // Goals
  Object.entries(state.goals).forEach(([areaId, goals]) => {
    const area = state.areas.find((a) => a.id === areaId);
    goals.forEach((goal) => {
      items.push({
        id: `goal_${goal.id}`,
        type: 'goal',
        title: goal.label,
        subtitle: `Meta de ${area?.label || 'Área'} ${goal.due ? `· Prazo: ${goal.due}` : ''}`,
        badge: `Prioridade ${goal.priority}`,
        color: area?.color,
        action: () => {
          onNavigate(areaId);
          onClose();
        }
      });
    });
  });

  // Filter items
  const cleanQ = query.trim().toLowerCase();
  const filtered = cleanQ
    ? items.filter(
        (it) =>
          it.title.toLowerCase().includes(cleanQ) ||
          (it.subtitle && it.subtitle.toLowerCase().includes(cleanQ))
      )
    : items.slice(0, 8); // show quick actions when query is empty

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-bg/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-xl rounded-2xl bg-bg-elev border border-line-strong shadow-2xl overflow-hidden flex flex-col z-10"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line bg-bg-elev-2/50">
          <Search size={18} className="text-text-dim flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Digite para buscar tarefas, metas ou comandos..."
            className="w-full bg-transparent text-sm text-text placeholder-text-faint focus:outline-none"
          />
          <span className="font-mono text-[10px] text-text-faint bg-bg px-2 py-0.5 rounded border border-line flex-shrink-0">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-text-dim text-sm">
              Nenhum resultado encontrado para "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-accent/15 border border-accent/30' : 'hover:bg-bg-elev-2 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="p-1.5 rounded-lg flex-shrink-0"
                      style={{
                        backgroundColor: item.color ? `${item.color}22` : 'var(--bg-elev-2)',
                        color: item.color || 'var(--accent-plasma)'
                      }}
                    >
                      {item.type === 'task' && <CheckCircle2 size={15} />}
                      {item.type === 'goal' && <Target size={15} />}
                      {item.type === 'area' && <Layers size={15} />}
                      {item.type === 'action' && <Compass size={15} />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-text-dim truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span className="font-mono text-[10px] text-text-faint bg-bg px-2 py-0.5 rounded-full border border-line flex-shrink-0 ml-2">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2 bg-bg-elev-2/80 border-t border-line text-[11px] font-mono text-text-faint flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ navegar</span>
            <span>↵ selecionar</span>
          </div>
          <span>Orbit Quasar Search</span>
        </div>
      </div>
    </div>
  );
};
