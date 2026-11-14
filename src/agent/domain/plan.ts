// Plano do agente (SPEC-037 D5).
//
// A regra que a UI não pode furar: **nada vira realidade antes da confirmação**.
// Por isso os efeitos (`planEffects`) exigem `status === 'confirmed'` e há teste
// garantindo que plano em `draft` devolve lista vazia.

import type { AgentPlan, AgentPlanStep, AgentPlanStatus, Task } from '@/types';

export interface CreatePlanInput {
  taskId: string;
  objective: string;
  expectedOutput?: string;
  steps?: AgentPlanStep[];
  at: string;
}

export function createDraftPlan(input: CreatePlanInput): AgentPlan {
  if (!input.taskId.trim()) throw new Error('createDraftPlan: taskId vazio');
  const id = `plan-${input.taskId}`;
  return {
    id,
    taskId: input.taskId,
    objective: input.objective.trim(),
    expectedOutput: input.expectedOutput?.trim() || undefined,
    steps: input.steps ?? [],
    status: 'draft',
    createdAt: input.at,
    updatedAt: input.at,
  };
}

export function createStep(
  title: string,
  source: AgentPlanStep['source'],
  extra: Partial<Omit<AgentPlanStep, 'id' | 'title' | 'source'>> = {},
): AgentPlanStep {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  return {
    id: `step-${base || 'etapa'}`,
    title: title.trim(),
    status: 'pendente',
    source,
    ...extra,
  };
}

/** D5 — a única pré-condição para escrever efeito é o plano confirmado. */
export function planCanCreateEffects(plan: Pick<AgentPlan, 'status'>): boolean {
  return plan.status === 'confirmed';
}

export function confirmPlan(plan: AgentPlan, at: string): AgentPlan {
  if (plan.status !== 'draft' && plan.status !== 'reviewing') {
    throw new Error(`confirmPlan: plano em "${plan.status}" não pode ser confirmado`);
  }
  return { ...plan, status: 'confirmed', updatedAt: at };
}

export function rejectPlan(plan: AgentPlan, at: string): AgentPlan {
  if (plan.status === 'confirmed') {
    throw new Error('rejectPlan: plano confirmado não é recusável (use completePlan)');
  }
  return { ...plan, status: 'rejected', updatedAt: at };
}

/** Só fecha quando nada ficou pendente — e nunca toca a `Task` (D7). */
export function completePlan(plan: AgentPlan, at: string): AgentPlan {
  if (!planCanCreateEffects(plan)) {
    throw new Error('completePlan: só um plano confirmado pode ser concluído');
  }
  const open = plan.steps.some((step) => step.status === 'pendente' || step.status === 'em_andamento');
  if (open) throw new Error('completePlan: ainda há etapas abertas');
  return { ...plan, status: 'completed', updatedAt: at };
}

export function setPlanStatus(plan: AgentPlan, status: AgentPlanStatus, at: string): AgentPlan {
  return { ...plan, status, updatedAt: at };
}

export function addStep(plan: AgentPlan, step: AgentPlanStep, at: string): AgentPlan {
  if (plan.status === 'confirmed' || plan.status === 'completed') {
    throw new Error('addStep: o plano já foi confirmado');
  }
  return { ...plan, steps: [...plan.steps, step], updatedAt: at };
}

export function editStep(
  plan: AgentPlan,
  stepId: string,
  patch: Partial<Pick<AgentPlanStep, 'title' | 'description' | 'dueDate' | 'status'>>,
  at: string,
): AgentPlan {
  return {
    ...plan,
    steps: plan.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    updatedAt: at,
  };
}

export function removeStep(plan: AgentPlan, stepId: string, at: string): AgentPlan {
  return { ...plan, steps: plan.steps.filter((step) => step.id !== stepId), updatedAt: at };
}

export function dismissStep(plan: AgentPlan, stepId: string, at: string): AgentPlan {
  return editStep(plan, stepId, { status: 'dispensada' }, at);
}

export function markStepDone(plan: AgentPlan, stepId: string, at: string): AgentPlan {
  return editStep(plan, stepId, { status: 'concluida' }, at);
}

export function nextPendingStepId(plan: AgentPlan): string | undefined {
  return plan.steps.find((step) => step.status === 'pendente' || step.status === 'em_andamento')?.id;
}

export function planProgress(plan: AgentPlan): { done: number; total: number; pct: number } {
  const total = plan.steps.length;
  const done = plan.steps.filter(
    (step) => step.status === 'concluida' || step.status === 'dispensada',
  ).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/**
 * Subtarefas/eventos internos que a confirmação cria (D5).
 *
 * Plano não confirmado devolve `[]` — **não** lança, porque a UI chama isto no
 * render para decidir se mostra o botão. A guarda dura é esta: sem
 * `confirmed`, nenhum efeito existe.
 */
export function planEffects(plan: AgentPlan, task: Task): Task[] {
  if (!planCanCreateEffects(plan)) return [];
  return plan.steps
    .filter((step) => step.status === 'pendente' || step.status === 'em_andamento')
    .map((step) => ({
      id: `t-${plan.id}-${step.id}`,
      title: step.title,
      disciplineId: task.disciplineId,
      category: task.category,
      dueDate: step.dueDate,
      completed: false,
      priority: task.priority,
    }));
}
