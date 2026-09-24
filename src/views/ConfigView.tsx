import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import { renderAreaIcon } from '../components/NewAreaModal';
import {
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Shield,
  Layers,
  Trash2,
  Check,
  AlertTriangle
} from 'lucide-react';

interface ConfigViewProps {
  state: AppState;
  onToggleTheme: () => void;
  onExport: () => void;
  onImport: (newState: AppState) => void;
  onReset: () => void;
  onDeleteArea: (areaId: string) => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  state,
  onToggleTheme,
  onExport,
  onImport,
  onReset,
  onDeleteArea
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.areas && parsed.schedule) {
          onImport(parsed as AppState);
          setImportStatus('Backup importado com sucesso!');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Arquivo JSON inválido para o Orbit.');
        }
      } catch (err) {
        setImportStatus('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-24">
      {/* Title */}
      <div>
        <h2 className="font-title font-bold text-2xl text-text">Configurações do Orbit</h2>
        <p className="text-xs text-text-dim mt-1">
          Gerencie tema cósmico, sincronização local, dados e áreas em órbita
        </p>
      </div>

      {/* Theme Section */}
      <div className="card-cosmic p-5 space-y-4">
        <h3 className="font-title font-bold text-sm text-text flex items-center gap-2">
          {state.theme === 'dark' ? <Moon size={16} className="text-accent" /> : <Sun size={16} className="text-amber-500" />}
          <span>Tema Visual</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (state.theme !== 'dark') onToggleTheme();
            }}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              state.theme === 'dark'
                ? 'bg-bg-elev-2 border-accent text-accent-plasma shadow-md'
                : 'bg-bg/60 border-line text-text-dim hover:text-text'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0c0a18] border border-[#2e2652] flex items-center justify-center text-purple-400">
                <Moon size={16} />
              </div>
              <div>
                <span className="font-title font-bold text-sm block">Roxo Espacial</span>
                <span className="text-[11px] font-mono text-text-dim">Escuro cósmico</span>
              </div>
            </div>
            {state.theme === 'dark' && <Check size={16} className="text-accent-plasma" />}
          </button>

          <button
            onClick={() => {
              if (state.theme !== 'light') onToggleTheme();
            }}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              state.theme === 'light'
                ? 'bg-bg-elev-2 border-accent text-accent shadow-md'
                : 'bg-bg/60 border-line text-text-dim hover:text-text'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f8f6fc] border border-[#e2daf2] flex items-center justify-center text-amber-500">
                <Sun size={16} />
              </div>
              <div>
                <span className="font-title font-bold text-sm block">Starlight</span>
                <span className="text-[11px] font-mono text-text-dim">Claro celestial</span>
              </div>
            </div>
            {state.theme === 'light' && <Check size={16} className="text-accent" />}
          </button>
        </div>
      </div>

      {/* Backup & Persistence Section */}
      <div className="card-cosmic p-5 space-y-4">
        <div>
          <h3 className="font-title font-bold text-sm text-text flex items-center gap-2">
            <Shield size={16} className="text-accent-plasma" />
            <span>Persistência & Backup</span>
          </h3>
          <p className="text-xs text-text-dim mt-0.5">
            Os dados são persistidos no navegador (LocalStorage + IndexedDB). Você pode exportar backups manuais a qualquer momento.
          </p>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-accent/15 border border-accent/30 text-xs font-mono text-accent-plasma">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExport}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
          >
            <Download size={15} />
            <span>Exportar Backup (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-bg-elev text-text hover:bg-bg-elev-2 transition-colors text-xs font-medium"
          >
            <Upload size={15} />
            <span>Importar Backup (JSON)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Areas Management */}
      <div className="card-cosmic p-5 space-y-4">
        <div>
          <h3 className="font-title font-bold text-sm text-text flex items-center gap-2">
            <Layers size={16} className="text-accent-plasma" />
            <span>Áreas Configuradas</span>
          </h3>
          <p className="text-xs text-text-dim mt-0.5">
            Lista de todas as áreas ativas no Orbit
          </p>
        </div>

        <div className="space-y-2">
          {state.areas.map((area) => (
            <div
              key={area.id}
              className="flex items-center justify-between p-3 rounded-xl bg-bg/60 border border-line"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: area.color }}
                >
                  {renderAreaIcon(area.icon, 15)}
                </div>
                <div>
                  <span className="font-title font-semibold text-sm text-text">
                    {area.label}
                  </span>
                  {area.beta && (
                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ml-2 bg-line text-text-faint">
                      beta
                    </span>
                  )}
                </div>
              </div>

              {/* Only allow deleting if there are more than 2 areas */}
              {state.areas.length > 2 && (
                <button
                  onClick={() => onDeleteArea(area.id)}
                  className="p-1.5 rounded-lg text-text-faint hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Remover esta área"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone: Reset to Default Physics Seed Data */}
      <div className="card-cosmic p-5 border-danger/30 space-y-3">
        <h3 className="font-title font-bold text-sm text-danger flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Zona de Reset</span>
        </h3>
        <p className="text-xs text-text-dim">
          Restaura o sistema para o cronograma de estudos de física original e metas iniciais descritas na especificação.
        </p>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-danger/40 text-danger hover:bg-danger/10 transition-colors text-xs font-mono"
          >
            <RotateCcw size={14} />
            <span>Resetar para Cronograma Padrão</span>
          </button>
        ) : (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl space-y-2">
            <p className="text-xs text-danger font-medium">
              Tem certeza? Todas as modificações locais serão substituídas pelos dados de exemplo da spec.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onReset();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-semibold hover:bg-danger/90"
              >
                Sim, resetar dados
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-bg-elev text-text-dim text-xs hover:text-text"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
