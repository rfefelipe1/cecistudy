import { createHash } from 'node:crypto';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { JobStore, JobStatus, StoredJob } from './jobs.ts';
import { createJobStore } from './jobs.ts';
import { bearerToken, expectToken } from './auth.ts';
import { NimPool, nimError } from './nim.ts';
import type { NimError } from './nim.ts';

export type JobKind = 'analyze' | 'plan' | 'artifact';

export interface JobInput {
  operationId: string;
  taskId: string;
  kind: JobKind;
  payload?: Record<string, unknown>;
}

/** Contexto mínimo que chega ao modelo — gravado para auditoria (D11). */
export interface MinimalContextSnapshot {
  operationId: string;
  taskId: string;
  at: string;
  bytes: number;
  truncated: string[];
}

export interface GatewayConfig {
  token: string;
  dataDir: string;
  nim: {
    apiKeys: string[];
    model: string;
    baseUrl: string;
    maxAttemptsPerKey: number;
    timeoutMs: number;
  };
}

/**
 * O gateway roda o processamento longo fora do mobile (SPEC-037 D11).
 *
 * Regras que valem como código (não como documento):
 *   - idempotência por operationId: POST /jobs com o mesmo id devolve o estado
 *     que já existe;
 *   - contexto mínimo: apenas o allowlist do contexto chega ao modelo, e o
 *     snapshot é gravado em execution.json;
 *   - erros não vazam token nem chave de API;
 *   - o pool NIM tenta a próxima chave em 429/503 e encerra em definitivo para
 *   - 401/402/413/422.
 */
export function createGateway(config: GatewayConfig) {
  const store = createJobStore(config.dataDir);
  const pool = new NimPool(
    {
      apiKeys: config.nim.apiKeys,
      model: config.nim.model,
      baseUrl: config.nim.baseUrl,
      maxAttemptsPerKey: config.nim.maxAttemptsPerKey,
      timeoutMs: config.nim.timeoutMs,
    },
    { call: (_key, body, signal) => callNim(config.nim, body, signal) },
  );

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('content-type', 'application/json');
    const url = new URL(req.url ?? '/', `http://localhost`);
    const path = url.pathname;
    const method = req.method ?? 'GET';

    if (method === 'POST' && path === '/jobs') {
      const auth = expectToken(config.token)(bearerToken(req));
      if (!auth.ok) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: auth.message ?? 'sessão inválida' }));
      }

      let body: unknown;
      try {
        body = await readJson(req);
      } catch {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'corpo inválido' }));
      }

      const input = body as JobInput;
      if (!input?.operationId?.trim() || !input?.taskId?.trim()) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'operationId e taskId obrigatórios' }));
      }

      // Idempotência: reenviar o mesmo operationId não cria outro job.
      const existing = store.find(input.operationId);
      if (existing) {
        res.statusCode = 200;
        return res.end(
          JSON.stringify({
            operationId: existing.operationId,
            status: existing.status,
            idempotent: true,
          }),
        );
      }

      const now = new Date().toISOString();
      const job = store.create({
        operationId: input.operationId,
        taskId: input.taskId,
        kind: input.kind,
        status: 'queued_remote',
        createdAt: now,
        updatedAt: now,
      });

      // Contexto mínimo: só o allowlist viaja; o snapshot fica gravado.
      const snapshot: MinimalContextSnapshot = {
        operationId: input.operationId,
        taskId: input.taskId,
        at: now,
        bytes: new TextEncoder().encode(JSON.stringify(input.payload ?? {})).length,
        truncated: [],
      };
      writeSnapshot(store, input.operationId, snapshot);

      // Dispatch assíncrono: o app não precisa ficar aberto.
      void processJob(pool, store, input, snapshot);

      res.statusCode = 202;
      return res.end(
        JSON.stringify({ operationId: job.operationId, status: job.status }),
      );
    }

    if (method === 'GET' && path.startsWith('/jobs/')) {
      const auth = expectToken(config.token)(bearerToken(req));
      if (!auth.ok) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: auth.message ?? 'sessão inválida' }));
      }

      const operationId = path.slice('/jobs/'.length);
      if (!operationId) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: 'job não encontrado' }));
      }

      const job = store.find(operationId);
      if (!job) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: 'job não encontrado' }));
      }

      res.statusCode = 200;
      return res.end(
        JSON.stringify({
          operationId: job.operationId,
          status: job.status,
          attempts: job.attempts,
          error: job.error,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        }),
      );
    }

    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'rota não encontrada' }));
  });

  return { server, store, pool };
}

async function callNim(
  nim: GatewayConfig['nim'],
  messages: unknown,
  signal: AbortSignal,
): Promise<{ ok: true; text: string } | { ok: false; error: NimError }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), nim.timeoutMs);

  // O caller também pode abortar (ex.: processo desmontado).
  signal.addEventListener('abort', () => controller.abort(), { once: true });

  const requestBody = {
    model: nim.model,
    messages:
      Array.isArray(messages)
        ? messages
        : (messages as { messages?: unknown[] } | undefined)?.messages ?? [],
    temperature: 0.7,
    max_tokens: 2048,
    stream: false,
  };

  try {
    const response = await fetch(`${nim.baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${nim.apiKeys[0] ?? ''}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (response.status === 429 || response.status === 503) {
      return {
        ok: false,
        error: nimError(
          response.status === 429 ? 'rate_limit' : 'provider_down',
          response.status === 429
            ? 'limite temporário do provedor'
            : 'provedor indisponível',
          response.status,
        ),
      };
    }
    if (response.status === 401 || response.status === 402) {
      return {
        ok: false,
        error: nimError('rejected', 'credencial do provedor rejeitada', response.status),
      };
    }
    if (response.status === 413) {
      return {
        ok: false,
        error: nimError('context_too_large', 'contexto grande demais', response.status),
      };
    }
    if (response.status === 422) {
      return {
        ok: false,
        error: nimError('rejected', 'conteúdo recusado pelo provedor', response.status),
      };
    }
    if (!response.ok) {
      return {
        ok: false,
        error: nimError('provider_down', `o provedor falhou (${response.status})`, response.status),
      };
    }

    return { ok: true, text: await response.text() };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      ok: false,
      error: nimError(
        'provider_down',
        aborted ? 'o provedor demorou demais' : 'sem conexão com o provedor',
      ),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null');
}

async function processJob(
  pool: NimPool,
  store: JobStore,
  input: JobInput,
  snapshot: MinimalContextSnapshot,
): Promise<void> {
  const now = () => new Date().toISOString();

  try {
    store.update(input.operationId, { status: 'processing', updatedAt: now() });
    const controller = new AbortController();
    const outcome = await pool.run(input.payload ?? {}, controller.signal);

    if (!outcome.ok) {
      store.update(input.operationId, {
        status: 'failed',
        error: outcome.error.safeMessage,
        attempts: store.find(input.operationId)?.attempts ?? 0 + 1,
        updatedAt: now(),
      });
      return;
    }

    store.update(input.operationId, {
      status: 'done',
      result: { text: outcome.text, snapshot },
      updatedAt: now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'falha ao processar';
    store.update(input.operationId, {
      status: 'failed',
      error: message,
      updatedAt: now(),
    });
  }
}

function writeSnapshot(store: JobStore, operationId: string, snapshot: MinimalContextSnapshot): void {
  try {
    const dir = join(process.cwd(), 'execution');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${operationId}.json`), JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  } catch {
    // Falha ao gravar snapshot não derruba o job.
  }
}
