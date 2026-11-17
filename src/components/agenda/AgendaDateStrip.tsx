// Faixa de datas da Agenda (SPEC-035 D2/D9): a semana por perto, e o mês como
// camada secundária. O botão de cada dia mostra se ele tem item — o indicador é
// textual no `aria-label`, não só um pontinho.
import React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DateKey } from '../../types';
import { addDaysKey, formatDateBR, weekStartKey } from '../../lib/dateBR';

const WEEKDAY = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Dia da semana de uma `DateKey`, por construtor local — nunca por UTC. */
const weekdayOf = (key: DateKey): string => {
  const [y, m, d] = key.split('-').map(Number);
  return WEEKDAY[new Date(y, m - 1, d).getDay()];
};

interface AgendaDateStripProps {
  today: DateKey;
  selected: DateKey;
  daysWithItems: Set<DateKey>;
  onSelect: (date: DateKey) => void;
  onToday: () => void;
  monthOpen: boolean;
  onToggleMonth: () => void;
}

export const AgendaDateStrip: React.FC<AgendaDateStripProps> = ({
  today,
  selected,
  daysWithItems,
  onSelect,
  onToday,
  monthOpen,
  onToggleMonth,
}) => {
  const weekStart = weekStartKey(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(weekStart, i));

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ceci-primary">
            {selected === today ? 'hoje' : 'dia escolhido'}
          </p>
          <p className="text-[11px] text-ceci-secondary">
            {weekdayOf(selected)}, {formatDateBR(selected)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {selected !== today && (
            <button
              type="button"
              onClick={onToday}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand min-h-[36px] cursor-pointer"
            >
              hoje
            </button>
          )}
          <button
            type="button"
            onClick={onToggleMonth}
            aria-expanded={monthOpen}
            aria-label={monthOpen ? 'fechar o mês' : 'ver o mês'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default min-h-[36px] cursor-pointer"
          >
            {monthOpen ? (
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            mês
          </button>
        </div>
      </div>

      <ol className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const isToday = date === today;
          const isSelected = date === selected;
          const hasItems = daysWithItems.has(date);
          return (
            <li key={date}>
              <button
                type="button"
                onClick={() => onSelect(date)}
                aria-current={isToday ? 'date' : undefined}
                aria-selected={isSelected}
                aria-label={`${weekdayOf(date)} ${date.slice(8, 10)}${hasItems ? ', tem itens' : ''}`}
                className={`w-full min-h-[52px] rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-ceci-brand-strong text-ceci-on-brand border-ceci-brand-strong'
                    : isToday
                      ? 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand'
                      : 'bg-surface-default text-ceci-primary border-ceci-border-default hover:bg-surface-muted'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  {weekdayOf(date)}
                </span>
                <span className="text-sm font-bold tabular-nums">{date.slice(8, 10)}</span>
                <span
                  aria-hidden="true"
                  className={`w-1 h-1 rounded-full ${
                    hasItems
                      ? isSelected
                        ? 'bg-ceci-on-brand'
                        : 'bg-ceci-brand-strong'
                      : 'bg-transparent'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
