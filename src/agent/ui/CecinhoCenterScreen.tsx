// Central do Cecinho (SPEC-037 T006).
//
// Lista as tarefas com assistência e o estado de cada uma. O cartão de ajuda
// global só aparece quando o toggle do Perfil está desligado — sugestão, nunca
// interrupção.
import React from 'react';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { useDataClientApp, useDataClientCourses } from '@/context/DataClientProvider';
import { useNavValue } from '@/context/shellNavContexts';
import { DICA, VAZIO, frase } from '@/lib/voice';
import { useCecinho } from '../useCecinho';
import { CecinhoConversationRow } from './CecinhoConversationRow';
import { CecinhoPendingBadge } from './CecinhoPendingBadge';

export const CecinhoCenterScreen: React.FC = () => {
  const nav = useNavValue();
  const { courses, tasks } = useDataClientCourses();
  const { setCecinhoHelpEnabled } = useDataClientApp();
  const cecinho = useCecinho();

  const assisteds = [...cecinho.collections.assistedTasks].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-24">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={nav.closeCecinho}
          aria-label="voltar"
          className="w-11 h-11 shrink-0 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
            assistência nas tarefas
          </p>
          <h1 className="font-display text-lg font-bold text-ceci-primary">central do cecinho</h1>
        </div>
        <CecinhoPendingBadge count={cecinho.totalUnread} />
      </header>

      {!cecinho.helpEnabled && (
        <section className="rounded-2xl border border-ceci-border-brand bg-surface-rose p-3.5 space-y-2">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 text-ceci-brand-strong" aria-hidden="true" />
            <p className="text-[12px] text-ceci-primary leading-relaxed">
              {frase(DICA, 'cecinhoAjudaGlobal')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCecinhoHelpEnabled(true)}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-surface-default text-ceci-brand-strong border border-ceci-border-brand min-h-[36px] cursor-pointer"
          >
            ligar a ajuda global
          </button>
        </section>
      )}

      <p className="text-[11px] text-ceci-secondary px-1">{frase(DICA, 'cecinhoCentralAjuda')}</p>

      {assisteds.length === 0 ? (
        <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-5 text-center">
          <p className="text-sm font-semibold text-ceci-primary">
            {frase(VAZIO, 'cecinhoSemConversas')}
          </p>
        </section>
      ) : (
        <div className="space-y-2">
          {assisteds.map((assisted) => {
            const task = tasks.find((t) => t.id === assisted.taskId);
            const courseName = task?.disciplineId
              ? courses.find((c) => c.id === task.disciplineId)?.name
              : undefined;
            return (
              <CecinhoConversationRow
                key={assisted.id}
                assisted={assisted}
                conversation={cecinho.conversationFor(assisted.taskId)}
                task={task}
                courseName={courseName}
                estado={cecinho.statusLabel(assisted.taskId)}
                onOpen={() => nav.openCecinhoTask(assisted.taskId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
