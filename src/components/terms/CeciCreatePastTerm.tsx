import React, { useState } from 'react';
import { useMobileApp } from '@/context/mobileApp';
import { erro, frase, VAZIO } from '../../lib/voice';
import { cn } from '@/lib/utils';
import { Modal } from '../ui/Modal';

export interface CeciCreatePastTermProps {
  onSaved: () => void;
  onClose: () => void;
}

/**
 * Modal para criar um semestre passado retroativamente (SPEC-SEMESTRES-PASSADOS-MEMORIAS-REDESIGN).
 *
 * O usuário preenche número do semestre, rótulo, início e término. O termo
 * nasce `encerrado` e aparece no histórico de semestres passados, onde pode
 * receber memórias depois. Nunca cria categoria livre nem summary — dados de
 * aula/foco/leitura continuam vindo apenas da virada de semestre.
 */
export const CeciCreatePastTerm: React.FC<CeciCreatePastTermProps> = ({
  onSaved,
  onClose,
}) => {
  const { academicTerms, createPastTerm } = useMobileApp();
  const [ordinal, setOrdinal] = useState('');
  const [label, setLabel] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const handleSave = () => {
    const o = Math.trunc(Number(ordinal));
    if (!Number.isFinite(o) || o < 1 || o > 12) {
      setErroMsg(erro('semestrePassadoIntervalo'));
      return;
    }
    if (!startedAt || !endedAt) {
      setErroMsg(erro('semestrePassadoSemDatas'));
      return;
    }
    if (endedAt < startedAt) {
      setErroMsg(frase(VAZIO, 'criarSemestrePassadoErroOrdem'));
      return;
    }
    const jaExiste = academicTerms.some(
      (t) => t.status === 'encerrado' && t.ordinal === o,
    );
    if (jaExiste) {
      setErroMsg(frase(VAZIO, 'criarSemestrePassadoErroDuplicado'));
      return;
    }
    setErroMsg(null);
    createPastTerm({
      ordinal: o,
      label: label.trim() || undefined,
      startedAt,
      endedAt,
    });
    onSaved();
    onClose();
  };

  return (
    <Modal open onClose={onClose} position="bottom" showGrabber labelledBy="dialog-criar-semestre-passado">
      <div className="space-y-4">
        <h2 id="dialog-criar-semestre-passado" className="font-display font-bold text-ceci-primary">
          {frase(VAZIO, 'criarSemestrePassadoTitulo')}
        </h2>
        <p className="text-sm text-ceci-secondary">
          {frase(VAZIO, 'criarSemestrePassadoSubtitulo')}
        </p>

        <div>
          <label className="block text-xs font-semibold text-ceci-text-soft">
            {frase(VAZIO, 'criarSemestrePassadoLabelOrdinal')}
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={ordinal}
            onChange={(e) => setOrdinal(e.target.value)}
            placeholder="1"
            className={cn(
              'w-full rounded-xl border px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand',
              erroMsg === erro('semestrePassadoIntervalo')
                ? 'border-status-danger'
                : 'border-ceci-border-default',
            )}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ceci-text-soft">
            {frase(VAZIO, 'criarSemestrePassadoLabelLabel')}
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ex.: 1º semestre"
            className="w-full rounded-xl border border-ceci-border-default bg-surface-input px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ceci-text-soft">
              {frase(VAZIO, 'criarSemestrePassadoLabelInicio')}
            </label>
            <input
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="w-full rounded-xl border border-ceci-border-default bg-surface-input px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ceci-text-soft">
              {frase(VAZIO, 'criarSemestrePassadoLabelFim')}
            </label>
            <input
              type="date"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className={cn(
                'w-full rounded-xl border border-ceci-border-default bg-surface-input px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand',
                erroMsg === frase(VAZIO, 'criarSemestrePassadoErroOrdem')
                  ? 'border-status-danger'
                  : 'border-ceci-border-default',
              )}
            />
          </div>
        </div>

        {erroMsg && (
          <p className="mt-1 text-[11px] text-status-danger">{erroMsg}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ceci-border-default bg-surface-default px-4 py-2 text-sm text-ceci-secondary hover:bg-surface-muted cursor-pointer"
          >
            {frase(VAZIO, 'criarSemestrePassadoAcaoCancelar')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full border border-ceci-border-brand bg-ceci-brand px-4 py-2 text-sm text-ceci-on-brand hover:bg-ceci-brand-strong cursor-pointer"
          >
            {frase(VAZIO, 'criarSemestrePassadoAcaoSalvar')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
