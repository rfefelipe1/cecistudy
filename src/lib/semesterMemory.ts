/**
 * Memória de semestre (SPEC-028) — domínio puro, sem React, sem storage,
 * sem Capacitor. `now` entra sempre por argumento; nunca lê o relógio.
 *
 * Toda memória está vinculada a um `AcademicTerm` existente (D2). Categorias
 * fixas (D12): feliz, engraçada, assustadora, memorável. Sem campo livre de
 * categoria — o usuário pediu "sem registros brutos", e categorias livres
 * virariam rastreamento, não memória afetiva.
 *
 * Identificadores das categorias são sem acento (limitação de tipo TS);
 * rótulos de exibição mantêm o acento (D12).
 */

import type { EntityId, DateKey } from '@cecistudy/domain';
import { makeId } from '@cecistudy/domain';

export type MemoryCategory = 'feliz' | 'engracada' | 'assustadora' | 'memoravel';

/** Cores fixas por categoria — usado pela UI para identificar visualmente. */
export const MEMORY_CATEGORY_META: Record<
  MemoryCategory,
  { label: string; icon: string; color: string }
> = {
  feliz: {
    label: 'feliz',
    icon: 'Sparkles',
    color: '#D85F79',
  },
  engracada: {
    label: 'engraçada',
    icon: 'Lightbulb',
    color: '#4A879F',
  },
  assustadora: {
    label: 'assustadora',
    icon: 'AlertTriangle',
    color: '#B2554D',
  },
  memoravel: {
    label: 'memorável',
    icon: 'BookOpen',
    color: '#756354',
  },
};

export interface SemesterMemory {
  id: EntityId;
  /** Referência ao `AcademicTerm` ao qual a memória pertence. */
  termId: EntityId;
  title: string;
  category: MemoryCategory;
  description?: string;
  /** Data em que a memória aconteceu (`YYYY-MM-DD`), opcional. */
  memoryDate?: DateKey;
  /** `startedAt` do semestre (derivada do termo, nunca digitada pela usuária). */
  termDate: DateKey;
  createdAt: string;
  updatedAt: string;
}

/** Validação pura de uma memória. Devolve `null` se válida, ou a razão do erro. */
export function validarMemoria(memoria: Partial<SemesterMemory>): string | null {
  if (!memoria.title || memoria.title.trim().length === 0) {
    return 'o título é obrigatório';
  }
  if (memoria.category !== undefined && !isValidCategory(memoria.category)) {
    return 'categoria inválida';
  }
  if (
    memoria.memoryDate !== undefined &&
    memoria.memoryDate !== '' &&
    !/^\d{4}-\d{2}-\d{2}$/.test(memoria.memoryDate)
  ) {
    return 'data da memória inválida (use AAAA-MM-DD)';
  }
  return null;
}

function isValidCategory(cat: unknown): cat is MemoryCategory {
  return (
    cat === 'feliz' ||
    cat === 'engracada' ||
    cat === 'assustadora' ||
    cat === 'memoravel'
  );
}

/** Cria uma memória. `now` (ISO) entra por argumento — nunca `Date.now()` aqui. */
export function createSemesterMemory(input: {
  termId: EntityId;
  title: string;
  category: MemoryCategory;
  description?: string;
  memoryDate?: DateKey;
  termDate: DateKey;
  now: string;
  id?: EntityId;
}): SemesterMemory {
  const erro = validarMemoria(input);
  if (erro) throw new Error(erro);

  const now = input.now;
  return {
    id: input.id ?? makeId('mem'),
    termId: input.termId,
    title: input.title.trim(),
    category: input.category,
    description: input.description?.trim() ?? undefined,
    memoryDate: input.memoryDate ?? undefined,
    termDate: input.termDate,
    createdAt: now,
    updatedAt: now,
  };
}

/** Aplica um patch imutável a uma memória. `now` entra por argumento. */
export function patchSemesterMemory(
  memoria: SemesterMemory,
  patch: Partial<Pick<SemesterMemory, 'title' | 'category' | 'description' | 'memoryDate'>>,
  now: string,
): SemesterMemory {
  const candidato: Partial<SemesterMemory> = { ...memoria, ...patch, updatedAt: now };
  const erro = validarMemoria(candidato);
  if (erro) throw new Error(erro);
  return {
    ...memoria,
    ...patch,
    updatedAt: now,
  } as SemesterMemory;
}

/** Ordena memórias do mais recente para o mais antigo (por `updatedAt`). */
export function sortMemoriesByRecency(memorias: SemesterMemory[]): SemesterMemory[] {
  return [...memorias].sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
}

/** Filtra memórias de um termo específico. */
export function memoriesByTerm(memorias: SemesterMemory[], termId: EntityId): SemesterMemory[] {
  return memorias.filter((m) => m.termId === termId);
}
