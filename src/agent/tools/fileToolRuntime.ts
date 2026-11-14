// Runtime de ferramentas de arquivo do Cecinho (SPEC-037 T003).
//
// Toda operação passa por duas camadas, nesta ordem:
//   1. política de permissões (`permissionPolicy.ts`) — `allow`/`ask`/`deny`;
//   2. workspace (`taskWorkspace.ts`) — caminho, extensão, versão, integridade.
//
// O runtime é puro sobre `AgentFs`: o teste injeta um FS em memória e não toca
// Capacitor. Operação `ask` devolve `needs_confirmation` **antes** de qualquer
// efeito — a UI pergunta e chama de novo com `confirmed: true`.

import {
  appendWorkspaceFile,
  copyWorkspaceFile,
  deleteWorkspaceFile,
  exportWorkspaceFile,
  getWorkspaceFileInfo,
  listWorkspaceFiles,
  readWorkspaceFile,
  renameWorkspaceFile,
  writeWorkspaceFile,
  type AgentFs,
  type WorkspaceContext,
  type WorkspaceErrorCode,
} from '../storage/taskWorkspace';
import {
  decidePermission,
  type AgentAction,
  type AgentPermissionRule,
  DEFAULT_PERMISSION_POLICY,
} from './permissionPolicy';

export type ToolErrorCode = WorkspaceErrorCode | 'permission_denied' | 'needs_confirmation';

export type ToolResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ToolErrorCode; message: string } };

export interface FileToolRuntimeOptions {
  fs: AgentFs;
  taskId: string;
  conversationId: string;
  /** Relógio injetado — nada aqui lê `Date.now()`. */
  now: string;
  policy?: readonly AgentPermissionRule[];
  /** Confirmação já dada pela usuária para operações `ask`. */
  confirmed?: boolean;
}

export interface FileToolRuntime {
  list_files: () => Promise<ToolResult<{ path: string; size?: number }[]>>;
  read_file: (path: string) => Promise<ToolResult<{ content: string; version: number }>>;
  create_file: (path: string, content: string) => Promise<ToolResult<{ version: number }>>;
  edit_file: (
    path: string,
    content: string,
    expectedVersion: number,
  ) => Promise<ToolResult<{ version: number }>>;
  append_file: (
    path: string,
    content: string,
    expectedVersion: number,
  ) => Promise<ToolResult<{ version: number }>>;
  rename_file: (
    from: string,
    to: string,
    expectedVersion: number,
  ) => Promise<ToolResult<{ version: number }>>;
  copy_file: (from: string, to: string) => Promise<ToolResult<{ version: number }>>;
  delete_file: (path: string, expectedVersion: number) => Promise<ToolResult<{ deleted: true }>>;
  get_file_info: (
    path: string,
  ) => Promise<ToolResult<{ version: number; size: number; checksum: string }>>;
  export_file: (path: string) => Promise<ToolResult<{ path: string }>>;
}

/** Converte `WorkspaceResult` em `ToolResult` sem perder o código do erro. */
function fromWorkspace<T>(
  result: { ok: true; value: T } | { ok: false; error: { code: WorkspaceErrorCode; message: string } },
): ToolResult<T> {
  if ('value' in result) return { ok: true, value: result.value };
  return { ok: false, error: { code: result.error.code, message: result.error.message } };
}

export function createFileToolRuntime(options: FileToolRuntimeOptions): FileToolRuntime {
  const ctx: WorkspaceContext = {
    fs: options.fs,
    taskId: options.taskId,
    conversationId: options.conversationId,
    now: options.now,
  };
  const policy = options.policy ?? DEFAULT_PERMISSION_POLICY;

  const gate = <T>(action: AgentAction, resource: string): ToolResult<T> | null => {
    const decision = decidePermission(action, resource, policy);
    if (decision.effect === 'deny') {
      return {
        ok: false,
        error: { code: 'permission_denied', message: decision.reason },
      };
    }
    if (decision.effect === 'ask' && !options.confirmed) {
      return {
        ok: false,
        error: {
          code: 'needs_confirmation',
          message: `preciso da sua confirmação para ${action} em "${resource}"`,
        },
      };
    }
    return null;
  };

  return {
    async list_files() {
      const blocked = gate<{ path: string; size?: number }[]>('list_files', '*');
      if (blocked) return blocked;
      const result = await listWorkspaceFiles(ctx);
      if (!('value' in result)) {
        return { ok: false, error: { code: result.error.code, message: result.error.message } };
      }
      const entries: { path: string; size?: number }[] = result.value.map((entry) => ({
        path: entry.name,
        size: entry.size,
      }));
      return { ok: true, value: entries };
    },

    async read_file(path) {
      const blocked = gate<{ content: string; version: number }>('read_file', path);
      if (blocked) return blocked;
      return fromWorkspace(await readWorkspaceFile(ctx, path));
    },

    async create_file(path, content) {
      const blocked = gate<{ version: number }>('create_file', path);
      if (blocked) return blocked;
      const result = await writeWorkspaceFile(ctx, path, content, { source: 'agent' });
      if (!result.ok) return fromWorkspace(result);
      return { ok: true, value: { version: result.value.version } };
    },

    async edit_file(path, content, expectedVersion) {
      const blocked = gate<{ version: number }>('edit_file', path);
      if (blocked) return blocked;
      const result = await writeWorkspaceFile(ctx, path, content, {
        expectedVersion,
        source: 'agent',
      });
      if (!result.ok) return fromWorkspace(result);
      return { ok: true, value: { version: result.value.version } };
    },

    async append_file(path, content, expectedVersion) {
      const blocked = gate<{ version: number }>('append_file', path);
      if (blocked) return blocked;
      const result = await appendWorkspaceFile(ctx, path, content, {
        expectedVersion,
        source: 'agent',
      });
      if (!result.ok) return fromWorkspace(result);
      return { ok: true, value: { version: result.value.version } };
    },

    async rename_file(from, to, expectedVersion) {
      const blocked = gate<{ version: number }>('rename_file', to);
      if (blocked) return blocked;
      return fromWorkspace(await renameWorkspaceFile(ctx, from, to, expectedVersion));
    },

    async copy_file(from, to) {
      const blocked = gate<{ version: number }>('copy_file', to);
      if (blocked) return blocked;
      return fromWorkspace(await copyWorkspaceFile(ctx, from, to));
    },

    async delete_file(path, expectedVersion) {
      const blocked = gate<{ deleted: true }>('delete_file', path);
      if (blocked) return blocked;
      return fromWorkspace(await deleteWorkspaceFile(ctx, path, expectedVersion));
    },

    async get_file_info(path) {
      const blocked = gate<{ version: number; size: number; checksum: string }>(
        'get_file_info',
        path,
      );
      if (blocked) return blocked;
      return fromWorkspace(await getWorkspaceFileInfo(ctx, path));
    },

    async export_file(path) {
      const blocked = gate<{ path: string }>('export_file', path);
      if (blocked) return blocked;
      return fromWorkspace(await exportWorkspaceFile(ctx, path));
    },
  };
}
