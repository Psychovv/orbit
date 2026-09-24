import React, { useState } from 'react';
import { Area, Priority, Weekday } from '../types';
import { WEEKDAYS, WEEKDAY_LABELS, getTodayWeekday } from '../utils/date';
import { X, CheckCircle2, Target } from 'lucide-react';
import { SlideUp, Backdrop } from '../components/motion';
import { AnimatePresence } from 'framer-motion';

interface QuickCreateModalProps {
  isOpen: boolean;
  initialType?: 'task' | 'goal';
  initialAreaId?: string;
  initialWeekday?: Weekday;
  areas: Area[];
  onClose: () => void;
  onCreateTask: (data: {
    areaId: string;
    weekday: Weekday;
    blockTitle?: string;
    label: string;
    note?: string;
  }) => void;
  onCreateGoal: (data: {
    areaId: string;
    label: string;
    due?: string;
    priority: Priority;
  }) => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  initialType = 'task',
  initialAreaId,
  initialWeekday,
  areas,
  onClose,
  onCreateTask,
  onCreateGoal
}) => {
  const [itemType, setItemType] = useState<'task' | 'goal'>(initialType);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    initialAreaId || (areas[0]?.id ?? 'facul')
  );
  const [selectedWeekday, setSelectedWeekday] = useState<Weekday>(
    initialWeekday || getTodayWeekday()
  );
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [blockTitle, setBlockTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState<Priority>('media');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (itemType === 'task') {
      onCreateTask({
        areaId: selectedAreaId,
        weekday: selectedWeekday,
        blockTitle: blockTitle.trim() || undefined,
        label: title.trim(),
        note: note.trim() || undefined
      });
    } else {
      onCreateGoal({
        areaId: selectedAreaId,
        label: title.trim(),
        due: due || undefined,
        priority
      });
    }

    setTitle('');
    setNote('');
    setBlockTitle('');
    setDue('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop onClick={onClose} className="p-4 items-center justify-center">
          <SlideUp className="relative w-full max-w-lg rounded-2xl bg-bg-elev border border-line-strong p-7 shadow-2xl z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setItemType('task')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-title font-medium text-sm transition-all ${
                    itemType === 'task'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-dim hover:text-text bg-bg-elev-2'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>Nova Tarefa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setItemType('goal')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-title font-medium text-sm transition-all ${
                    itemType === 'goal'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-dim hover:text-text bg-bg-elev-2'
                  }`}
                >
                  <Target size={16} />
                  <span>Nova Meta</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-text-dim hover:text-text hover:bg-bg-elev-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  {itemType === 'task' ? 'O que precisa ser feito?' : 'Qual é o objetivo da meta?'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    itemType === 'task'
                      ? 'Ex: Fazer exercícios da lista de Bernoulli...'
                      : 'Ex: Dominar prova de física até próxima semana...'
                  }
                  className="w-full px-4 py-3 rounded-xl bg-bg border border-line text-base text-text placeholder-text-faint focus:outline-none focus:border-accent-light transition-all"
                />
              </div>

              {/* Area selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Área</label>
                  <select
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-sm text-text focus:outline-none focus:border-accent-light"
                  >
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.label} {area.beta ? '(Beta)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Task specific: Weekday */}
                {itemType === 'task' ? (
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">Dia da Semana</label>
                    <select
                      value={selectedWeekday}
                      onChange={(e) => setSelectedWeekday(e.target.value as Weekday)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-sm text-text focus:outline-none focus:border-accent-light"
                    >
                      {WEEKDAYS.map((w) => (
                        <option key={w} value={w}>
                          {WEEKDAY_LABELS[w]}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  /* Goal specific: Priority */
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">Prioridade</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-sm text-text focus:outline-none focus:border-accent-light"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Goal specific: Due Date */}
              {itemType === 'goal' && (
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Data Limite / Prazo (Opcional)
                  </label>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-sm text-text focus:outline-none focus:border-accent-light"
                  />
                </div>
              )}

              {/* Task specific: Optional Block Title & Note */}
              {itemType === 'task' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">
                      Título do Bloco (Opcional)
                    </label>
                    <input
                      type="text"
                      value={blockTitle}
                      onChange={(e) => setBlockTitle(e.target.value)}
                      placeholder="Deixe em branco para adicionar ao bloco principal do dia"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-sm text-text placeholder-text-faint focus:outline-none focus:border-accent-light"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">
                      Nota / Observação (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Fórmulas, links ou instruções rápidas..."
                      className="w-full p-3 rounded-xl bg-bg border border-line text-sm font-mono text-text placeholder-text-faint focus:outline-none focus:border-accent-light resize-none"
                    />
                  </div>
                </>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-dim hover:text-text hover:bg-bg-elev-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                >
                  {itemType === 'task' ? 'Criar Tarefa' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </SlideUp>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};
