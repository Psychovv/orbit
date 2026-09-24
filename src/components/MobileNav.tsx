import React, { useState } from 'react';
import { Area } from '../types';
import { renderAreaIcon } from './NewAreaModal';
import {
  CalendarDays,
  CalendarRange,
  Layers,
  Plus,
  Settings,
  X
} from 'lucide-react';

interface MobileNavProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  areas: Area[];
  onOpenQuickCreate: () => void;
  onOpenNewArea: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView,
  onNavigate,
  areas,
  onOpenQuickCreate,
  onOpenNewArea
}) => {
  const [showAreasDrawer, setShowAreasDrawer] = useState(false);

  return (
    <>
      {/* Bottom Floating/Fixed Bar for Mobile screens < 640px */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-elev/95 backdrop-blur-lg border-t border-line px-2 py-1.5 flex items-center justify-around select-none">
        {/* Hoje */}
        <button
          onClick={() => {
            onNavigate('hoje');
            setShowAreasDrawer(false);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeView === 'hoje' ? 'text-accent-plasma font-semibold' : 'text-text-dim'
          }`}
        >
          <CalendarDays size={18} />
          <span className="text-[10px] font-title">Hoje</span>
        </button>

        {/* Semana */}
        <button
          onClick={() => {
            onNavigate('cronograma');
            setShowAreasDrawer(false);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeView === 'cronograma' ? 'text-accent-plasma font-semibold' : 'text-text-dim'
          }`}
        >
          <CalendarRange size={18} />
          <span className="text-[10px] font-title">Semana</span>
        </button>

        {/* Central Action Button */}
        <button
          onClick={onOpenQuickCreate}
          className="btn-primary -mt-4 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
          title="Novo Item"
        >
          <Plus size={20} />
        </button>

        {/* Áreas Drawer trigger */}
        <button
          onClick={() => setShowAreasDrawer(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            areas.some((a) => a.id === activeView)
              ? 'text-accent-plasma font-semibold'
              : 'text-text-dim'
          }`}
        >
          <Layers size={18} />
          <span className="text-[10px] font-title">Áreas</span>
        </button>

        {/* Configurações */}
        <button
          onClick={() => {
            onNavigate('config');
            setShowAreasDrawer(false);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeView === 'config' ? 'text-accent-plasma font-semibold' : 'text-text-dim'
          }`}
        >
          <Settings size={18} />
          <span className="text-[10px] font-title">Config</span>
        </button>
      </nav>

      {/* Areas Bottom Drawer */}
      {showAreasDrawer && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowAreasDrawer(false)}
          />

          <div className="relative w-full rounded-t-3xl bg-bg-elev border-t border-line-strong p-5 pb-8 shadow-2xl z-10 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-title font-bold text-sm text-text">
                Áreas em Órbita
              </span>
              <button
                onClick={() => setShowAreasDrawer(false)}
                className="p-1.5 rounded-lg text-text-dim hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {areas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => {
                    onNavigate(area.id);
                    setShowAreasDrawer(false);
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    activeView === area.id
                      ? 'bg-bg-elev-2 border-line-strong text-text font-semibold'
                      : 'bg-bg/60 border-line text-text-dim hover:text-text'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${area.color}25`,
                      color: area.color
                    }}
                  >
                    {renderAreaIcon(area.icon, 16)}
                  </div>
                  <span className="text-xs truncate">{area.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowAreasDrawer(false);
                onOpenNewArea();
              }}
              className="mt-3 flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-dashed border-line text-xs font-medium text-text-dim hover:text-accent-plasma hover:border-accent-plasma transition-colors"
            >
              <Plus size={15} />
              <span>Criar Nova Área</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
