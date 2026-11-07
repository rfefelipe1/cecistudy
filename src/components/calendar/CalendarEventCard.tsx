// Card de evento do calendário pessoal (SPEC-redesign-calendario §14).
// Base única com variação semântica por tipo: ícone, cor, label em texto.
import React from 'react';
import {
  BookOpen,
  ClipboardCheck,
  CheckSquare,
  HeartHandshake,
  Timer,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import type { PersonalCalendarEvent } from '../../lib/personalCalendar';

interface CalendarEventCardProps {
  event: PersonalCalendarEvent;
  showTime?: boolean;
  onOpen?: () => void;
  completed?: boolean;
}

const ICON_OF_KIND: Record<PersonalCalendarEvent['kind'], React.ElementType> = {
  class: BookOpen,
  exam: ClipboardCheck,
  task: CheckSquare,
  internship: HeartHandshake,
  focus: Timer,
  reading: BookOpen,
  review: Sparkles,
  tcc: GraduationCap,
};

const CHIP_OF_KIND: Record<PersonalCalendarEvent['kind'], string> = {
  class: 'text-ceci-academic-strong bg-surface-default border-ceci-border-academic',
  exam: 'text-ceci-brand-strong bg-surface-rose border-ceci-border-brand',
  task: 'text-ceci-brand-strong bg-surface-warm border-ceci-border-gold',
  internship: 'text-ceci-brand-strong bg-surface-mint border-ceci-border-mint',
  focus: 'text-ceci-brand-strong bg-surface-rose border-ceci-border-brand',
  reading: 'text-ceci-academic-strong bg-surface-blue border-ceci-border-academic',
  review: 'text-ceci-brand-strong bg-surface-gold border-ceci-border-gold',
  tcc: 'text-ceci-primary bg-surface-gold border-ceci-border-brand',
};

const LABEL_OF_KIND: Record<PersonalCalendarEvent['kind'], string> = {
  class: 'aula',
  exam: 'prova',
  task: 'tarefa',
  internship: 'estágio',
  focus: 'foco',
  reading: 'leitura',
  review: 'revisão',
  tcc: 'TCC',
};

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  showTime = true,
  onOpen,
  completed = false,
}) => {
  const kind = event.kind;
  const Icon = ICON_OF_KIND[kind];
  const when = event.startTime
    ? `${event.startTime}${event.endTime ? `–${event.endTime}` : ''}`
    : 'o dia todo';

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!onOpen}
      aria-label={`${event.date} ${when} ${event.title} ${LABEL_OF_KIND[kind]}`}
      className="w-full py-3 flex items-start justify-between gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-default border border-ceci-border-subtle rounded-2xl bg-surface-default"
    >
      <div className="min-w-0 flex items-baseline gap-2">
        {showTime && (
          <span className="text-[11px] font-semibold text-ceci-tertiary tabular-nums shrink-0">
            {when}
          </span>
        )}
        <div className="flex items-baseline gap-1">
          <Icon className="w-4 h-4 shrink-0" />
          <h3 className={`font-semibold text-xs text-ceci-primary line-clamp-1 ${completed ? 'line-through opacity-70' : ''}`}>
            {event.title}
          </h3>
        </div>
        {event.subtitle && (
          <p className="text-[11px] text-ceci-secondary line-clamp-1">
            {event.subtitle}
          </p>
        )}
      </div>
      <span
        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${CHIP_OF_KIND[kind]}`}
      >
        {LABEL_OF_KIND[kind]}
      </span>
    </button>
  );
};
