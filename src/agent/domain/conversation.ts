// Conversa do agente (SPEC-037 D4).
//
// Contrato duro: no máximo **três perguntas por rodada**. A validação mora aqui,
// não na UI — a UI pode esquecer; o domínio não.

import type { AgentConversation, AgentMessage, AgentQuestion } from '@/types';

/** D4 — teto por rodada de conversa. */
export const MAX_QUESTIONS_PER_ROUND = 3;

export function createConversation(taskId: string, at: string, id?: string): AgentConversation {
  if (!taskId.trim()) throw new Error('createConversation: taskId vazio');
  return {
    id: id ?? `conv-${taskId}`,
    taskId,
    messages: [],
    createdAt: at,
    updatedAt: at,
  };
}

/** `true` se a pergunta ainda espera resposta ("não sei"/"depois" contam como resposta). */
export function isQuestionPending(message: AgentMessage): boolean {
  return message.kind === 'question' && message.question?.answerKind === undefined;
}

export function pendingQuestions(messages: readonly AgentMessage[]): AgentQuestion[] {
  return messages
    .filter(isQuestionPending)
    .map((message) => message.question!)
    .filter(Boolean);
}

/**
 * Perguntas da rodada aberta — as mensagens de pergunta no **fim** da conversa,
 * parando na primeira mensagem que não é pergunta. É o que a UI mostra como
 * "responda estas" e o que o teto de três protege.
 */
export function questionsInOpenRound(messages: readonly AgentMessage[]): AgentMessage[] {
  const round: AgentMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]!;
    if (message.kind !== 'question') break;
    round.unshift(message);
  }
  return round;
}

/** D4/I4 — rejeita uma rodada com mais de três perguntas. */
export function assertQuestionRound(questions: readonly unknown[]): void {
  if (questions.length > MAX_QUESTIONS_PER_ROUND) {
    throw new Error(
      `conversation: uma rodada tem no máximo ${MAX_QUESTIONS_PER_ROUND} perguntas (recebeu ${questions.length})`,
    );
  }
}

export function appendMessage(
  conversation: AgentConversation,
  message: AgentMessage,
): AgentConversation {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: message.createdAt,
  };
}

/** Anexa uma rodada inteira de perguntas, respeitando o teto. */
export function appendQuestionRound(
  conversation: AgentConversation,
  questions: readonly AgentMessage[],
): AgentConversation {
  assertQuestionRound(questions);
  const wrongKind = questions.find((question) => question.kind !== 'question');
  if (wrongKind) throw new Error('conversation: rodada de perguntas contém mensagem de outro tipo');
  return questions.reduce(appendMessage, conversation);
}

/** Responde uma pergunta. `nao_sei` e `depois` são respostas válidas. */
export function answerQuestion(
  conversation: AgentConversation,
  questionId: string,
  answer: string,
  answerKind: NonNullable<AgentQuestion['answerKind']> = 'texto',
  at: string,
): AgentConversation {
  let found = false;
  const messages = conversation.messages.map((message) => {
    if (message.kind !== 'question' || message.question?.id !== questionId) return message;
    found = true;
    return {
      ...message,
      question: { ...message.question, answer: answer.trim(), answerKind },
    };
  });
  if (!found) throw new Error(`conversation: pergunta "${questionId}" não existe`);
  return { ...conversation, messages, updatedAt: at };
}

/** Outputs não lidos desde `lastReadAt` (mensagens do assistente). */
export function countUnread(
  messages: readonly AgentMessage[],
  lastReadAt: string | undefined,
): number {
  const since = lastReadAt ?? '';
  return messages.filter(
    (message) =>
      message.role === 'assistant' &&
      (message.kind === 'text' || message.kind === 'artifact' || message.kind === 'plan') &&
      message.createdAt > since,
  ).length;
}

/** Últimas mensagens, da mais antiga para a mais nova (o que a lista mostra). */
export function lastMessage(messages: readonly AgentMessage[]): AgentMessage | undefined {
  return messages[messages.length - 1];
}
