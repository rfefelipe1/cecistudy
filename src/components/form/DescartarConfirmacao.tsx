// Confirmação de descarte de formulário — padrão extraído do WizardScaffoldFooter
// (SPEC-009 / WizardScaffoldFooter).
//
// Usado quando o usuário tenta sair de um formulário com alterações não salvas.
// Nunca fecha silenciosamente: pergunta se quer continuar editando ou descartar.

import React from 'react';
import { cn } from '@/lib/utils';

interface DescartarConfirmacaoProps {
  /** Aberta ou fechada. */
  aberta: boolean;
  /** Fecha a confirmação sem descartar (continua editando). */
  aoCancelar: () => void;
  /** Confirma o descarte e fecha o formulário. */
  aoDescartar: () => void;
}

export const DescartarConfirmacao: React.FC<DescartarConfirmacaoProps> = ({
  aberta,
  aoCancelar,
  aoDescartar,
}) => {
  if (!aberta) return null;

  return (
    <div className="rounded-2xl bg-surface-default border border-ceci-border-default p-3 space-y-2">
      <p className="text-xs font-semibold text-ceci-primary text-center">
        tem coisas escritas aqui — sair sem guardar?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={aoCancelar}
          className="flex-1 min-h-[44px] rounded-xl bg-ceci-primary text-ceci-on-primary text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
        >
          continuar editando
        </button>
        <button
          type="button"
          onClick={aoDescartar}
          className="flex-1 min-h-[44px] rounded-xl border border-ceci-border-default bg-surface-default text-status-danger-strong text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
        >
          descartar
        </button>
      </div>
    </div>
  );
};
