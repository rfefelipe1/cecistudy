import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CeciTagProps {
  value: string;
  label?: string;
  /** Tag removível? */
  removable?: boolean;
  onRemove?: (value: string) => void;
  disabled?: boolean;
  /** Variante visual: neutro ou rosa. */
  variant?: 'neutral' | 'rose';
  className?: string;
}

/**
 * Tag — valor persistente removível.
 *
 * Superfície neutra ou rosa, com `×` contextual para remover. Não é um filtro
 * de tela nem um valor de formulário — é um item que já foi guardado e pode ser
 * retirado (ex.: autor, conceito, material).
 */
export const CeciTag: React.FC<CeciTagProps> = ({
  value,
  label = value,
  removable = true,
  onRemove,
  disabled = false,
  variant = 'neutral',
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold',
      variant === 'rose'
        ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
        : 'border-ceci-border-default text-ceci-secondary bg-surface-default',
      disabled && 'opacity-50',
      className,
    )}
  >
    {label}
    {removable && onRemove && !disabled && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(value);
        }}
        aria-label={`remover ${label}`}
        className="p-0 text-ceci-tertiary hover:text-status-danger-strong"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
);
