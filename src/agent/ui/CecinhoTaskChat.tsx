// Conversa por tarefa (SPEC-037 T007).
//
// A tela empilha sobre a Home e recebe `taskId` da navegação. Ela lê a conversa
// leve das coleções e, no fim, mostra o plano e os artefatos — sem rota nova
// para cada um.
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Send } from 'lucide-react';
import { useDataClientCourses } from '@/context/DataClientProvider';
import { useMobileApp } from '@/context/mobileApp';
import { useNavValue } from '@/context/shellNavContexts';
import { CELEBRACAO, DICA, VAZIO, frase } from '@/lib/voice';
import { useCecinho } from '../useCecinho';
import { planEffects } from '../domain/plan';
import { CecinhoArtifactList } from './CecinhoArtifactList';
import { CecinhoMessage } from './CecinhoMessage';
import { CecinhoPlanReview } from './CecinhoPlanReview';
import { CecinhoStatusPill } from './CecinhoStatusPill';

interface CecinhoTaskChatProps {
  taskId: string;
}

export const CecinhoTaskChat: React.FC<CecinhoTaskChatProps> = ({ taskId }) => {
  const nav = useNavValue();
  const { tasks } = useDataClientCourses();
  const { handleAddTask, showToast } = useMobileApp();
  const cecinho = useCecinho();
  const [draft, setDraft] = useState('');
  const markedRef = useRef<string | null>(null);

  const task = tasks.find((t) => t.id === taskId);
  const assisted = cecinho.assistedFor(taskId);
  const conversation = cecinho.conversationFor(taskId);
  const plan = cecinho.planFor(taskId);
  const artifacts = cecinho.artifactsFor(taskId);

  // Abrir a conversa zera o não lido. O ref evita reescrever a cada render.
  useEffect(() => {
    if (markedRef.current === taskId) return;
    markedRef.current = taskId;
    cecinho.markRead(taskId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const title = task?.title ?? taskId;

  const send = () => {
    if (!draft.trim() || !assisted) return;
    cecinho.append(taskId, { role: 'user', kind: 'text', content: draft.trim() });
    setDraft('');
  };

  const confirmPlan = () => {
    if (!plan || !task) return;
    cecinho.confirmPlan(taskId);
    for (const effect of planEffects({ ...plan, status: 'confirmed' }, task)) {
      handleAddTask(effect);
    }
    showToast(frase(CELEBRACAO, 'cecinhoPlanoConfirmado'));
  };

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4 pb-24">
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
            conversa do cecinho
          </p>
          <h1 className="font-display text-base font-bold text-ceci-primary line-clamp-1">
            {title}
          </h1>
        </div>
        <CecinhoStatusPill estado={cecinho.statusLabel(taskId)} />
      </header>

      {!assisted ? (
        <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-5 text-center space-y-3">
          <p className="text-sm font-semibold text-ceci-primary">
            {frase(VAZIO, 'cecinhoSemMensagens')}
          </p>
          <button
            type="button"
            onClick={() => cecinho.activate(taskId)}
            className="px-4 py-2.5 rounded-xl bg-ceci-brand-strong text-ceci-on-brand text-[11px] font-semibold min-h-[44px] cursor-pointer"
          >
            chamar o cecinho
          </button>
        </section>
      ) : (
        <>
          <section className="space-y-2.5" aria-label="conversa">
            {(conversation?.messages ?? []).length === 0 ? (
              <p className="text-[11px] text-ceci-secondary">{frase(VAZIO, 'cecinhoSemMensagens')}</p>
            ) : (
              conversation?.messages.map((message) => (
                <CecinhoMessage
                  key={message.id}
                  message={message}
                  onAnswer={(target, answer, kind) =>
                    cecinho.answer(taskId, target.question?.id ?? '', answer, kind)
                  }
                  onOpenArtifact={() => undefined}
                />
              ))
            )}
          </section>

          <div className="flex items-end gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="o que você precisa nesta tarefa?"
              aria-label="mensagem para o cecinho"
              className="min-w-0 flex-1 rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2.5 text-[12px] text-ceci-primary"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim()}
              aria-label="enviar mensagem"
              className="w-11 h-11 shrink-0 rounded-xl bg-ceci-brand-strong text-ceci-on-brand flex items-center justify-center disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {plan ? (
            <CecinhoPlanReview
              plan={plan}
              onConfirm={confirmPlan}
              onReject={() => cecinho.rejectPlan(taskId)}
              onEditStep={(stepId, patch) => cecinho.editStep(taskId, stepId, patch)}
              onRemoveStep={(stepId) => cecinho.removeStep(taskId, stepId)}
              onMarkDone={(stepId) => cecinho.markStepDone(taskId, stepId)}
            />
          ) : (
            <p className="text-[11px] text-ceci-secondary px-1">{frase(VAZIO, 'cecinhoSemPlano')}</p>
          )}

          {assisted && (
            <CecinhoArtifactList
              taskId={taskId}
              conversationId={assisted.conversationId}
              artifacts={artifacts}
              onDeleted={(artifactId) => cecinho.removeArtifact(taskId, artifactId)}
            />
          )}

          <p className="text-[10px] text-ceci-tertiary px-1">{frase(DICA, 'cecinhoCentralAjuda')}</p>
        </>
      )}
    </div>
  );
};
