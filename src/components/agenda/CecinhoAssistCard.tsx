// Cartão do Cecinho na Agenda (SPEC-037 T010).
//
// Um CTA só. Ele não compete com "atenção primeiro": aparece depois dos
// controles da agenda e só quando há novidade, acompanhamento ou sugestão.
import React from 'react';
import { Sparkles } from 'lucide-react';
import { CecinhoPendingBadge } from '@/agent/ui/CecinhoPendingBadge';
import { DICA, frase } from '@/lib/voice';

interface CecinhoAssistCardProps {
  unread: number;
  assistedCount: number;
  /** Tarefa elegível à ajuda global, quando o toggle está ligado. */
  suggestionTitle?: string;
  onOpenCenter: () => void;
  onActivateSuggestion: () => void;
}

export const CecinhoAssistCard: React.FC<CecinhoAssistCardProps> = ({
  unread,
  assistedCount,
  suggestionTitle,
  onOpenCenter,
  onActivateSuggestion,
}) => {
  const hasAssistance = assistedCount > 0;
  if (!hasAssistance && !suggestionTitle) return null;

  const text = hasAssistance
    ? unread > 0
      ? frase(DICA, 'cecinhoAgendaNovidades', { n: unread })
      : frase(DICA, 'cecinhoAgendaAcompanhar')
    : frase(DICA, 'cecinhoAgendaSugestao', { titulo: suggestionTitle ?? '' });

  const actionLabel = hasAssistance ? 'abrir no cecinho' : 'pedir ajuda';
  const onAction = hasAssistance ? onOpenCenter : onActivateSuggestion;

  return (
    <section className="rounded-2xl border border-ceci-border-brand bg-surface-rose p-3.5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="shrink-0 w-8 h-8 rounded-xl bg-ceci-brand-strong text-ceci-on-brand flex items-center justify-center font-display font-bold text-sm"
        >
          c
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
              cecinho
            </p>
            <CecinhoPendingBadge count={unread} compact />
          </div>
          <p className="text-[12px] text-ceci-primary leading-relaxed">{text}</p>
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-surface-default text-ceci-brand-strong border border-ceci-border-brand min-h-[36px] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            {actionLabel}
          </button>
        </div>
      </div>
    </section>
  );
};
