import React, { cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';

export interface CeciFieldShellProps {
  label?: string;
  htmlFor?: string;
  description?: React.ReactNode;
  /** Mensagem de erro exibida inline, associada ao controle por aria-describedby. */
  error?: string;
  required?: boolean;
  optional?: boolean;
  /** Densidade/peso visual do campo no grupo. */
  importance?: 'primary' | 'secondary' | 'advanced';
  /** Controle de entrada (input, select, picker, etc.). */
  children: React.ReactNode;
}

/**
 * Shell de campo: rótulo + descrição + controle + erro.
 * Padroniza label, descrição, erro e aria-describedby em todos os inputs Ceci.
 * Substitui o padrão manual repetido em wizardFields.tsx, TagField, Picker, etc.
 */
export const CeciFieldShell: React.FC<CeciFieldShellProps> = ({
  label,
  htmlFor,
  description,
  error,
  required,
  optional,
  importance = 'primary',
  children,
}) => {
  const inputId = htmlFor;
  const errorId = inputId ? `${inputId}-error` : undefined;

  /** Injeta aria-invalid e aria-describedby no controle de entrada único. */
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, error
      ? { 'aria-invalid': true, 'aria-describedby': errorId }
      : {})
    : children;

  return (
    <div className={cn('space-y-1', importance === 'advanced' && 'text-ceci-secondary')}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-[10px] text-status-danger-strong" aria-hidden>
              obrigatório
            </span>
          )}
          {optional && !required && (
            <span className="ml-0.5 text-[10px] text-ceci-faded">opcional</span>
          )}
        </label>
      )}
      {description && (
        <p
          id={errorId ? `${errorId}-desc` : undefined}
          className="text-[11px] text-ceci-secondary leading-relaxed"
        >
          {description}
        </p>
      )}
      {control}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] font-medium text-status-danger-strong mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
