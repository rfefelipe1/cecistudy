/**
 * Importação do backup em ZIP (SPEC-M-030 D2/D5/D8).
 *
 * Aplica o mínimo (manifest + profile + courses + themes) antes de abrir a home
 * e carrega o restante domínio a domínio, chamando `onDomainLoaded` a cada
 * arquivo aplicado. Cada etapa tem `try/catch`: um domínio corrompido não
 * derruba o resto do backup.
 *
 * A validação de forma/migração é a do pipeline JSON v2 existente: montamos um
 * envelope `cecistudy-user-backup` com os domínios já lidos e delegamos a
 * `importAppDatabase`. Nada de esquema paralelo.
 */

import { SCHEMA_VERSION } from '@/data/schema';
import type { EmptyDatabase } from '@/data/empty';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  importAppDatabase,
} from '../exportImport';
import { MINIMUM_DOMAINS, domainKey, domainPath, type BackupManifest } from './manifest';
import { openZip, type ZipSource } from './zipReader';

export interface ZipImportDeps {
  /** Aplica um banco completo (mínimo, depois acumulados com cada domínio). */
  apply: (db: EmptyDatabase) => void;
  /** Aplica o tema lido de `themes.json` (mínimo). */
  applyTheme?: (themeId: string) => void;
  /** Chamado uma vez por domínio aplicado (toast, D10). */
  onDomainLoaded?: (domain: string) => void;
  /** Chamado quando um domínio é ilegível (aviso específico, D8). */
  onDomainError?: (domain: string) => void;
}

export type ZipImportResult =
  | { ok: true; manifest: BackupManifest }
  | { ok: false; reason: 'arquivo' | 'manifesto' | 'versao' | 'invalido' };

const MINIMUM_KEYS = MINIMUM_DOMAINS.filter((d) => d !== 'themes');

/** Monta o envelope v2 para um subconjunto de domínios e valida pelo pipeline atual. */
async function databaseFrom(
  manifest: BackupManifest,
  payload: Record<string, unknown>,
): Promise<EmptyDatabase | null> {
  const envelope = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    userSchemaVersion: manifest.schemaVersion,
    schemaVersion: manifest.schemaVersion,
    catalogRelease: null,
    exportedAt: manifest.createdAt,
    payload,
  };
  return importAppDatabase(JSON.stringify(envelope));
}

export async function importBackupZip(
  source: ZipSource,
  deps: ZipImportDeps,
): Promise<ZipImportResult> {
  // `openZip` já devolve null para bytes que não são ZIP.
  const reader = await openZip(source);
  if (!reader) return { ok: false, reason: 'arquivo' };

  const manifest = await reader.readManifest();
  if (!manifest) return { ok: false, reason: 'manifesto' };
  // Backup de versão futura: o app desatualizado não deve gravar dado truncado.
  if (manifest.schemaVersion > SCHEMA_VERSION) return { ok: false, reason: 'versao' };

  // Tema faz parte do mínimo (D6).
  const themes = await reader.readDomain<{ temaId?: string }>('themes.json');
  const temaId = themes.data?.temaId ?? manifest.temaId;
  if (temaId) deps.applyTheme?.(temaId);

  // --- mínimo: home abre com perfil, disciplinas e tema ---
  const minimumPayload: Record<string, unknown> = {
    // Restaurar um backup implica que o onboarding já aconteceu; sem esta chave
    // a casca voltaria para a tela de cadastro mesmo com o perfil restaurado.
    onboarding: { completed: true },
  };
  for (const key of MINIMUM_KEYS) {
    const result = await reader.readDomain(domainPath(key));
    if (result.data !== null) minimumPayload[key] = result.data;
  }
  const minimumDb = await databaseFrom(manifest, minimumPayload);
  if (!minimumDb) return { ok: false, reason: 'invalido' };
  deps.apply(minimumDb);

  // --- on-demand: um domínio por vez, acumulando no que já foi aplicado ---
  let accumulated = minimumPayload;
  for (const path of reader.listFiles()) {
    if (path === 'manifest.json' || path === 'themes.json') continue;
    const key = domainKey(path);
    if (MINIMUM_KEYS.includes(key)) continue;

    const result = await reader.readDomain(path);
    if (result.data === null) {
      deps.onDomainError?.(key);
      continue;
    }

    const next = { ...accumulated, [key]: result.data };
    const db = await databaseFrom(manifest, next);
    if (!db) {
      // Fallback da coleção ruim: mantém o que já foi aplicado e segue (D8).
      deps.onDomainError?.(key);
      continue;
    }
    accumulated = next;
    deps.apply(db);
    deps.onDomainLoaded?.(key);
  }

  return { ok: true, manifest };
}
