// Sessão do aparelho no gateway (SPEC-M-039 D3).
//
// O app não assina nada: troca `installationId` + chave do app por um JWT
// curto. O token fica **só em memória** — segredo de curta duração não vira
// dado persistido nem backup.

import type { GatewayConfig } from './agentJobClient';

export interface SessionConfig {
  baseUrl: string;
  appKey: string;
  installationId: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface GatewaySession {
  token: string;
  expiresAt: string;
  deviceId: string;
}

/** Cold start do Render Free pode passar de 30 s na primeira chamada. */
const DEFAULT_TIMEOUT_MS = 45_000;
const EXPIRY_MARGIN_MS = 60_000;

export interface GatewaySessionClient {
  /** Token válido, reaproveitando o cache enquanto faltar mais de 1 min. */
  token: () => Promise<string | null>;
  /** Config completa para as chamadas de job, com renovação em 401. */
  config: () => Promise<GatewayConfig | null>;
}

export function createGatewaySession(config: SessionConfig): GatewaySessionClient {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  let cached: { token: string; expiresAt: number } | null = null;

  async function open(): Promise<GatewaySession | null> {
    if (!fetchImpl) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetchImpl(`${baseUrl}/v1/auth/session`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-app-key': config.appKey },
        body: JSON.stringify({ installationId: config.installationId }),
        signal: controller.signal,
      });
      if (!response.ok) return null;

      const body = (await response.json()) as Partial<GatewaySession>;
      if (typeof body.token !== 'string' || typeof body.expiresAt !== 'string') return null;
      return {
        token: body.token,
        expiresAt: body.expiresAt,
        deviceId: body.deviceId ?? config.installationId,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  function remember(session: GatewaySession): string {
    const expiresAt = Date.parse(session.expiresAt);
    cached = {
      token: session.token,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + EXPIRY_MARGIN_MS * 2,
    };
    return session.token;
  }

  async function token(): Promise<string | null> {
    if (cached && cached.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return cached.token;
    const fresh = await open();
    if (!fresh) {
      cached = null;
      return null;
    }
    return remember(fresh);
  }

  async function renew(): Promise<string | null> {
    const fresh = await open();
    if (!fresh) {
      cached = null;
      return null;
    }
    return remember(fresh);
  }

  return {
    token,
    async config() {
      const value = await token();
      if (!value) return null;
      return { baseUrl, token: value, fetchImpl, renewToken: renew };
    },
  };
}
