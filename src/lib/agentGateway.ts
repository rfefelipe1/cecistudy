// Configuração de runtime do Agent Gateway (SPEC-M-039 T009).
//
// A URL e a chave do app vêm do build. Sem as duas, o Cecinho funciona local
// (conversa, plano manual) e simplesmente não tenta rede — nenhuma tela quebra.
//
// A chave do app é **barreira de uso, não segredo**: ela é extraível do bundle.
// Quem protege a cota é o rate limit e a revogação por aparelho no painel.

export interface GatewayRuntime {
  baseUrl: string;
  appKey: string;
}

export function readGatewayRuntime(): GatewayRuntime | null {
  const baseUrl = (import.meta.env.VITE_AGENT_GATEWAY_URL as string | undefined)?.trim();
  const appKey = (import.meta.env.VITE_AGENT_GATEWAY_APP_KEY as string | undefined)?.trim();
  if (!baseUrl || !appKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), appKey };
}
