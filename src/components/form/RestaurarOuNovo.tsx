// Pergunta ao reabrir formulário com rascunho salvo — padrão extraído do sistema
// de estágio (SPEC-009).
//
// Quando o usuário retorna a um formulário que tem rascunho, oferece duas opções:
//  - continuar o registro de [data e hora] — carrega o rascunho e segue preenchendo;
//  - começar um novo — limpa o rascunho e inicia o formulário vazio.
//
// Nenhuma das duas é imposta: o usuário escolhe.

import React from 'react';

interface RestaurarOuNovoProps {
  /** Aberta ou fechada. */
  aberta: boolean;
  /** Legível do registro salvo (ex.: "registro de 26/10 às 14:30"). */
  labelRegistro: string;
  /** Carrega o rascunho e continua preenchendo. */
  aoContinuarRegistro: () => void;
  /** Limpa o rascunho e inicia um registro novo. */
  aoComecarNovo: () => void;
  /** Cancela a pergunta (fica no formulário vazio / fecha). */
  aoCancelar: () => void;
}

export const RestaurarOuNovo: React.FC<RestaurarOuNovoProps> = ({
  aberta,
  labelRegistro,
  aoContinuarRegistro,
  aoComecarNovo,
  aoCancelar,
}) => {
  if (!aberta) return null;

  return (
    <div className="rounded-2xl bg-surface-default border border-ceci-border-default p-4 space-y-3">
      <p className="font-display font-bold text-sm text-ceci-primary text-center">
        você tem um registro salvo
      </p>
      <p className="text-[11px] text-ceci-secondary text-center leading-relaxed">
        deseja continuar o "{labelRegistro}" ou começar um novo?
      </p>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          type="button"
          onClick={aoContinuarRegistro}
          className="min-h-[44px] rounded-2xl bg-ceci-brand text-ceci-on-brand text-xs font-bold active:scale-[0.98] transition-transform cursor-pointer"
        >
          continuar registro
        </button>
        <button
          type="button"
          onClick={aoComecarNovo}
          className="min-h-[44px] rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-secondary text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
        >
          começar novo
        </button>
      </div>
      <button
        type="button"
        onClick={aoCancelar}
        className="w-full min-h-[40px] rounded-xl text-xs font-medium text-ceci-tertiary hover:text-ceci-primary hover:bg-surface-muted transition-colors cursor-pointer"
      >
        cancelar
      </button>
    </div>
  );
};
