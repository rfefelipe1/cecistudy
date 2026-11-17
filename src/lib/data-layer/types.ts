/**
 * Tipos compartilhados da camada data-layer (SPEC-M-029).
 *
 * Esta camada é a **única porta de acesso** a gravação/leitura de dados do
 * usuário. Todas as 23 coleções do registry (`COLLECTIONS`) mais `profile` como
 * singleton passam por aqui. Dado do aparelho (tema, rascunho, deviceId) fica
 * fora — permanece em `src/lib/storage.ts`.
 */

import type { CollectionKey } from '../../../packages/data/src/collections';

/** Resultado de leitura de uma coleção. */
export interface DataReadResult<T> {
  /** Valor lido do disco, ou `undefined` se nunca foi gravado. */
  value: T | undefined;
  /** `true` se a leitura veio do disco, `false` se é o valor inicial (não existe ainda). */
  fromDisk: boolean;
  /** Erro se a leitura falhou. Quando presente, `value` é `undefined` e `fromDisk` é `false`. */
  error: string | null;
}

/** Resultado de gravação. */
export interface DataWriteResult {
  /** `true` se a gravação foi confirmada no disco. */
  ok: boolean;
  /** Erro se a gravação falhou. Quando presente, `ok` é `false`. */
  error: string | null;
}

/** Resultado de saúde de uma coleção. */
export interface DataHealthEntry {
  /** Chave da coleção (ex.: 'courses', 'profile'). */
  key: string;
  /** `true` se a última leitura/gravação funcionou. */
  ok: boolean;
  /** Mensagem de erro, se houver. */
  error?: string;
}

/** Resultado de snapshot completo. */
export interface DataSnapshotResult {
  /** JSON completo de todas as coleções do usuário. */
  json: string;
  /** Timestamp do snapshot (ISO). */
  createdAt: string;
}

/** Parâmetros de uma operação dentro de uma transação atômica. */
export interface DataTransactionOp<T> {
  /** Chave da coleção (deve ser uma `CollectionKey`). */
  chave: CollectionKey;
  /** Valor a gravar (já validado pelo schema da coleção). */
  valor: T;
}

/** Resultado de uma transação atômica. */
export interface DataTransactionResult {
  /** `true` se todas as operações foram gravadas com sucesso. */
  ok: boolean;
  /** Erro se alguma operação falhou. Quando presente, nenhuma coleção foi gravada. */
  error: string | null;
}

/** Chave de coleção válida para a camada data-layer. */
export type ChaveColecao = CollectionKey;

/** Tipo de destino de armazenamento (interno, exposto apenas para testes). */
export type StorageDestination = 'sqlite' | 'localStorage' | 'preferences';
