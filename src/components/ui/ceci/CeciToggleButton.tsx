import React from 'react';
import { cn } from '@/lib/utils';

export interface CeciToggleButtonProps {
  /** Valor atual (ativo/inativo). */
  active: boolean;
  onChange: () => void;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Estilo do estado ativo. */
  variant?: 'brand' | 'rose' | 'academic';
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<CeciToggleButtonProps['variant']>, string> = {
  brand: 'bg-ceci-brand-strong text-ceci-on-brand border-ceci-border-brand',
  rose: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand shadow-2xs',
  academic: 'bg-ceci-academic text-ceci-on-academic border-ceci-academic',
};

/**
 * Botão de alternância — modo ou estado de uma ação.
 *
 * Não é um switch de preferência (`CeciSwitchRow`) nem uma escolha de formulário
 * (`CeciChoicePill`). É um botão que alterna entre dois estados visuais, ex.:
 * modo escuro/claro, visualização lista/grade.
 */
export const CeciToggleButton: React.FC<CeciToggleButtonProps> = ({
  active,
  onChange,
  label,
  icon,
  disabled = false,
  variant = 'brand',
  className,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    aria-label={label}
    onClick={() => !disabled && onChange()}
    disabled={disabled}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-semibold tap-interactive cursor-pointer transition-colors',
      active
        ? VARIANT_CLASSES[variant]
        : 'bg-surface-default text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted',
      disabled && 'opacity-50 pointer-events-none',
      className,
    )}
  >
    {icon}
    {label && <span>{label}</span>}
  </button>
);
