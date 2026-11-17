/**
 * Validador genérico para coleções de array (SPEC-M-029 D3).
 *
 * Usado para coleções onde não existe um schema Zod específico ainda:
 * courses, classes, tasks, exams, authors, concepts, readings, flashcards,
 * decks, materials, techniques, internshipLogs, stickers, sessions,
 * looseNotes, quizSessions, academicTerms, readingSessions, readingHighlights,
 * readingBookmarks, thesisChapters, thesisReferences, thesisMeetings,
 * thesisTasks, thesisWritingLogs.
 *
 * Aceita qualquer objeto válido (passthrough) mas garante que o valor seja
 * um array. Isso evita que dados não-array entrem no disco.
 */

import { z } from 'zod';

/** Schema que aceita qualquer array de objetos. */
export const arrayCollectionSchema = z.array(z.record(z.string(), z.unknown()));

/**
 * Valida uma coleção de array. Retorna o array validado ou lança erro.
 */
export function validarArrayCollection(valor: unknown): unknown[] {
  return arrayCollectionSchema.parse(valor);
}

/** Validador para coleções singleton (tcc, streakData). */
export const singletonCollectionSchema = z.record(z.string(), z.unknown());

export function validarSingletonCollection(valor: unknown): Record<string, unknown> {
  return singletonCollectionSchema.parse(valor);
}

/** Validador para idList (savedBookIds, bookmarkedCourseIds). */
export const idListCollectionSchema = z.array(z.string());

export function validarIdListCollection(valor: unknown): string[] {
  return idListCollectionSchema.parse(valor);
}

/** Validador para map (readingProgress). */
export const mapCollectionSchema = z.record(z.string(), z.number());

export function validarMapCollection(valor: unknown): Record<string, number> {
  return mapCollectionSchema.parse(valor);
}
