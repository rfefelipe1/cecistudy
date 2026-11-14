// Liga o domínio do Cecinho Agent ao estado da usuária (SPEC-037 T005/T006).
//
// A regra continua no domínio (`src/agent/domain/*`) e no repositório
// (`src/agent/storage/agentRepository.ts`); aqui só há cola de React: leitura
// das quatro coleções leves, escrita atômica e o relógio da borda.

import { useCallback, useMemo } from 'react';
import { useDataClientApp } from '@/context/DataClientProvider';
import type {
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
import { DICA, frase } from '@/lib/voice';

const nowIso = () => new Date().toISOString();
const messageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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
  answer: (
    taskId: string,
    questionId: string,
    answer: string,
    kind?: NonNullable<AgentQuestion['answerKind']>,
  ) => void;
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

  /**
   * Grava as quatro coleções de uma vez. As referências inalteradas são
   * preservadas pelo repositório, então o React só re-renderiza o que mudou.
   */
  const apply = useCallback(
    (next: AgentCollections) => {
      if (next.assistedTasks !== collections.assistedTasks) setAssistedTasks(next.assistedTasks);
      if (next.agentConversations !== collections.agentConversations) {
        setAgentConversations(next.agentConversations);
      }
      if (next.agentPlans !== collections.agentPlans) setAgentPlans(next.agentPlans);
      if (next.agentArtifacts !== collections.agentArtifacts) {
        setAgentArtifacts(next.agentArtifacts);
      }
    },
    [
      collections,
      setAssistedTasks,
      setAgentConversations,
      setAgentPlans,
      setAgentArtifacts,
    ],
  );

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
      const at = nowIso();
      const existing =
        conversationForTask(collections, taskId) ?? createConversation(taskId, at);
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
        collections.agentConversations.some((c) => c.id === conversation.id)
          ? collections
          : {
              ...collections,
              agentConversations: [...collections.agentConversations, conversation],
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
    [collections, apply],
  );

  const answer = useCallback(
    (taskId: string, questionId: string, text: string, kind: 'texto' | 'nao_sei' | 'depois' = 'texto') => {
      const at = nowIso();
      const conversation = conversationForTask(collections, taskId);
      if (!conversation) return;
      const nextConversation = answerQuestion(conversation, questionId, text, kind, at);
      const assisted = collections.assistedTasks.find((a) => a.taskId === taskId);
      const withQuestionClosed = assisted
        ? {
            ...collections,
            assistedTasks: collections.assistedTasks.map((a) =>
              a.taskId === taskId ? markPendingQuestion(a, false, at) : a,
            ),
          }
        : collections;
      apply(saveConversation(withQuestionClosed, nextConversation));
    },
    [collections, apply],
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

  return {
    collections,
    totalUnread: totalUnread(collections),
    helpEnabled: cecinhoHelpEnabled,
    setHelpEnabled: (enabled: boolean) => setCecinhoHelpEnabled(enabled),
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
    answer,
    confirmPlan,
    rejectPlan,
    editStep,
    removeStep,
    markStepDone,
    saveArtifactPatch,
    removeArtifact,
  };
}

export type { AgentStatusLabel };
