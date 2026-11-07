// Calendário mensal compacto (SPEC-redesign-calendario §12).
// Permite navegar por datas com indicadores por tipo de evento.
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DateKey } from '../../types';

interface CalendarDay {
  date: DateKey;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  eventKinds: string[];
  eventCount: number;
}

interface CompactMonthCalendarProps {
  year: number;
  month: number;
  monthLabel: string;
  days: CalendarDay[];
  today: DateKey;
  selected: DateKey | null;
  onShift: (delta: number) => void;
  onToday: () => void;
  onSelect: (day: DateKey) => void;
}

const WEEKDAY_HEADERS = ['d', 's', 't', 'q', 'q', 's', 's'];

const dotForKind = (kind: string): string => {
  switch (kind) {
    case 'class':
      return 'bg-ceci-academic-strong';
    case 'exam':
      return 'bg-ceci-brand-strong';
    case 'task':
      return 'bg-surface-warm';
    case 'internship':
      return 'bg-surface-mint';
    case 'focus':
      return 'bg-surface-rose';
    case 'reading':
      return 'bg-surface-blue';
    case 'review':
      return 'bg-surface-gold';
    case 'tcc':
      return 'bg-ceci-brand-strong';
    default:
      return 'bg-surface-subtle';
  }
};

export const CompactMonthCalendar: React.FC<CompactMonthCalendarProps> = ({
  year,
  month,
  monthLabel,
  days,
  today,
  selected,
  onShift,
  onToday,
  onSelect,
}) => {
  const isCurrentMonth = today.startsWith(`${year}-${String(month).padStart(2, '0')}`);

  return (
    <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-4 space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="font-display text-base font-bold text-ceci-primary">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onShift(-1)}
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
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-brand hover:bg-surface-rose transition-colors cursor-pointer"
            >
              hoje
            </button>
          )}
          <button
            type="button"
            onClick={() => onShift(1)}
            aria-label="próximo mês"
            className="w-8 h-8 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-ceci-tertiary py-1 border-b border-ceci-border-default">
        {WEEKDAY_HEADERS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
        {days.map((day) => {
          const isToday = day.isToday;
          const isSelected = day.isSelected;
          const hasEntry = day.eventCount > 0;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelect(day.date)}
              aria-label={
                day.isCurrentMonth
                  ? `dia ${day.date.slice(8)}${
                      hasEntry ? `, ${day.eventCount} itens` : ''
                    }`
                  : `dia ${day.date.slice(8)} do mês anterior ou seguinte`
              }
              aria-current={isToday ? 'date' : undefined}
              aria-selected={isSelected || undefined}
              disabled={!day.isCurrentMonth}
              className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[40px] font-medium transition-colors cursor-pointer ${
                isToday && isSelected
                  ? 'bg-ceci-brand-strong text-ceci-on-brand font-bold ring-2 ring-ceci-border-brand'
                  : isSelected
                    ? 'bg-surface-blue text-ceci-academic-strong font-bold border border-ceci-border-academic'
                    : isToday
                      ? 'bg-ceci-brand-strong text-ceci-on-brand font-bold'
                      : hasEntry
                        ? 'bg-surface-rose text-ceci-brand-strong font-bold border border-ceci-border-brand hover:bg-surface-rose'
                        : day.isCurrentMonth
                          ? 'bg-surface-muted text-ceci-primary hover:bg-surface-subtle'
                          : 'text-ceci-faded hover:bg-surface-subtle'
              }`}
            >
              <span>{day.date.slice(8)}</span>
              {hasEntry && (
                <div className="flex gap-0.5 mt-0.5">
                  {day.eventKinds.slice(0, 3).map((kind) => (
                    <span
                      key={kind}
                      className={`w-1.5 h-1.5 rounded-full ${dotForKind(kind)}`}
                      aria-hidden="true"
                    />
                  ))}
                  {day.eventCount > 3 && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-ceci-tertiary text-[10px] text-ceci-on-brand flex items-center justify-center"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
