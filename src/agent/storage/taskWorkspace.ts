// Workspace de arquivos por tarefa (SPEC-037 D9/D10).
//
// Tudo aqui é **puro sobre um `AgentFs`**: o domínio não conhece Capacitor. O
// adaptador real mora em `capacitorFs.ts` (glue de plataforma, `src/lib`), e o
// teste usa um FS em memória.
//
// Estrutura em `Directory.Data/cecinho/tasks/<task-id>/`:
//   index.json · agente.md · prompt.json · conversation.json · execution.json
//   context-snapshot.json · plan.json · manifest.json
//   artifacts/ · versions/original/ · versions/user-edits/ · exports/
//
// Regras de segurança que este arquivo garante (não a UI):
//   - `..`, caminho absoluto, `\` e `clinical/*` são rejeitados;
//   - arquivos técnicos não são editáveis por ferramenta;
//   - sobrescrita exige `expectedVersion` (controle otimista, D10);
//   - a versão anterior é preservada em `versions/` antes de qualquer escrita.

import type { AgentArtifactSource } from '@/types';

export type WorkspaceSource = AgentArtifactSource | 'system';

export interface AgentFsEntry {
  name: string;
  isDirectory: boolean;
  size?: number;
}

/** Interface mínima de FS — o adaptador de Capacitor implementa isto. */
export interface AgentFs {
  readText(path: string): Promise<string>;
  writeText(path: string, data: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  list(path: string): Promise<AgentFsEntry[]>;
  exists(path: string): Promise<boolean>;
  /** Remove arquivo ou diretório (recursivo). */
  remove(path: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  copy(from: string, to: string): Promise<void>;
}

export const WORKSPACE_ROOT = 'cecinho/tasks';
export const WORKSPACE_FORMAT_VERSION = 1;
export const MAX_FILE_BYTES = 512 * 1024;
export const ALLOWED_EXTENSIONS = ['.md', '.txt', '.json', '.csv'] as const;

/** Arquivos técnicos: invisíveis na UI e não editáveis pelo agente (D9). */
export const TECHNICAL_FILES = [
  'index.json',
  'agente.md',
  'prompt.json',
  'conversation.json',
  'execution.json',
  'context-snapshot.json',
  'plan.json',
  'manifest.json',
] as const;

export const WORKSPACE_DIRS = ['artifacts', 'versions', 'exports'] as const;

export type WorkspaceErrorCode =
  | 'invalid_path'
  | 'protected_file'
  | 'extension'
  | 'too_large'
  | 'conflict'
  | 'not_found'
  | 'exists';

export interface WorkspaceError {
  code: WorkspaceErrorCode;
  message: string;
}

export type WorkspaceResult<T> = { ok: true; value: T } | { ok: false; error: WorkspaceError };

const fail = <T>(code: WorkspaceErrorCode, message: string): WorkspaceResult<T> => ({
  ok: false,
  error: { code, message },
});

export interface WorkspaceManifestFile {
  version: number;
  source: WorkspaceSource;
  size: number;
  checksum: string;
  updatedAt: string;
}

export interface WorkspaceManifest {
  formatVersion: number;
  taskId: string;
  conversationId: string;
  createdAt: string;
  updatedAt: string;
  files: Record<string, WorkspaceManifestFile>;
}

export interface WorkspaceContext {
  fs: AgentFs;
  taskId: string;
  conversationId: string;
  /** Relógio injetado — nada aqui lê `Date.now()`. */
  now: string;
}

/** FNV-1a 32-bit em hex — integridade suficiente para detectar edição externa. */
export function checksum(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i += 1) {
    hash ^= content.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function isTechnical(relPath: string): boolean {
  const name = relPath.split('/').pop() ?? relPath;
  return (TECHNICAL_FILES as readonly string[]).includes(name);
}

function isClinical(relPath: string): boolean {
  return relPath.split('/')[0]?.toLowerCase() === 'clinical';
}

function hasUnsafeSegment(relPath: string): boolean {
  if (!relPath.trim()) return true;
  if (relPath.startsWith('/') || relPath.includes('\\')) return true;
  return relPath
    .split('/')
    .some((segment) => segment === '' || segment === '.' || segment === '..');
}

function extensionOf(relPath: string): string {
  const name = relPath.split('/').pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

/** Caminho relativo de **escrita** (artefato). */
export function validateWritePath(relPath: string): WorkspaceError | null {
  if (hasUnsafeSegment(relPath)) {
    return { code: 'invalid_path', message: `caminho inválido: "${relPath}"` };
  }
  if (isClinical(relPath)) {
    return { code: 'invalid_path', message: 'caminho clínico é bloqueado pelo runtime' };
  }
  if (isTechnical(relPath)) {
    return { code: 'protected_file', message: `arquivo técnico protegido: "${relPath}"` };
  }
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(relPath) as (typeof ALLOWED_EXTENSIONS)[number])) {
    return { code: 'extension', message: `extensão não permitida: "${relPath}"` };
  }
  return null;
}

/** Caminho relativo de **leitura** (técnico pode ser lido). */
export function validateReadPath(relPath: string): WorkspaceError | null {
  if (hasUnsafeSegment(relPath)) {
    return { code: 'invalid_path', message: `caminho inválido: "${relPath}"` };
  }
  if (isClinical(relPath)) {
    return { code: 'invalid_path', message: 'caminho clínico é bloqueado pelo runtime' };
  }
  return null;
}

export function validateTaskId(taskId: string): boolean {
  return Boolean(taskId.trim()) && !hasUnsafeSegment(taskId) && !taskId.includes('/');
}

export function workspaceRoot(taskId: string): string {
  if (!validateTaskId(taskId)) throw new Error(`workspaceRoot: taskId inválido "${taskId}"`);
  return `${WORKSPACE_ROOT}/${taskId}`;
}

export function workspaceFilePath(taskId: string, relPath = ''): string {
  const root = workspaceRoot(taskId);
  return relPath ? `${root}/${relPath}` : root;
}

async function readManifestRaw(ctx: WorkspaceContext): Promise<WorkspaceManifest | null> {
  const path = workspaceFilePath(ctx.taskId, 'manifest.json');
  if (!(await ctx.fs.exists(path))) return null;
  return JSON.parse(await ctx.fs.readText(path)) as WorkspaceManifest;
}

async function writeManifestRaw(ctx: WorkspaceContext, manifest: WorkspaceManifest): Promise<void> {
  await ctx.fs.writeText(
    workspaceFilePath(ctx.taskId, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
}

async function putSystemFile(
  ctx: WorkspaceContext,
  relPath: string,
  content: string,
  manifest: WorkspaceManifest,
): Promise<WorkspaceManifest> {
  await ctx.fs.writeText(workspaceFilePath(ctx.taskId, relPath), content);
  return {
    ...manifest,
    updatedAt: ctx.now,
    files: {
      ...manifest.files,
      [relPath]: {
        version: 1,
        source: 'system',
        size: content.length,
        checksum: checksum(content),
        updatedAt: ctx.now,
      },
    },
  };
}

/** Cria o workspace inteiro. Idempotente: se o manifest existe, só devolve. */
export async function createTaskWorkspace(
  ctx: WorkspaceContext,
): Promise<WorkspaceResult<WorkspaceManifest>> {
  const existing = await readManifestRaw(ctx);
  if (existing) return { ok: true, value: existing };

  const root = workspaceRoot(ctx.taskId);
  await ctx.fs.mkdir(root);
  for (const dir of WORKSPACE_DIRS) await ctx.fs.mkdir(`${root}/${dir}`);
  await ctx.fs.mkdir(`${root}/versions/original`);
  await ctx.fs.mkdir(`${root}/versions/user-edits`);

  let manifest: WorkspaceManifest = {
    formatVersion: WORKSPACE_FORMAT_VERSION,
    taskId: ctx.taskId,
    conversationId: ctx.conversationId,
    createdAt: ctx.now,
    updatedAt: ctx.now,
    files: {},
  };

  const seed: Record<string, unknown> = {
    'index.json': {
      formatVersion: WORKSPACE_FORMAT_VERSION,
      taskId: ctx.taskId,
      conversationId: ctx.conversationId,
      createdAt: ctx.now,
    },
    'agente.md': '# como me ajudar nesta tarefa\n\n',
    'prompt.json': { instructions: '', questions: [] },
    'conversation.json': { messages: [] },
    'execution.json': { jobs: [] },
    'context-snapshot.json': { context: {} },
    'plan.json': { steps: [] },
  };
  for (const [relPath, value] of Object.entries(seed)) {
    const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    manifest = await putSystemFile(ctx, relPath, content, manifest);
  }
  await writeManifestRaw(ctx, manifest);
  return { ok: true, value: manifest };
}

export async function readManifest(
  ctx: WorkspaceContext,
): Promise<WorkspaceResult<WorkspaceManifest>> {
  const manifest = await readManifestRaw(ctx);
  if (!manifest) return fail('not_found', 'workspace não existe — crie antes de usar');
  return { ok: true, value: manifest };
}

/** Arquivos visíveis dentro do workspace (caminhos relativos). */
export async function listWorkspaceFiles(
  ctx: WorkspaceContext,
): Promise<WorkspaceResult<AgentFsEntry[]>> {
  const root = workspaceRoot(ctx.taskId);
  if (!(await ctx.fs.exists(root))) return fail('not_found', 'workspace não existe');

  const out: AgentFsEntry[] = [];
  const walk = async (prefix: string): Promise<void> => {
    const entries = await ctx.fs.list(prefix ? `${root}/${prefix}` : root);
    for (const entry of entries) {
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory) await walk(relPath);
      else out.push({ ...entry, name: relPath });
    }
  };
  await walk('');
  return { ok: true, value: out.sort((a, b) => a.name.localeCompare(b.name)) };
}

export async function readWorkspaceFile(
  ctx: WorkspaceContext,
  relPath: string,
): Promise<WorkspaceResult<{ content: string; version: number }>> {
  const invalid = validateReadPath(relPath);
  if (invalid) return fail(invalid.code, invalid.message);
  const path = workspaceFilePath(ctx.taskId, relPath);
  if (!(await ctx.fs.exists(path))) return fail('not_found', `arquivo inexistente: "${relPath}"`);
  const manifest = await readManifestRaw(ctx);
  const content = await ctx.fs.readText(path);
  return { ok: true, value: { content, version: manifest?.files[relPath]?.version ?? 0 } };
}

async function archiveBeforeWrite(
  ctx: WorkspaceContext,
  relPath: string,
  manifest: WorkspaceManifest,
): Promise<void> {
  const entry = manifest.files[relPath];
  if (!entry) return;
  const path = workspaceFilePath(ctx.taskId, relPath);
  if (!(await ctx.fs.exists(path))) return;
  const content = await ctx.fs.readText(path);
  const bucket = entry.source === 'user' ? 'user-edits' : 'original';
  const target = workspaceFilePath(ctx.taskId, `versions/${bucket}/v${entry.version}/${relPath}`);
  await ctx.fs.mkdir(target.slice(0, target.lastIndexOf('/')));
  await ctx.fs.writeText(target, content);
}

/**
 * Escreve um artefato.
 *
 * `expectedVersion` é obrigatório quando o arquivo já existe — e `undefined`
 * significa "criar". Versão errada rejeita **sem** tocar no conteúdo (D10/I7).
 */
export async function writeWorkspaceFile(
  ctx: WorkspaceContext,
  relPath: string,
  content: string,
  options: { expectedVersion?: number; source?: WorkspaceSource } = {},
): Promise<WorkspaceResult<{ version: number; checksum: string }>> {
  const invalid = validateWritePath(relPath);
  if (invalid) return fail(invalid.code, invalid.message);
  if (content.length > MAX_FILE_BYTES) {
    return fail('too_large', `conteúdo acima de ${MAX_FILE_BYTES} bytes`);
  }

  const manifest = await readManifestRaw(ctx);
  if (!manifest) return fail('not_found', 'workspace não existe — crie antes de escrever');

  const entry = manifest.files[relPath];
  if (entry && options.expectedVersion === undefined) {
    return fail('conflict', `"${relPath}" já existe — informe expectedVersion`);
  }
  if (entry && options.expectedVersion !== entry.version) {
    return fail(
      'conflict',
      `"${relPath}" mudou desde a leitura (esperado v${options.expectedVersion}, atual v${entry.version})`,
    );
  }

  await archiveBeforeWrite(ctx, relPath, manifest);
  const absolute = workspaceFilePath(ctx.taskId, relPath);
  await ctx.fs.mkdir(absolute.slice(0, absolute.lastIndexOf('/')));
  await ctx.fs.writeText(absolute, content);

  const version = (entry?.version ?? 0) + 1;
  const digest = checksum(content);
  await writeManifestRaw(ctx, {
    ...manifest,
    updatedAt: ctx.now,
    files: {
      ...manifest.files,
      [relPath]: {
        version,
        source: options.source ?? 'agent',
        size: content.length,
        checksum: digest,
        updatedAt: ctx.now,
      },
    },
  });
  return { ok: true, value: { version, checksum: digest } };
}

export async function appendWorkspaceFile(
  ctx: WorkspaceContext,
  relPath: string,
  content: string,
  options: { expectedVersion: number; source?: WorkspaceSource },
): Promise<WorkspaceResult<{ version: number; checksum: string }>> {
  const current = await readWorkspaceFile(ctx, relPath);
  if (!('value' in current)) return { ok: false, error: current.error };
  if (current.value.version !== options.expectedVersion) {
    return fail(
      'conflict',
      `"${relPath}" mudou desde a leitura (esperado v${options.expectedVersion}, atual v${current.value.version})`,
    );
  }
  return writeWorkspaceFile(ctx, relPath, current.value.content + content, options);
}

export async function renameWorkspaceFile(
  ctx: WorkspaceContext,
  from: string,
  to: string,
  expectedVersion: number,
): Promise<WorkspaceResult<{ version: number }>> {
  const invalidFrom = validateWritePath(from);
  if (invalidFrom) return fail(invalidFrom.code, invalidFrom.message);
  const invalidTo = validateWritePath(to);
  if (invalidTo) return fail(invalidTo.code, invalidTo.message);

  const manifest = await readManifestRaw(ctx);
  if (!manifest) return fail('not_found', 'workspace não existe');
  const entry = manifest.files[from];
  if (!entry) return fail('not_found', `arquivo inexistente: "${from}"`);
  if (entry.version !== expectedVersion) {
    return fail('conflict', `"${from}" mudou desde a leitura (atual v${entry.version})`);
  }
  if (manifest.files[to]) return fail('exists', `destino já existe: "${to}"`);

  const absoluteTo = workspaceFilePath(ctx.taskId, to);
  await ctx.fs.mkdir(absoluteTo.slice(0, absoluteTo.lastIndexOf('/')));
  await ctx.fs.rename(workspaceFilePath(ctx.taskId, from), absoluteTo);

  const { [from]: moved, ...rest } = manifest.files;
  await writeManifestRaw(ctx, {
    ...manifest,
    updatedAt: ctx.now,
    files: {
      ...rest,
      [to]: { ...moved!, updatedAt: ctx.now },
    },
  });
  return { ok: true, value: { version: entry.version } };
}

export async function copyWorkspaceFile(
  ctx: WorkspaceContext,
  from: string,
  to: string,
): Promise<WorkspaceResult<{ version: number }>> {
  const current = await readWorkspaceFile(ctx, from);
  if (!current.ok) return current;
  const invalidTo = validateWritePath(to);
  if (invalidTo) return fail(invalidTo.code, invalidTo.message);
  const manifest = await readManifestRaw(ctx);
  if (!manifest) return fail('not_found', 'workspace não existe');
  if (manifest.files[to]) return fail('exists', `destino já existe: "${to}"`);

  const written = await writeWorkspaceFile(ctx, to, current.value.content, { source: 'derived' });
  if (!written.ok) return written;
  return { ok: true, value: { version: written.value.version } };
}

export async function deleteWorkspaceFile(
  ctx: WorkspaceContext,
  relPath: string,
  expectedVersion: number,
): Promise<WorkspaceResult<{ deleted: true }>> {
  const invalid = validateWritePath(relPath);
  if (invalid) return fail(invalid.code, invalid.message);

  const manifest = await readManifestRaw(ctx);
  if (!manifest) return fail('not_found', 'workspace não existe');
  const entry = manifest.files[relPath];
  if (!entry) return fail('not_found', `arquivo inexistente: "${relPath}"`);
  if (entry.version !== expectedVersion) {
    return fail('conflict', `"${relPath}" mudou desde a leitura (atual v${entry.version})`);
  }

  await archiveBeforeWrite(ctx, relPath, manifest);
  await ctx.fs.remove(workspaceFilePath(ctx.taskId, relPath));
  const { [relPath]: _removed, ...rest } = manifest.files;
  await writeManifestRaw(ctx, { ...manifest, updatedAt: ctx.now, files: rest });
  return { ok: true, value: { deleted: true } };
}

export async function getWorkspaceFileInfo(
  ctx: WorkspaceContext,
  relPath: string,
): Promise<WorkspaceResult<WorkspaceManifestFile & { path: string }>> {
  const invalid = validateReadPath(relPath);
  if (invalid) return fail(invalid.code, invalid.message);
  const manifest = await readManifestRaw(ctx);
  const entry = manifest?.files[relPath];
  if (!entry) return fail('not_found', `arquivo inexistente: "${relPath}"`);
  return { ok: true, value: { ...entry, path: relPath } };
}

/** Copia o artefato para `exports/` — o compartilhamento real é glue de UI. */
export async function exportWorkspaceFile(
  ctx: WorkspaceContext,
  relPath: string,
): Promise<WorkspaceResult<{ path: string }>> {
  const invalid = validateReadPath(relPath);
  if (invalid) return fail(invalid.code, invalid.message);
  const name = relPath.split('/').pop() ?? relPath;
  const target = `exports/${name}`;
  await ctx.fs.mkdir(workspaceFilePath(ctx.taskId, 'exports'));
  await ctx.fs.copy(workspaceFilePath(ctx.taskId, relPath), workspaceFilePath(ctx.taskId, target));
  return { ok: true, value: { path: target } };
}
