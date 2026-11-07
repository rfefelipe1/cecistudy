// Agenda da data selecionada (SPEC-redesign-calendario §13).
import React from 'react';
import { formatDateBR, todayKeyLocal, addDaysKey } from '../../lib/dateBR';
import { CalendarEventCard } from './CalendarEventCard';
import type { PersonalCalendarEvent } from '../../lib/personalCalendar';

interface SelectedDayAgendaProps {
  date: string;
  events: PersonalCalendarEvent[];
  onOpen: (event: PersonalCalendarEvent) => void;
}

export const SelectedDayAgenda: React.FC<SelectedDayAgendaProps> = ({
  date,
  events,
  onOpen,
}) => {
  const today = todayKeyLocal();
  const tomorrow = addDaysKey(today, 1);

  const label =
    date === today
      ? 'hoje'
      : date === tomorrow
        ? 'amanhã'
        : formatDateBR(date);

  if (events.length === 0) {
    return (
      <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-ceci-primary">
            {label} · {formatDateBR(date)}
          </h3>
        </div>
        <div className="rounded-xl border border-ceci-border-subtle bg-surface-muted p-4 text-center space-y-2">
          <p className="text-[12px] text-ceci-secondary">
            nada marcado para este dia ♡
          </p>
          <p className="text-[11px] text-ceci-tertiary">
            um espacinho livre no seu planner.
          </p>
        </div>
      </section>
    );
  }

  const timed = events.filter((e) => e.startTime);
  const allDay = events.filter((e) => !e.startTime);

  return (
    <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-ceci-primary">
          {label} · {formatDateBR(date)}
        </h3>
      </div>
      <div className="divide-y divide-ceci-border-subtle space-y-2">
        {timed.map((e) => (
          <CalendarEventCard
            key={e.id}
            event={e}
            onOpen={() => onOpen(e)}
          />
        ))}
        {allDay.map((e) => (
          <CalendarEventCard
            key={e.id}
            event={e}
            showTime={false}
            onOpen={() => onOpen(e)}
          />
        ))}
      </div>
    </section>
  );
};
