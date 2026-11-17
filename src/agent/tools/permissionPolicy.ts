// Política de permissões do agente (SPEC-037 T004).
//
// O agente **não** altera estas regras: elas vivem em código, não em
// `agente.md`. Cada operação passa por `decidePermission` antes de tocar dado.
//
// Efeitos:
// - `allow` → segue;
// - `ask`   → exige confirmação explícita da usuária (a UI mostra o pedido);
// - `deny`  → recusa sempre (dado clínico, diretório externo).

export type AgentEffect = 'allow' | 'ask' | 'deny';

export type AgentAction =
  | 'read_context'
  | 'list_files'
  | 'read_file'
  | 'create_file'
  | 'edit_file'
  | 'append_file'
  | 'rename_file'
  | 'copy_file'
  | 'delete_file'
  | 'get_file_info'
  | 'export_file'
  | 'share_file'
  | 'create_native_event'
  | 'complete_task';

export interface AgentPermissionRule {
  action: AgentAction;
  /** Glob simples (`clinical/*`). `*` no fim casa o prefixo. */
  resource: string;
  effect: AgentEffect;
}

/** Ordem importa: a primeira regra que casa vence. */
export const DEFAULT_PERMISSION_POLICY: readonly AgentPermissionRule[] = [
  // Dado clínico nunca entra no contexto do agente (I9).
  { action: 'read_context', resource: 'clinical/*', effect: 'deny' },
  { action: 'read_context', resource: '*', effect: 'allow' },
  { action: 'list_files', resource: '*', effect: 'allow' },
  { action: 'read_file', resource: '*', effect: 'allow' },
  { action: 'create_file', resource: '*', effect: 'allow' },
  { action: 'edit_file', resource: '*', effect: 'allow' },
  { action: 'append_file', resource: '*', effect: 'allow' },
  { action: 'rename_file', resource: '*', effect: 'allow' },
  { action: 'copy_file', resource: '*', effect: 'allow' },
  { action: 'get_file_info', resource: '*', effect: 'allow' },
  { action: 'export_file', resource: '*', effect: 'allow' },
  { action: 'share_file', resource: '*', effect: 'allow' },
  // Sair do app (calendário nativo) e concluir a tarefa exige confirmação.
  { action: 'create_native_event', resource: '*', effect: 'ask' },
  { action: 'complete_task', resource: '*', effect: 'ask' },
  // Exclusão sempre pergunta — é o único caminho destrutivo no workspace.
  { action: 'delete_file', resource: '*', effect: 'ask' },
];

function matches(pattern: string, resource: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1); // mantém a barra
    return resource === pattern.slice(0, -2) || resource.startsWith(prefix);
  }
  return pattern === resource;
}

export interface PermissionDecision {
  effect: AgentEffect;
  /** Regra que decidiu — `null` quando nenhuma casou (fallback `deny`). */
  rule: AgentPermissionRule | null;
  reason: string;
}

/**
 * Decide o efeito de uma ação sobre um recurso.
 *
 * Sem regra que case, o efeito é `deny`: a política é fechada por padrão — uma
 * ação nova que ninguém autorizou não ganha permissão por esquecimento.
 */
export function decidePermission(
  action: AgentAction,
  resource: string,
  policy: readonly AgentPermissionRule[] = DEFAULT_PERMISSION_POLICY,
): PermissionDecision {
  for (const rule of policy) {
    if (rule.action !== action) continue;
    if (!matches(rule.resource, resource)) continue;
    return { effect: rule.effect, rule, reason: `${action} em ${resource}: ${rule.effect}` };
  }
  return { effect: 'deny', rule: null, reason: `${action} em ${resource}: sem regra (deny)` };
}

/** `true` se o recurso é clínico — bloqueado para contexto e para arquivos. */
export function isClinicalResource(resource: string): boolean {
  return resource.split('/')[0]?.toLowerCase() === 'clinical';
}

/**
 * O agente nunca muda a política por arquivo: só a lista em código é aceita.
 * Chamadas vindas do workspace (ex.: `agente.md` pedindo permissão) não alteram
 * nada — esta função é a fronteira.
 */
export function resolvePolicyFromWorkspace(): readonly AgentPermissionRule[] {
  return DEFAULT_PERMISSION_POLICY;
}
