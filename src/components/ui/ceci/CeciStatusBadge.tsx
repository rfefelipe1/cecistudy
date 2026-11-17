import React from 'react';
import { cn } from '@/lib/utils';

export type CeciStatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export interface CeciStatusBadgeProps {
  children: React.ReactNode;
  variant?: CeciStatusBadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const VARIANT_CLASSES: Record<CeciStatusBadgeVariant, string> = {
  success: 'bg-status-success-surface border-status-success-border text-status-success-strong',
  warning: 'bg-status-warning-surface border-status-warning-border text-status-warning-strong',
  danger: 'bg-status-danger-surface border-status-danger-border text-status-danger-strong',
  info: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong',
  neutral: 'border-ceci-border-default text-ceci-secondary bg-surface-default',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[9px]',
  md: 'px-2.5 py-1 text-[10px]',
} as const;

/**
 * Badge de status — estado informativo não interativo.
 *
 * Sem hover, sem aparência de botão, sem `×`. Apenas comunica um estado
 * (ex.: concluído, pendente, atrasado, arquivado). Não confundir com
 * `CeciTag` (removível) ou `CeciFilterChip` (filtro ativo).
 */
export const CeciStatusBadge: React.FC<CeciStatusBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border font-semibold uppercase tracking-wider',
      SIZES[size],
      VARIANT_CLASSES[variant],
      className,
    )}
  >
    {children}
  </span>
);
