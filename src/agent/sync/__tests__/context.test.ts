import { describe, expect, it } from 'vitest';
import type { AgentMessage } from '@/types';
import { MAX_CONTEXT_BYTES, MAX_HISTORY_TURNS, buildHistory, buildMinimalContext } from '../context';

const base = {
  task: { title: 'Ler o capítulo 3 de Skinner', category: 'leitura' as const, priority: 'alta' as const },
  at: '2026-11-14T12:00:00.000Z',
};

describe('contexto mínimo', () => {
  it('leva só os campos da allowlist', () => {
    const result = buildMinimalContext({
      ...base,
      courseName: 'Psicologia do Desenvolvimento',
      relatedTaskTitles: ['resumir o capítulo'],
      noteExcerpts: ['nota de aula'],
      thesis: { title: 'TCC sobre reforço', chapterTitles: ['introdução'] },
    });
    expect(result.ok).toBe(true);
    if (!('context' in result)) return;
    expect(Object.keys(result.context).sort()).toEqual(
      ['at', 'notes', 'relatedTasks', 'task', 'thesis'].sort(),
    );
    expect(result.context.task).not.toHaveProperty('id');
    expect(result.context.task).not.toHaveProperty('disciplineId');
  });

  it('recusa tarefa de estágio: dado clínico não sai do aparelho', () => {
    const result = buildMinimalContext({
      task: { title: 'Escrever o registro da sessão', category: 'estagio', priority: 'alta' },
      at: base.at,
    });
    expect(result.ok).toBe(false);
    if ('context' in result) return;
    expect(result.error.code).toBe('clinical_blocked');
  });

  it('corta listas longas e registra o corte', () => {
    const result = buildMinimalContext({
      ...base,
      relatedTaskTitles: Array.from({ length: 12 }, (_, i) => `tarefa ${i}`),
      noteExcerpts: Array.from({ length: 9 }, () => 'nota'),
    });
    expect(result.ok).toBe(true);
    if (!('context' in result)) return;
    expect(result.context.relatedTasks).toHaveLength(8);
    expect(result.context.notes).toHaveLength(5);
    expect(result.truncated).toEqual(expect.arrayContaining(['relatedTasks', 'notes']));
  });

  it('recusa contexto acima do limite em vez de deixar o provedor recusar', () => {
    const result = buildMinimalContext({
      task: { title: 't'.repeat(200), category: 'trabalho', priority: 'alta' },
      at: base.at,
      relatedTaskTitles: Array.from({ length: 8 }, () => 'r'.repeat(200)),
      noteExcerpts: Array.from({ length: 5 }, () => 'x'.repeat(400)),
      thesis: { title: 'y'.repeat(200), chapterTitles: Array.from({ length: 8 }, () => 'c'.repeat(200)) },
    });
    expect(result.ok).toBe(false);
    if ('context' in result) return;
    expect(result.error.code).toBe('context_too_large');
    expect(MAX_CONTEXT_BYTES).toBe(4 * 1024);
  });
});

describe('histórico da conversa', () => {
  const message = (patch: Partial<AgentMessage> & Pick<AgentMessage, 'role' | 'content'>): AgentMessage => ({
    id: `m-${Math.random().toString(36).slice(2, 7)}`,
    kind: 'text',
    createdAt: '2026-11-14T12:00:00.000Z',
    ...patch,
  });

  it('descarta a mensagem atual, que já viaja em payload.message', () => {
    const history = buildHistory(
      {
        messages: [
          message({ role: 'user', content: 'preciso entregar o recorte' }),
          message({ role: 'assistant', content: 'qual o prazo?' }),
          message({ role: 'user', content: 'sexta' }),
        ],
      },
      'sexta',
    );

    expect(history.map((turn) => turn.content)).toEqual([
      'preciso entregar o recorte',
      'qual o prazo?',
    ]);
  });

  it('leva só os dois papéis da conversa', () => {
    const history = buildHistory({
      messages: [
        message({ role: 'system', content: 'ignorar' }),
        message({ role: 'tool', content: 'ignorar' }),
        message({ role: 'assistant', content: 'oi' }),
      ],
    });

    expect(history).toHaveLength(1);
    expect(history[0]).toEqual({ role: 'assistant', content: 'oi' });
  });

  it('mostra a resposta da usuária junto da pergunta', () => {
    const history = buildHistory({
      messages: [
        message({
          role: 'assistant',
          kind: 'question',
          content: 'qual o prazo?',
          question: { id: 'q1', text: 'qual o prazo?', answerKind: 'nao_sei' },
        }),
      ],
    });

    expect(history[0]?.content).toContain('não sei');
  });

  it('corta nas rodadas mais novas', () => {
    const messages = Array.from({ length: 20 }, (_, index) =>
      message({ role: index % 2 === 0 ? 'user' : 'assistant', content: `fala ${index}` }),
    );

    const history = buildHistory({ messages }, 'ignorada');

    expect(history).toHaveLength(MAX_HISTORY_TURNS);
    expect(history[history.length - 1]?.content).toBe('fala 19');
    expect(history.some((turn) => turn.content === 'fala 11')).toBe(false);
  });
});
