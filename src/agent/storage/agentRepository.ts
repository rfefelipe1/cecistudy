// Repositório do agente (SPEC-037 T005).
//
// Puro sobre as quatro coleções leves; não importa React, Capacitor nem o
// DataClient. O `useCecinho` (hook) liga estas funções ao `useStampedState`.
//
// Fronteira: aqui só vive o **estado leve** (ids, estados, contadores e a
// conversa resumida). Conversa completa, artefatos, versões e manifest moram
// no workspace de arquivos (`taskWorkspace.ts`).

import type {
  AgentArtifact,
  AgentConversation,
  AgentPlan,
  AssistedTask,
} from '@/types';
import {
  assertOneConversationPerTask,
  createAssistedTask,
  type CreateAssistedTaskInput,
} from '../domain/assistedTask';
import { createConversation, countUnread } from '../domain/conversation';

export interface AgentCollections {
  assistedTasks: AssistedTask[];
  agentConversations: AgentConversation[];
  agentPlans: AgentPlan[];
  agentArtifacts: AgentArtifact[];
}

export const emptyAgentCollections: AgentCollections = {
  assistedTasks: [],
  agentConversations: [],
  agentPlans: [],
  agentArtifacts: [],
};

function replaceById<T extends { id: string }>(items: readonly T[], item: T): T[] {
  const idx = items.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...items, item];
  const next = items.slice();
  next[idx] = item;
  return next;
}

export function conversationForTask(
  collections: AgentCollections,
  taskId: string,
): AgentConversation | undefined {
  return collections.agentConversations.find((c) => c.taskId === taskId);
}

export function planForTask(
  collections: AgentCollections,
  taskId: string,
): AgentPlan | undefined {
  return collections.agentPlans.find((p) => p.taskId === taskId);
}

export function artifactsForTask(
  collections: AgentCollections,
  taskId: string,
): AgentArtifact[] {
  return collections.agentArtifacts.filter((a) => a.taskId === taskId);
}

/**
 * Ativa a assistência de uma tarefa. Idempotente: se já existe assistência, só
 * devolve o estado atual — duas conversas para a mesma tarefa são erro (I10).
 */
export function activateAssistance(
  collections: AgentCollections,
  input: Omit<CreateAssistedTaskInput, 'conversationId'> & { conversationId?: string },
): AgentCollections {
  const existing = collections.assistedTasks.find((a) => a.taskId === input.taskId);
  if (existing) return collections;

  assertOneConversationPerTask(collections.assistedTasks);
  const conversationId = input.conversationId ?? `conv-${input.taskId}`;
  const assisted = createAssistedTask({ ...input, conversationId });
  const conversation = createConversation(input.taskId, input.at, conversationId);
  return {
    ...collections,
    assistedTasks: [...collections.assistedTasks, assisted],
    agentConversations: [...collections.agentConversations, conversation],
  };
}

export function saveAssistedTask(
  collections: AgentCollections,
  assisted: AssistedTask,
): AgentCollections {
  return { ...collections, assistedTasks: replaceById(collections.assistedTasks, assisted) };
}

export function saveConversation(
  collections: AgentCollections,
  conversation: AgentConversation,
): AgentCollections {
  const unread = countUnread(conversation.messages, conversation.lastReadAt);
  return {
    ...collections,
    agentConversations: replaceById(collections.agentConversations, conversation),
    assistedTasks: collections.assistedTasks.map((assisted) =>
      assisted.conversationId === conversation.id
        ? { ...assisted, unreadOutput: unread, updatedAt: conversation.updatedAt }
        : assisted,
    ),
  };
}

export function savePlan(collections: AgentCollections, plan: AgentPlan): AgentCollections {
  return {
    ...collections,
    agentPlans: replaceById(collections.agentPlans, plan),
    assistedTasks: collections.assistedTasks.map((assisted) =>
      assisted.taskId === plan.taskId
        ? { ...assisted, planId: plan.id, updatedAt: plan.updatedAt }
        : assisted,
    ),
  };
}

export function saveArtifact(
  collections: AgentCollections,
  artifact: AgentArtifact,
): AgentCollections {
  return { ...collections, agentArtifacts: replaceById(collections.agentArtifacts, artifact) };
}

export function removeArtifact(
  collections: AgentCollections,
  artifactId: string,
): AgentCollections {
  return {
    ...collections,
    agentArtifacts: collections.agentArtifacts.filter((a) => a.id !== artifactId),
  };
}

/**
 * Remove a assistência e os estados derivados (conversa, plano, artefatos).
 * O workspace em disco **não** é apagado aqui — exclusão de arquivo é ação
 * explícita da usuária (`delete_file` passa por `ask`).
 */
export function removeAssistance(
  collections: AgentCollections,
  taskId: string,
): AgentCollections {
  return {
    assistedTasks: collections.assistedTasks.filter((a) => a.taskId !== taskId),
    agentConversations: collections.agentConversations.filter((c) => c.taskId !== taskId),
    agentPlans: collections.agentPlans.filter((p) => p.taskId !== taskId),
    agentArtifacts: collections.agentArtifacts.filter((a) => a.taskId !== taskId),
  };
}

/** Total de pendências não lidas — o contador da Central na Agenda. */
export function totalUnread(collections: AgentCollections): number {
  return collections.assistedTasks.reduce(
    (sum, assisted) => sum + assisted.unreadOutput + (assisted.pendingQuestion ? 1 : 0),
    0,
  );
}
