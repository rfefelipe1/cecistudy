import React, { useMemo } from 'react';
import { Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseScheduleSlot } from '../../../types/entity';
import { CeciTimePicker } from './CeciTimePicker';

export interface CeciSchedulePickerProps {
  value: CourseScheduleSlot[];
  onChange: (slots: CourseScheduleSlot[]) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** Labels dos dias da semana, segunda a domingo (mesma convenção de Date.getDay). */
const WEEKDAY_LABELS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;

/**
 * Editor de dias + intervalos. Cada horário vira um card de rotina:
 *
 *   segunda, quarta
 *   08:00 — 10:00              [remover]
 *
 * Dias como chips com seleção clara; horários em linha de dois campos. O card
 * comunica o resumo final, não apenas uma coleção de inputs.
 */
export const CeciSchedulePicker: React.FC<CeciSchedulePickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  className,
}) => {
  const update = (next: CourseScheduleSlot[]) => onChange(next);

  const setDay = (idx: number, day: number) =>
    update(value.map((s, i) => (i === idx ? { ...s, day } : s)));
  const setStart = (idx: number, start: string) =>
    update(value.map((s, i) => (i === idx ? { ...s, start } : s)));
  const setEnd = (idx: number, end: string) =>
    update(value.map((s, i) => (i === idx ? { ...s, end: end || undefined } : s)));
  const remove = (idx: number) => update(value.filter((_, i) => i !== idx));
  const add = () =>
    update([...value, { day: 1, start: '08:00', end: '10:00' }]);

  const daysSummary = useMemo(() => {
    const days = [...new Set(value.map((s) => s.day))].sort((a, b) => a - b);
    return days.map((d) => WEEKDAY_LABELS[d]).join(', ');
  }, [value]);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}

      {value.map((slot, idx) => {
        const dayLabel = WEEKDAY_LABELS[slot.day];
        return (
          <div
            key={idx}
            className="rounded-2xl bg-surface-default border border-ceci-border-default p-3 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
                {dayLabel}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  aria-label="remover horário"
                  className="w-7 h-7 rounded-lg bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-brand-strong hover:bg-ceci-border-brand/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-1">
              {WEEKDAY_LABELS.map((lbl, day) => {
                const active = slot.day === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !disabled && setDay(idx, day)}
                    aria-pressed={active}
                    className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                      active
                        ? 'bg-ceci-primary text-ceci-on-primary border-ceci-primary'
                        : 'bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
                    } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[10px] font-semibold text-ceci-tertiary mb-1">
                  início
                </span>
                <CeciTimePicker
                  label=""
                  value={slot.start}
                  onChange={(v) => setStart(idx, v)}
                  disabled={disabled}
                />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-ceci-tertiary mb-1">
                  término
                </span>
                <CeciTimePicker
                  label=""
                  value={slot.end ?? null}
                  onChange={(v) => setEnd(idx, v)}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => !disabled && add()}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-surface-default border border-dashed border-ceci-border-strong text-ceci-secondary text-xs font-semibold hover:bg-surface-muted cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        <Clock className="w-4 h-4" /> adicionar horário
      </button>

      {value.length === 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-ceci-tertiary">
          <Clock className="w-3.5 h-3.5" /> toque em + para definir os dias e horários
        </p>
      )}
    </div>
  );
};
