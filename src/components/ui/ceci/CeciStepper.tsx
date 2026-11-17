import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CeciFieldShell } from './CeciFieldShell';

export interface CeciStepperProps {
  label?: string;
  htmlFor?: string;
  /** Valor atual (número). */
  value: number;
  onChange: (value: number) => void;
  /** Unidade exibida ao lado do valor (ex.: "páginas", "horas"). */
  unit?: string;
  /** Valor máximo. */
  max?: number;
  /** Valor mínimo. */
  min?: number;
  /** Passo de incremento/decremento. */
  step?: number;
  /** Valores de atalho rápido (ex.: [5, 10, 25]). */
  quickSteps?: number[];
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Quantidade discreta com −, valor central editável e +.
 *
 * O centro é editável (input numérico). Os botões são grandes (alvo ≥ 44px),
 * com ícones simples, estados disabled e labels acessíveis. A unidade aparece
 * no label ou ao lado do valor, nunca só em placeholder.
 *
 * Estrutura visual:
 *   páginas lidas
 *   [ − ]   42 / 120   [ + ]
 *   +5   +10   +25
 */
export const CeciStepper: React.FC<CeciStepperProps> = ({
  label,
  htmlFor,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  quickSteps = [5, 10, 25],
  description,
  error,
  required,
  optional,
  disabled = false,
  className,
}) => {
  const [draft, setDraft] = useState(String(value));
  const parsed = draft === '' ? null : Number(draft);
  const invalid = draft !== '' && (Number.isNaN(parsed) || parsed < 0);

  const clamped = (n: number): number => {
    let r = n;
    if (min !== undefined) r = Math.max(r, min);
    if (max !== undefined) r = Math.min(r, max);
    return r;
  };

  const decrement = () => {
    const cur = Number.isFinite(parsed) ? parsed : value;
    onChange(clamped(cur - step));
    setDraft(String(clamped(cur - step)));
  };

  const increment = () => {
    const cur = Number.isFinite(parsed) ? parsed : value;
    onChange(clamped(cur + step));
    setDraft(String(clamped(cur + step)));
  };

  const onDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9-]/g, '');
    setDraft(raw);
    if (raw === '') {
      onChange(value);
    }
  };

  const onDraftBlur = () => {
    if (draft === '') return;
    const n = clamped(Number(draft));
    if (!Number.isNaN(n)) onChange(n);
    setDraft(String(n));
  };

  const displayTotal = max !== undefined ? ` / ${max}` : '';
  const canDecrement = !disabled && Number.isFinite(parsed) && parsed > (min ?? 0);
  const canIncrement = !disabled && Number.isFinite(parsed) && parsed < (max ?? Number.MAX_SAFE_INTEGER);

  return (
    <div>
      <CeciFieldShell
        label={label}
        htmlFor={htmlFor}
        description={description}
        error={error || (invalid ? 'digite um número válido' : undefined)}
        required={required}
        optional={optional}
      >
        <div className={cn('space-y-3', className)}>
          <div className="p-3.5 rounded-2xl bg-surface-muted border border-ceci-border-default space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-ceci-tertiary lowercase">
                {unit ? `${label ?? 'quantidade'} (${unit})` : label ?? 'quantidade'}
              </span>
              <span className="text-xs font-bold text-ceci-brand-strong tabular-nums">
                {draft || value}{displayTotal}
              </span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={decrement}
                disabled={!canDecrement}
                aria-label="diminuir"
                className={cn(
                  'w-11 h-11 rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-primary font-bold flex items-center justify-center transition active:scale-90 tap-interactive cursor-pointer',
                  disabled || !canDecrement ? 'opacity-35 pointer-events-none' : '',
                )}
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="text"
                inputMode="numeric"
                value={draft}
                onChange={onDraftChange}
                onBlur={onDraftBlur}
                aria-label={label ?? 'digite o valor'}
                className={cn(
                  'w-20 text-center bg-surface-input border rounded-2xl py-2.5 font-display font-bold text-xl text-ceci-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 transition-shadow',
                  invalid ? 'border-status-danger' : 'border-ceci-border-default',
                )}
              />

              <button
                type="button"
                onClick={increment}
                disabled={!canIncrement}
                aria-label="aumentar"
                className={cn(
                  'w-11 h-11 rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-primary font-bold flex items-center justify-center transition active:scale-90 tap-interactive cursor-pointer',
                  disabled || !canIncrement ? 'opacity-35 pointer-events-none' : '',
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {quickSteps.length > 0 && (
              <div className="flex items-center justify-center gap-2">
                {quickSteps.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      const cur = Number.isFinite(parsed) ? parsed : value;
                      onChange(clamped(cur + n));
                      setDraft(String(clamped(cur + n)));
                    }}
                    disabled={
                      disabled ||
                      (max !== undefined && Number.isFinite(parsed) && parsed >= max)
                    }
                    aria-label={`adicionar ${n}${unit ?? ''}`}
                    className="px-3 py-1.5 rounded-full border border-ceci-border-default bg-surface-default text-ceci-secondary text-[11px] font-semibold hover:bg-surface-rose hover:text-ceci-brand-strong hover:border-ceci-border-brand transition-colors tap-interactive cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            )}

            {invalid && (
              <p className="text-[11px] text-status-danger-strong text-center">
                digite um número válido
              </p>
            )}
          </div>
        </div>
      </CeciFieldShell>
    </div>
  );
};
