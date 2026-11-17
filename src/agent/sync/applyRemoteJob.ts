// Resultado remoto → coleções leves (SPEC-037 T012).
//
// Puro sobre `AgentCollections`: o hook só grava o que voltar daqui. Duas regras
// que a UI não pode furar e por isso moram aqui:
//   - o plano que chega do gateway nasce **draft** (`D5`): nada vira realidade
//     antes da confirmação;
//   - mensagem/artefato repetido não duplica — o gateway é idempotente, mas a
//     tela não precisa confiar nisso.

import type { AgentArtifact, AgentMessage, AgentPlan, AgentPlanStep } from '@/types';
import { appendMessage, createConversation } from '../domain/conversation';
import { createDraftPlan, createStep } from '../domain/plan';
import {
  conversationForTask,
  planForTask,
  saveArtifact,
  saveConversation,
  savePlan,
  type AgentCollections,
} from '../storage/agentRepository';
import type { RemoteJob } from './agentJobClient';

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export interface ApplyRemoteOutcome {
  collections: AgentCollections;
  appended: number;
  planCreated: boolean;
  artifactsAdded: number;
}

export function applyRemoteJob(
  collections: AgentCollections,
  taskId: string,
  remote: RemoteJob,
  at: string,
): ApplyRemoteOutcome {
  if (!collections.assistedTasks.some((a) => a.taskId === taskId)) {
    return { collections, appended: 0, planCreated: false, artifactsAdded: 0 };
  }

  let next = collections;
  let appended = 0;

  // --- mensagens
  const incoming = remote.messages ?? [];
  if (incoming.length > 0) {
    let conversation = conversationForTask(next, taskId) ?? createConversation(taskId, at);
    const seen = new Set(conversation.messages.map((m) => `${m.kind}:${m.content}`));
    for (const [index, message] of incoming.entries()) {
      const key = `${message.kind}:${message.content}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const local: AgentMessage = {
        id: message.id ?? `${remote.operationId}-m${index}`,
        role: message.role,
        kind: message.kind,
        content: message.content,
        createdAt: at,
        question: message.question,
      };
      conversation = appendMessage(conversation, local);
      appended += 1;
    }
    if (appended > 0) {
      const pending = incoming.some(
        (m) => m.kind === 'question' && m.question?.answerKind === undefined,
      );
      next = saveConversation(next, conversation);
      next = {
        ...next,
        assistedTasks: next.assistedTasks.map((a) =>
          a.taskId === taskId
            ? {
                ...a,
                pendingQuestion: pending,
                status: remote.status,
                updatedAt: at,
              }
            : a,
        ),
      };
    }
  }

  // --- plano (draft, sempre)
  let planCreated = false;
  if (remote.plan && !planForTask(next, taskId)) {
    const steps: AgentPlanStep[] = remote.plan.steps.map((step, index) => {
      const base = createStep(step.title, 'agent', {
        description: step.description,
        dueDate: step.dueDate,
      });
      return { ...base, id: `${base.id}-${index + 1}` };
    });
    const draft: AgentPlan = {
      ...createDraftPlan({
        taskId,
        objective: remote.plan.objective,
        expectedOutput: remote.plan.expectedOutput,
        at,
      }),
      steps,
    };
    next = savePlan(next, draft);
    next = {
      ...next,
      assistedTasks: next.assistedTasks.map((a) =>
        a.taskId === taskId ? { ...a, planId: draft.id, updatedAt: at } : a,
      ),
    };
    planCreated = true;
  }

  // --- artefatos
  let artifactsAdded = 0;
  for (const artifact of remote.artifacts ?? []) {
    if (next.agentArtifacts.some((a) => a.taskId === taskId && a.path === artifact.path)) continue;
    const local: AgentArtifact = {
      id: `art-${taskId}-${slug(artifact.name) || artifactsAdded + 1}`,
      taskId,
      path: artifact.path,
      name: artifact.name,
      mimeType: artifact.mimeType,
      source: 'agent',
      currentVersionId: 'v1',
      sizeBytes: artifact.content ? new TextEncoder().encode(artifact.content).length : undefined,
      synced: true,
      createdAt: at,
      updatedAt: at,
    };
    next = saveArtifact(next, local);
    artifactsAdded += 1;
  }

  if (appended === 0 && !planCreated && artifactsAdded === 0) {
    return { collections, appended: 0, planCreated: false, artifactsAdded: 0 };
  }

  return { collections: next, appended, planCreated, artifactsAdded };
}
