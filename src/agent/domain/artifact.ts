// Artefato do agente (SPEC-037 D9/D10).
//
// O `AgentArtifact` é o índice leve; o conteúdo e as versões moram no workspace
// (`src/agent/storage/taskWorkspace.ts`). Aqui só há forma, caminho e mime.

import type { AgentArtifact, AgentArtifactSource } from '@/types';

const MIME_BY_EXT: Record<string, string> = {
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.csv': 'text/csv',
};

export function mimeForName(name: string): string {
  const dot = name.lastIndexOf('.');
  const ext = dot === -1 ? '' : name.slice(dot).toLowerCase();
  return MIME_BY_EXT[ext] ?? 'text/plain';
}

export function nameFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] ?? path;
}

export interface CreateArtifactInput {
  taskId: string;
  path: string;
  source: AgentArtifactSource;
  at: string;
  sizeBytes?: number;
}

export function createArtifact(input: CreateArtifactInput): AgentArtifact {
  if (!input.taskId.trim()) throw new Error('createArtifact: taskId vazio');
  const name = nameFromPath(input.path);
  const id = `art-${input.taskId}-${name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
  return {
    id,
    taskId: input.taskId,
    path: input.path,
    name,
    mimeType: mimeForName(name),
    source: input.source,
    currentVersionId: 'v1',
    sizeBytes: input.sizeBytes,
    synced: false,
    createdAt: input.at,
    updatedAt: input.at,
  };
}

/** Nova versão depois de uma edição (original preservado no workspace, D10). */
export function bumpArtifactVersion(
  artifact: AgentArtifact,
  at: string,
  sizeBytes?: number,
): AgentArtifact {
  const current = Number(artifact.currentVersionId.replace(/^v/, '')) || 0;
  return {
    ...artifact,
    currentVersionId: `v${current + 1}`,
    sizeBytes: sizeBytes ?? artifact.sizeBytes,
    updatedAt: at,
  };
}

export function validateArtifact(value: AgentArtifact): string[] {
  const errors: string[] = [];
  if (!value.taskId.trim()) errors.push('taskId vazio');
  if (!value.path.trim()) errors.push('path vazio');
  if (value.path.includes('..') || value.path.startsWith('/')) errors.push('path inseguro');
  if (!value.name.trim()) errors.push('name vazio');
  return errors;
}
