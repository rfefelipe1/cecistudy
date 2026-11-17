// Contexto mínimo enviado ao gateway (SPEC-037 D11).
//
// Duas regras, e as duas são testadas:
//   1. **Allowlist**, nunca o banco inteiro. O que não está listado não sai do
//      aparelho — inclusive qualquer dado clínico (`estagio` é recusado).
//   2. **Tamanho limitado**. Contexto grande demais falha aqui, com erro
//      nomeado, e não no provedor.
//
// O que foi cortado/omitido volta em `truncated` para o `context-snapshot.json`
// do gateway. Contexto sem trilha é contexto que ninguém audita.

import type { AgentConversation, AgentMessage, Task } from '@/types';

/**
 * Limite do payload de contexto. 4 KiB cabe folgado no orçamento de contexto do
 * modelo e é atingível com os caps abaixo — guarda que nunca dispara é guarda
 * que ninguém testou.
 */
export const MAX_CONTEXT_BYTES = 4 * 1024;
const MAX_TITLE = 200;
const MAX_RELATED = 8;
const MAX_CHAPTERS = 8;
const MAX_NOTES = 5;
const MAX_NOTE_CHARS = 400;

export type MinimalContextErrorCode = 'clinical_blocked' | 'context_too_large';

export interface MinimalContextError {
  code: MinimalContextErrorCode;
  message: string;
}

export type MinimalContextResult =
  | { ok: true; context: MinimalTaskContext; bytes: number; truncated: string[] }
  | { ok: false; error: MinimalContextError };

/** A forma exata que atravessa a rede. Campo novo aqui é decisão de produto. */
export interface MinimalTaskContext {
  task: {
    title: string;
    category: Task['category'];
    priority: Task['priority'];
    dueDate?: string;
    courseName?: string;
  };
  thesis?: { title?: string; chapters: string[] };
  relatedTasks: string[];
  notes: string[];
  /** Instante de referência — o gateway não lê o relógio do aparelho. */
  at: string;
}

export interface MinimalContextInput {
  task: Pick<Task, 'title' | 'category' | 'priority' | 'dueDate'>;
  courseName?: string;
  thesis?: { title?: string; chapterTitles?: string[]; pendingTaskTitles?: string[] };
  relatedTaskTitles?: string[];
  noteExcerpts?: string[];
  at: string;
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

function take<T>(items: readonly T[] | undefined, max: number): T[] {
  return (items ?? []).slice(0, max);
}

export function buildMinimalContext(input: MinimalContextInput): MinimalContextResult {
  if (input.task.category === 'estagio') {
    return {
      ok: false,
      error: {
        code: 'clinical_blocked',
        message: 'tarefa de estágio tem dado clínico bloqueado pelo runtime',
      },
    };
  }

  const truncated: string[] = [];
  const relatedSource = input.relatedTaskTitles ?? [];
  const chapterSource = input.thesis?.chapterTitles ?? [];
  const noteSource = input.noteExcerpts ?? [];

  if (relatedSource.length > MAX_RELATED) truncated.push('relatedTasks');
  if (chapterSource.length > MAX_CHAPTERS) truncated.push('thesis.chapters');
  if (noteSource.length > MAX_NOTES) truncated.push('notes');

  const context: MinimalTaskContext = {
    task: {
      title: clip(input.task.title, MAX_TITLE),
      category: input.task.category,
      priority: input.task.priority,
      dueDate: input.task.dueDate,
      courseName: input.courseName ? clip(input.courseName, MAX_TITLE) : undefined,
    },
    thesis:
      input.thesis || chapterSource.length > 0
        ? {
            title: input.thesis?.title ? clip(input.thesis.title, MAX_TITLE) : undefined,
            chapters: take(chapterSource, MAX_CHAPTERS).map((c) => clip(c, MAX_TITLE)),
          }
        : undefined,
    relatedTasks: take(relatedSource, MAX_RELATED).map((t) => clip(t, MAX_TITLE)),
    notes: take(noteSource, MAX_NOTES).map((n) => clip(n, MAX_NOTE_CHARS)),
    at: input.at,
  };

  const bytes = new TextEncoder().encode(JSON.stringify(context)).length;
  if (bytes > MAX_CONTEXT_BYTES) {
    return {
      ok: false,
      error: {
        code: 'context_too_large',
        message: `contexto tem ${bytes} bytes; o limite é ${MAX_CONTEXT_BYTES}`,
      },
    };
  }

  return { ok: true, context, bytes, truncated };
}

// ---------------------------------------------------------------------------
// Histórico da conversa
// ---------------------------------------------------------------------------
//
// O gateway é stateless: sem histórico cada job recomeçaria a conversa. Mandar
// as últimas rodadas é o que faz o agente não repetir pergunta já respondida.
// Mesmas regras do contexto: allowlist de papel, teto de rodadas e de tamanho —
// 8 × 400 caracteres fica muito abaixo do `MAX_CONTEXT_BYTES`, então o teto de
// bytes do contexto continua valendo para ele.

export const MAX_HISTORY_TURNS = 8;
const MAX_HISTORY_CHARS = 400;

export interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

function answerText(message: AgentMessage): string {
  const kind = message.question?.answerKind;
  if (!kind) return '';
  if (kind === 'texto') return message.question?.answer ?? '';
  return kind === 'nao_sei' ? 'não sei' : 'depois';
}

function renderTurn(message: AgentMessage): string {
  const answer = answerText(message);
  const base = clip(message.content, MAX_HISTORY_CHARS);
  return answer ? clip(`${base} (ela respondeu: ${answer})`, MAX_HISTORY_CHARS) : base;
}

/**
 * Últimas rodadas da conversa, da mais antiga para a mais nova.
 *
 * `currentMessage` é o texto que vai em `payload.message`: se ele já foi
 * apendado na conversa (o caminho do `send`), é descartado daqui para não
 * aparecer duas vezes no prompt.
 */
export function buildHistory(
  conversation: Pick<AgentConversation, 'messages'> | undefined,
  currentMessage?: string,
): HistoryTurn[] {
  const messages = (conversation?.messages ?? []).filter(
    (message) => message.role === 'user' || message.role === 'assistant',
  );
  const current = currentMessage?.trim();
  const last = messages[messages.length - 1];
  const withoutCurrent =
    current && last?.role === 'user' && last.content.trim() === current ? messages.slice(0, -1) : messages;

  return withoutCurrent
    .slice(-MAX_HISTORY_TURNS)
    .map((message) => ({
      role: (message.role === 'user' ? 'user' : 'assistant') as HistoryTurn['role'],
      content: renderTurn(message),
    }))
    .filter((turn) => turn.content);
}
