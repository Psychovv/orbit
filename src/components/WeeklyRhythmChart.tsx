import React from 'react';
import { getTodayString } from '../utils/date';
import { cn } from '../lib/utils';

interface WeeklyRhythmChartProps {
  history: Record<string, number>;
}

export const WeeklyRhythmChart: React.FC<WeeklyRhythmChartProps> = ({ history }) => {
  // Generate the last 7 calendar days ending today
  const days: { dateStr: string; label: string; count: number; isToday: boolean }[] = [];
  const today = new Date();
  const todayStr = getTodayString();

  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayNum}`;
    const count = history[dateStr] || 0;

    days.push({
      dateStr,
      label: weekdayNames[d.getDay()],
      count,
      isToday: dateStr === todayStr
    });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 4);

  return (
    <div className="card-cosmic p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-title font-semibold text-base text-text">Ritmo Semanal</h4>
          <p className="text-sm text-text-dim">Tarefas concluídas nos últimos 7 dias</p>
        </div>
        <div className="font-mono text-sm text-accent-plasma font-medium px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
          {days.reduce((acc, d) => acc + d.count, 0)} total
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 pt-4 h-32 border-b border-line/40 px-1">
        {days.map((day) => {
          const heightPercent = Math.max(8, (day.count / maxCount) * 100);

          return (
            <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              {/* Tooltip on hover */}
              <span className="font-mono text-xs text-text-dim group-hover:text-text group-hover:scale-110 transition-all opacity-0 group-hover:opacity-100 mb-0.5">
                {day.count}
              </span>

              {/* Bar */}
              <div
                className={cn(
                  "w-full max-w-[32px] rounded-t-lg transition-all duration-500 relative",
                  day.isToday
                    ? "bg-gradient-to-t from-accent to-accent-plasma shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                    : day.count > 0
                    ? "bg-accent/40 group-hover:bg-accent/70"
                    : "bg-line/40"
                )}
                style={{ height: `${heightPercent}%` }}
              >
                {day.isToday && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-sm" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "font-mono text-xs pt-2 transition-colors",
                  day.isToday ? "text-accent-plasma font-semibold" : "text-text-dim"
                )}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
