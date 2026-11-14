/**
 * Adapter de plataforma para exportação de backup (web vs. nativo).
 *
 * Isolado de `packages/data` para manter o pacote de dados livre de
 * `@capacitor/*`. A lógica pura de backup/import (validação, migração,
 * montagem de payload) vive em `@cecistudy/data`.
 */
import { Capacitor } from '@capacitor/core';
import { BACKUP_FILE_NAME, type BackupV2 } from '../../packages/data/src/exportImport';

/**
 * Exporta o banco local como arquivo JSON versionado (backup v2).
 * - Web/PWA  → download via blob.
 * - Nativo   → grava na pasta Documents (@capacitor/filesystem) e abre a share sheet.
 */
export async function exportAppDatabase(payload: BackupV2): Promise<void> {
  const json = JSON.stringify(payload, null, 2);

  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const fileName = `cecistudy-backup-${Date.now()}.json`;
      await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: 'backup do cantinho',
        text: 'seu backup do cecistudy ♡',
        url: fileName,
        dialogTitle: 'guardar backup',
      });
      return;
    } catch (e) {
      console.error('native export failed, falling back to download', e);
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = BACKUP_FILE_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Exporta um backup ZIP (arquivo binário).
 * - Web/PWA  → download via blob (application/zip).
 * - Nativo   → grava na pasta Documents e abre a share sheet.
 */
export async function exportBackupZip(data: Uint8Array, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const base64 = btoa(String.fromCharCode(...data));
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
        encoding: Encoding.UTF8, // base64 é texto seguro
      });
      await Share.share({
        title: 'backup do cantinho',
        text: 'seu backup do cecistudy ♡',
        url: fileName,
        dialogTitle: 'guardar backup',
      });
      return;
    } catch (e) {
      console.error('native zip export failed, falling back to download', e);
    }
  }

  const blob = new Blob([data], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

