import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createGateway } from '../src/server.ts';
import type { NimAdapter } from '../src/nim.ts';
import { NimPool } from '../src/nim.ts';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function request(port: number, method: string, path: string, body?: unknown, token = 'tok-secreto') {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

async function closeServer(server: { close: (cb: () => void) => void; closeAllConnections?: () => void }): Promise<void> {
  return new Promise((resolve) => {
    server.closeAllConnections?.();
    server.close(resolve);
  });
}

describe('Agent Gateway', () => {
  it('POST /jobs é idempotente por operationId', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'gw-'));
    const gw = createGateway({ token: 'tok-secreto', dataDir, nim: { apiKeys: ['k1'], model: 'm', baseUrl: 'http://x', maxAttemptsPerKey: 1, timeoutMs: 5000 } });
    await new Promise<void>((r) => gw.server.listen(0, '127.0.0.1', r));
    const port = (gw.server.address() as { port: number }).port;

    const body = { operationId: 'op-1', taskId: 't1', kind: 'analyze' as const, payload: { a: 1 } };
    const first = await request(port, 'POST', '/jobs', body);
    assert.strictEqual(first.status, 202);
    assert.strictEqual((first.json as { idempotent?: boolean }).idempotent, undefined);

    const second = await request(port, 'POST', '/jobs', body);
    assert.strictEqual(second.status, 200);
    assert.strictEqual((second.json as { idempotent?: boolean }).idempotent, true);

    await closeServer(gw.server);
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('GET /jobs/:operationId devolve o status', async () => {    const dataDir = mkdtempSync(join(tmpdir(), 'gw-'));
    const gw = createGateway({ token: 'tok-secreto', dataDir, nim: { apiKeys: ['k1'], model: 'm', baseUrl: 'http://x', maxAttemptsPerKey: 1, timeoutMs: 5000 } });
    await new Promise<void>((r) => gw.server.listen(0, '127.0.0.1', r));
    const port = (gw.server.address() as { port: number }).port;

    await request(port, 'POST', '/jobs', { operationId: 'op-2', taskId: 't1', kind: 'plan' as const });
    const got = await request(port, 'GET', '/jobs/op-2');
    assert.strictEqual(got.status, 200);
    assert.strictEqual((got.json as { operationId: string }).operationId, 'op-2');
    assert.ok(
      ['queued_remote', 'processing', 'done', 'failed'].includes(
        (got.json as { status: string }).status,
      ),
      `status inesperado: ${(got.json as { status: string }).status}`,
    );

    await closeServer(gw.server);
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('sem token ou token errado é 401 e não vaza o token esperado', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'gw-'));
    const gw = createGateway({ token: 'tok-secreto', dataDir, nim: { apiKeys: ['k1'], model: 'm', baseUrl: 'http://x', maxAttemptsPerKey: 1, timeoutMs: 5000 } });
    await new Promise<void>((r) => gw.server.listen(0, '127.0.0.1', r));
    const port = (gw.server.address() as { port: number }).port;

    const noToken = await request(port, 'POST', '/jobs', { operationId: 'op-3', taskId: 't1', kind: 'analyze' as const }, '');
    assert.strictEqual(noToken.status, 401);
    assert.ok(!JSON.stringify(noToken.json).includes('tok-secreto'));

    const wrongToken = await request(port, 'POST', '/jobs', { operationId: 'op-3b', taskId: 't1', kind: 'analyze' as const }, 'outro');
    assert.strictEqual(wrongToken.status, 401);

    await closeServer(gw.server);
    rmSync(dataDir, { recursive: true, force: true });
  });
});

describe('Pool NIM', () => {
  it('faz fallback para a próxima chave em 429 e devolve texto na primeira tentativa', async () => {
    let calls = 0;
    const adapter: NimAdapter = {
      call: async (_key: string, _body: unknown, _signal: AbortSignal) => {
        calls += 1;
        if (calls === 1) {
          return { ok: false, error: { kind: 'rate_limit' as const, safeMessage: 'limite', status: 429 } };
        }
        return { ok: true, text: 'resposta do modelo' };
      },
    };
    const pool = new NimPool({ apiKeys: ['k1', 'k2'], model: 'm', baseUrl: 'http://x', maxAttemptsPerKey: 1, timeoutMs: 5000 }, adapter);
    const outcome = await pool.run({ x: 1 }, new AbortController().signal);
    assert.ok('ok' in outcome && outcome.ok);
    assert.strictEqual(outcome.text, 'resposta do modelo');
    assert.strictEqual(calls, 2);
  });

  it('erro definitivo (401) não faz retry', async () => {
    let calls = 0;
    const adapter: NimAdapter = {
      call: async () => {
        calls += 1;
        return { ok: false, error: { kind: 'rejected' as const, safeMessage: 'rejeitado', status: 401 } };
      },
    };
    const pool = new NimPool({ apiKeys: ['k1', 'k2'], model: 'm', baseUrl: 'http://x', maxAttemptsPerKey: 1, timeoutMs: 5000 }, adapter);
    const outcome = await pool.run({ x: 1 }, new AbortController().signal);
    assert.ok('error' in outcome && !outcome.ok);
    assert.strictEqual(outcome.error.kind, 'rejected');
    assert.strictEqual(calls, 1);
  });
});
