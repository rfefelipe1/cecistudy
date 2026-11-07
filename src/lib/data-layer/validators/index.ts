/**
 * Índice de validadores por coleção (SPEC-M-029 D3).
 *
 * Mapeia cada `ChaveColecao` para sua função de validação. Coleções sem schema
 * específico usam o validador genérico apropriado ao seu `kind`.
 */

import { validarProfile, userProfileSchema } from './profile.ts';
import {
  validarArrayCollection,
  validarSingletonCollection,
  validarIdListCollection,
  validarMapCollection,
} from './generic.ts';
import type { CollectionKey, CollectionKind } from '../../../../packages/data/src/collections.ts';
import { getCollection } from '../../../../packages/data/src/collections.ts';

/** Tipo de função validador. */
export type CollectionValidator<T = unknown> = (valor: unknown) => T;

/** Registro de validadores por chave de coleção. */
const VALIDATORS: Partial<Record<CollectionKey, CollectionValidator>> = {
  // Singleton com schema específico
  profile: validarProfile as unknown as CollectionValidator,
  // Singletons genéricos
  tcc: validarSingletonCollection,
  streakData: validarSingletonCollection,
  // idLists
  savedBookIds: validarIdListCollection,
  bookmarkedCourseIds: validarIdListCollection,
  // Map
  readingProgress: validarMapCollection,
  // Arrays genéricos (o restante)
  courses: validarArrayCollection,
  classes: validarArrayCollection,
  tasks: validarArrayCollection,
  exams: validarArrayCollection,
  authors: validarArrayCollection,
  concepts: validarArrayCollection,
  readings: validarArrayCollection,
  flashcards: validarArrayCollection,
  decks: validarArrayCollection,
  materials: validarArrayCollection,
  techniques: validarArrayCollection,
  internshipLogs: validarArrayCollection,
  supervision: validarArrayCollection,
  stickers: validarArrayCollection,
  sessions: validarArrayCollection,
  looseNotes: validarArrayCollection,
  quizSessions: validarArrayCollection,
  academicTerms: validarArrayCollection,
  readingSessions: validarArrayCollection,
  readingHighlights: validarArrayCollection,
  readingBookmarks: validarArrayCollection,
  thesisChapters: validarArrayCollection,
  thesisReferences: validarArrayCollection,
  thesisMeetings: validarArrayCollection,
  thesisTasks: validarArrayCollection,
  thesisWritingLogs: validarArrayCollection,
};

/**
 * Retorna o validador para uma chave de coleção.
 *
 * Lança erro se a chave não tiver validador (não deve acontecer, pois todas as
 * 23 coleções do registry estão mapeadas aqui).
 */
export function getValidator(chave: CollectionKey): CollectionValidator {
  const validator = VALIDATORS[chave];
  if (!validator) {
    throw new Error(`Nenhum validador registrado para a coleção "${chave}"`);
  }
  return validator;
}

/**
 * Valida um valor para uma chave de coleção, retornando o valor validado.
 *
 * Lança erro se a validação falhar (dado inválido não chega ao disco).
 */
export function validarParaColecao<T>(chave: CollectionKey, valor: unknown): T {
  const validator = getValidator(chave);
  return validator(valor) as T;
}

/** Verifica se uma chave tem validador registrado. */
export function temValidador(chave: string): chave is CollectionKey {
  return chave in VALIDATORS;
}

/** Lista todas as chaves com validador (deve bater com USER_COLLECTION_KEYS). */
export function chavesComValidador(): CollectionKey[] {
  return Object.keys(VALIDATORS) as CollectionKey[];
}

/** O `kind` esperado para cada chave (derivado do registry). */
export function getExpectedKind(chave: CollectionKey): CollectionKind | undefined {
  const spec = getCollection(chave);
  return spec?.kind;
}
