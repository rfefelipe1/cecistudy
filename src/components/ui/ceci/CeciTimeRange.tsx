import React from 'react';
import { Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CeciFieldShell } from './CeciFieldShell';

export interface CeciTimeRangeProps {
  label?: string;
  htmlFor?: string;
  /** Início em HH:MM. `null` = vazio. */
  start: string | null;
  /** Término em HH:MM. `null` = vazio. */
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Seletor de intervalo: início e término em 24 horas.
 * Valida que início < término quando ambos preenchidos.
 */
export const CeciTimeRange: React.FC<CeciTimeRangeProps> = ({
  label,
  htmlFor,
  start,
  end,
  onChange,
  description,
  error,
  required,
  optional,
  disabled = false,
  className,
}) => {
  const startValue = start ?? '';
  const endValue = end ?? '';
  const invalid = startValue && endValue && startValue >= endValue;

  const onStartChange = (v: string) => onChange(v, endValue || null);
  const onEndChange = (v: string) => onChange(startValue || null, v);

  return (
    <div>
      <CeciFieldShell
        label={label}
        htmlFor={htmlFor}
        description={description}
        error={error || (invalid ? 'o início precisa ser antes do término' : undefined)}
        required={required}
        optional={optional}
      >
        <div className={cn('grid grid-cols-2 gap-3', className)}>
          <div className="bg-surface-input border border-transparent rounded-2xl px-4 py-3 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-3.5 h-3.5 text-ceci-tertiary shrink-0" />
              <input
                type="time"
                value={startValue}
                onChange={(e) => onStartChange(e.target.value)}
                placeholder="--:--"
                aria-label="início"
                disabled={disabled}
                readOnly
                className="flex-1 bg-transparent text-sm text-ceci-primary placeholder-ceci-faded outline-none min-w-0"
              />
            </div>
            <span className="text-[10px] text-ceci-tertiary">início</span>
          </div>
          <div className="bg-surface-input border border-transparent rounded-2xl px-4 py-3 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-3.5 h-3.5 text-ceci-tertiary shrink-0" />
              <input
                type="time"
                value={endValue}
                onChange={(e) => onEndChange(e.target.value)}
                placeholder="--:--"
                aria-label="término"
                disabled={disabled}
                readOnly
                className="flex-1 bg-transparent text-sm text-ceci-primary placeholder-ceci-faded outline-none min-w-0"
              />
            </div>
            <span className="text-[10px] text-ceci-tertiary">término</span>
          </div>
        </div>

        {startValue && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            aria-label="limpar intervalo"
            className="w-7 h-7 rounded-xl flex items-center justify-center text-ceci-tertiary hover:text-status-danger-strong hover:bg-red-50 transition-colors tap-interactive cursor-pointer mt-1"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </CeciFieldShell>
    </div>
  );
};
