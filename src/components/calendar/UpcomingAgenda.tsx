// Próximos 14 dias agrupados por hoje / amanhã / próximos dias
// (SPEC-redesign-calendario §15).
import React from 'react';
import { formatDateBR, todayKeyLocal, addDaysKey } from '../../lib/dateBR';
import { CalendarEventCard } from './CalendarEventCard';

import type { PersonalCalendarEvent } from '../../lib/personalCalendar';

interface UpcomingDayGroupProps {
  date: string;
  events: PersonalCalendarEvent[];
  label: string;
  onOpen: (event: PersonalCalendarEvent) => void;
}

const UpcomingDayGroup: React.FC<UpcomingDayGroupProps> = ({
  date,
  events,
  label,
  onOpen,
}) => {
  const today = todayKeyLocal();

  if (events.length === 0) {
    return (
      <section className="rounded-xl border border-ceci-border-subtle bg-surface-muted p-3 space-y-2">
        <h4 className="font-display text-xs font-bold text-ceci-primary">
          {label} · {formatDateBR(date)}
        </h4>
        <p className="text-[11px] text-ceci-secondary">
          nada marcado por aqui ♡
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-ceci-border-default bg-surface-default p-3 space-y-2">
      <h4 className="font-display text-xs font-bold text-ceci-primary">
        {label} · {formatDateBR(date)}
      </h4>
      <div className="divide-y divide-ceci-border-subtle space-y-2">
        {events.map((e) => (
          <CalendarEventCard
            key={e.id}
            event={e}
            onOpen={() => onOpen(e)}
          />
        ))}
      </div>
    </section>
  );
};

interface UpcomingAgendaProps {
  todayEvents: PersonalCalendarEvent[];
  tomorrowEvents: PersonalCalendarEvent[];
  upcomingDays: Array<{ date: string; events: PersonalCalendarEvent[] }>;
  onOpen: (event: PersonalCalendarEvent) => void;
}

export const UpcomingAgenda: React.FC<UpcomingAgendaProps> = ({
  todayEvents,
  tomorrowEvents,
  upcomingDays,
  onOpen,
}) => {
  const today = todayKeyLocal();

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-ceci-secondary px-0.5">
        próximos dias
      </h2>

      <UpcomingDayGroup
        date={today}
        events={todayEvents}
        label="hoje"
        onOpen={onOpen}
      />

      <UpcomingDayGroup
        date={addDaysKey(today, 1)}
        events={tomorrowEvents}
        label="amanhã"
        onOpen={onOpen}
      />

      <h3 className="text-xs font-semibold text-ceci-secondary px-0.5 mt-2">
        depois de amanhã
      </h3>
      <div className="space-y-1">
        {upcomingDays
          .filter((d) => d.date !== today && d.date !== addDaysKey(today, 1))
          .map((group) => (
            <UpcomingDayGroup
              key={group.date}
              date={group.date}
              events={group.events}
              label=""
              onOpen={onOpen}
            />
          ))}
      </div>
    </section>
  );
};
