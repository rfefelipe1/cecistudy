import React from 'react';
import { cn } from '@/lib/utils';
import { Toggle } from '../Toggle';

export interface CeciSwitchRowProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Conteúdo extra abaixo da descrição (ex.: aviso de não concedido). */
  extra?: React.ReactNode;
  className?: string;
}

/**
 * Linha de preferência persistente — ícone + título + descrição + switch à
 * direita, com área inteira clicável.
 *
 * Substitui `ToggleRow` na camada Ceci com superfície/linha de separação mais
 * consistente. A aparência é de configuração de caderno, não de administração.
 */
export const CeciSwitchRow: React.FC<CeciSwitchRowProps> = ({
  label,
  description,
  icon,
  iconClassName,
  checked,
  onChange,
  disabled,
  loading,
  extra,
  className,
}) => (
  <div
    className={cn(
      'flex items-center gap-3 rounded-2xl bg-surface-input border border-transparent px-4 py-2.5 tap-interactive cursor-pointer transition-colors hover:bg-surface-muted focus-within:ring-2 focus-within:ring-ceci-brand/30 focus-within:outline-none',
      disabled && 'opacity-50 pointer-events-none',
      className,
    )}
  >
    {icon && (
      <span
        className={cn(
          'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
          iconClassName ?? 'bg-surface-muted text-ceci-secondary border border-ceci-border-default',
        )}
      >
        {icon}
      </span>
    )}
    <div className="flex-1 min-w-0">
      <h3 className="font-display font-bold text-sm text-ceci-primary">{label}</h3>
      {description && (
        <p className="text-[11px] text-ceci-secondary leading-tight mt-0.5">
          {description}
        </p>
      )}
      {extra}
    </div>
    <Toggle
      checked={checked}
      onChange={onChange}
      disabled={disabled || loading}
      loading={loading}
      label={label}
    />
  </div>
);
