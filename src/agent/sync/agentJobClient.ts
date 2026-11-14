// Contrato de consumo do Agent Gateway no mobile (SPEC-037 T012 / D11).
//
// Funções puras sobre uma fila local: nenhuma lê React, nenhuma guarda token no
// bundle (o token chega por argumento, de config de runtime) e nenhuma lança —
// erro é valor, como no workspace.
//
// A regra da fila: **idempotência por `operationId`**. Reenviar o mesmo job não
// cria outro no gateway; o gateway devolve o estado que já tinha.

import type { AgentJob, AgentJobStatus, AgentMessageKind, AgentQuestion } from '@/types';

export type GatewayErrorKind =
  | 'unauthorized'
  | 'user_limit'
  | 'key_limit'
  | 'provider_down'
  | 'rejected'
  | 'context_too_large'
  | 'network'
  | 'timeout'
  | 'server';

export interface GatewayError {
  kind: GatewayErrorKind;
  /** Mensagem já sanitizada pelo gateway: nunca contém token nem chave. */
  message: string;
}

export type GatewayResult<T> = { ok: true; value: T } | { ok: false; error: GatewayError };

export interface GatewayConfig {
  /** Ex.: `https://gateway.exemplo` — sem barra final. */
  baseUrl: string;
  /**
   * Bearer de dispositivo. Vem de configuração de runtime
   * (`VITE_AGENT_GATEWAY_TOKEN` / pareamento), nunca de constante no código.
   */
  token: string;
  /** `fetch` injetado — teste sem rede. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** O que o gateway devolve em `GET /jobs/:operationId`. */
export interface RemoteJob {
  operationId: string;
  status: AgentJobStatus;
  messages?: Array<{
    id?: string;
    role: 'assistant' | 'system' | 'tool';
    kind: AgentMessageKind;
    content: string;
    question?: AgentQuestion;
  }>;
  plan?: {
    objective: string;
    expectedOutput?: string;
    steps: Array<{ title: string; description?: string; dueDate?: string }>;
  };
  artifacts?: Array<{ name: string; path: string; mimeType: string; content?: string }>;
  error?: string;
}

const DEFAULT_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Fila local
// ---------------------------------------------------------------------------

export interface EnqueueInput {
  operationId: string;
  taskId: string;
  kind: AgentJob['kind'];
  payload?: Record<string, unknown>;
  at: string;
}

/** Enfileira; o mesmo `operationId` já presente é devolvido intacto. */
export function enqueueJob(queue: readonly AgentJob[], input: EnqueueInput): AgentJob[] {
  if (!input.operationId.trim()) throw new Error('enqueueJob: operationId vazio');
  if (queue.some((job) => job.operationId === input.operationId)) return [...queue];
  const job: AgentJob = {
    operationId: input.operationId,
    taskId: input.taskId,
    kind: input.kind,
    status: 'queued_local',
    payload: input.payload,
    attempts: 0,
    createdAt: input.at,
    updatedAt: input.at,
  };
  return [...queue, job];
}

export function patchJob(
  queue: readonly AgentJob[],
  operationId: string,
  patch: Partial<Omit<AgentJob, 'operationId'>>,
  at: string,
): AgentJob[] {
  return queue.map((job) =>
    job.operationId === operationId ? { ...job, ...patch, updatedAt: at } : job,
  );
}

export function jobsToSend(queue: readonly AgentJob[]): AgentJob[] {
  return queue.filter((job) => job.status === 'queued_local');
}

export function jobsToPoll(queue: readonly AgentJob[]): AgentJob[] {
  return queue.filter((job) => job.status === 'queued_remote' || job.status === 'processing');
}

export function jobFor(queue: readonly AgentJob[], operationId: string): AgentJob | undefined {
  return queue.find((job) => job.operationId === operationId);
}

// ---------------------------------------------------------------------------
// Rede
// ---------------------------------------------------------------------------

function httpError(status: number): GatewayError {
  if (status === 401 || status === 403) return { kind: 'unauthorized', message: 'sessão inválida' };
  if (status === 402) return { kind: 'user_limit', message: 'limite da conta atingido' };
  if (status === 413) return { kind: 'context_too_large', message: 'contexto grande demais' };
  if (status === 422) return { kind: 'rejected', message: 'conteúdo recusado' };
  if (status === 429) return { kind: 'key_limit', message: 'limite temporário do provedor' };
  if (status === 503) return { kind: 'provider_down', message: 'provedor indisponível' };
  if (status >= 500) return { kind: 'server', message: 'o gateway falhou agora' };
  return { kind: 'server', message: `resposta inesperada (${status})` };
}

async function call<T>(
  config: GatewayConfig,
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown },
): Promise<GatewayResult<T>> {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) return { ok: false, error: { kind: 'network', message: 'sem fetch disponível' } };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${config.baseUrl.replace(/\/$/, '')}${path}`, {
      method: init.method,
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, error: httpError(response.status) };
    return { ok: true, value: (await response.json()) as T };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      ok: false,
      error: aborted
        ? { kind: 'timeout', message: 'o gateway demorou demais' }
        : { kind: 'network', message: 'sem conexão com o gateway' },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function submitJob(
  config: GatewayConfig,
  job: AgentJob,
): Promise<GatewayResult<{ operationId: string; status: AgentJobStatus }>> {
  return call(config, '/jobs', {
    method: 'POST',
    body: {
      operationId: job.operationId,
      taskId: job.taskId,
      kind: job.kind,
      payload: job.payload ?? {},
    },
  });
}

export function fetchJob(config: GatewayConfig, operationId: string): Promise<GatewayResult<RemoteJob>> {
  return call(config, `/jobs/${encodeURIComponent(operationId)}`, { method: 'GET' });
}

/** Erros que **não** melhoram tentando de novo sozinho. */
const FATAL: readonly GatewayErrorKind[] = [
  'unauthorized',
  'user_limit',
  'rejected',
  'context_too_large',
];

export interface FlushOutcome {
  queue: AgentJob[];
  sent: number;
  failed: number;
  error?: GatewayError;
}

/**
 * Tenta enviar a fila local. Para no primeiro erro de rede/timeout: insistir nos
 * seguintes só gasta bateria e confirma que está offline.
 */
export async function flushQueue(
  config: GatewayConfig,
  queue: readonly AgentJob[],
  at: string,
): Promise<FlushOutcome> {
  let next = [...queue];
  let sent = 0;
  let failed = 0;

  for (const job of jobsToSend(queue)) {
    const result = await submitJob(config, job);
    if ('value' in result) {
      next = patchJob(next, job.operationId, {
        status: result.value.status === 'done' ? 'done' : 'queued_remote',
        attempts: job.attempts + 1,
      }, at);
      sent += 1;
      continue;
    }

    const error = result.error;
    if (FATAL.includes(error.kind)) {
      next = patchJob(
        next,
        job.operationId,
        { status: 'failed', error: error.kind, attempts: job.attempts + 1 },
        at,
      );
      failed += 1;
      continue;
    }

    next = patchJob(next, job.operationId, { attempts: job.attempts + 1 }, at);
    return { queue: next, sent, failed, error };
  }

  return { queue: next, sent, failed };
}

export interface PollOutcome {
  queue: AgentJob[];
  results: RemoteJob[];
  error?: GatewayError;
}

/** Consulta os jobs remotos e devolve o que já terminou. */
export async function pollQueue(
  config: GatewayConfig,
  queue: readonly AgentJob[],
  at: string,
): Promise<PollOutcome> {
  let next = [...queue];
  const results: RemoteJob[] = [];

  for (const job of jobsToPoll(queue)) {
    const result = await fetchJob(config, job.operationId);
    if (!('value' in result)) {
      if (result.error.kind === 'network' || result.error.kind === 'timeout') {
        return { queue: next, results, error: result.error };
      }
      next = patchJob(
        next,
        job.operationId,
        { status: 'failed', error: result.error.kind },
        at,
      );
      continue;
    }

    const remote = result.value;
    next = patchJob(
      next,
      job.operationId,
      {
        status: remote.status,
        error: remote.status === 'failed' ? remote.error ?? 'falha no gateway' : undefined,
        result:
          remote.status === 'done'
            ? { messages: remote.messages?.length ?? 0, artifacts: remote.artifacts?.length ?? 0 }
            : job.result,
      },
      at,
    );
    if (remote.status === 'done' || remote.status === 'failed') results.push(remote);
  }

  return { queue: next, results };
}
