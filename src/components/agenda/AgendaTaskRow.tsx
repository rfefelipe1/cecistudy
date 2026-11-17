// Linha de tarefa da Agenda (SPEC-035 D1/D8). Tarefa tem checkbox e pode ser
// concluída; evento não. O estado de atraso é texto ("atrasada"), nunca só cor.
import React from 'react';
import { Check } from 'lucide-react';
import type { AgendaTaskItem } from '../../lib/agenda';
import type { DateKey } from '../../types';
import { addDaysKey, formatDateBR } from '../../lib/dateBR';

interface AgendaTaskRowProps {
  item: AgendaTaskItem;
  today: DateKey;
  courseName?: string;
  onToggle: (taskId: string) => void;
  onOpen: () => void;
  /** Selo discreto do Cecinho (SPEC-037 T010): estado ou pendência. */
  agentBadge?: React.ReactNode;
}

const dueLabel = (date: DateKey | undefined, today: DateKey): string => {
  if (!date) return 'sem data';
  if (date < today) return 'atrasada';
  if (date === today) return 'hoje';
  if (date === addDaysKey(today, 1)) return 'amanhã';
  return formatDateBR(date);
};

export const AgendaTaskRow: React.FC<AgendaTaskRowProps> = ({
  item,
  today,
  courseName,
  onToggle,
  onOpen,
  agentBadge,
}) => {
  const { task } = item;
  const quando = dueLabel(item.date, today);
  const meta = [courseName, task.priority === 'alta' ? 'prioridade alta' : ''].filter(Boolean).join(' · ');

  return (
    <div className="flex items-start gap-2 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`${task.completed ? 'reabrir' : 'concluir'} ${task.title}`}
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 w-11 h-11 shrink-0 -ml-2 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
          task.completed
            ? 'bg-ceci-brand-strong border-ceci-brand-strong text-ceci-on-brand'
            : 'bg-surface-default border-ceci-border-default text-transparent hover:border-ceci-border-brand'
        }`}
      >
        <Check className="w-4 h-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left cursor-pointer hover:opacity-80 transition-opacity py-1"
      >
        <p
          className={`text-xs font-semibold text-ceci-primary line-clamp-1 ${
            task.completed ? 'line-through opacity-60' : ''
          }`}
        >
          {task.title}
        </p>
        {meta && <p className="text-[11px] text-ceci-secondary line-clamp-1">{meta}</p>}
        {agentBadge ? <span className="inline-flex items-center gap-1.5 mt-1">{agentBadge}</span> : null}
      </button>

      <span
        className={`shrink-0 mt-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
          item.overdue
            ? 'text-status-danger-strong bg-status-danger-surface border-status-danger-border'
            : quando === 'hoje'
              ? 'text-ceci-brand-strong bg-surface-rose border-ceci-border-brand'
              : quando === 'amanhã'
                ? 'text-ceci-primary bg-surface-warm border-ceci-border-gold'
                : 'text-ceci-secondary bg-surface-muted border-ceci-border-default'
        }`}
      >
        {quando}
      </span>
    </div>
  );
};
