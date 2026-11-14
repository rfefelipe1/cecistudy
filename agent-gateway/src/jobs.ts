import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type JobStatus = 'queued_local' | 'queued_remote' | 'processing' | 'done' | 'failed';

export interface StoredJob {
  operationId: string;
  taskId: string;
  kind: string;
  status: JobStatus;
  attempts: number;
  error?: string;
  result?: unknown;
  createdAt: string;
  updatedAt: string;
}

export type JobPatch = Partial<
  Omit<StoredJob, 'operationId' | 'taskId' | 'kind' | 'createdAt'>
> & { updatedAt: string };

export interface JobStore {
  find(operationId: string): StoredJob | undefined;
  create(job: Omit<StoredJob, 'attempts'>): StoredJob;
  update(operationId: string, patch: JobPatch): StoredJob | undefined;
  all(): StoredJob[];
}

/**
 * Loja de jobs idempotente por `operationId`.
 *
 * Recriar um job com o mesmo `operationId` devolve o existente (não duplica) —
 * o contrato de idempotência do gateway (D11).
 */
export function createJobStore(dataDir: string): JobStore {
  mkdirSync(dataDir, { recursive: true });
  const jobs = new Map<string, StoredJob>();

  function executionPath(operationId: string): string {
    return join(dataDir, `execution-${operationId}.json`);
  }

  function writeExecution(job: StoredJob): void {
    try {
      writeFileSync(executionPath(job.operationId), JSON.stringify(job, null, 2) + '\n', 'utf8');
    } catch {
      // Falha ao gravar execution.json não derruba o job; o erro vai no status.
    }
  }

  return {
    find: (operationId: string) => jobs.get(operationId),
    create: (job) => {
      if (jobs.has(job.operationId)) return jobs.get(job.operationId)!;
      const stored: StoredJob = { ...job, attempts: 0 };
      jobs.set(stored.operationId, stored);
      writeExecution(stored);
      return stored;
    },
    update: (operationId: string, patch: JobPatch) => {
      const current = jobs.get(operationId);
      if (!current) return undefined;
      const next: StoredJob = { ...current, ...patch };
      jobs.set(operationId, next);
      writeExecution(next);
      return next;
    },
    all: () => [...jobs.values()],
  };
}
