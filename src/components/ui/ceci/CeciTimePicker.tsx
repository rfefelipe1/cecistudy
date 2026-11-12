import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CeciFieldShell } from './CeciFieldShell';
import { TimePickerSheet } from '../time-picker-sheet';

export interface CeciTimePickerProps {
  label?: string;
  htmlFor?: string;
  /** Hora em HH:MM (24h). `null` = vazio. */
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  /** Rótulo do topo da sheet (quando abre seleção visual). */
  sheetTitle?: string;
  className?: string;
}

/**
 * Seletor de horário único em 24 horas.
 *
 * Abre uma sheet com wheel de escolha de hora (24h, sem AM/PM) ao tocar,
 * mantendo o wrapper visual padronizado (label, descrição, erro, foco, disabled).
 */
export const CeciTimePicker: React.FC<CeciTimePickerProps> = ({
  label,
  htmlFor,
  value,
  onChange,
  placeholder = '--:--',
  description,
  error,
  required,
  optional,
  disabled = false,
  sheetTitle,
  className,
}) => {
  const timeValue = value ?? '';

  return (
    <div>
      <CeciFieldShell
        label={label}
        htmlFor={htmlFor}
        description={description}
        error={error}
        required={required}
        optional={optional}
      >
        <div className={cn(
          'w-full border border-transparent rounded-2xl px-4 py-4 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand transition-colors',
          disabled && 'bg-surface-muted cursor-not-allowed',
          className,
        )}>
          <div className="flex items-center gap-2 min-w-0">
            {disabled ? (
              <span className="flex-1 text-sm text-ceci-faded placeholder-ceci-faded min-w-0">
                {timeValue || placeholder}
              </span>
            ) : (
              <TimePickerSheet
                value={timeValue}
                onChange={(v) => onChange(v)}
                placeholder={placeholder}
              />
            )}
          </div>
          {timeValue && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="limpar horário"
              disabled={disabled}
              className={cn(
                'w-7 h-7 rounded-xl flex items-center justify-center text-ceci-tertiary hover:text-status-danger-strong hover:bg-red-50 transition-colors tap-interactive cursor-pointer',
                disabled && 'opacity-50 pointer-events-none',
              )}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <span className="text-[10px] text-ceci-tertiary">24h</span>
        </div>
      </CeciFieldShell>
    </div>
  );
};
