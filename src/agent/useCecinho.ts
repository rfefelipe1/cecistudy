// Liga o domínio do Cecinho Agent ao estado da usuária (SPEC-037 T005/T006).
//
// A regra continua no domínio (`src/agent/domain/*`) e no repositório
// (`src/agent/storage/agentRepository.ts`); aqui só há cola de React: leitura
// das quatro coleções leves, escrita atômica e o relógio da borda.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDataClientApp, useDataClientCourses } from '@/context/DataClientProvider';
import type {
  AgentJob,
  AgentMessage,
  AgentMessageKind,
  AgentQuestion,
  AgentPlan,
  AgentPlanStep,
} from '@/types';
import {
  activateAssistance,
  artifactsForTask,
  conversationForTask,
  emptyAgentCollections,
  planForTask,
  removeArtifact as removeArtifactRepo,
  removeAssistance,
  saveArtifact,
  saveAssistedTask,
  saveConversation,
  savePlan,
  totalUnread,
  type AgentCollections,
} from './storage/agentRepository';
import {
  agentStatusLabel,
  markRead,
  markPendingQuestion,
  type AgentStatusLabel,
} from './domain/assistedTask';
import { appendMessage, answerQuestion, createConversation } from './domain/conversation';
import {
  confirmPlan as confirmPlanDomain,
  editStep as editStepDomain,
  markStepDone as markStepDomain,
  removeStep as removeStepDomain,
  rejectPlan as rejectPlanDomain,
} from './domain/plan';
import { readGatewayRuntime } from '@/lib/agentGateway';
import { getInstallationId } from '@/lib/deviceId';
import { DICA, frase } from '@/lib/voice';
import {
  applyRemoteJob,
  buildHistory,
  buildMinimalContext,
  createGatewaySession,
  enqueueJob,
  flushQueue,
  jobFor,
  pollQueue,
} from './sync';

const nowIso = () => new Date().toISOString();
const messageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** O gateway responde por polling; 24 × 1,5 s cobre o cold start do Render Free. */
const POLL_INTERVAL_MS = 1_500;
const POLL_TIMEOUT_MS = 36_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface AppendMessageInput {
  role: AgentMessage['role'];
  kind: AgentMessageKind;
  content: string;
  question?: AgentQuestion;
  artifactId?: string;
  planId?: string;
}

export interface CecinhoApi {
  collections: AgentCollections;
  totalUnread: number;
  helpEnabled: boolean;
  setHelpEnabled: (enabled: boolean) => void;
  /** Assistência existente da tarefa, se houver. */
  assistedFor: (taskId: string) => AgentCollections['assistedTasks'][number] | undefined;
  isActive: (taskId: string) => boolean;
  conversationFor: (taskId: string) => AgentCollections['agentConversations'][number] | undefined;
  planFor: (taskId: string) => AgentCollections['agentPlans'][number] | undefined;
  artifactsFor: (taskId: string) => AgentCollections['agentArtifacts'];
  statusLabel: (taskId: string) => AgentStatusLabel;
  activate: (taskId: string) => void;
  remove: (taskId: string) => void;
  markRead: (taskId: string) => void;
  append: (taskId: string, input: AppendMessageInput) => void;
  /** Responde a rodada inteira do sheet em **uma** escrita. */
  answerRound: (taskId: string, answers: { questionId: string; answer: string }[]) => void;
  confirmPlan: (taskId: string) => void;
  rejectPlan: (taskId: string) => void;
  editStep: (
    taskId: string,
    stepId: string,
    patch: Partial<Pick<AgentPlanStep, 'title' | 'description' | 'dueDate' | 'status'>>,
  ) => void;
  removeStep: (taskId: string, stepId: string) => void;
  markStepDone: (taskId: string, stepId: string) => void;
  saveArtifactPatch: (taskId: string, artifactId: string, patch: Record<string, unknown>) => void;
  removeArtifact: (taskId: string, artifactId: string) => void;
  /** Há gateway configurado neste build? Sem ele o Cecinho fica só local (D1). */
  assistantReady: boolean;
  /** Uma conversa está em voo — a tela desabilita o envio. */
  asking: boolean;
  /**
   * Envia a mensagem ao gateway e aplica o que voltar.
   * Devolve `false` quando não dá (sem gateway, contexto recusado, rede, timeout).
   */
  ask: (taskId: string, message: string) => Promise<boolean>;
}

