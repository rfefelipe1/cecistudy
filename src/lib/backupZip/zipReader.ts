/**
 * Leitor de ZIP de backup.
 *
 * Abre um ZIP (arquivo selecionado pelo usuário ou baixado do GitHub) e
 * expõe leitura individual por domínio, para possibilitar o carregamento
 * on-demand: mínimo primeiro (manifest + profile + courses + themes), o resto
 * depois com toast por domínio.
 *
 * Cada leitura de domínio é envolvida em try/catch: um domínio corrompido não
 * falha o ZIP inteiro (retorna null para aquele domínio).
 */

import JSZip from 'jszip';
import { validateManifest, type BackupManifest } from './manifest';

export interface ZipDomainResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface BackupZipReader {
  /** Lê e valida o manifest.json da raiz do ZIP. */
  readManifest(): Promise<BackupManifest | null>;
  /** Lê um domínio específico pelo caminho interno da ZIP. */
  readDomain<T>(path: string): Promise<ZipDomainResult<T>>;
  /** Lista todos os caminhos de arquivo dentro da ZIP. */
  listFiles(): string[];
  /** Fecha/libera o zip (no-op no JSZip, mantido para simetria). */
  close(): void;
}

/** Aceita o que vem do `<input type="file">`, do Capacitor ou de bytes crus. */
export type ZipSource = File | ArrayBuffer | Uint8Array;

export async function openZip(source: ZipSource): Promise<BackupZipReader | null> {
  let zip: JSZip;
  try {
    const contents =
      source instanceof Uint8Array
        ? source
        : source instanceof ArrayBuffer
          ? source
          : await source.arrayBuffer();
    zip = await JSZip.loadAsync(contents);
  } catch {
    return null; // não é um ZIP válido
  }

  const files = Object.keys(zip.files).filter((f) => !zip.files[f]?.dir);

  return {
    readManifest: async (): Promise<BackupManifest | null> => {
      const manifestFile = zip.files['manifest.json'];
      if (!manifestFile) return null;
      try {
        const text = await manifestFile.async('string');
        return validateManifest(JSON.parse(text));
      } catch {
        return null;
      }
    },
    readDomain: async <T>(path: string): Promise<ZipDomainResult<T>> => {
      const file = zip.files[path];
      if (!file) return { data: null, error: `arquivo não encontrado: ${path}` };
      try {
        const text = await file.async('string');
        const data = JSON.parse(text) as T;
        return { data, error: null };
      } catch (e) {
        return {
          data: null,
          error: `falha ao ler ${path}: ${e instanceof Error ? e.message : String(e)}`,
        };
      }
    },
    listFiles: () => files,
    close: () => {},
  };
}
