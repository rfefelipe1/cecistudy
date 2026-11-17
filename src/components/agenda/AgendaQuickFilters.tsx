// Filtros rápidos da Agenda (SPEC-035 D7): cinco recortes automáticos, sempre
// disponíveis, com contador. O chip é um botão de verdade — `aria-pressed` diz o
// estado, e o rótulo diz o que ele mostra.
import React from 'react';
import type { AgendaFilter, AgendaViewModel } from '../../lib/agenda';

interface AgendaQuickFiltersProps {
  active: AgendaFilter;
  counts: AgendaViewModel['counts'];
  onChange: (filter: AgendaFilter) => void;
}

const OPCOES: Array<{ id: AgendaFilter; label: string; count?: keyof AgendaViewModel['counts'] }> = [
  { id: 'tudo', label: 'tudo' },
  { id: 'atrasadas', label: 'atrasadas', count: 'overdue' },
  { id: 'hoje', label: 'hoje', count: 'today' },
  { id: 'proximos', label: 'próximos prazos', count: 'upcoming' },
  { id: 'sem-data', label: 'sem data', count: 'inbox' },
];

export const AgendaQuickFilters: React.FC<AgendaQuickFiltersProps> = ({
  active,
  counts,
  onChange,
}) => (
  <div className="flex gap-1.5 overflow-x-auto px-0.5 pb-1 scrollbar-hide" role="group" aria-label="filtrar a agenda">
    {OPCOES.map((opcao) => {
      const n = opcao.count ? counts[opcao.count] : 0;
      const isActive = active === opcao.id;
      return (
        <button
          key={opcao.id}
          type="button"
          onClick={() => onChange(opcao.id)}
          aria-pressed={isActive}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors min-h-[36px] cursor-pointer border ${
            isActive
              ? 'bg-ceci-brand-strong text-ceci-on-brand border-ceci-brand-strong'
              : 'bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
          }`}
        >
          {opcao.label}
          {n > 0 ? ` · ${n}` : ''}
        </button>
      );
    })}
  </div>
);
