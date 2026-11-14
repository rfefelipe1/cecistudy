import React from 'react';
import { Check } from 'lucide-react';
import type { InternshipLog } from '../../../types';
import { formatDateShortBR } from '../../../lib/dateBR';
import { statusOf } from '../../../lib/internshipCases';
import { cn } from '../../../lib/utils';

interface AttendanceRowProps {
  log: InternshipLog;
  checked: boolean;
  linkIndex: ReturnType<typeof import('../../../lib/internshipCases').buildLinkIndex>;
  todayKey: string;
  date: string | undefined;
  onToggle: (id: string) => void;
}

/** Retorna um botão de linha de atendimento discutido (checkbox com paciente, sessão, data e status). */
export function AttendanceRow(props: AttendanceRowProps): React.ReactNode {
  const { log, checked, linkIndex, todayKey, date, onToggle } = props;
  const st = statusOf(log, linkIndex, todayKey);
  const depoisDaSupervisao = !!date && log.date > date;

  return (
    <button
      key={log.id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onToggle(log.id)}
      className="w-full flex items-start gap-3 p-3 rounded-xl border border-ceci-border-default bg-surface-default text-left cursor-pointer tap-interactive min-h-[44px]"
    >
      <span
        className={cn(
          'w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
          checked
            ? 'bg-ceci-primary border-ceci-primary text-ceci-on-primary'
            : 'bg-surface-muted border-ceci-border-subtle',
        )}
      >
        {checked && <Check className="w-4 h-4" aria-hidden />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold text-ceci-primary">
          {log.sessionNumber ? `sessão ${log.sessionNumber}` : 'sessão'}
          <span className="text-[10px] text-ceci-secondary">{log.patient?.trim()}</span>
          <span className="text-[11px] text-ceci-secondary">{formatDateShortBR(log.date)}</span>
        </span>
        {log.theme?.trim() && (
          <span className="block text-[11px] text-ceci-secondary truncate">{log.theme}</span>
        )}
        {depoisDaSupervisao && (
          <span className="block text-[10px] text-status-warning-strong">
            essa sessão é depois da data da supervisão
          </span>
        )}
        {st.intervised && !st.supervised && (
          <span className="block text-[10px] text-ceci-academic-strong">
            discutida em intervisão
          </span>
        )}
      </span>
    </button>
  );
}
