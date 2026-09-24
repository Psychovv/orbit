import React, { useState, useEffect } from 'react';
import { ScheduleBlock, Area } from '../types';
import { cosmicSound } from '../utils/sound';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Radio,
  Sparkles
} from 'lucide-react';
import { FadeUp } from '../components/motion';
import { AnimatePresence, motion } from 'framer-motion';

interface FocusModeOverlayProps {
  block: ScheduleBlock;
  area?: Area;
  isOpen: boolean;
  onClose: () => void;
  onToggleTask: (taskId: string, blockId: string) => void;
}

export const FocusModeOverlay: React.FC<FocusModeOverlayProps> = ({
  block,
  area,
  isOpen,
  onClose,
  onToggleTask
}) => {
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isRunning) {
      setIsRunning(false);
      // Play a gentle notification chime or alert
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerSeconds]);

  // Clean up sound on unmount or close
  useEffect(() => {
    if (!isOpen) {
      cosmicSound.stop();
      setIsAudioPlaying(false);
      setIsRunning(false);
    }
  }, [isOpen]);

  const toggleSound = () => {
    if (isAudioPlaying) {
      cosmicSound.stop();
      setIsAudioPlaying(false);
    } else {
      cosmicSound.play(volume);
      setIsAudioPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    cosmicSound.setVolume(val);
  };

  const setTimerPreset = (mins: number) => {
    setIsRunning(false);
    const secs = mins * 60;
    setInitialSeconds(secs);
    setTimerSeconds(secs);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const completedCount = block.tasks.filter((t) => t.done).length;
  const totalCount = block.tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-bg/95 backdrop-blur-xl p-8 sm:p-12"
        >
          {/* Top Bar */}
          <FadeUp delay={0.1} className="flex items-center justify-between max-w-4xl w-full mx-auto">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shadow-[0_0_10px_var(--glow)]"
                style={{
                  backgroundColor: area?.color || 'var(--accent)',
                  ['--glow' as string]: area?.color || 'var(--accent)'
                }}
              />
              <div>
                <span className="font-mono text-sm uppercase tracking-widest text-text-dim">
                  Modo Foco Cósmico · {area?.label || 'Estudo'}
                </span>
                <h2 className="font-title font-bold text-xl sm:text-2xl text-text">
                  {block.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-3 rounded-full border border-line bg-bg-elev text-text-dim hover:text-text hover:border-line-strong transition-all"
              title="Sair do modo foco (Esc)"
            >
              <X size={20} />
            </button>
          </FadeUp>

          {/* Center: Timer & Ambient Sound */}
          <FadeUp delay={0.2} className="max-w-2xl w-full mx-auto my-auto flex flex-col items-center text-center">
            {/* Timer Display */}
            <div className="relative my-4 select-none">
              <div className="font-mono font-bold text-7xl sm:text-9xl tracking-tight text-text">
                {formatTime(timerSeconds)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-base transition-all"
                >
                  {isRunning ? <Pause size={18} /> : <Play size={18} />}
                  <span>{isRunning ? 'Pausar' : 'Iniciar Foco'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsRunning(false);
                    setTimerSeconds(initialSeconds);
                  }}
                  className="p-3 rounded-xl border border-line bg-bg-elev text-text-dim hover:text-text hover:bg-bg-elev-2 transition-colors"
                  title="Reiniciar temporizador"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              {/* Presets */}
              <div className="flex items-center justify-center gap-3 mt-4">
                {[15, 25, 45, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTimerPreset(m)}
                    className={`px-3.5 py-1.5 rounded-lg font-mono text-sm transition-colors ${
                      initialSeconds === m * 60
                        ? 'bg-accent/20 border border-accent text-accent-plasma font-semibold'
                        : 'text-text-dim hover:text-text hover:bg-bg-elev-2'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Sound Controller */}
            <div className="flex items-center gap-3 bg-bg-elev/80 border border-line px-5 py-3 rounded-2xl mt-4">
              <button
                onClick={toggleSound}
                className={`flex items-center gap-2 text-sm font-mono px-4 py-2 rounded-xl transition-all ${
                  isAudioPlaying
                    ? 'bg-accent text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'text-text-dim hover:text-text hover:bg-bg-elev-2'
                }`}
              >
                {isAudioPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>Som Espacial ({isAudioPlaying ? 'Ativo' : 'Desligado'})</span>
                {isAudioPlaying && <Radio size={14} className="animate-pulse" />}
              </button>

              {isAudioPlaying && (
                <input
                  type="range"
                  min="0"
                  max="0.6"
                  step="0.02"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 accent-accent cursor-pointer"
                  title="Volume do ruído cósmico"
                />
              )}
            </div>

            {/* Focus Tasks Checklist */}
            <div className="w-full mt-10 text-left bg-bg-elev/60 border border-line rounded-2xl p-6 max-h-[38vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 border-b border-line/40 pb-3">
                <span className="font-title font-semibold text-base text-text flex items-center gap-2">
                  <Sparkles size={16} className="text-accent-plasma" />
                  Tarefas do Bloco ({completedCount}/{totalCount})
                </span>
                <span className="font-mono text-sm text-text-dim">{Math.round(progressPercent)}%</span>
              </div>

              <div className="space-y-3.5">
                {block.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id, block.id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      task.done
                        ? 'bg-bg-elev/30 border-line/40 opacity-60'
                        : 'bg-bg-elev border-line hover:border-line-strong'
                    }`}
                  >
                    <div className="mt-0.5">
                      <CheckCircle2
                        size={20}
                        className={task.done ? 'text-success' : 'text-text-dim/60'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-base font-medium ${
                          task.done ? 'line-through text-text-faint' : 'text-text'
                        }`}
                      >
                        {task.label}
                      </p>
                      {task.note && (
                        <p className="font-mono text-sm text-text-dim mt-1.5 bg-bg/40 px-3 py-1 rounded border border-line/30 w-fit">
                          {task.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Footer Info */}
          <FadeUp delay={0.3} className="max-w-4xl w-full mx-auto flex items-center justify-between text-sm text-text-faint font-mono">
            <span>Pressione ESC para sair</span>
            <span>Orbit Deep Space Focus</span>
          </FadeUp>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
