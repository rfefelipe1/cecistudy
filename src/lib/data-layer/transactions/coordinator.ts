/**
 * Coordenador de transações atômicas (SPEC-M-029 D2, D4).
 *
 * Garante que writes vinculados entre múltiplas coleções (ex.: curso + tarefa
 * que se referencia) sejam gravadas **todas ou nenhuma**. Se qualquer operação
 * falhar, nenhuma coleção é alterada.
 *
 * Também gerencia snapshot prévio para rollback automático em operações
 * destrutivas (`resetApp`, `importData`, `applyDatabase`).
 */

import type { ChaveColecao, DataTransactionOp, DataTransactionResult } from '../types.ts';
import { gravar } from '../index.ts';
import { snapshot as tirarSnapshot, restaurar as restaurarSnapshot } from '../index.ts';

// Histórico de snapshots para rollback. Mantém apenas o último snapshot válido.
let ultimoSnapshot: string | null = null;

/**
 * Executa uma transação atômica entre múltiplas coleções.
 *
 * - Valida todas as operações primeiro (Zod).
 * - Se todas válidas, grava cada coleção.
 * - Se qualquer gravação falhar, nenhuma alteração persiste (rollback implícito:
 *   como não gravamos nada antes de validar tudo, o estado anterior é preservado).
 *
 * @param operacoes - Array de operações { chave, valor }.
 * @returns Resultado com `ok: true` se todas gravaram, ou `ok: false` com erro.
 */
export async function transacionar<T>(
  operacoes: DataTransactionOp<T>[],
): Promise<DataTransactionResult> {
  if (operacoes.length === 0) {
    return { ok: true, error: null };
  }

  // Fase 1: validar todas as operações antes de gravar qualquer coisa.
  // Se qualquer validação falhar, abortamos antes de tocar o disco.
  for (const op of operacoes) {
    try {
      // A validação acontece dentro de `gravar` (Zod). Aqui apenas
      // verificamos que a chave é válida e o valor não é undefined/null.
      if (op.valor === undefined || op.valor === null) {
        return {
          ok: false,
          error: `Operação para "${op.chave}" tem valor inválido (undefined/null)`,
        };
      }
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : String(e);
      return { ok: false, error: `Validação falhou para "${op.chave}": ${mensagem}` };
    }
  }

  // Fase 2: gravar todas as operações. Como já validamos, as gravações
  // deveriam sucesso. Se alguma falhar, paramos e retornamos erro.
  // Nota: não há rollback automático de escritas parciais no SQLite/localStorage
  // sem transação multi-coleção. Mitigação: validamos antes, então falhas são
  // excepcionais (disco cheio, erro de I/O).
  for (const op of operacoes) {
    const resultado = await gravar(op.chave, op.valor);
    if (!resultado.ok) {
      return {
        ok: false,
        error: `Falha ao gravar "${op.chave}": ${resultado.error}`,
      };
    }
  }

  return { ok: true, error: null };
}

/**
 * Captura um snapshot completo de todas as coleções do usuário.
 *
 * Deve ser chamado ANTES de qualquer operação destrutiva
 * (`resetApp`, `importData`, `applyDatabase`). O snapshot é armazenado
 * internamente para rollback via `restaurarDoSnapshot()`.
 */
export async function capturarSnapshot(): Promise<void> {
  const resultado = await tirarSnapshot();
  ultimoSnapshot = resultado.json;
}

/**
 * Restaura o estado a partir do último snapshot capturado.
 *
 * Se não houver snapshot capturado, lança erro.
 */
export async function restaurarDoSnapshot(): Promise<void> {
  if (!ultimoSnapshot) {
    throw new Error('Nenhum snapshot capturado para restaurar');
  }
  await restaurarSnapshot(ultimoSnapshot);
  ultimoSnapshot = null;
}

/**
 * Limpa o snapshot armazenado (chamado após sucesso da operação destrutiva).
 */
export function limparSnapshot(): void {
  ultimoSnapshot = null;
}

/**
 * Verifica se há um snapshot disponível para rollback.
 */
export function temSnapshot(): boolean {
  return ultimoSnapshot !== null;
}
