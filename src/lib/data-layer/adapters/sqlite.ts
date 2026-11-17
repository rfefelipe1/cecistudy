/**
 * Adapter SQLite para a camada data-layer (SPEC-M-029).
 *
 * Usado no nativo (Android/iOS) para as 23 coleções de domínio. No web, este
 * adapter não é usado (cabe ao localStorage).
 *
 * Reutiliza `getUserDb`, `saveCollection`, `loadCollection` e
 * `isUserCollectionKey` da camada de DB existente, mas expõe a interface
 * simplificada do data-layer: `ler`, `gravar`, `saude`.
 */

import { getUserDb } from '../../db/userDb.ts';
import { loadCollection, saveCollection, isUserCollectionKey } from '../../db/normalize.ts';
import type { DataHealthEntry, DataReadResult, DataWriteResult } from '../types.ts';

const HEALTH_KEY_PREFIX = 'data-layer:health';

let lastHealth: Map<string, { ok: boolean; error?: string }> = new Map();

/**
 * Lê uma coleção do SQLite.
 *
 * - Web: não usado (retorna erro de "não disponível").
 * - Nativo: abre o banco, lê a coleção, valida que não é undefined.
 */
export async function ler<T>(chave: string): Promise<DataReadResult<T>> {
  try {
    const db = await getUserDb();
    if (!db) {
      return {
        value: undefined,
        fromDisk: false,
        error: 'SQLite não disponível no dispositivo',
      };
    }

    if (!isUserCollectionKey(chave)) {
      return {
        value: undefined,
        fromDisk: false,
        error: `Chave "${chave}" não é uma coleção de usuário válida`,
      };
    }

    const value = await loadCollection<T>(db, chave);
    if (value === undefined) {
      return { value: undefined, fromDisk: false, error: null };
    }

    lastHealth.set(chave, { ok: true });
    return { value, fromDisk: true, error: null };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    lastHealth.set(chave, { ok: false, error: mensagem });
    return {
      value: undefined,
      fromDisk: false,
      error: `Falha ao ler "${chave}" do SQLite: ${mensagem}`,
    };
  }
}

/**
 * Grava uma coleção no SQLite.
 *
 * Usa `saveCollection` que faz DELETE + INSERT dentro de uma transação.
 */
export async function gravar<T>(chave: string, valor: T): Promise<DataWriteResult> {
  try {
    const db = await getUserDb();
    if (!db) {
      return {
        ok: false,
        error: 'SQLite não disponível no dispositivo',
      };
    }

    if (!isUserCollectionKey(chave)) {
      return {
        ok: false,
        error: `Chave "${chave}" não é uma coleção de usuário válida`,
      };
    }

    await saveCollection(db, chave as any, valor);

    lastHealth.set(chave, { ok: true });
    return { ok: true, error: null };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    lastHealth.set(chave, { ok: false, error: mensagem });
    return {
      ok: false,
      error: `Falha ao gravar "${chave}" no SQLite: ${mensagem}`,
    };
  }
}

/**
 * Retorna a saúde de todas as coleções conhecidas.
 */
export async function saude(): Promise<DataHealthEntry[]> {
  const entries: DataHealthEntry[] = [];
  for (const [key, status] of lastHealth) {
    entries.push({ key, ok: status.ok, ...(status.error ? { error: status.error } : {}) });
  }
  return entries;
}

/** Limpa o histórico de saúde (usado em testes). */
export function resetHealth(): void {
  lastHealth = new Map();
}
