// Recado do Cecinho na Agenda (SPEC-035 D6). Orienta, não cobra: uma frase, no
// máximo um CTA, e a dispensa como ação secundária. A frase vem de `voice.ts`.
import React from 'react';
import { X } from 'lucide-react';
import type { AgendaTone } from '../../lib/agenda';
import { DICA, VOZ, frase } from '../../lib/voice';

interface CecinhoAgendaNoteProps {
  tone: AgendaTone;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}

/** O tom vem da carga derivada; a frase, do catálogo. */
const CHAVE_POR_TOM: Record<AgendaTone, string> = {
  overdue: 'agendaAtrasadas',
  exam: 'agendaProvaProxima',
  busy: 'agendaDiaCheio',
  inbox: 'agendaInboxCheia',
  empty: 'agendaDiaVazio',
  calm: 'agendaDiaVazio',
};

export const CecinhoAgendaNote: React.FC<CecinhoAgendaNoteProps> = ({
  tone,
  actionLabel,
  onAction,
  onDismiss,
}) => (
  <section className="rounded-2xl border border-ceci-border-brand bg-surface-rose p-3.5">
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="shrink-0 w-8 h-8 rounded-xl bg-ceci-brand-strong text-ceci-on-brand flex items-center justify-center font-display font-bold text-sm"
      >
        c
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
          {VOZ.rotuloDica}
        </p>
        <p className="text-[12px] text-ceci-primary leading-relaxed">
          {frase(DICA, CHAVE_POR_TOM[tone])}
        </p>
        <button
          type="button"
          onClick={onAction}
          className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-surface-default text-ceci-brand-strong border border-ceci-border-brand min-h-[36px] cursor-pointer"
        >
          {actionLabel}
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="dispensar o recado do cecinho"
        className="shrink-0 w-9 h-9 -mr-1 -mt-1 rounded-full flex items-center justify-center text-ceci-tertiary hover:bg-surface-default cursor-pointer"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </section>
);
