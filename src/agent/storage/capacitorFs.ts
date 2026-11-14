// Glue de plataforma do workspace do Cecinho (SPEC-037 T002).
//
// O domínio fala com `AgentFs` (`taskWorkspace.ts`). Este arquivo é o único que
// conhece `@capacitor/filesystem` — mesma disciplina do `exportFile.ts`: o
// adaptador de plataforma mora em `src/lib`/`src/agent/storage`, nunca em
// `packages/*`.
//
// Nativo: `Directory.Data` (sandbox do app, sem permissão extra).
// Web: `localStorage` com prefixo próprio — dev/PWA sem IndexedDB a mais.

import { Capacitor } from '@capacitor/core';
import type { AgentFs, AgentFsEntry } from './taskWorkspace';

const WEB_PREFIX = 'cecinho:fs:';

function dirname(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? '' : path.slice(0, idx);
}

function isDirMarker(path: string): string {
  return `${WEB_PREFIX}dir:${path}`;
}

/** FS web mínimo: arquivos em `cecinho:fs:<path>`, diretórios em `dir:<path>`. */
class WebAgentFs implements AgentFs {
  async readText(path: string): Promise<string> {
    const raw = localStorage.getItem(`${WEB_PREFIX}${path}`);
    if (raw === null) throw new Error(`arquivo inexistente: ${path}`);
    return raw;
  }

  async writeText(path: string, data: string): Promise<void> {
    localStorage.setItem(`${WEB_PREFIX}${path}`, data);
  }

  async mkdir(path: string): Promise<void> {
    localStorage.setItem(isDirMarker(path), '1');
  }

  async list(path: string): Promise<AgentFsEntry[]> {
    const prefix = `${path}/`;
    const seen = new Map<string, AgentFsEntry>();
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(WEB_PREFIX)) continue;
      const isDir = key.startsWith(`${WEB_PREFIX}dir:`);
      const rel = key.slice(WEB_PREFIX.length + (isDir ? 4 : 0));
      if (!rel.startsWith(prefix)) continue;
      const rest = rel.slice(prefix.length);
      if (!rest) continue;
      const name = rest.split('/')[0]!;
      if (!seen.has(name)) seen.set(name, { name, isDirectory: rest.includes('/') });
    }
    return [...seen.values()];
  }

  async exists(path: string): Promise<boolean> {
    return (
      localStorage.getItem(`${WEB_PREFIX}${path}`) !== null ||
      localStorage.getItem(isDirMarker(path)) !== null
    );
  }

  async remove(path: string): Promise<void> {
    localStorage.removeItem(`${WEB_PREFIX}${path}`);
    localStorage.removeItem(isDirMarker(path));
    const prefix = `${WEB_PREFIX}${path}/`;
    const dirPrefix = isDirMarker(path) + '/';
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(prefix) || key.startsWith(dirPrefix))) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  }

  async rename(from: string, to: string): Promise<void> {
    const content = await this.readText(from);
    await this.writeText(to, content);
    await this.remove(from);
  }

  async copy(from: string, to: string): Promise<void> {
    await this.writeText(to, await this.readText(from));
  }
}

/** FS nativo sobre `Directory.Data`. */
class NativeAgentFs implements AgentFs {
  private fs(): Promise<typeof import('@capacitor/filesystem')> {
    return import('@capacitor/filesystem');
  }

  async readText(path: string): Promise<string> {
    const { Filesystem, Directory, Encoding } = await this.fs();
    const res = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 });
    return String(res.data);
  }

  async writeText(path: string, data: string): Promise<void> {
    const { Filesystem, Directory, Encoding } = await this.fs();
    await Filesystem.writeFile({ path, data, directory: Directory.Data, encoding: Encoding.UTF8, recursive: true });
  }

  async mkdir(path: string): Promise<void> {
    const { Filesystem, Directory } = await this.fs();
    try {
      await Filesystem.mkdir({ path, directory: Directory.Data, recursive: true });
    } catch {
      // diretório já existe — `mkdir` idempotente é o contrato do workspace
    }
  }

  async list(path: string): Promise<AgentFsEntry[]> {
    const { Filesystem, Directory } = await this.fs();
    const res = await Filesystem.readdir({ path, directory: Directory.Data });
    return res.files.map((entry) => ({
      name: entry.name,
      isDirectory: entry.type === 'directory',
      size: entry.size,
    }));
  }

  async exists(path: string): Promise<boolean> {
    const { Filesystem, Directory } = await this.fs();
    try {
      await Filesystem.stat({ path, directory: Directory.Data });
      return true;
    } catch {
      return false;
    }
  }

  async remove(path: string): Promise<void> {
    const { Filesystem, Directory } = await this.fs();
    await Filesystem.rmdir({ path, directory: Directory.Data, recursive: true });
  }

  async rename(from: string, to: string): Promise<void> {
    const { Filesystem, Directory } = await this.fs();
    await Filesystem.rename({ from, to, directory: Directory.Data });
  }

  async copy(from: string, to: string): Promise<void> {
    const { Filesystem, Directory } = await this.fs();
    await Filesystem.copy({ from, to, directory: Directory.Data, toDirectory: Directory.Data });
  }
}

export function createAgentFs(): AgentFs {
  return Capacitor.isNativePlatform() ? new NativeAgentFs() : new WebAgentFs();
}

export { dirname };
