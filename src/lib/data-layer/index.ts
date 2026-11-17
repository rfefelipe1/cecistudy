/**
 * Camada unificada de persistência de dados do usuário (SPEC-M-029).
 *
 * Esta é a **única porta de acesso** a gravação/leitura de dados do usuário.
 * Todas as 23 coleções do registry (`COLLECTIONS`) mais `profile` como
 * singleton passam por aqui.
 *
 * Dado do aparelho (tema, rascunho, deviceId) fica fora — permanece em
 * `src/lib/storage.ts`.
 *
 * API pública:
 *   - ler(chave)        → leitura com validação de schema
 *   - gravar(chave, valor) → gravação com validação Zod
 *   - transacionar(ops)  → transação atômica entre múltiplas coleções
 *   - snapshot()         → JSON completo para backup/undo
 *   - restaurar(json)    → rollback a partir de snapshot
 *   - saude()            → saúde do armazenamento por coleção
 *
 * Adapters internos: sqlite (nativo), localStorage (web), preferences (fallback nativo).
 * Validadores: schemas Zod por coleção.
 * Transações: coordenador de atomicidade entre coleções vinculadas.
 */

import { isNativePlatform } from '../storage.ts';
import { ler as sqliteLer, gravar as sqliteGravar, saude as sqliteSaude } from './adapters/sqlite.ts';
import {
  ler as localStorageLer,
  gravar as localStorageGravar,
  saude as localStorageSaude,
} from './adapters/localStorage.ts';
import {
  ler as preferencesLer,
  gravar as preferencesGravar,
  saude as preferencesSaude,
} from './adapters/preferences.ts';
import { validarParaColecao, chavesComValidador } from './validators/index.ts';
import {
  transacionar as transacaoAtomica,
  capturarSnapshot,
  restaurarDoSnapshot,
  limparSnapshot,
  temSnapshot,
} from './transactions/coordinator.ts';
import type {
  ChaveColecao,
  DataHealthEntry,
  DataReadResult,
  DataSnapshotResult,
  DataTransactionOp,
  DataTransactionResult,
  DataWriteResult,
} from './types.ts';

/**
 * Escolhe o adapter de leitura com base na plataforma.
 *
 * - Nativo: SQLite primeiro, com fallback para Preferences se SQLite falhar.
 * - Web: localStorage.
 */
async function lerComAdapter<T>(chave: ChaveColecao): Promise<DataReadResult<T>> {
  if (isNativePlatform) {
    // Tentar SQLite primeiro
    const resultado = await sqliteLer<T>(chave);
    if (resultado.error === null || resultado.fromDisk) {
      return resultado;
    }
    // Fallback para Preferences se SQLite não tiver o dado ou falhar
    const fallback = await preferencesLer<T>(chave);
    if (fallback.error === null) {
      return fallback;
    }
    // Ambos falharam: retornar o erro do SQLite (mais informativo)
    return resultado;
  }
  return localStorageLer<T>(chave);
}

/**
 * Escolhe o adapter de gravação com base na plataforma.
 *
 * - Nativo: SQLite.
 * - Web: localStorage.
 */
async function gravarComAdapter<T>(chave: ChaveColecao, valor: T): Promise<DataWriteResult> {
  if (isNativePlatform) {
    return sqliteGravar(chave, valor);
  }
  return localStorageGravar(chave, valor);
}

/**
 * Lê uma coleção do disco com validação de schema.
 *
 * - Retorna o valor válido se o disco tiver dados válidos para a chave.
 * - Retorna `undefined` se a chave nunca foi gravada.
 * - Lança erro se o dado no disco estiver corrompido (falha no Zod).
 */
export async function ler<T>(chave: ChaveColecao): Promise<DataReadResult<T>> {
  const resultado = await lerComAdapter<T>(chave);

  // Se há dados no disco, validar com Zod antes de retornar
  if (resultado.fromDisk && resultado.value !== undefined) {
    try {
      resultado.value = validarParaColecao(chave, resultado.value) as T;
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : String(e);
      return {
        value: undefined,
        fromDisk: true,
        error: `Dados corrompidos para "${chave}": ${mensagem}`,
      };
    }
  }

  return resultado;
}

