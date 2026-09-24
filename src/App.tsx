import React, { useState, useEffect, useCallback } from 'react';
import { AppState, ScheduleBlock, Area, Weekday, Priority, GoalSubtask } from './types';
import { loadStateFromStorage, saveStateToStorage, exportStateAsJSON, applyTheme } from './utils/storage';
import { INITIAL_STATE } from './data/seedData';
import { getTodayString, getTomorrowWeekday, updateStreakOnTaskDone } from './utils/date';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Topbar } from './components/Topbar';
import { CommandPalette } from './components/CommandPalette';
import { QuickCreateModal } from './components/QuickCreateModal';
import { NewAreaModal } from './components/NewAreaModal';
import { FocusModeOverlay } from './components/FocusModeOverlay';
import { TodayView } from './views/TodayView';
import { WeekView } from './views/WeekView';
import { AreaView } from './views/AreaView';
import { ConfigView } from './views/ConfigView';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadStateFromStorage());
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<'task' | 'goal'>('task');
  const [quickCreateWeekday, setQuickCreateWeekday] = useState<Weekday | undefined>(undefined);
  const [quickCreateAreaId, setQuickCreateAreaId] = useState<string | undefined>(undefined);
  const [isNewAreaOpen, setIsNewAreaOpen] = useState(false);

  // Focus Mode state
  const [focusBlock, setFocusBlock] = useState<ScheduleBlock | null>(null);

  // Sync theme changes to html attribute
  useEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  // Persist state changes with subtle saving indicator
  const persistState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      setIsSaving(true);
      saveStateToStorage(next);
      setTimeout(() => setIsSaving(false), 600);
      return next;
    });
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K, /, n, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Close modals on Esc
      if (e.key === 'Escape') {
        if (focusBlock) {
          setFocusBlock(null);
          return;
        }
        if (isSearchOpen) {
          setIsSearchOpen(false);
          return;
        }
        if (isQuickCreateOpen) {
          setIsQuickCreateOpen(false);
          return;
        }
        if (isNewAreaOpen) {
          setIsNewAreaOpen(false);
          return;
        }
      }

      // Command palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      // Non-input shortcuts
      if (!isInput) {
        if (e.key === '/') {
          e.preventDefault();
          setIsSearchOpen(true);
        } else if (e.key === 'n') {
          e.preventDefault();
          setQuickCreateType('task');
          setIsQuickCreateOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusBlock, isSearchOpen, isQuickCreateOpen, isNewAreaOpen]);

  // Actions
  const handleToggleTheme = () => {
    persistState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const handleNavigate = (viewId: string) => {
    persistState((prev) => ({
      ...prev,
      activeView: viewId
    }));
  };

  const handleToggleTask = (taskId: string, blockId: string) => {
    const todayStr = getTodayString();

    persistState((prev) => {
      let toggledToDone = false;
      let targetAreaId = '';

      const updatedSchedule = prev.schedule.map((block) => {
        if (block.id !== blockId) return block;
        targetAreaId = block.areaId;
        const updatedTasks = block.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const nextDone = !task.done;
          if (nextDone) toggledToDone = true;
          return {
            ...task,
            done: nextDone,
            completedAt: nextDone ? new Date().toISOString() : undefined
          };
        });
        return { ...block, tasks: updatedTasks };
      });

      // Update streak and completion history if toggled to true
      let nextStreaks = { ...prev.streaks };
      let nextHistory = { ...prev.completionHistory };

      if (toggledToDone && targetAreaId) {
        nextStreaks[targetAreaId] = updateStreakOnTaskDone(
          nextStreaks[targetAreaId],
          todayStr
        );
        nextHistory[todayStr] = (nextHistory[todayStr] || 0) + 1;
      }

      return {
        ...prev,
        schedule: updatedSchedule,
        streaks: nextStreaks,
        completionHistory: nextHistory
      };
    });

    // Also update focus block if currently active
    if (focusBlock && focusBlock.id === blockId) {
      setFocusBlock((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done } : t
          )
        };
      });
    }
  };

  const handleUpdateTaskNote = (taskId: string, blockId: string, note: string) => {
    persistState((prev) => ({
      ...prev,
      schedule: prev.schedule.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          tasks: block.tasks.map((t) => (t.id === taskId ? { ...t, note } : t))
        };
      })
    }));
  };

  const handleMoveToTomorrow = (taskId: string, fromBlockId: string) => {
    persistState((prev) => {
      const fromBlock = prev.schedule.find((b) => b.id === fromBlockId);
      if (!fromBlock) return prev;

      const targetTask = fromBlock.tasks.find((t) => t.id === taskId);
      if (!targetTask) return prev;

      const nextWeekday = getTomorrowWeekday(fromBlock.weekday);

      // Find an existing block for same area on next weekday or create one
      const existingNextBlock = prev.schedule.find(
        (b) => b.weekday === nextWeekday && b.areaId === fromBlock.areaId
      );

      let nextSchedule = prev.schedule.map((block) => {
        if (block.id === fromBlockId) {
          return {
            ...block,
            tasks: block.tasks.filter((t) => t.id !== taskId)
          };
        }
        return block;
      });

      if (existingNextBlock) {
        nextSchedule = nextSchedule.map((b) => {
          if (b.id === existingNextBlock.id) {
            return {
              ...b,
              tasks: [...b.tasks, targetTask]
            };
          }
          return b;
        });
      } else {
        const newBlock: ScheduleBlock = {
          id: `s_${Date.now()}`,
          areaId: fromBlock.areaId,
          weekday: nextWeekday,
          title: fromBlock.title,
          tasks: [targetTask]
        };
        nextSchedule.push(newBlock);
      }

      return {
        ...prev,
        schedule: nextSchedule
      };
    });
  };

  const handleMoveToDay = (taskId: string, fromBlockId: string, toWeekday: Weekday) => {
    persistState((prev) => {
      const fromBlock = prev.schedule.find((b) => b.id === fromBlockId);
      if (!fromBlock) return prev;

      const targetTask = fromBlock.tasks.find((t) => t.id === taskId);
      if (!targetTask) return prev;

      const existingBlock = prev.schedule.find(
        (b) => b.weekday === toWeekday && b.areaId === fromBlock.areaId
      );

      let nextSchedule = prev.schedule.map((b) => {
        if (b.id === fromBlockId) {
          return {
            ...b,
            tasks: b.tasks.filter((t) => t.id !== taskId)
          };
        }
        return b;
      });

      if (existingBlock) {
        nextSchedule = nextSchedule.map((b) => {
          if (b.id === existingBlock.id) {
            return {
              ...b,
              tasks: [...b.tasks, targetTask]
            };
          }
          return b;
        });
      } else {
        const newBlock: ScheduleBlock = {
          id: `s_${Date.now()}`,
          areaId: fromBlock.areaId,
          weekday: toWeekday,
          title: fromBlock.title,
          tasks: [targetTask]
        };
        nextSchedule.push(newBlock);
      }

      return {
        ...prev,
        schedule: nextSchedule
      };
    });
  };

  const handleDeleteTask = (taskId: string, blockId: string) => {
    persistState((prev) => ({
      ...prev,
      schedule: prev.schedule.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          tasks: block.tasks.filter((t) => t.id !== taskId)
        };
      })
    }));
  };

  const handleCreateTask = (data: {
    areaId: string;
    weekday: Weekday;
    blockTitle?: string;
    label: string;
    note?: string;
  }) => {
    persistState((prev) => {
      // Find matching block
      const existingBlock = prev.schedule.find(
        (b) =>
          b.weekday === data.weekday &&
          b.areaId === data.areaId &&
          (!data.blockTitle || b.title === data.blockTitle)
      );

      const newTask = {
        id: `t_${Date.now()}`,
        label: data.label,
        done: false,
        note: data.note
      };

      if (existingBlock) {
        return {
          ...prev,
          schedule: prev.schedule.map((b) =>
            b.id === existingBlock.id
              ? { ...b, tasks: [...b.tasks, newTask] }
              : b
          )
        };
      } else {
        const area = prev.areas.find((a) => a.id === data.areaId);
        const newBlock: ScheduleBlock = {
          id: `s_${Date.now()}`,
          areaId: data.areaId,
          weekday: data.weekday,
          title: data.blockTitle || `${area?.label || 'Bloco'} (${data.weekday})`,
          tasks: [newTask]
        };
        return {
          ...prev,
          schedule: [...prev.schedule, newBlock]
        };
      }
    });
  };

  const handleToggleGoal = (goalId: string, areaId: string) => {
    persistState((prev) => {
      const areaGoals = prev.goals[areaId] || [];
      const updated = areaGoals.map((g) => {
        if (g.id !== goalId) return g;
        return { ...g, done: !g.done, completedAt: !g.done ? new Date().toISOString() : undefined };
      });
      return {
        ...prev,
        goals: {
          ...prev.goals,
          [areaId]: updated
        }
      };
    });
  };

  const handleDeleteGoal = (goalId: string, areaId: string) => {
    persistState((prev) => ({
      ...prev,
      goals: {
        ...prev.goals,
        [areaId]: (prev.goals[areaId] || []).filter((g) => g.id !== goalId)
      }
    }));
  };

  const handleAddGoalSubtask = (goalId: string, areaId: string, label: string) => {
    persistState((prev) => {
      const areaGoals = prev.goals[areaId] || [];
      const updated = areaGoals.map((g) => {
        if (g.id !== goalId) return g;
        const subtasks = g.subtasks || [];
        const newSubtask: GoalSubtask = {
          id: `st_${Date.now()}`,
          label,
          done: false
        };
        return { ...g, subtasks: [...subtasks, newSubtask] };
      });
      return {
        ...prev,
        goals: {
          ...prev.goals,
          [areaId]: updated
        }
      };
    });
  };

  const handleToggleGoalSubtask = (goalId: string, areaId: string, subtaskId: string) => {
    persistState((prev) => {
      const areaGoals = prev.goals[areaId] || [];
      const updated = areaGoals.map((g) => {
        if (g.id !== goalId) return g;
        const subtasks = (g.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, done: !st.done } : st
        );
        return { ...g, subtasks };
      });
      return {
        ...prev,
        goals: {
          ...prev.goals,
          [areaId]: updated
        }
      };
    });
  };

  const handleCreateGoal = (data: {
    areaId: string;
    label: string;
    due?: string;
    priority: Priority;
  }) => {
    persistState((prev) => {
      const newGoal = {
        id: `g_${Date.now()}`,
        label: data.label,
        done: false,
        due: data.due,
        priority: data.priority,
        subtasks: []
      };
      const list = prev.goals[data.areaId] || [];
      return {
        ...prev,
        goals: {
          ...prev.goals,
          [data.areaId]: [...list, newGoal]
        }
      };
    });
  };

  const handleCreateArea = (newArea: Area) => {
    persistState((prev) => ({
      ...prev,
      areas: [...prev.areas, newArea],
      goals: {
        ...prev.goals,
        [newArea.id]: []
      },
      streaks: {
        ...prev.streaks,
        [newArea.id]: { current: 0, longest: 0, lastCompletedDate: '' }
      },
      activeView: newArea.id
    }));
  };

  const handleDeleteArea = (areaId: string) => {
    persistState((prev) => {
      const nextAreas = prev.areas.filter((a) => a.id !== areaId);
      const nextSchedule = prev.schedule.filter((b) => b.areaId !== areaId);
      const nextGoals = { ...prev.goals };
      delete nextGoals[areaId];
      const nextStreaks = { ...prev.streaks };
      delete nextStreaks[areaId];

      return {
        ...prev,
        areas: nextAreas,
        schedule: nextSchedule,
        goals: nextGoals,
        streaks: nextStreaks,
        activeView: prev.activeView === areaId ? 'hoje' : prev.activeView
      };
    });
  };

  const handleResetToSeed = () => {
    persistState(() => INITIAL_STATE);
  };

  const handleImportState = (newState: AppState) => {
    persistState(() => newState);
  };

  // Find active area if activeView matches an area ID
  const activeArea = state.areas.find((a) => a.id === state.activeView);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text font-body">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar
        activeView={state.activeView}
        onNavigate={handleNavigate}
        areas={state.areas}
        schedule={state.schedule}
        goals={state.goals}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenNewArea={() => setIsNewAreaOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuickCreate={() => {
          setQuickCreateType('task');
          setIsQuickCreateOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          theme={state.theme}
          onToggleTheme={handleToggleTheme}
          isSaving={isSaving}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {state.activeView === 'hoje' && (
            <TodayView
              state={state}
              onToggleTask={handleToggleTask}
              onUpdateNote={handleUpdateTaskNote}
              onMoveToTomorrow={handleMoveToTomorrow}
              onMoveToDay={handleMoveToDay}
              onDeleteTask={handleDeleteTask}
              onOpenFocusMode={(block) => setFocusBlock(block)}
              onNavigate={handleNavigate}
              onToggleGoal={handleToggleGoal}
            />
          )}

          {state.activeView === 'cronograma' && (
            <WeekView
              state={state}
              onToggleTask={handleToggleTask}
              onUpdateNote={handleUpdateTaskNote}
              onMoveToTomorrow={handleMoveToTomorrow}
              onMoveToDay={handleMoveToDay}
              onDeleteTask={handleDeleteTask}
              onOpenFocusMode={(block) => setFocusBlock(block)}
              onOpenQuickCreate={(defaultWeekday) => {
                setQuickCreateWeekday(defaultWeekday);
                setQuickCreateType('task');
                setIsQuickCreateOpen(true);
              }}
              onDropTaskToDay={handleMoveToDay}
            />
          )}

          {activeArea && (
            <AreaView
              area={activeArea}
              goals={state.goals[activeArea.id] || []}
              streakCurrent={state.streaks[activeArea.id]?.current || 0}
              schedule={state.schedule}
              onToggleGoal={handleToggleGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddSubtask={handleAddGoalSubtask}
              onToggleSubtask={handleToggleGoalSubtask}
              onOpenNewGoalModal={(areaId) => {
                setQuickCreateAreaId(areaId);
                setQuickCreateType('goal');
                setIsQuickCreateOpen(true);
              }}
              onNavigateToWeek={() => handleNavigate('cronograma')}
            />
          )}

          {state.activeView === 'config' && (
            <ConfigView
              state={state}
              onToggleTheme={handleToggleTheme}
              onExport={() => exportStateAsJSON(state)}
              onImport={handleImportState}
              onReset={handleResetToSeed}
              onDeleteArea={handleDeleteArea}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <MobileNav
        activeView={state.activeView}
        onNavigate={handleNavigate}
        areas={state.areas}
        onOpenQuickCreate={() => {
          setQuickCreateType('task');
          setIsQuickCreateOpen(true);
        }}
        onOpenNewArea={() => setIsNewAreaOpen(true)}
      />

      {/* Command Palette / Unified Search */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        state={state}
        onNavigate={handleNavigate}
        onOpenQuickCreate={(type) => {
          setQuickCreateType(type);
          setIsQuickCreateOpen(true);
        }}
        onToggleTheme={handleToggleTheme}
        onExport={() => exportStateAsJSON(state)}
      />

      {/* Quick Create Task / Goal Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        initialType={quickCreateType}
        initialWeekday={quickCreateWeekday}
        initialAreaId={quickCreateAreaId}
        areas={state.areas}
        onClose={() => {
          setIsQuickCreateOpen(false);
          setQuickCreateWeekday(undefined);
          setQuickCreateAreaId(undefined);
        }}
        onCreateTask={handleCreateTask}
        onCreateGoal={handleCreateGoal}
      />

      {/* Create New Area Modal */}
      <NewAreaModal
        isOpen={isNewAreaOpen}
        onClose={() => setIsNewAreaOpen(false)}
        onCreateArea={handleCreateArea}
      />

      {/* Deep Space Focus Mode Overlay */}
      {focusBlock && (
        <FocusModeOverlay
          isOpen={true}
          block={focusBlock}
          area={state.areas.find((a) => a.id === focusBlock.areaId)}
          onClose={() => setFocusBlock(null)}
          onToggleTask={handleToggleTask}
        />
      )}
    </div>
  );
};
export default App;
