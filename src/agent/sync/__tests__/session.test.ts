// Contrato da sessão do aparelho (SPEC-M-039 D3).
//
// Classe: caso de uso de rede. Protege o que nenhum outro gate cobre — que o
// app mande `X-App-Key`, guarde o JWT só em memória e o renove antes de vencer.

import { describe, expect, it, vi } from 'vitest';
import { createGatewaySession } from '../session';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe('createGatewaySession', () => {
  it('troca installationId + X-App-Key por um JWT e reaproveita enquanto vale', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init: RequestInit) =>
      json({ token: 'jwt-1', expiresAt: inOneHour(), deviceId: 'aparelho-1' }),
    );
    const session = createGatewaySession({
      baseUrl: 'https://gw.example/',
      appKey: 'chave-do-app',
      installationId: 'aparelho-1',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(await session.token()).toBe('jwt-1');
    expect(await session.token()).toBe('jwt-1');
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://gw.example/v1/auth/session');
    expect(init.headers).toMatchObject({ 'x-app-key': 'chave-do-app' });
    expect(JSON.parse(String(init.body))).toEqual({ installationId: 'aparelho-1' });
  });

  it('token quase vencendo é trocado antes de expirar', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        json({ token: 'jwt-antigo', expiresAt: new Date(Date.now() + 30_000).toISOString() }),
      )
      .mockResolvedValueOnce(json({ token: 'jwt-novo', expiresAt: inOneHour() }));

    const session = createGatewaySession({
      baseUrl: 'https://gw.example',
      appKey: 'chave',
      installationId: 'aparelho-1',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(await session.token()).toBe('jwt-antigo');
    expect(await session.token()).toBe('jwt-novo');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('resposta sem token devolve null e config fica nulo', async () => {
    const fetchImpl = vi.fn(async () => json({ error: 'chave inválida' }, 401));
    const session = createGatewaySession({
      baseUrl: 'https://gw.example',
      appKey: 'errada',
      installationId: 'aparelho-1',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(await session.token()).toBeNull();
    expect(await session.config()).toBeNull();
  });

  it('config entrega a renovação para o cliente de jobs', async () => {
    const fetchImpl = vi.fn(async () =>
      json({ token: 'jwt-1', expiresAt: inOneHour(), deviceId: 'aparelho-1' }),
    );
    const session = createGatewaySession({
      baseUrl: 'https://gw.example',
      appKey: 'chave',
      installationId: 'aparelho-1',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const config = await session.config();
    expect(config).toMatchObject({ baseUrl: 'https://gw.example', token: 'jwt-1' });
    expect(typeof config?.renewToken).toBe('function');
  });
});