/**
 * O hook da Central. Ele **não** cria regra: cada operação chama o domínio e
 * grava o resultado nas quatro coleções.
 */
export function useCecinho(): CecinhoApi {
  const app = useDataClientApp();
  const {
    assistedTasks,
    setAssistedTasks,
    agentConversations,
    setAgentConversations,
    agentPlans,
    setAgentPlans,
    agentArtifacts,
    setAgentArtifacts,
    cecinhoHelpEnabled,
    setCecinhoHelpEnabled,
  } = app;

  const collections = useMemo<AgentCollections>(
    () => ({
      assistedTasks: assistedTasks ?? emptyAgentCollections.assistedTasks,
      agentConversations: agentConversations ?? emptyAgentCollections.agentConversations,
      agentPlans: agentPlans ?? emptyAgentCollections.agentPlans,
      agentArtifacts: agentArtifacts ?? emptyAgentCollections.agentArtifacts,
    }),
    [assistedTasks, agentConversations, agentPlans, agentArtifacts],
  );

  const { tasks, courses } = useDataClientCourses();

  /**
   * Grava as quatro coleções de uma vez. As referências inalteradas são
   * preservadas pelo repositório, então o React só re-renderiza o que mudou.
   *
   * A comparação é contra o ref, não contra o estado do render: o laço de
   * polling é assíncrono e precisa enxergar a última escrita, não a do render
   * que o criou.
   */
  const collectionsRef = useRef(collections);
  useEffect(() => {
    collectionsRef.current = collections;
  }, [collections]);

  const apply = useCallback(
    (next: AgentCollections) => {
      const current = collectionsRef.current;
      if (next.assistedTasks !== current.assistedTasks) setAssistedTasks(next.assistedTasks);
      if (next.agentConversations !== current.agentConversations) {
        setAgentConversations(next.agentConversations);
      }
      if (next.agentPlans !== current.agentPlans) setAgentPlans(next.agentPlans);
      if (next.agentArtifacts !== current.agentArtifacts) {
        setAgentArtifacts(next.agentArtifacts);
      }
      collectionsRef.current = next;
    },
    [setAssistedTasks, setAgentConversations, setAgentPlans, setAgentArtifacts],
  );

  // --- gateway (SPEC-M-039) ------------------------------------------------
  // Sem URL e chave no build, `session` é `null` e o Cecinho segue local: a
  // conversa, o plano manual e o resto da Central não dependem de rede.
  const runtime = useMemo(() => readGatewayRuntime(), []);
  const session = useMemo(
    () =>
      runtime
        ? createGatewaySession({
            baseUrl: runtime.baseUrl,
            appKey: runtime.appKey,
            installationId: getInstallationId(),
          })
        : null,
    [runtime],
  );
  const queueRef = useRef<AgentJob[]>([]);
  const [asking, setAsking] = useState(false);

  const assistedFor = useCallback(
    (taskId: string) => collections.assistedTasks.find((a) => a.taskId === taskId),
    [collections],
  );
  const conversationFor = useCallback(
    (taskId: string) => conversationForTask(collections, taskId),
    [collections],
  );
  const planFor = useCallback((taskId: string) => planForTask(collections, taskId), [collections]);
  const artifactsFor = useCallback(
    (taskId: string) => artifactsForTask(collections, taskId),
    [collections],
  );

  const statusLabel = useCallback(
    (taskId: string): AgentStatusLabel => {
      const assisted = collections.assistedTasks.find((a) => a.taskId === taskId);
      if (!assisted) return 'ocioso';
      const plan = collections.agentPlans.find((p) => p.taskId === taskId);
      const hasArtifact = collections.agentArtifacts.some((a) => a.taskId === taskId);
      return agentStatusLabel(assisted, plan?.status, hasArtifact);
    },
    [collections],
  );

  const activate = useCallback(
    (taskId: string) => {
      const at = nowIso();
      const next = activateAssistance(collections, { taskId, at });
      if (next === collections) return;
      const conversation = conversationForTask(next, taskId);
      const withWelcome: AgentCollections =
        conversation && conversation.messages.length === 0
          ? {
              ...next,
              agentConversations: next.agentConversations.map((c) =>
                c.id === conversation.id
                  ? appendMessage(c, {
                      id: messageId(),
                      role: 'assistant',
                      kind: 'text',
                      content: frase(DICA, 'cecinhoBoasVindas'),
                      createdAt: at,
                    })
                  : c,
              ),
            }
          : next;
      apply(withWelcome);
    },
    [collections, apply],
  );

  const remove = useCallback(
    (taskId: string) => {
      apply(removeAssistance(collections, taskId));
    },
    [collections, apply],
  );

  const markTaskRead = useCallback(
    (taskId: string) => {
      const at = nowIso();
      const conversation = conversationForTask(collections, taskId);
      const assisted = collections.assistedTasks.find((a) => a.taskId === taskId);
      if (!conversation || !assisted) return;
      const nextConversation = { ...conversation, lastReadAt: at };
      const nextAssisted = markRead({ ...assisted, pendingQuestion: false }, at);
      apply(
        saveConversation(
          saveAssistedTask(collections, nextAssisted),
          nextConversation,
        ),
      );
    },
    [collections, apply],
  );

  const append = useCallback(
    (taskId: string, input: AppendMessageInput) => {
      // O ref enxerga a escrita que acabou de acontecer no mesmo handler (sheet
      // responde e já manda a fala para o gateway).
      const current = collectionsRef.current;
      const at = nowIso();
      const existing =
        conversationForTask(current, taskId) ?? createConversation(taskId, at);
      const message: AgentMessage = {
        id: messageId(),
        role: input.role,
        kind: input.kind,
        content: input.content,
        createdAt: at,
        question: input.question,
        artifactId: input.artifactId,
        planId: input.planId,
      };
      const conversation = appendMessage(existing, message);
      const withConversation: AgentCollections =
        current.agentConversations.some((c) => c.id === conversation.id)
          ? current
          : {
              ...current,
              agentConversations: [...current.agentConversations, conversation],
            };
      let next = saveConversation(withConversation, conversation);
      if (input.kind === 'question' && input.question) {
        next = {
          ...next,
          assistedTasks: next.assistedTasks.map((a) =>
            a.taskId === taskId ? markPendingQuestion(a, true, at) : a,
          ),
        };
      }
      apply(next);
    },
    [apply],
  );

  const answerRound = useCallback(
    (taskId: string, answers: { questionId: string; answer: string }[]) => {
      const current = collectionsRef.current;
      const at = nowIso();
      const conversation = conversationForTask(current, taskId);
      if (!conversation) return;
      const nextConversation = answers.reduce(
        (open, item) => answerQuestion(open, item.questionId, item.answer, 'texto', at),
        conversation,
      );
      const withQuestionClosed = {
        ...current,
        assistedTasks: current.assistedTasks.map((a) =>
          a.taskId === taskId ? markPendingQuestion(a, false, at) : a,
        ),
      };
      apply(saveConversation(withQuestionClosed, nextConversation));
    },
    [apply],
  );

  const withPlan = useCallback(
    (taskId: string, transform: (plan: AgentPlan) => AgentPlan) => {
      const plan = planForTask(collections, taskId);
      if (!plan) return;
      apply(savePlan(collections, transform(plan)));
    },
    [collections, apply],
  );

  const confirmPlan = useCallback(
    (taskId: string) => withPlan(taskId, (plan) => confirmPlanDomain(plan, nowIso())),
    [withPlan],
  );
  const rejectPlan = useCallback(
    (taskId: string) => withPlan(taskId, (plan) => rejectPlanDomain(plan, nowIso())),
    [withPlan],
  );
  const editStep = useCallback(
    (taskId: string, stepId: string, patch: Partial<Pick<AgentPlanStep, 'title' | 'description' | 'dueDate' | 'status'>>) =>
      withPlan(taskId, (plan) => editStepDomain(plan, stepId, patch, nowIso())),
    [withPlan],
  );
  const removeStep = useCallback(
    (taskId: string, stepId: string) =>
      withPlan(taskId, (plan) => removeStepDomain(plan, stepId, nowIso())),
    [withPlan],
  );
  const markStepDone = useCallback(
    (taskId: string, stepId: string) =>
      withPlan(taskId, (plan) => markStepDomain(plan, stepId, nowIso())),
    [withPlan],
  );

  const saveArtifactPatch = useCallback(
    (_taskId: string, artifactId: string, patch: Record<string, unknown>) => {
      const artifact = collections.agentArtifacts.find((a) => a.id === artifactId);
      if (!artifact) return;
      apply(saveArtifact(collections, { ...artifact, ...patch, updatedAt: nowIso() }));
    },
    [collections, apply],
  );

  // Usado pelo sync (T012) para marcar `synced`; a UI não chama hoje.
  void saveArtifactPatch;

  const removeArtifact = useCallback(
    (_taskId: string, artifactId: string) => {
      apply(removeArtifactRepo(collections, artifactId));
    },
    [collections, apply],
  );

  const ask = useCallback(
    async (taskId: string, message: string): Promise<boolean> => {
      if (!session) return false;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return false;

      // Dado clínico e tamanho são barrados **antes** da rede: tarefa de
      // estágio nunca sai do aparelho, nem chega ao gateway.
      const built = buildMinimalContext({
        task,
        courseName: courses.find((c) => c.id === task.disciplineId)?.name,
        at: nowIso(),
      });
      if (!built.ok) return false;

      const at = nowIso();
      // Conversa fluida: cada job é stateless, então o histórico vai junto. Sem
      // plano e com pelo menos duas falas anteriores, o modo sobe para `plan` em
      // vez de só analisar outra vez. O ref enxerga a escrita que acabou de
      // acontecer (`answer` antes de `ask`), não o estado do render.
      const current = collectionsRef.current;
      const history = buildHistory(conversationForTask(current, taskId), message);
      const userTurns = history.filter((turn) => turn.role === 'user').length;
      const kind: AgentJob['kind'] =
        !planForTask(current, taskId) && userTurns >= 2 ? 'plan' : 'analyze';

      const operationId = `${kind}:${taskId}:${at}`;
      queueRef.current = enqueueJob(queueRef.current, {
        operationId,
        taskId,
        kind,
        payload: { message, context: built.context, history },
        at,
      });

      setAsking(true);
      try {
        const config = await session.config();
        if (!config) return false;

        const flushed = await flushQueue(config, queueRef.current, nowIso());
        queueRef.current = flushed.queue;
        if (flushed.sent === 0) return false;

        const deadline = Date.now() + POLL_TIMEOUT_MS;
        while (Date.now() < deadline) {
          await sleep(POLL_INTERVAL_MS);
          const polled = await pollQueue(config, queueRef.current, nowIso());
          queueRef.current = polled.queue;
          if (polled.error) return false;

          // O laço consulta a fila inteira; o resultado é aplicado na tarefa
          // dona do job, não na tarefa que chamou.
          for (const remote of polled.results) {
            const owner = jobFor(queueRef.current, remote.operationId)?.taskId ?? taskId;
            const outcome = applyRemoteJob(collectionsRef.current, owner, remote, nowIso());
            if (outcome.collections !== collectionsRef.current) apply(outcome.collections);
          }

          const status = jobFor(queueRef.current, operationId)?.status;
          if (status === 'done') return true;
          if (status === 'failed') return false;
        }
        return false;
      } finally {
        setAsking(false);
      }
    },
    [session, tasks, courses, apply],
  );

  return {
    collections,
    totalUnread: totalUnread(collections),
    helpEnabled: cecinhoHelpEnabled,
    setHelpEnabled: (enabled: boolean) => setCecinhoHelpEnabled(enabled),
    assistantReady: session !== null,
    asking,
    assistedFor,
    isActive: (taskId: string) => collections.assistedTasks.some((a) => a.taskId === taskId),
    conversationFor,
    planFor,
    artifactsFor,
    statusLabel,
    activate,
    remove,
    markRead: markTaskRead,
    append,
    answerRound,
    confirmPlan,
    rejectPlan,
    editStep,
    removeStep,
    markStepDone,
    saveArtifactPatch,
    removeArtifact,
    ask,
  };
}

export type { AgentStatusLabel };
