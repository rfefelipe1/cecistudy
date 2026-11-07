// Cabeçalho da tela de Calendário (SPEC-redesign-calendario §9).
// Contextualiza a tela sem repetir a navegação global. Sem botão de voltar:
// o retorno cabe à navegação global do app.
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthName } from '../../lib/schedule';

interface CalendarHeaderProps {
  monthLabel: string; // ex.: "outubro de 2026"
  onShiftPrev: () => void;
  onShiftNext: () => void;
  onToday: () => void;
  isCurrentMonth: boolean;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  monthLabel,
  onShiftPrev,
  onShiftNext,
  onToday,
  isCurrentMonth,
}) => {
  return (
    <header className="flex items-center justify-between gap-2 px-0.5">
      <h1 className="font-display text-lg font-bold text-ceci-primary">
        calendário ♡
      </h1>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onShiftPrev}
          aria-label="mês anterior"
          className="w-8 h-8 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {!isCurrentMonth && (
          <button
            type="button"
            onClick={onToday}
            aria-label="voltar para hoje"
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand hover:bg-surface-rose transition-colors cursor-pointer"
          >
            hoje
          </button>
        )}
        <button
          type="button"
          onClick={onShiftNext}
          aria-label="próximo mês"
          className="w-8 h-8 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs font-semibold text-ceci-tertiary">{monthLabel}</p>
    </header>
  );
};
