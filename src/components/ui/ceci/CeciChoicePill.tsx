import React from 'react';
import { cn } from '@/lib/utils';

export interface CeciChoicePillProps<T extends string> {
  value: T;
  label: string;
  /** Selecionada? */
  selected: boolean;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Pill de escolha única — valor de formulário.
 *
 * Selecionada: fundo de marca e texto sobre marca. Não selecionada: superfície
 * neutra com borda. Não é um filtro de tela nem uma tag persistente — é um
 * campo de formulário com escolha entre opções mutuamente exclusivas.
 */
export const CeciChoicePill = <T extends string>({
  value,
  label,
  selected,
  onChange,
  disabled = false,
  className,
}: CeciChoicePillProps<T>) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    aria-label={label}
    onClick={() => !disabled && onChange(value)}
    disabled={disabled}
    className={cn(
      'rounded-full font-semibold capitalize whitespace-nowrap tap-interactive cursor-pointer transition',
      'px-3 py-1.5 text-xs',
      selected
        ? 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand'
        : 'bg-surface-default text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted',
      disabled && 'opacity-50 pointer-events-none',
      className,
    )}
  >
    {label}
  </button>
);
