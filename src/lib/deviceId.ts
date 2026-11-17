// Identificador de instalação do aparelho (SPEC-M-039 D3).
//
// Não é dado de domínio: não entra no schema, não sobe para backup e não tem
// migração. Fica em `localStorage` porque o WebView do Capacitor persiste
// igual ao navegador e um UUID não justifica ida ao SQLite.

const KEY = 'cecistudy.cecinho.installationId';

let cached: string | null = null;

function randomId(): string {
  const api = globalThis.crypto;
  if (api?.randomUUID) return api.randomUUID();
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getInstallationId(): string {
  if (cached) return cached;
  try {
    const stored = globalThis.localStorage?.getItem(KEY);
    if (stored) {
      cached = stored;
      return stored;
    }
    const created = randomId();
    globalThis.localStorage?.setItem(KEY, created);
    cached = created;
    return created;
  } catch {
    // Modo privado / storage bloqueado: id efêmero ainda serve para a sessão.
    cached = randomId();
    return cached;
  }
}

/** Só teste: esquece o id em memória para exercitar o caminho de criação. */
export function resetInstallationIdForTest(): void {
  cached = null;
}
