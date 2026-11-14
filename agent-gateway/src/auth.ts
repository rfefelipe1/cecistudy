import { IncomingMessage } from 'node:http';

// Autenticação do Agent Gateway (SPEC-037 D11).
//
// O token de dispositivo vem de variável de ambiente — nunca embutido no código,
// nunca enviado de volta ao app. O app só recebe bearer na requisição; o gateway
// valida e responde sem revelar o segredo.

export function bearerToken(req: IncomingMessage): string | undefined {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return undefined;
  return auth.slice('Bearer '.length).trim();
}

export function expectToken(expected: string) {
  return function requireAuth(
    token: string | undefined,
  ): { ok: boolean; status?: number; message?: string } {
    if (!token || token !== expected) {
      return { ok: false, status: 401, message: 'sessão inválida' };
    }
    return { ok: true };
  };
}
