// Tarefa assistida — projeção complementar da `Task` (SPEC-037 D1/D3).
//
// Nada aqui importa React, Capacitor ou backend: são funções puras sobre dados.
// A `Task` continua sendo a fonte da verdade; esta entidade só guarda o estado
// da assistência e os contadores que a Agenda/Central leem sem abrir arquivo.

import type { AgentJobStatus, AgentPlanStatus, AssistedTask, AssistanceState } from '@/types';

export interface CreateAssistedTaskInput {
  taskId: string;
  conversationId: string;
  assistanceState?: AssistanceState;
  status?: AgentJobStatus;
  at: string;
}

/** Erros de forma; lista vazia = válida. */
export function validateAssistedTask(value: AssistedTask): string[] {
  const errors: string[] = [];
  if (!value.id.trim()) errors.push('id vazio');
  if (!value.taskId.trim()) errors.push('taskId vazio');
  if (!value.conversationId.trim()) errors.push('conversationId vazio');
  if (!value.createdAt) errors.push('createdAt ausente');
  return errors;
}

export function createAssistedTask(input: CreateAssistedTaskInput): AssistedTask {
  if (!input.taskId.trim()) throw new Error('createAssistedTask: taskId vazio');
  if (!input.conversationId.trim()) throw new Error('createAssistedTask: conversationId vazio');
  return {
    id: input.taskId,
    taskId: input.taskId,
    conversationId: input.conversationId,
    assistanceState: input.assistanceState ?? 'active',
    status: input.status ?? 'queued_local',
    unreadOutput: 0,
    pendingQuestion: false,
    createdAt: input.at,
    updatedAt: input.at,
  };
}

/** I10 — uma conversa por tarefa no MVP. */
export function assertOneConversationPerTask(items: readonly AssistedTask[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.taskId)) {
      throw new Error(`assistedTask: mais de uma conversa para a tarefa "${item.taskId}"`);
    }
    seen.add(item.taskId);
  }
}

export function findByTaskId(
  items: readonly AssistedTask[],
  taskId: string,
): AssistedTask | undefined {
  return items.find((item) => item.taskId === taskId);
}

export function upsertAssistedTask(
  items: readonly AssistedTask[],
  item: AssistedTask,
): AssistedTask[] {
  const idx = items.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...items, item];
  const next = items.slice();
  next[idx] = item;
  return next;
}

export function setAssistanceState(
  item: AssistedTask,
  assistanceState: AssistanceState,
  at: string,
): AssistedTask {
  return { ...item, assistanceState, updatedAt: at };
}

/** Leitura zera o contador de outputs novos. */
export function markRead(item: AssistedTask, at: string): AssistedTask {
  return { ...item, unreadOutput: 0, updatedAt: at };
}

export function bumpUnread(item: AssistedTask, at: string, count = 1): AssistedTask {
  return { ...item, unreadOutput: item.unreadOutput + count, updatedAt: at };
}

export function markPendingQuestion(item: AssistedTask, pending: boolean, at: string): AssistedTask {
  return { ...item, pendingQuestion: pending, updatedAt: at };
}

/** Rótulo de estado — a UI traduz para a frase de `voice.ts` (nunca o inverso). */
export type AgentStatusLabel =
  | 'analisando'
  | 'pergunta'
  | 'plano'
  | 'arquivo'
  | 'sincronizando'
  | 'concluido'
  | 'ocioso';

/**
 * Deriva o estado visível. Pergunta pendente vence plano pronto; arquivo vence
 * "ocioso". O agente **nunca** conclui a tarefa sozinho (D7), então
 * `concluido` só aparece quando a própria assistência foi encerrada.
 */
export function agentStatusLabel(
  assisted: AssistedTask,
  planStatus?: AgentPlanStatus,
  hasArtifact = false,
): AgentStatusLabel {
  if (assisted.assistanceState === 'completed') return 'concluido';
  if (assisted.pendingQuestion) return 'pergunta';
  if (planStatus === 'draft' || planStatus === 'reviewing') return 'plano';
  if (assisted.status === 'queued_local' || assisted.status === 'queued_remote') {
    return 'sincronizando';
  }
  if (assisted.status === 'processing') return 'analisando';
  if (hasArtifact) return 'arquivo';
  return 'ocioso';
}
