/**
 * Adapter localStorage para a camada data-layer (SPEC-M-029).
 *
 * Usado no web/PWA para as 23 coleções de domínio. No nativo, não é usado
 * (cabe ao SQLite).
 *
 * Sincronização direta: leitura e gravação são imediatas, sem debounce.
 */

import type { DataHealthEntry, DataReadResult, DataWriteResult } from '../types.ts';

const PREFIX = 'cecistudy_user_';

let lastHealth: Map<string, { ok: boolean; error?: string }> = new Map();

function storageKey(chave: string): string {
  return PREFIX + chave;
}

/**
 * Lê uma coleção do localStorage.
 */
export async function ler<T>(chave: string): Promise<DataReadResult<T>> {
  try {
    const item = localStorage.getItem(storageKey(chave));
    if (item === null) {
      return { value: undefined, fromDisk: false, error: null };
    }

    const value = JSON.parse(item) as T;
    lastHealth.set(chave, { ok: true });
    return { value, fromDisk: true, error: null };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    lastHealth.set(chave, { ok: false, error: mensagem });
    return {
      value: undefined,
      fromDisk: false,
      error: `Falha ao ler "${chave}" do localStorage: ${mensagem}`,
    };
  }
}

/**
 * Grava uma coleção no localStorage.
 */
export async function gravar<T>(chave: string, valor: T): Promise<DataWriteResult> {
  try {
    localStorage.setItem(storageKey(chave), JSON.stringify(valor));
    lastHealth.set(chave, { ok: true });
    return { ok: true, error: null };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    lastHealth.set(chave, { ok: false, error: mensagem });
    return {
      ok: false,
      error: `Falha ao gravar "${chave}" no localStorage: ${mensagem}`,
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

/** Remove uma chave do localStorage (usado em resetApp/testes). */
export function localStorageRemover(chave: string): void {
  localStorage.removeItem(storageKey(chave));
  lastHealth.delete(chave);
}
