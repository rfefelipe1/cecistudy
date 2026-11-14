// Elegibilidade da ajuda global (SPEC-037 D2 / T013).
//
// A ajuda global **sugere**, nunca interrompe. A decisão é local, determinística
// e auditável: metadados da própria `Task`, sem enviar nada a ninguém.
//
// Estágio fica de fora de propósito: o dado clínico é bloqueado pelo runtime
// (I9), então sugerir assistência nele seria um beco sem saída.

import type { AssistedTask, Task } from '@/types';

/** Estados em que a sugestão já foi feita (ou a tarefa já tem assistência). */
const STATES_THAT_BLOCK_SUGGESTION: readonly AssistedTask['assistanceState'][] = [
  'suggested',
  'accepted',
  'ignored',
  'active',
  'completed',
];

const DAY_MS = 86_400_000;

export interface EligibilityInput {
  task: Task;
  /** Assistência existente para a tarefa, se houver. */
  existing?: Pick<AssistedTask, 'assistanceState'>;
  /** Toggle do Perfil. */
  helpEnabled: boolean;
  /** A tarefa está ligada a um capítulo/pendência do TCC? */
  hasThesisLink?: boolean;
  /** Instante de referência (o relógio entra por parâmetro). */
  now: string;
}

export interface EligibilityVerdict {
  eligible: boolean;
  score: number;
  reason: string;
}

function daysUntil(dateKey: string | undefined, nowIso: string): number | undefined {
  if (!dateKey) return undefined;
  const due = Date.parse(`${dateKey}T00:00:00`);
  if (Number.isNaN(due)) return undefined;
  return Math.ceil((due - Date.parse(nowIso)) / DAY_MS);
}

/** Regras locais de elegibilidade — sem rede, sem estado escondido. */
export function evaluateEligibility(input: EligibilityInput): EligibilityVerdict {
  const { task, existing, helpEnabled, hasThesisLink, now } = input;

  if (!helpEnabled) return { eligible: false, score: 0, reason: 'ajuda global desligada' };
  if (task.completed) return { eligible: false, score: 0, reason: 'tarefa concluída' };
  if (existing && STATES_THAT_BLOCK_SUGGESTION.includes(existing.assistanceState)) {
    return { eligible: false, score: 0, reason: `já tem assistência (${existing.assistanceState})` };
  }
  if (task.category === 'estagio') {
    return { eligible: false, score: 0, reason: 'estágio tem dado clínico bloqueado' };
  }
  if (task.title.trim().length < 8) {
    return { eligible: false, score: 0, reason: 'título curto demais para entender a intenção' };
  }

  let score = 0;
  if (task.category === 'trabalho' || task.category === 'revisao') score += 2;
  else if (task.category === 'leitura') score += 1;

  if (task.priority === 'alta') score += 2;
  else if (task.priority === 'media') score += 1;

  const days = daysUntil(task.dueDate, now);
  if (days !== undefined) {
    if (days < 0) score += 1; // atrasada: já aparece em "atenção"; a sugestão pode esperar
    else if (days <= 7) score += 2;
    else if (days <= 14) score += 1;
  }

  if (task.disciplineId) score += 1;
  if (hasThesisLink) score += 1;

  const eligible = score >= 3;
  return {
    eligible,
    score,
    reason: eligible ? 'metadados indicam tarefa de processo longo' : 'tarefa simples o bastante',
  };
}

export function shouldSuggestAssistance(input: EligibilityInput): boolean {
  return evaluateEligibility(input).eligible;
}
