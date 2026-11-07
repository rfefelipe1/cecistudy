import React, { useState } from 'react';
import { AlertTriangle, BookOpen, Lightbulb, Sparkles } from 'lucide-react';
import {
  validarMemoria,
  MEMORY_CATEGORY_META,
  type MemoryCategory,
  type SemesterMemory,
} from '../../lib/semesterMemory';
import { formatDateBR } from '@/core/domain';
import { frase, VAZIO } from '../../lib/voice';
import { cn } from '@/lib/utils';
import { Modal } from '../ui/Modal';

export type CaptureMode = 'quick' | 'guided';

export interface CeciMemoryCaptureProps {
  termId: string;
  initialCategory?: MemoryCategory;
  mode?: CaptureMode;
  /** Memória sem id/timestamps: o ponto de persistência completa esses campos. */
  onSaved: (
    input: Omit<SemesterMemory, 'id' | 'createdAt' | 'updatedAt'> & { now: string },
  ) => void;
  onClose: () => void;
  /** Ação secundária: abrir a entrevista guiada (modo guiado). */
  onGuided?: () => void;
}

/**
 * Captura rápida de uma memória (modo padrão).
 *
 * Nunca cria categoria livre: usa as quatro categorias existentes. `termDate`
 * é derivada do termo pelo ponto de persistência, nunca digitada aqui.
 */
export const CeciMemoryCapture: React.FC<CeciMemoryCaptureProps> = ({
  termId,
  initialCategory,
  mode = 'quick',
  onSaved,
  onClose,
  onGuided,
}) => {
  const [categoria, setCategoria] = useState<MemoryCategory>(initialCategory ?? 'feliz');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [semData, setSemData] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const handleSave = () => {
    const erroValidacao = validarMemoria({
      title: titulo,
      category: categoria,
      description: descricao,
      memoryDate: semData ? undefined : memoryDate,
    });
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }
    setErro(null);
    const agora = new Date().toISOString();
    onSaved({
      termId,
      termDate: '', // preenchido pelo ponto de persistência (derivada do termo)
      title: titulo.trim(),
      category: categoria,
      description: descricao.trim() || undefined,
      memoryDate: semData ? undefined : memoryDate,
      now: agora,
    });
    onClose();
  };

  const ICON_BY_CATEGORY: Record<MemoryCategory, React.ElementType> = {
    feliz: Sparkles,
    engracada: Lightbulb,
    assustadora: AlertTriangle,
    memoravel: BookOpen,
  };

  return (
    <Modal open onClose={onClose} position="bottom" showGrabber labelledBy="dialog-captura-memoria">
      <div className="space-y-4">
        <h2 id="dialog-captura-memoria" className="font-display font-bold text-ceci-primary">
          {frase(VAZIO, 'captureTitulo', { label: 'este semestre' })}
        </h2>
        <p className="text-sm text-ceci-secondary">{frase(VAZIO, 'captureSubtitulo')}</p>

        <div>
          <label className="block text-xs font-semibold text-ceci-text-soft">
            {frase(VAZIO, 'captureLabelCategoria')}
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(['feliz', 'engracada', 'assustadora', 'memoravel'] as const).map((cat) => {
              const Icon = ICON_BY_CATEGORY[cat];
              const meta = MEMORY_CATEGORY_META[cat];
              const sel = categoria === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="radio"
                  aria-pressed={sel}
                  onClick={() => setCategoria(cat)}
                  className={cn(
                    'rounded-xl border px-3 py-3 text-sm font-semibold cursor-pointer transition',
                    sel
                      ? 'border-ceci-brand bg-surface-rose text-ceci-brand-strong'
                      : 'border-ceci-border-default bg-surface-default text-ceci-secondary hover:bg-surface-muted',
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ceci-text-soft">
            título
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={frase(VAZIO, 'capturePlaceholderTitulo')}
            autoFocus
            className={cn(
              'w-full rounded-xl border px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand',
              erro === 'o título é obrigatório' ? 'border-status-danger' : 'border-ceci-border-default',
            )}
          />
          {erro === 'o título é obrigatório' && (
            <p className="mt-1 text-[11px] text-status-danger">{erro}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-ceci-text-soft">
            {frase(VAZIO, 'captureLabelDescricao')}
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={frase(VAZIO, 'capturePlaceholderDescricao')}
            rows={3}
            className="w-full rounded-xl border border-ceci-border-default bg-surface-input px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-ceci-text-soft">
            {frase(VAZIO, 'captureLabelData')}
          </label>
          <button
            type="button"
            role="checkbox"
            aria-checked={semData}
            onClick={() => setSemData(!semData)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-semibold cursor-pointer transition',
              semData
                ? 'border-ceci-border-default bg-surface-default text-ceci-secondary'
                : 'border-ceci-brand bg-surface-rose text-ceci-brand-strong',
            )}
          >
            {semData ? frase(VAZIO, 'captureDataSemData') : formatDateBR(memoryDate)}
          </button>
          {!semData && (
            <input
              type="date"
              value={memoryDate}
              onChange={(e) => setMemoryDate(e.target.value)}
              className="rounded-xl border border-ceci-border-default bg-surface-input px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand"
            />
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onGuided ?? onClose}
            className="rounded-full border border-ceci-border-default bg-surface-default px-4 py-2 text-sm text-ceci-secondary hover:bg-surface-muted cursor-pointer"
          >
            {onGuided ? frase(VAZIO, 'captureModoGuiado') : frase(VAZIO, 'captureAcaoSair')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full border border-ceci-border-brand bg-ceci-brand px-4 py-2 text-sm text-ceci-on-brand hover:bg-ceci-brand-strong cursor-pointer"
          >
            {frase(VAZIO, 'captureAcaoSalvar')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
