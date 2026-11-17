// Bottom sheet para definir/editar a meta de horas do estágio (SPEC-009 D2).
// Abre a partir do card "horas feitas" do diário e grava via `onSet`.
import React, { useState } from 'react';
import { Target, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { VAZIO, erro, frase } from '../../lib/voice';
import { formatHours } from '../../lib/formatHours';

interface InternshipGoalSheetProps {
  open: boolean;
  onClose: () => void;
  /** Meta atualmente guardada (opcional, para pré-encher o input). */
  currentHours?: number;
  onSet: (hours: number) => void;
}

export const InternshipGoalSheet: React.FC<InternshipGoalSheetProps> = ({
  open,
  onClose,
  currentHours,
  onSet,
}) => {
  const [value, setValue] = useState(currentHours ? String(currentHours) : '');
  const [error, setError] = useState('');

  const submit = () => {
    const n = Number(value.replace(',', '.'));
    if (!Number.isInteger(n) || n < 1 || n > 5000) {
      setError(erro('metaDeHoras'));
      return;
    }
    onSet(n);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      position="bottom"
      showGrabber
      labelledBy="meta-horas-titulo"
      className="w-full sm:max-w-md"
    >
      <div className="bg-surface-default rounded-[28px] border border-ceci-border-default shadow-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h3 id="meta-horas-titulo" className="font-display font-bold text-lg text-ceci-primary leading-tight">
            meta de horas de estágio
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-muted border border-ceci-border-subtle flex items-center justify-center text-ceci-secondary cursor-pointer tap-interactive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[13px] text-ceci-secondary leading-relaxed">
          quantas horas seu estágio pede no total? dá pra mudar quando quiser ♡
        </p>
        <div className="rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-ceci-tertiary shrink-0">meta</span>
          <input
            autoFocus
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="ex.: 300"
            aria-label="meta de horas em h"
            className="flex-1 bg-transparent border-none text-sm text-ceci-primary focus:ring-0 min-w-0"
          />
          <span className="text-[11px] text-ceci-tertiary shrink-0">h</span>
        </div>
        {error && (
          <p className="text-[11px] text-status-warning-strong">{error}</p>
        )}
        <p className="text-[11px] text-ceci-tertiary leading-relaxed">
          {currentHours
            ? `meta atual: ${formatHours(currentHours)} h`
            : 'sem meta ainda — define a sua abaixo ♡'}
        </p>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={submit}
            className="flex-1 min-h-[44px] rounded-xl bg-ceci-primary text-ceci-on-primary text-sm font-semibold cursor-pointer tap-interactive transition-colors hover:bg-ceci-primary-hover"
          >
            guardar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl border border-ceci-border-default bg-surface-default text-sm font-semibold text-ceci-secondary cursor-pointer tap-interactive transition-colors hover:bg-surface-rose"
          >
            cancelar
          </button>
        </div>
        <p className="text-[10px] text-ceci-muted text-center">
          {frase(VAZIO, 'semRegistroEstagio')}
        </p>
      </div>
    </Modal>
  );
};
