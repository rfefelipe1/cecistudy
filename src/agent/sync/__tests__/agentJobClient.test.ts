import { describe, expect, it, vi } from 'vitest';
import type { AgentJob } from '@/types';
import {
  enqueueJob,
  fetchJob,
  flushQueue,
  jobFor,
  jobsToPoll,
  pollQueue,
  submitJob,
  type GatewayConfig,
} from '../agentJobClient';

const at = '2026-11-14T12:00:00.000Z';

function queued(): AgentJob[] {
  return enqueueJob([], {
    operationId: 'analyze:task-1:v1',
    taskId: 'task-1',
    kind: 'analyze',
    payload: { prompt: 'ajuda' },
    at,
  });
}

function config(response: Response | Error): GatewayConfig {
  return {
    baseUrl: 'https://gw.example/',
    token: 'tok-secreto',
    fetchImpl: vi.fn(async () => {
      if (response instanceof Error) throw response;
      return response;
    }) as unknown as typeof fetch,
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('contrato HTTP', () => {
  it('envia o job em /v1 com Idempotency-Key', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return json({ operationId: 'analyze:task-1:v1', status: 'queued_remote' }, 202);
    });

    const result = await submitJob(
      { baseUrl: 'https://gw.example', token: 'tok', fetchImpl: fetchImpl as unknown as typeof fetch },
      queued()[0],
    );

    expect(result).toEqual({
      ok: true,
      value: { operationId: 'analyze:task-1:v1', status: 'queued_remote' },
    });
    expect(calls[0].url).toBe('https://gw.example/v1/agent/jobs');
    expect(calls[0].init.headers).toMatchObject({
      authorization: 'Bearer tok',
      'idempotency-key': 'analyze:task-1:v1',
    });
  });

  it('renova o token no 401 e repete uma vez', async () => {
    const responses = [
      json({ error: 'sessão expirada' }, 401),
      json({ operationId: 'op-1', status: 'processing' }),
    ];
    const fetchImpl = vi.fn(async (_url: string, _init: RequestInit) => responses.shift()!);
    const renewToken = vi.fn(async () => 'tok-novo');

    const result = await fetchJob(
      {
        baseUrl: 'https://gw.example',
        token: 'tok-velho',
        renewToken,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      },
      'op-1',
    );

    expect(renewToken).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, value: { operationId: 'op-1', status: 'processing' } });
    expect(fetchImpl.mock.calls[1][1].headers).toMatchObject({
      authorization: 'Bearer tok-novo',
    });
  });

  it('401 sem renovação vira unauthorized', async () => {
    const result = await fetchJob(
      config(json({ error: 'nope' }, 401)),
      'op-1',
    );
    expect(result).toEqual({ ok: false, error: { kind: 'unauthorized', message: 'sessão inválida' } });
  });
});

describe('fila local', () => {
  it('é idempotente por operationId', () => {
    const once = queued();
    const twice = enqueueJob(once, {
      operationId: 'analyze:task-1:v1',
      taskId: 'task-1',
      kind: 'analyze',
      at: '2026-11-14T12:05:00.000Z',
    });
    expect(twice).toHaveLength(1);
    expect(jobFor(twice, 'analyze:task-1:v1')?.createdAt).toBe(at);
  });

  it('só consulta o que já saiu do aparelho', () => {
    expect(jobsToPoll(queued())).toHaveLength(0);
  });
});

describe('flushQueue', () => {
  it('marca queued_remote quando o gateway aceita', async () => {
    const outcome = await flushQueue(
      config(json({ operationId: 'analyze:task-1:v1', status: 'queued_remote' }, 202)),
      queued(),
      at,
    );
    expect(outcome.error).toBeUndefined();
    expect(outcome.sent).toBe(1);
    expect(jobFor(outcome.queue, 'analyze:task-1:v1')?.status).toBe('queued_remote');
  });

  it('para no primeiro erro de rede e mantém a fila', async () => {
    const outcome = await flushQueue(config(new TypeError('offline')), queued(), at);
    expect(outcome.error?.kind).toBe('network');
    const job = jobFor(outcome.queue, 'analyze:task-1:v1');
    expect(job?.status).toBe('queued_local');
    expect(job?.attempts).toBe(1);
  });

  it('falha definitiva não fica tentando para sempre', async () => {
    const outcome = await flushQueue(config(json({ error: 'no' }, 401)), queued(), at);
    const job = jobFor(outcome.queue, 'analyze:task-1:v1');
    expect(job?.status).toBe('failed');
    expect(job?.error).toBe('unauthorized');
    expect(outcome.failed).toBe(1);
  });

  it('erro devolvido não vaza o token', async () => {
    const outcome = await flushQueue(config(json({ error: 'nope' }, 500)), queued(), at);
    expect(JSON.stringify(outcome)).not.toContain('tok-secreto');
  });
});

describe('pollQueue', () => {
  it('devolve o resultado final e fecha o job', async () => {
    const sent = queued().map((job) => ({ ...job, status: 'processing' as const }));
    const outcome = await pollQueue(
      config(
        json({
          operationId: 'analyze:task-1:v1',
          status: 'done',
          messages: [{ role: 'assistant', kind: 'text', content: 'prontinho' }],
        }),
      ),
      sent,
      at,
    );
    expect(outcome.results).toHaveLength(1);
    expect(jobFor(outcome.queue, 'analyze:task-1:v1')?.status).toBe('done');
  });

  it('rede cai: job continua remoto, nada é perdido', async () => {
    const sent = queued().map((job) => ({ ...job, status: 'queued_remote' as const }));
    const outcome = await pollQueue(config(new TypeError('offline')), sent, at);
    expect(outcome.error?.kind).toBe('network');
    expect(jobFor(outcome.queue, 'analyze:task-1:v1')?.status).toBe('queued_remote');
  });
});
