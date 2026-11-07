import React from 'react';
import { cn } from '@/lib/utils';
import { CeciFieldShell } from './CeciFieldShell';

export interface CeciNumberFieldProps {
  label?: string;
  htmlFor?: string;
  /** Valor numérico. `undefined` = vazio. */
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  /** Unidade exibida ao lado do campo (ex.: "horas", "páginas"). */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Número direto com unidade, erro e limites.
 *
 * Sempre exibe o valor numérico (não depende só de placeholder). Comunica
 * unidade, min/max, passo, estado vazio e valor atual. Para contagens exatas,
 * prefira o `CeciStepper`; este é para entrada numérica direta com validação.
 */
export const CeciNumberField: React.FC<CeciNumberFieldProps> = ({
  label,
  htmlFor,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  placeholder,
  description,
  error,
  required,
  optional,
  disabled = false,
  className,
}) => {
  const display = value === undefined || Number.isNaN(value) ? '' : String(value);
  const invalid = display !== '' && (Number.isNaN(Number(display)) || (min !== undefined && Number(display) < min) || (max !== undefined && Number(display) > max));
  const outOfRange = display !== '' && !invalid && ((min !== undefined && Number(display) < min) || (max !== undefined && Number(display) > max));

  const onChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(undefined);
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange(n);
  };

  return (
    <div>
      <CeciFieldShell
        label={label}
        htmlFor={htmlFor}
        description={description}
        error={error || (outOfRange ? `valor fora do intervalo ${min ?? ''}–${max ?? ''}` : invalid ? 'digite um número válido' : undefined)}
        required={required}
        optional={optional}
      >
        <div className={cn('flex items-center gap-3', className)}>
          <input
            type="number"
            inputMode="decimal"
            value={display}
            onChange={onChangeValue}
            placeholder={placeholder}
            aria-label={label ?? 'digite o número'}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={cn(
              'flex-1 bg-surface-input border rounded-2xl px-4 py-4 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 transition-shadow',
              invalid || outOfRange ? 'border-status-danger' : 'border-transparent',
              disabled && 'bg-surface-muted cursor-not-allowed',
            )}
          />
          {unit && (
            <span className="text-sm text-ceci-tertiary shrink-0 whitespace-nowrap">{unit}</span>
          )}
        </div>
      </CeciFieldShell>
    </div>
  );
};
