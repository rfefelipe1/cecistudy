import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CeciFilterChipProps {
  value: string;
  label: string;
  /** Filtro ativo? */
  active: boolean;
  onChange: (value: string) => void;
  /** Permite remover o filtro (clique no ×). */
  removable?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Chip de filtro — filtro de tela.
 *
 * Ativo: superfície rosa/azul e ícone de check. Não é um valor de formulário
 * nem uma tag persistente — é um filtro aplicado à listagem da tela atual.
 *
 * Quando removível, usa um container com `role="checkbox"` + botão `×` separado
 * (evita `<button>` aninhado em `<button>`, que é HTML inválido).
 */
export const CeciFilterChip: React.FC<CeciFilterChipProps> = ({
  value,
  label,
  active,
  onChange,
  removable = true,
  disabled = false,
  className,
}) => {
  const base = cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition',
    active
      ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
      : 'border-ceci-border-default text-ceci-secondary bg-surface-default hover:bg-surface-muted',
    disabled && 'opacity-50 pointer-events-none',
    className,
  );

  if (!removable) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={active}
        aria-label={label}
        onClick={() => !disabled && onChange(value)}
        disabled={disabled}
        className={cn(base, 'tap-interactive cursor-pointer')}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      role="checkbox"
      aria-checked={active}
      aria-label={label}
      onClick={() => !disabled && onChange(value)}
      className={cn(base, disabled && 'pointer-events-none', 'tap-interactive cursor-pointer')}
    >
      {label}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onChange(value);
        }}
        aria-label={`remover ${label}`}
        className="ml-1 p-0 text-ceci-tertiary hover:text-status-danger-strong"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
};
