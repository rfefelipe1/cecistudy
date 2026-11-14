import React from 'react';
import { AlertCircle } from 'lucide-react';
import { CeciDatePicker } from '../../ui/ceci';
import type { WizardStep } from '../WizardScaffold';
import type { InternshipLogType } from '../../../types';

const HOUR_SHORTCUTS = ['1', '2', '3', '4', '6'];

interface EssentialStepProps {
  kind: InternshipLogType | null;
  activity: string;
  hours: string;
  date: string;
  missingInitials: boolean;
  titleHint: string;
  hoursTooHigh: boolean;
  isFuture: boolean;
  onPatch: (parcial: { activity?: string; hours?: string; date?: string }) => void;
  futureNotice: React.ReactNode | null;
  extra?: React.ReactNode;
}

/** Retorna o objeto WizardStep do passo essencial: o que aconteceu e quando. */
export function EssentialStep(props: EssentialStepProps): WizardStep {
  const {
    kind,
    activity,
    hours,
    date,
    missingInitials,
    titleHint,
    hoursTooHigh,
    isFuture,
    onPatch,
    futureNotice,
    extra,
  } = props;

  const hoursField = (
    <div>
      <label
        htmlFor="internship-horas-input"
        className="block text-xs font-medium text-ceci-secondary mb-1"
      >
        horas
      </label>
      <input
        id="internship-horas-input"
        inputMode="decimal"
        value={hours}
        onChange={(e) => onPatch({ hours: e.target.value })}
        placeholder="ex: 1,5"
        className="w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand transition-shadow"
      />
      {hoursTooHigh ? (
        <p className="text-[11px] text-status-warning-strong mt-1">até 24 h por registro</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {HOUR_SHORTCUTS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onPatch({ hours: h })}
              className="min-h-[44px] px-3 rounded-full text-xs font-semibold bg-surface-muted border border-ceci-border-subtle text-ceci-secondary cursor-pointer tap-interactive"
            >
              {h} h
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const futureNoticeEl = isFuture ? (
    <p className="text-[11px] text-status-warning-strong inline-flex items-center gap-1.5">
      <AlertCircle className="w-3.5 h-3.5" aria-hidden />
      essa data ainda não chegou — vai ficar como agendado ♡
    </p>
  ) : null;

  return {
    id: 'essencial',
    title: 'essencial',
    headline: 'o que aconteceu e quando?',
    subtitle: 'horas e data são opcionais e dá para ajustar depois.',
    content: (
      <div className="space-y-4">
        {kind === 'atendimento_clinico' && missingInitials && (
          <p className="text-[11px] text-status-warning-strong">
            coloque as iniciais do paciente
          </p>
        )}
        {extra}
        <div>
          <label
            htmlFor="internship-atividade-input"
            className="block text-xs font-medium text-ceci-secondary mb-1"
          >
            título (opcional)
          </label>
          <input
            id="internship-atividade-input"
            value={activity}
            onChange={(e) => onPatch({ activity: e.target.value })}
            placeholder={titleHint}
            className="w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand transition-shadow"
          />
          {!activity.trim() && (
            <p className="text-[11px] text-ceci-tertiary mt-1">
              vazio salva como “{titleHint}”
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {hoursField}
          <div>
            <label htmlFor="internship-data-input" className="block text-xs font-medium text-ceci-secondary mb-1">
              data
            </label>
            <CeciDatePicker
              htmlFor="internship-data-input"
              value={date ?? null}
              onChange={(v) => onPatch({ date: v })}
            />
            {futureNotice || futureNoticeEl}
          </div>
        </div>
      </div>
    ),
  };
}
