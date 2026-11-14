import { describe, expect, it } from 'vitest';
import { MAX_CONTEXT_BYTES, buildMinimalContext } from '../context';

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