/**
 * Grava uma coleção no disco com validação de schema Zod.
 *
 * - Rejeita dados inválidos antes de tocar o disco.
 * - Retorna `{ ok: true }` se confirmado no disco.
 * - Retorna `{ ok: false, error }` se falhar.
 */
export async function gravar<T>(chave: ChaveColecao, valor: T): Promise<DataWriteResult> {
  // Validar antes de gravar (D3)
  try {
    validarParaColecao(chave, valor);
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: `Validação falhou para "${chave}": ${mensagem}`,
    };
  }

  return gravarComAdapter(chave, valor);
}

/**
 * Transação atômica entre múltiplas coleções.
 *
 * - Todas as operações são gravadas ou nenhuma (atomicidade).
 * - Útil para writes vinculados (ex.: curso + tarefa que se referencia).
 */
export async function transacionar<T>(
  operacoes: DataTransactionOp<T>[],
): Promise<DataTransactionResult> {
  return transacaoAtomica(operacoes);
}

/**
 * Snapshot completo de todas as coleções do usuário.
 *
 * Útil para backup e para rollback antes de operações destrutivas
 * (`resetApp`, `importData`, `applyDatabase`).
 */
export async function snapshot(): Promise<DataSnapshotResult> {
  const partes: Record<string, unknown> = {};
  const chaves = chavesComValidador();

  for (const chave of chaves) {
    const resultado = await lerComAdapter<unknown>(chave);
    if (resultado.error === null && resultado.value !== undefined) {
      try {
        partes[chave] = validarParaColecao(chave, resultado.value);
      } catch {
        // Se a validação falhar no snapshot, usar o valor bruto (melhor que nada)
        partes[chave] = resultado.value;
      }
    }
  }

  return {
    json: JSON.stringify(partes, null, 2),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Restaura o estado a partir de um snapshot prévio.
 *
 * Útil para rollback automático quando uma operação destrutiva falha.
 */
export async function restaurar(json: string): Promise<void> {
  const dados = JSON.parse(json) as Record<string, unknown>;

  // Validar e gravar cada coleção do snapshot
  for (const [chave, valor] of Object.entries(dados)) {
    if (!chavesComValidador().includes(chave as ChaveColecao)) {
      continue; // pular chaves desconhecidas
    }

    try {
      const valorValidado = validarParaColecao(chave as ChaveColecao, valor);
      await gravarComAdapter(chave as ChaveColecao, valorValidado);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : String(e);
      throw new Error(`Falha ao restaurar "${chave}": ${mensagem}`);
    }
  }
}

/**
 * Saúde do armazenamento por coleção.
 *
 * Exposto na tela de Configurações para o usuário saber se seus dados estão
 * sendo salvos corretamente.
 */
export async function saude(): Promise<DataHealthEntry[]> {
  const entradas: DataHealthEntry[] = [];

  if (isNativePlatform) {
    const [sqlite, preferences] = await Promise.all([sqliteSaude(), preferencesSaude()]);
    const mapa = new Map<string, DataHealthEntry>();
    for (const e of sqlite) mapa.set(e.key, e);
    for (const e of preferences) {
      if (!mapa.has(e.key)) mapa.set(e.key, e);
      else if (!e.ok) mapa.set(e.key, e); // Preferences erro sobrescreve SQLite ok
    }
    entradas.push(...mapa.values());
  } else {
    entradas.push(...(await localStorageSaude()));
  }

  return entradas;
}

/**
 * Captura um snapshot completo de todas as coleções do usuário.
 *
 * Deve ser chamado ANTES de qualquer operação destrutiva
 * (`resetApp`, `importData`, `applyDatabase`). O snapshot é armazenado
 * internamente para rollback via `restaurarDoSnapshot()`.
 */
export { capturarSnapshot, restaurarDoSnapshot, limparSnapshot, temSnapshot };

