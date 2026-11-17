/**
 * Escritor de ZIP de backup.
 *
 * Monta um ZIP a partir de um mapa de {caminho: conteúdo JSON} e salva como
 * arquivo `cecistudy-backup-<yyyy-mm-dd>.zip` no dispositivo.
 *
 * Funciona tanto na web (download via blob) quanto no nativo
 * (Capacitor Filesystem), por meio de injeção de função de gravação.
 */

import JSZip from 'jszip';
import { backupZipFileName, domainPath, type BackupManifest } from './manifest';

export interface ZipWriterDeps {
  /** Salva bytes em um arquivo local. Recebe (nome, bytes base64 ou Uint8Array). */
  saveFile: (fileName: string, data: Uint8Array) => Promise<string>;
}

export async function writeBackupZip(
  deps: ZipWriterDeps,
  manifest: BackupManifest,
  domains: Record<string, unknown>,
  themes: unknown,
): Promise<string> {
  const zip = new JSZip();

  // manifest.json na raiz
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // themes.json na raiz (customizações/temas — dado do usuário)
  zip.file('themes.json', JSON.stringify(themes, null, 2));

  // cada domínio em sua subpasta (o mapeamento é a fonte dos caminhos)
  for (const [key, data] of Object.entries(domains)) {
    zip.file(domainPath(key), JSON.stringify(data, null, 2));
  }

  const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return deps.saveFile(backupZipFileName(), content);
}
