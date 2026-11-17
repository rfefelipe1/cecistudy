// Conversa por tarefa (SPEC-037 T007 · SPEC-M-040).
//
// A tela empilha sobre a Home e recebe `taskId` da navegação. Ela lê a conversa
// leve das coleções e, no fim, mostra o plano e os artefatos — sem rota nova
// para cada um. As perguntas do agente vivem no sheet, não nas bolhas.
//
// Layout (SPEC-M-040 D10): coluna de altura cheia — cabeçalho, lista com scroll
// próprio e composer fixo. A lista rola sozinha para que o campo nunca saia da
// tela quando o teclado abre; o cabeçalho da app já está oculto neste fluxo.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, Send } from 'lucide-react';
import { useDataClientCourses } from '@/context/DataClientProvider';
import { useMobileApp } from '@/context/mobileApp';
import { useNavValue } from '@/context/shellNavContexts';
import { CELEBRACAO, CECINHO_PENSANDO_FASES, DICA, VAZIO, erro, frase } from '@/lib/voice';
import type { AgentMessage } from '@/types';
import { useCecinho } from '../useCecinho';
import { pendingQuestions, questionsInOpenRound } from '../domain/conversation';
import { planEffects } from '../domain/plan';
import { CecinhoArtifactList } from './CecinhoArtifactList';
import { CecinhoMessage } from './CecinhoMessage';
import { CecinhoPlanReview } from './CecinhoPlanReview';
import { CecinhoQuestionSheet, type CecinhoAnswer } from './CecinhoQuestionSheet';
import { CecinhoStatusPill } from './CecinhoStatusPill';
import { ThinkingLoader } from './ThinkingLoader';

interface CecinhoTaskChatProps {
  taskId: string;
}

/** Falas separadas por mais que isto abrem grupo novo (selo e horário repetem). */
const GAP_ENTRE_GRUPOS_MS = 4 * 60 * 1000;

const mesmoGrupo = (anterior?: AgentMessage, atual?: AgentMessage): boolean =>
  !!anterior &&
  !!atual &&
  anterior.role === atual.role &&
  Math.abs(Date.parse(atual.createdAt) - Date.parse(anterior.createdAt)) < GAP_ENTRE_GRUPOS_MS;

