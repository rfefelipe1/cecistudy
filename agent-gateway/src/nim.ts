import { createHash } from 'node:crypto';

export type NimErrorKind = 'rate_limit' | 'provider_down' | 'rejected' | 'context_too_large' | 'unknown';

export interface NimError {
  kind: NimErrorKind;
  status?: number;
  /** Mensagem já sanitizada: nunca contém chave de API. */
  safeMessage: string;
}

export interface NimAdapter {
  /** Chamada real ao modelo. Injetável em teste (sem rede). */
  call: (
    apiKey: string,
    body: unknown,
    signal: AbortSignal,
  ) => Promise<{ ok: true; text: string } | { ok: false; error: NimError }>;
}

export interface NimPoolConfig {
  /** Chaves de API do NVIDIA NIM (env, nunca no bundle do app). */
  apiKeys: string[];
  model: string;
  baseUrl: string;
  maxAttemptsPerKey: number;
  timeoutMs: number;
}

/**
 * Pool de chaves NVIDIA NIM com retry e fallback.
 *
 * Regras:
 *   - rota as chaves em round-robin;
 *   - `429`/`503` de uma chave tenta a próxima chave (fallback);
 *   - nunca vaza a chave nem o corpo de erro bruto do provedor.
 */
export class NimPool {
  private index = 0;
  private readonly config: NimPoolConfig;
  private readonly adapter: NimAdapter;

  constructor(config: NimPoolConfig, adapter: NimAdapter) {
    this.config = config;
    this.adapter = adapter;
  }

  /** Próxima chave da rodada (round-robin, determinístico para teste). */
  nextKey(): string {
    const keys = this.config.apiKeys;
    if (keys.length === 0) throw new Error('nim: nenhuma chave configurada');
    const key = keys[this.index % keys.length];
    this.index += 1;
    return key;
  }

  reset(): void {
    this.index = 0;
  }

  /** chave de consumo por usuária/tarefa (auditável, não é a chave de API). */
  consumptionKey(userId: string, taskId: string): string {
    return createHash('sha256').update(`${userId}:${taskId}`).digest('hex').slice(0, 16);
  }

  async run(body: unknown, signal: AbortSignal): Promise<{ ok: true; text: string } | { ok: false; error: NimError }> {
    const { apiKeys, maxAttemptsPerKey } = this.config;
    if (apiKeys.length === 0) {
      return { ok: false, error: nimError('provider_down', 'provedor sem chaves configuradas', 503) };
    }

    let lastError: NimError | undefined;
    const totalAttempts = apiKeys.length * maxAttemptsPerKey;

    for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
      const key = this.nextKey();
      const outcome = await this.adapter.call(key, body, signal);
      if (outcome.ok) return outcome;

      const error = outcome.error;
      lastError = error;
      if (error.kind === 'rate_limit' || error.kind === 'provider_down') {
        continue; // tenta a próxima chave
      }
      return outcome; // definitivo: rejected, context_too_large, unknown
    }

    return {
      ok: false,
      error: lastError ?? nimError('provider_down', 'provedor indisponível', 503),
    };
  }
}

export function nimError(kind: NimErrorKind, message: string, status?: number): NimError {
  return { kind, status, safeMessage: sanitize(kind) };
}

function sanitize(kind: NimErrorKind): string {
  switch (kind) {
    case 'rate_limit':
      return 'limite temporário do provedor';
    case 'provider_down':
      return 'provedor indisponível';
    case 'rejected':
      return 'conteúdo recusado';
    case 'context_too_large':
      return 'contexto grande demais';
    default:
      return 'o provedor falhou agora';
  }
}
