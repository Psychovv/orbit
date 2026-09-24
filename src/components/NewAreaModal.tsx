import React, { useState } from 'react';
import { Area } from '../types';
import {
  X,
  GraduationCap,
  Music,
  Book,
  Wallet,
  Sparkles,
  Code,
  Dumbbell,
  Heart,
  Briefcase,
  Flame,
  Rocket,
  Palette,
  Coffee,
  Cpu
} from 'lucide-react';
import { SlideUp, Backdrop } from '../components/motion';
import { AnimatePresence } from 'framer-motion';

interface NewAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateArea: (area: Area) => void;
}

const COSMIC_COLORS = [
  '#8b5cf6', // Quasar Violet
  '#a855f7', // Nebula Purple
  '#ec4899', // Supernova Pink
  '#38bdf8', // Stellar Blue
  '#06b6d4', // Cyan Plasma
  '#10b981', // Emerald Aurora
  '#f59e0b', // Solar Flare Amber
  '#f97316', // Mars Orange
  '#ef4444', // Red Giant
  '#6366f1'  // Deep Cosmic Indigo
];

export const AVAILABLE_ICONS = [
  { id: 'graduation-cap', label: 'Estudo', Icon: GraduationCap },
  { id: 'music', label: 'Música', Icon: Music },
  { id: 'book', label: 'Leitura', Icon: Book },
  { id: 'wallet', label: 'Finanças', Icon: Wallet },
  { id: 'code', label: 'Código', Icon: Code },
  { id: 'dumbbell', label: 'Treino', Icon: Dumbbell },
  { id: 'heart', label: 'Saúde', Icon: Heart },
  { id: 'briefcase', label: 'Trabalho', Icon: Briefcase },
  { id: 'flame', label: 'Foco', Icon: Flame },
  { id: 'rocket', label: 'Projetos', Icon: Rocket },
  { id: 'palette', label: 'Design', Icon: Palette },
  { id: 'coffee', label: 'Rotina', Icon: Coffee },
  { id: 'cpu', label: 'Tech', Icon: Cpu },
  { id: 'sparkles', label: 'Criativo', Icon: Sparkles }
];

export const renderAreaIcon = (iconName: string, size = 16, className = '') => {
  const found = AVAILABLE_ICONS.find((i) => i.id === iconName);
  if (found) {
    const Component = found.Icon;
    return <Component size={size} className={className} />;
  }
  return <Sparkles size={size} className={className} />;
};

export const NewAreaModal: React.FC<NewAreaModalProps> = ({
  isOpen,
  onClose,
  onCreateArea
}) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(COSMIC_COLORS[0]);
  const [icon, setIcon] = useState('sparkles');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const id = label
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);

    onCreateArea({
      id,
      label: label.trim(),
      color,
      icon
    });

    setLabel('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop onClick={onClose} className="p-4 items-center justify-center">
          <SlideUp className="relative w-full max-w-md rounded-2xl bg-bg-elev border border-line-strong p-7 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: color }}
                >
                  {renderAreaIcon(icon, 18)}
                </div>
                <div>
                  <h3 className="font-title font-bold text-lg text-text">Criar Nova Área</h3>
                  <p className="text-sm text-text-dim">Adicione um novo eixo à sua órbita</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-text-dim hover:text-text hover:bg-bg-elev-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Nome da Área
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Trabalho, Saúde, Idiomas..."
                  className="w-full px-4 py-3 rounded-xl bg-bg border border-line text-base text-text placeholder-text-faint focus:outline-none focus:border-accent-light transition-all"
                />
              </div>

              {/* Color Picker with Cosmic Presets */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Cor Cósmica
                </label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {COSMIC_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110 opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 ml-1">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0"
                      title="Cor personalizada"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Ícone
                </label>
                <div className="grid grid-cols-7 gap-2.5 max-h-40 overflow-y-auto p-2 bg-bg/50 rounded-xl border border-line">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.Icon;
                    const isSelected = icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-accent text-white shadow-sm scale-105'
                            : 'text-text-dim hover:text-text hover:bg-bg-elev-2'
                        }`}
                        title={item.label}
                      >
                        <IconComp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
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
                  Criar Área
                </button>
              </div>
            </form>
          </SlideUp>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};
