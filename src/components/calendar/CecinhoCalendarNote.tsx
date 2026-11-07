// Nota do Cecinho para orientar a leitura da semana e do dia
// (SPEC-redesign-calendario §11).
// Mensagem vem de `src/lib/voice.ts` — nunca escrita inline.
import React from 'react';
import { frase, VAZIO, DICA } from '../../lib/voice';

type CecinhoTone = 'calm' | 'busy' | 'exam' | 'study' | 'empty';

interface CecinhoCalendarNoteProps {
  tone: CecinhoTone;
}

const CHAVE_POR_TOM: Record<CecinhoTone, { catalogo: typeof VAZIO | typeof DICA; chave: string }> = {
  // `diaTranquilo` é a chave do tom calmo no catálogo (SPEC-029 D3).
  calm: { catalogo: DICA, chave: 'diaTranquilo' },
  busy: { catalogo: DICA, chave: 'semanaCheia' },
  exam: { catalogo: DICA, chave: 'provaProgramada' },
  study: { catalogo: DICA, chave: 'momentosEstudo' },
  empty: { catalogo: VAZIO, chave: 'calendarioVazio' },
};

export const CecinhoCalendarNote: React.FC<CecinhoCalendarNoteProps> = ({
  tone,
}) => {
  const { catalogo, chave } = CHAVE_POR_TOM[tone];

  return (
    <section className="rounded-2xl border border-ceci-border-default bg-surface-rose p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-ceci-brand-strong">✨</span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ceci-tertiary">
            recado do cecinho
          </p>
          <p className="text-[12px] text-ceci-primary leading-relaxed">
            {frase(catalogo, chave)}
          </p>
        </div>
      </div>
    </section>
  );
};
