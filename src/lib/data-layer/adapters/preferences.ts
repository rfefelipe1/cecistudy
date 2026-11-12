/**
 * Adapter Preferences para a camada data-layer (SPEC-M-029).
 *
 * Usado no nativo como **fallback** quando o SQLite está indisponível, e para
 * preferências pequenas que não são coleções de domínio (ex.: onboarding,
 * reminder, themePref).
 *
 * Reutiliza `userStorage` de `storageLayers.ts`, que já lida com o prefixo
 * `cecistudy_user_*` e com a degradação para localStorage no web.
 */

import { userStorage } from '../../storageLayers.ts';
import type { DataHealthEntry, DataReadResult, DataWriteResult } from '../types.ts';

let lastHealth: Map<string, { ok: boolean; error?: string }> = new Map();

/**
 * Lê uma coleção das Preferences.
 */
export async function ler<T>(chave: string): Promise<DataReadResult<T>> {
  try {
    const item = await userStorage.get(chave);
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
      error: `Falha ao ler "${chave}" das Preferences: ${mensagem}`,
    };
  }
}

/**
 * Grava uma coleção nas Preferences.
 */
export async function gravar<T>(chave: string, valor: T): Promise<DataWriteResult> {
  try {
    await userStorage.set(chave, JSON.stringify(valor));
    lastHealth.set(chave, { ok: true });
    return { ok: true, error: null };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    lastHealth.set(chave, { ok: false, error: mensagem });
    return {
      ok: false,
      error: `Falha ao gravar "${chave}" nas Preferences: ${mensagem}`,
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
