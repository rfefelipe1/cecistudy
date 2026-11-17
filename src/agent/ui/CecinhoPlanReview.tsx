// Revisão do plano (SPEC-037 T008).
//
// A regra da tela é a regra do domínio: nada é criado antes do `confirm`. O
// plano em `draft`/`reviewing` pode ser editado, recusado ou confirmado; depois
// disso a tela só mostra progresso.
import React, { useState } from 'react';
import { CalendarDays, Check, Pencil, Trash2, X } from 'lucide-react';
import type { AgentPlan, AgentPlanStep } from '@/types';
import { planProgress } from '../domain/plan';
import { DICA, frase } from '@/lib/voice';

interface CecinhoPlanReviewProps {
  plan: AgentPlan;
  onConfirm: () => void;
  onReject: () => void;
  onEditStep: (
    stepId: string,
    patch: Partial<Pick<AgentPlanStep, 'title' | 'description' | 'dueDate' | 'status'>>,
  ) => void;
  onRemoveStep: (stepId: string) => void;
  onMarkDone: (stepId: string) => void;
}

const STATUS_LABEL: Record<AgentPlanStep['status'], string> = {
  pendente: 'a fazer',
  em_andamento: 'em andamento',
  concluida: 'feita',
  dispensada: 'dispensada',
};

export const CecinhoPlanReview: React.FC<CecinhoPlanReviewProps> = ({
  plan,
  onConfirm,
  onReject,
  onEditStep,
  onRemoveStep,
  onMarkDone,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [dateDraft, setDateDraft] = useState('');
  const editable = plan.status === 'draft' || plan.status === 'reviewing';
  const progress = planProgress(plan);

  const startEdit = (step: AgentPlanStep) => {
    setEditingId(step.id);
    setTitleDraft(step.title);
    setDateDraft(step.dueDate ?? '');
  };

  const saveEdit = (stepId: string) => {
    if (!titleDraft.trim()) return;
    onEditStep(stepId, { title: titleDraft.trim(), dueDate: dateDraft || undefined });
    setEditingId(null);
  };

  return (
    <section className="rounded-2xl border border-ceci-border-brand bg-surface-default p-4 space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
          {editable ? 'plano para revisar' : 'plano'}
        </p>
        <h2 className="font-display font-bold text-sm text-ceci-primary mt-0.5">
          {plan.objective}
        </h2>
        {plan.expectedOutput && (
          <p className="text-[11px] text-ceci-secondary mt-1">resultado: {plan.expectedOutput}</p>
        )}
      </div>

      {!editable && (
        <p className="text-[11px] font-semibold text-ceci-secondary">
          {progress.done} de {progress.total} etapas concluídas
        </p>
      )}

      <ol className="space-y-2">
        {plan.steps.map((step) => (
          <li
            key={step.id}
            className="rounded-xl border border-ceci-border-default bg-surface-muted px-3 py-2.5 space-y-1.5"
          >
            {editingId === step.id ? (
              <div className="space-y-2">
                <input
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  aria-label="título da etapa"
                  className="w-full rounded-lg border border-ceci-border-default bg-surface-default px-2.5 py-1.5 text-[12px] text-ceci-primary"
                />
                <input
                  type="date"
                  value={dateDraft}
                  onChange={(event) => setDateDraft(event.target.value)}
                  aria-label="data da etapa"
                  className="rounded-lg border border-ceci-border-default bg-surface-default px-2.5 py-1.5 text-[12px] text-ceci-primary"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(step.id)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-ceci-brand-strong text-ceci-on-brand cursor-pointer"
                  >
                    guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-ceci-border-default bg-surface-default text-ceci-secondary cursor-pointer"
                  >
                    cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-ceci-primary">{step.title}</p>
                    <p className="text-[10px] text-ceci-tertiary">
                      {STATUS_LABEL[step.status]}
                      {step.source === 'agent' ? ' · sugerida pelo cecinho' : ''}
                    </p>
                  </div>
                  {step.dueDate && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-ceci-secondary">
                      <CalendarDays className="w-3 h-3" aria-hidden="true" />
                      {new Date(`${step.dueDate}T00:00:00`).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                {(editable || step.status === 'pendente') && (
                  <div className="flex flex-wrap gap-1.5">
                    {editable && (
                      <button
                        type="button"
                        onClick={() => startEdit(step)}
                        aria-label={`editar ${step.title}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-ceci-border-default bg-surface-default text-ceci-secondary cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" aria-hidden="true" /> editar
                      </button>
                    )}
                    {editable && (
                      <button
                        type="button"
                        onClick={() => onRemoveStep(step.id)}
                        aria-label={`remover ${step.title}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-status-danger-border bg-status-danger-surface text-status-danger-strong cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" /> remover
                      </button>
                    )}
                    {step.status !== 'concluida' && step.status !== 'dispensada' && (
                      <button
                        type="button"
                        onClick={() => onMarkDone(step.id)}
                        aria-label={`marcar ${step.title} como feita`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-ceci-border-brand bg-surface-rose text-ceci-brand-strong cursor-pointer"
                      >
                        <Check className="w-3 h-3" aria-hidden="true" /> já fiz
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ol>

      {editable ? (
        <div className="space-y-2">
          <p className="text-[11px] text-ceci-secondary">{frase(DICA, 'cecinhoPlanoAjuda')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-3 py-2.5 rounded-xl bg-ceci-brand-strong text-ceci-on-brand text-[11px] font-semibold min-h-[44px] cursor-pointer"
            >
              confirmar plano
            </button>
            <button
              type="button"
              onClick={onReject}
              className="px-3 py-2.5 rounded-xl border border-ceci-border-default bg-surface-default text-[11px] font-semibold text-ceci-secondary min-h-[44px] inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" /> recusar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};
