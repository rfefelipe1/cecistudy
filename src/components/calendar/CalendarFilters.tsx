// Filtros de tipo de evento da agenda (SPEC-redesign-calendario §17).
// Chips roláveis no mobile, linha no desktop.
import React from 'react';

type FiltroTipo = 'todos' | 'aula' | 'prova' | 'tarefa' | 'estágio' | 'estudo';

interface CalendarFiltersProps {
  ativo: FiltroTipo;
  onMudar: (filtro: FiltroTipo) => void;
}

const OPCOES: Array<{ id: FiltroTipo; label: string }> = [
  { id: 'todos', label: 'todos' },
  { id: 'aula', label: 'aula' },
  { id: 'prova', label: 'prova' },
  { id: 'tarefa', label: 'tarefa' },
  { id: 'estágio', label: 'estágio' },
  { id: 'estudo', label: 'estudo' },
];

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  ativo,
  onMudar,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto px-0.5 pb-1 scrollbar-hide">
      {OPCOES.map((opcao) => (
        <button
          key={opcao.id}
          type="button"
          onClick={() => onMudar(opcao.id)}
          aria-pressed={ativo === opcao.id}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
            ativo === opcao.id
              ? 'bg-ceci-brand-strong text-ceci-on-brand'
              : 'bg-surface-default border border-ceci-border-default text-ceci-secondary hover:bg-surface-muted'
          }`}
        >
          {opcao.label}
        </button>
      ))}
    </div>
  );
};