export const CecinhoTaskChat: React.FC<CecinhoTaskChatProps> = ({ taskId }) => {
  const nav = useNavValue();
  const { tasks } = useDataClientCourses();
  const { handleAddTask, showToast } = useMobileApp();
  const cecinho = useCecinho();
  const [draft, setDraft] = useState('');
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [freshId, setFreshId] = useState<string | null>(null);
  const markedRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  const task = tasks.find((t) => t.id === taskId);
  const assisted = cecinho.assistedFor(taskId);
  const conversation = cecinho.conversationFor(taskId);
  const plan = cecinho.planFor(taskId);
  const artifacts = cecinho.artifactsFor(taskId);
  const messages = conversation?.messages ?? [];

  // Abrir a conversa zera o não lido. O ref evita reescrever a cada render.
  useEffect(() => {
    if (markedRef.current === taskId) return;
    markedRef.current = taskId;
    cecinho.markRead(taskId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // Rodada aberta: as perguntas no fim da conversa que ainda esperam resposta.
  const pending = useMemo(() => pendingQuestions(questionsInOpenRound(messages)), [conversation]);
  const roundId = pending[0]?.id ?? '';
  const sheetOpen =
    pending.length > 0 && !cecinho.asking && !!roundId && !dismissed.includes(roundId);

  // Só a resposta que acabou de chegar é revelada aos poucos; reabrir a conversa
  // não repete a animação (os ids já conhecidos entram no set na montagem).
  const knownRef = useRef<Set<string>>(new Set(messages.map((message) => message.id)));
  useEffect(() => {
    const fresh = messages.find(
      (message) =>
        !knownRef.current.has(message.id) &&
        message.role === 'assistant' &&
        message.kind === 'text',
    );
    for (const message of messages) knownRef.current.add(message.id);
    if (fresh) setFreshId(fresh.id);
  }, [conversation]);

  const title = task?.title ?? taskId;
  const streaming = freshId !== null;

  // Abrir a tela cai no fim da conversa, sem animação.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Fala nova (ou o loader entrando) mantém o fim à vista — mas só se a usuária
  // já estava no fim; rolar para cima é sinal de que ela está lendo.
  const messageCount = messages.length;
  const rolarParaOFim = () => {
    const el = listRef.current;
    if (!el) return;
    // jsdom não implementa `scrollTo`; o fallback também serve a WebView antiga.
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    if (!atBottomRef.current) return;
    rolarParaOFim();
  }, [messageCount, cecinho.asking, freshId]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    atBottomRef.current = near;
    setAtBottom(near);
  };

  const irParaOFim = () => {
    rolarParaOFim();
    atBottomRef.current = true;
    setAtBottom(true);
  };

  // O campo cresce com o texto até 5 linhas, como em qualquer chat.
  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 116)}px`;
  }, [draft]);

  const send = () => {
    const text = draft.trim();
    if (!text || !assisted || cecinho.asking || streaming) return;
    cecinho.append(taskId, { role: 'user', kind: 'text', content: text });
    setDraft('');
    // A resposta chega por polling; enquanto isso a bolha do agente "pensa".
    void cecinho.ask(taskId, text).then((ok) => {
      if (!ok) showToast(erro('acaoFalhou'));
    });
  };

  // Confirmar o sheet fecha a rodada e devolve as respostas como a próxima fala
  // da conversa — o Cecinho continua dali em vez de repetir a pergunta.
  const submitAnswers = (answers: CecinhoAnswer[]) => {
    cecinho.answerRound(taskId, answers);
    const text = answers
      .map((answer) => answer.answer)
      .filter(Boolean)
      .join('\n');
    if (!text) return;
    cecinho.append(taskId, { role: 'user', kind: 'text', content: text });
    void cecinho.ask(taskId, text).then((ok) => {
      if (!ok) showToast(erro('acaoFalhou'));
    });
  };

  const confirmPlan = () => {
    if (!plan || !task) return;
    cecinho.confirmPlan(taskId);
    for (const effect of planEffects({ ...plan, status: 'confirmed' }, task)) {
      handleAddTask(effect);
    }
    showToast(frase(CELEBRACAO, 'cecinhoPlanoConfirmado'));
  };

  const travado = cecinho.asking || streaming;

  return (
    <div className="relative flex h-[calc(100dvh-2.5rem)] flex-col">
      {/* Cabeçalho da conversa: fica no topo enquanto a lista rola. O header da
          app já está oculto neste fluxo (`isAuxFlow`), então este é o topo. */}
      <header className="-mx-3.5 shrink-0 border-b border-ceci-border-subtle bg-canvas/90 px-3.5 pb-2.5 pt-1 backdrop-blur sm:-mx-5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={nav.closeCecinho}
            aria-label="voltar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ceci-border-default bg-surface-default text-ceci-secondary transition-colors hover:bg-surface-muted cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span
            aria-hidden="true"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-ceci-brand-strong font-display text-sm font-bold text-ceci-on-brand"
          >
            c
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
              conversa do cecinho
            </p>
            <h1 className="truncate font-display text-[15px] font-bold leading-tight text-ceci-primary">
              {title}
            </h1>
          </div>
          <CecinhoStatusPill estado={cecinho.statusLabel(taskId)} />
        </div>
      </header>

      {!assisted ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-rose font-display text-lg font-bold text-ceci-brand-strong"
          >
            c
          </span>
          <p className="max-w-[28ch] text-[14px] leading-relaxed text-ceci-secondary">
            {frase(VAZIO, 'cecinhoSemMensagens')}
          </p>
          <button
            type="button"
            onClick={() => cecinho.activate(taskId)}
            className="min-h-[44px] rounded-full bg-ceci-brand-strong px-5 text-[13px] font-semibold text-ceci-on-brand transition active:scale-[0.99] cursor-pointer"
          >
            chamar o cecinho
          </button>
        </div>
      ) : (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2"
          role="log"
          aria-live="polite"
          aria-label="conversa"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
              <p className="max-w-[30ch] text-[13px] leading-relaxed text-ceci-secondary">
                {frase(VAZIO, 'cecinhoSemMensagens')}
              </p>
            </div>
          ) : (
            <div className="pt-3">
              {messages.map((message, index) => {
                const first = !mesmoGrupo(messages[index - 1], message);
                const last = !mesmoGrupo(message, messages[index + 1]);
                return (
                  <div key={message.id} className={index === 0 ? '' : first ? 'mt-4' : 'mt-1.5'}>
                    <CecinhoMessage
                      message={message}
                      streaming={message.id === freshId}
                      onStreamDone={() =>
                        setFreshId((current) => (current === message.id ? null : current))
                      }
                      onOpenAnswers={() => setDismissed([])}
                      onOpenArtifact={() => undefined}
                      first={first}
                      last={last}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {cecinho.asking && (
            <div className="mt-4 flex items-start gap-2.5" role="status">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[9px] bg-ceci-brand-strong font-display text-[12px] font-bold text-ceci-on-brand"
              >
                c
              </span>
              <div className="flex min-h-[26px] items-center text-ceci-secondary">
                <ThinkingLoader phases={CECINHO_PENSANDO_FASES} />
              </div>
            </div>
          )}

          {plan ? (
            <div className="mt-5">
              <CecinhoPlanReview
                plan={plan}
                onConfirm={confirmPlan}
                onReject={() => cecinho.rejectPlan(taskId)}
                onEditStep={(stepId, patch) => cecinho.editStep(taskId, stepId, patch)}
                onRemoveStep={(stepId) => cecinho.removeStep(taskId, stepId)}
                onMarkDone={(stepId) => cecinho.markStepDone(taskId, stepId)}
              />
            </div>
          ) : (
            <p className="mt-4 px-1 text-[11px] text-ceci-tertiary">
              {frase(VAZIO, 'cecinhoSemPlano')}
            </p>
          )}

          {assisted && (
            <div className="mt-4">
              <CecinhoArtifactList
                taskId={taskId}
                conversationId={assisted.conversationId}
                artifacts={artifacts}
                onDeleted={(artifactId) => cecinho.removeArtifact(taskId, artifactId)}
              />
            </div>
          )}

          <p className="mb-1 mt-4 px-1 text-[10px] text-ceci-tertiary">
            {frase(DICA, 'cecinhoCentralAjuda')}
          </p>
        </div>
      )}

      {assisted && (
        <div className="relative -mx-3.5 shrink-0 border-t border-ceci-border-subtle bg-canvas/95 px-3.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-2 backdrop-blur sm:-mx-5 sm:px-5">
          {!atBottom && (
            <button
              type="button"
              onClick={irParaOFim}
              className="absolute -top-11 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-ceci-border-default bg-surface-default px-3 py-1.5 text-[11px] font-semibold text-ceci-secondary shadow-2xs cursor-pointer"
            >
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              ir para o fim
            </button>
          )}

          <div className="flex items-end gap-2 rounded-[22px] border border-ceci-border-default bg-surface-default py-1.5 pl-3.5 pr-1.5 shadow-2xs focus-within:border-ceci-border-brand">
            <textarea
              ref={composerRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey) return;
                // No toque, Enter quebra linha (é o que o teclado sugere); o
                // envio é o botão. No desktop, Enter envia.
                if (window.matchMedia?.('(pointer: coarse)').matches) return;
                event.preventDefault();
                send();
              }}
              rows={1}
              placeholder="o que você precisa nesta tarefa?"
              aria-label="mensagem para o cecinho"
              disabled={travado}
              className="max-h-[116px] min-h-[38px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-[1.5] text-ceci-primary placeholder:text-ceci-faded focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || travado}
              aria-label="enviar mensagem"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ceci-brand-strong text-ceci-on-brand transition active:scale-[0.96] disabled:bg-surface-muted disabled:text-ceci-faded cursor-pointer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <CecinhoQuestionSheet
        open={sheetOpen}
        questions={pending}
        onConfirm={submitAnswers}
        onClose={() => setDismissed((current) => [...current, roundId])}
      />
    </div>
  );
};
