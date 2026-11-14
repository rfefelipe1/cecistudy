import { describe, expect, it } from 'vitest';
import {
  createSemesterMemory,
  patchSemesterMemory,
  sortMemoriesByRecency,
  memoriesByTerm,
  validarMemoria,
  MEMORY_CATEGORY_META,
  type SemesterMemory,
  type MemoryCategory,
} from '../semesterMemory';

const NOW = '2026-10-28T12:00:00.000Z';
const TERM_ID = 'trm-1';

function mem(overrides: Partial<SemesterMemory> & { now?: string } = {}): SemesterMemory {
  return createSemesterMemory({
    termId: TERM_ID,
    title: 'minha memória',
    category: 'feliz',
    termDate: '2026-08-01',
    now: overrides.now ?? NOW,
    ...overrides,
  });
}

describe('semesterMemory — criação', () => {
  it('cria com id automático quando não informado', () => {
    const m = mem();
    expect(m.id).toMatch(/^mem-/);
    expect(m.termId).toBe(TERM_ID);
    expect(m.title).toBe('minha memória');
    expect(m.category).toBe('feliz');
    expect(m.createdAt).toBe(NOW);
    expect(m.updatedAt).toBe(NOW);
  });

  it('aceita id informado', () => {
    const m = mem({ id: 'mem-xyz' });
    expect(m.id).toBe('mem-xyz');
  });

  it('trimma o título', () => {
    const m = mem({ title: '  espaços  ' });
    expect(m.title).toBe('espaços');
  });

  it('trimma a descrição', () => {
    const m = mem({ description: '  texto  ' });
    expect(m.description).toBe('texto');
  });

  it('descrição undefined vira undefined (não string vazia)', () => {
    const m = mem({ description: undefined });
    expect(m.description).toBeUndefined();
  });

  it('aceita categoria engracada', () => {
    const m = mem({ category: 'engracada' });
    expect(m.category).toBe('engracada');
  });
});

describe('semesterMemory — validação', () => {
  it('rejeita título vazio', () => {
    expect(validarMemoria({ title: '' })).toBe('o título é obrigatório');
    expect(validarMemoria({ title: '   ' })).toBe('o título é obrigatório');
  });

  it('rejeita categoria inválida', () => {
    expect(validarMemoria({ title: 'ok', category: 'tralha' as MemoryCategory })).toBe(
      'categoria inválida',
    );
  });

  it('aceita categorias válidas', () => {
    for (const cat of ['feliz', 'engracada', 'assustadora', 'memoravel'] as const) {
      expect(validarMemoria({ title: 'ok', category: cat })).toBeNull();
    }
  });

  it('rejeita data da memória com formato inválido', () => {
    expect(validarMemoria({ title: 'ok', memoryDate: '26/10/2026' })).toBe(
      'data da memória inválida (use AAAA-MM-DD)',
    );
  });

  it('aceita data da memória vazia ou indefinida', () => {
    expect(validarMemoria({ title: 'ok', memoryDate: '' })).toBeNull();
    expect(validarMemoria({ title: 'ok', memoryDate: undefined })).toBeNull();
    expect(validarMemoria({ title: 'ok', memoryDate: '2026-10-28' })).toBeNull();
  });
});

describe('semesterMemory — patch', () => {
  it('atualiza campos e o updatedAt', () => {
    const m = mem();
    const atualizado = patchSemesterMemory(
      m,
      { title: 'novo título', category: 'memoravel' },
      '2026-10-29T00:00:00.000Z',
    );
    expect(atualizado.title).toBe('novo título');
    expect(atualizado.category).toBe('memoravel');
    expect(atualizado.updatedAt).toBe('2026-10-29T00:00:00.000Z');
    expect(atualizado.createdAt).toBe(m.createdAt); // não mexe no createdAt
    expect(atualizado.id).toBe(m.id);
  });

  it('rejeita patch com título vazio', () => {
    const m = mem();
    expect(() =>
      patchSemesterMemory(m, { title: '' }, '2026-10-29T00:00:00.000Z'),
    ).toThrow('o título é obrigatório');
  });
});

describe('semesterMemory — ordenação e filtro', () => {
  it('ordena do mais recente para o mais antigo', () => {
    const a = mem({ id: 'mem-a', now: '2026-10-01T00:00:00.000Z' });
    const b = mem({ id: 'mem-b', now: '2026-10-03T00:00:00.000Z' });
    const c = mem({ id: 'mem-c', now: '2026-10-02T00:00:00.000Z' });
    const ordenados = sortMemoriesByRecency([a, c, b]);
    expect(ordenados.map((m) => m.id)).toEqual(['mem-b', 'mem-c', 'mem-a']);
  });

  it('filtra por termo', () => {
    const a = mem({ id: 'mem-a', termId: 'trm-1' });
    const b = mem({ id: 'mem-b', termId: 'trm-2' });
    const c = mem({ id: 'mem-c', termId: 'trm-1' });
    const filtrados = memoriesByTerm([a, b, c], 'trm-1');
    expect(filtrados.map((m) => m.id)).toEqual(['mem-a', 'mem-c']);
  });
});

describe('semesterMemory — meta de categoria', () => {
  it('todas as quatro categorias têm rótulo, ícone e cor', () => {
    for (const cat of ['feliz', 'engracada', 'assustadora', 'memoravel'] as const) {
      const meta = MEMORY_CATEGORY_META[cat];
      expect(typeof meta.label).toBe('string');
      expect(typeof meta.icon).toBe('string');
      expect(typeof meta.color).toBe('string');
      expect(meta.label.length).toBeGreaterThan(0);
    }
  });
});
