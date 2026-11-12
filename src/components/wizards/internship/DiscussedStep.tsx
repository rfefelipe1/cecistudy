import React from 'react';
import type { WizardStep } from '../WizardScaffold';
import { AttendanceRow } from './AttendanceRow';
import type { InternshipLog } from '../../../types';
import { buildLinkIndex, isDone, statusOf } from '../../../lib/internshipCases';

interface DiscussedStepProps {
  kind: InternshipLogType | null;
  discussedLogIds: string[];
  internshipLogs: InternshipLog[];
  todayKey: string;
  seedTarget: InternshipLog | undefined;
  onToggle: (id: string) => void;
}
import type { InternshipLogType } from '../../../types';

/** Retorna o objeto WizardStep dos atendimentos discutidos. */
export function DiscussedStep(props: DiscussedStepProps): WizardStep {
  const { kind, discussedLogIds, internshipLogs, todayKey, seedTarget, onToggle } = props;
  const index = buildLinkIndex(internshipLogs, todayKey);
  const attendanceLogs = internshipLogs
    .filter((l) => l.type === 'atendimento_clinico' && isDone(l, todayKey))
    .sort((a, b) => {
      const aSup = statusOf(a, index, todayKey).supervised;
      const bSup = statusOf(b, index, todayKey).supervised;
      if (aSup !== bSup) return aSup ? 1 : -1;
      const an = a.sessionNumber ?? 0;
      const bn = b.sessionNumber ?? 0;
      if (an !== bn) return an - bn;
      return a.date.localeCompare(b.date);
    });

  const inThisSupervision = seedTarget?.discussedLogIds ?? [];
  const pendingAttendance = attendanceLogs.filter(
    (l) => !statusOf(l, index, todayKey).supervised && !inThisSupervision.includes(l.id),
  );
  const discussedElsewhere = attendanceLogs.filter(
    (l) => statusOf(l, index, todayKey).supervised && !inThisSupervision.includes(l.id),
  );
  const hereAttendance = attendanceLogs.filter((l) => inThisSupervision.includes(l.id));

  return {
    id: 'discutidos',
    title: 'discutidos',
    headline: 'quais atendimentos foram discutidos?',
    subtitle: 'só atendimentos que já aconteceram podem ser discutidos.',
    content: (
      <div className="space-y-4">
        <p className="text-[11px] text-ceci-secondary text-center">
          {discussedLogIds.length} {discussedLogIds.length === 1 ? 'selecionada' : 'selecionadas'}
        </p>
        {attendanceLogs.length === 0 ? (
          <p className="text-xs text-ceci-secondary text-center py-6">
            nenhum atendimento feito ainda — quando anotar sessões, elas aparecem aqui ♡
          </p>
        ) : (
          <div className="space-y-4">
            {hereAttendance.length > 0 && (
              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1.5">
                  nesta supervisão
                </h4>
                <div className="space-y-2">
                  {hereAttendance.map((log) => (
                    <AttendanceRow
                      key={log.id}
                      log={log}
                      checked={discussedLogIds.includes(log.id)}
                      linkIndex={index}
                      todayKey={todayKey}
                      date={undefined}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </section>
            )}
            {pendingAttendance.length > 0 && (
              <section>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1.5">
                  sem supervisão ainda
                </h4>
                <div className="space-y-2">
                  {pendingAttendance.map((log) => (
                    <AttendanceRow
                      key={log.id}
                      log={log}
                      checked={discussedLogIds.includes(log.id)}
                      linkIndex={index}
                      todayKey={todayKey}
                      date={undefined}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </section>
            )}
            {discussedElsewhere.length > 0 && (
              <details>
                <summary className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary cursor-pointer min-h-[44px] flex items-center">
                  já discutidas antes ({discussedElsewhere.length})
                </summary>
                <div className="space-y-2 mt-1.5">
                  {discussedElsewhere.map((log) => (
                    <AttendanceRow
                      key={log.id}
                      log={log}
                      checked={discussedLogIds.includes(log.id)}
                      linkIndex={index}
                      todayKey={todayKey}
                      date={undefined}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    ),
  };
}
