import React from 'react';
import { cn } from '@/lib/utils';
import { CeciFieldShell } from './CeciFieldShell';

export interface CeciRangeFieldProps {
  label?: string;
  htmlFor?: string;
  /** Valor contínuo (ex.: horas de carga, nível de progresso). `undefined` = vazio. */
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  /** Unidade exibida ao lado do valor (ex.: "h", "%"). */
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
 * Slider com valor numérico sempre visível e editável.
 *
 * Para valores contínuos ou intervalos (duração aproximada, carga horária,
 * nível de progresso). O número permanece visível quando o slider é usado —
 * nunca fica escondido. Para contagens exatas, prefira o `CeciStepper`.
 */
export const CeciRangeField: React.FC<CeciRangeFieldProps> = ({
  label,
  htmlFor,
  value,
  onChange,
  unit,
  min = 1,
  max = 360,
  step = 1,
  placeholder,
  description,
  error,
  required,
  optional,
  disabled = false,
  className,
}) => {
  const isEmpty = value === undefined || Number.isNaN(value);
  const display = isEmpty ? '' : String(value);
  const sliderValue = isEmpty ? min : Math.min(Math.max(value, min), max);
  const invalid = display !== '' && Number.isNaN(Number(display));
  const outOfRange =
    display !== '' && !invalid && (Number(display) < min || Number(display) > max);

  const onSliderChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(ev.target.value));
  };

  const onInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const raw = ev.target.value;
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
        error={error || (outOfRange ? `valor fora do intervalo ${min}–${max}` : invalid ? 'digite um número válido' : undefined)}
        required={required}
        optional={optional}
      >
        <div className={cn('flex flex-col gap-2', className)}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              role="slider"
              aria-label={label ?? 'valor'}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={sliderValue}
              min={min}
              max={max}
              step={step}
              value={sliderValue}
              onChange={onSliderChange}
              disabled={disabled}
              className="flex-1 accent-ceci-brand cursor-pointer"
            />
            <input
              type="number"
              inputMode="decimal"
              value={display}
              onChange={onInputChange}
              placeholder={placeholder ?? '0'}
              aria-label={`${label ?? 'valor'} ${unit ?? ''}`}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              className="w-16 rounded-xl border border-ceci-border-default bg-surface-muted px-2 py-2 text-center text-sm font-semibold text-ceci-primary tabular-nums focus:border-ceci-border-brand focus:outline-none"
            />
            {unit && (
              <span className="text-sm text-ceci-tertiary shrink-0 whitespace-nowrap">
                {unit}
              </span>
            )}
          </div>
        </div>
      </CeciFieldShell>
    </div>
  );
};
