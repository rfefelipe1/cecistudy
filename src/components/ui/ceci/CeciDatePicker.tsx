import React, { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CeciFieldShell } from './CeciFieldShell';
import { Modal } from '../Modal';
import { addDays, todayKey } from '../../../../packages/domain/src/core/domain/common';

export interface CeciDatePickerProps {
  label?: string;
  htmlFor?: string;
  /** Data civil em ISO `YYYY-MM-DD`. `null` = vazio. */
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  /** Data mínima selecionável (inclusive), ISO `YYYY-MM-DD`. */
  minDate?: string;
  /** Data máxima selecionável (inclusive), ISO `YYYY-MM-DD`. */
  maxDate?: string;
  /** Datas desabilitadas (não selecionáveis), ISO `YYYY-MM-DD`[]. */
  disabledDates?: string[];
  /** Rótulo do topo da sheet. */
  sheetTitle?: string;
  /** Oferece "sem data" para limpar. */
  clearable?: boolean;
  className?: string;
}

/** Dias da semana, segunda a domingo (abertura da semana civil). */
const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'] as const;

/** Nomes dos meses em pt-BR. */
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

/** Nome do dia da semana em pt-BR (0=domingo … 6=sábado). */
const DAY_NAMES = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;

/** '2026-10-29' → 'quarta, 29 de outubro'. */
export const formatDateFriendly = (key: string): string => {
  const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!p) return key;
  const d = new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3]));
  const dia = DAY_NAMES[d.getDay()];
  const num = Number(p[3]);
  const mes = MONTHS[Number(p[2]) - 1];
  return `${dia}, ${num} de ${mes}`;
};

interface MonthCell {
  date: string;
  day: number;
  isToday: boolean;
  inMonth: boolean;
}

/** Gera as células do calendário mensal para `year-month` (YYYY-MM). */
const monthDays = (yearMonth: string): MonthCell[] => {
  const [y, m] = yearMonth.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const startOffset = (first.getDay() + 6) % 7; // segunda=0
  const today = todayKey();

  const cells: MonthCell[] = [];
  // dias do mês anterior (preenchimento)
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = addDays(`${y}-${String(m - 1).padStart(2, '0')}-01`, -i);
    cells.push({ date: d, day: Number(d.slice(8)), isToday: d === today, inMonth: false });
  }
  // dias do mês corrente
  for (let d = 1; d <= last.getDate(); d++) {
    const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date: key, day: d, isToday: key === today, inMonth: true });
  }
  // dias do mês seguinte (preenchimento)
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = addDays(`${y}-${String(m).padStart(2, '0')}-${last.getDate()}`, i);
    cells.push({ date: d, day: Number(d.slice(8)), isToday: d === today, inMonth: false });
  }
  return cells;
};

/**
 * Date picker de data civil (YYYY-MM-DD).
 *
 * - Nunca converte para `Date` local para exibir/armazenar: a string ISO é
 *   quebrada em partes, não convertida (evita deslocamento de dia por fuso).
 * - Abre uma bottom sheet com calendário mensal, navegação mês a mês, hoje
 *   marcado, seleção destacada e datas desabilitadas atenuadas.
 * - Suporta minDate/maxDate/disabledDates e ação de limpar.
 */
export const CeciDatePicker: React.FC<CeciDatePickerProps> = ({
  label,
  htmlFor,
  value,
  onChange,
  placeholder = 'escolher uma data',
  description,
  error,
  required,
  optional,
  minDate,
  maxDate,
  disabledDates = [],
  sheetTitle,
  clearable = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [viewYearMonth, setViewYearMonth] = useState<string | null>(null);

  const selected = value ?? null;
  const today = todayKey();

  const view = useMemo(() => {
    if (viewYearMonth) return viewYearMonth;
    if (selected) return selected.slice(0, 7);
    return today.slice(0, 7);
  }, [viewYearMonth, selected, today]);

  const [y, m] = view.split('-').map(Number);
  const days = monthDays(view);
  const monthLabel = `${MONTHS[Number(m) - 1]} de ${y}`;

  const isDisabled = (d: string): boolean => {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    if (disabledDates.includes(d)) return true;
    return false;
  };

  const isSelected = (d: string): boolean => d === selected;

  const selectDay = (d: string) => {
    onChange(d);
    setOpen(false);
  };

  const prevMonth = () => {
    const prev = addDays(`${y}-${String(m).padStart(2, '0')}-01`, -1);
    setViewYearMonth(prev.slice(0, 7));
  };
  const nextMonth = () => {
    const next = addDays(`${y}-${String(m).padStart(2, '0')}-28`, 28);
    setViewYearMonth(next.slice(0, 7));
  };

  const clearDate = () => {
    onChange('');
    setOpen(false);
  };

  const closeSheet = () => setOpen(false);

  const triggerContent = selected
    ? <span className="text-ceci-primary">{formatDateFriendly(selected)}</span>
    : <span className="text-ceci-faded">{placeholder}</span>;

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
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={label ?? placeholder ?? 'selecionar data'}
          className={cn(
            'w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand cursor-pointer transition-colors',
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-ceci-tertiary shrink-0" />
            <span className="truncate">{triggerContent}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-ceci-tertiary shrink-0 transition-transform" style={{ transform: open ? 'rotate(90deg)' : undefined }} />
        </button>
      </CeciFieldShell>

      <Modal open={open} onClose={closeSheet} position="bottom" className="w-full max-w-md">
        <div className="bg-surface-default rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden text-ceci-primary">
          <div className="px-5 pt-4 pb-2 border-b border-ceci-border-subtle">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
              {sheetTitle ?? label ?? 'escolher data'}
            </p>
          </div>

          {/* cabeçalho do mês com navegação */}
          <div className="px-5 pt-3 pb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="mês anterior"
              className="w-8 h-8 rounded-2xl flex items-center justify-center text-ceci-tertiary hover:bg-surface-muted hover:text-ceci-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-display font-bold text-ceci-primary">{monthLabel}</h3>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="próximo mês"
              className="w-8 h-8 rounded-2xl flex items-center justify-center text-ceci-tertiary hover:bg-surface-muted hover:text-ceci-primary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* dias da semana */}
          <div className="px-5 pb-1">
            <div className="flex">
              {WEEKDAYS.map((w) => (
                <span
                  key={w}
                  className="w-[calc(100%/7)] text-[10px] font-semibold text-ceci-tertiary uppercase text-center tracking-wider"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>

          {/* grid de dias */}
          <div className="px-5 pb-4">
            <div className="grid grid-cols-7">
              {days.map((cell) => {
                const disabled = isDisabled(cell.date);
                const sel = isSelected(cell.date);
                return (
                  <button
                    key={cell.date}
                    type="button"
                    role="option"
                    aria-selected={sel}
                    aria-disabled={disabled}
                    disabled={disabled}
                    onClick={() => !disabled && selectDay(cell.date)}
                    className={cn(
                      'w-[calc(100%/7)] h-10 rounded-xl flex items-center justify-center text-[11px] transition-colors tap-interactive cursor-pointer',
                      !cell.inMonth && 'text-ceci-faded',
                      cell.isToday && !sel && 'border border-ceci-border-brand',
                      sel && 'bg-ceci-brand-strong text-ceci-on-brand',
                      disabled && 'text-ceci-muted',
                      !disabled && !sel && !cell.isToday && 'hover:bg-surface-muted',
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* atalhos rápidos */}
          <div className="px-5 pt-3 pb-1 flex gap-1.5">
            <button
              type="button"
              onClick={() => { selectDay(today); }}
              disabled={isDisabled(today)}
              className="flex-1 min-h-[36px] rounded-xl border border-ceci-border-default bg-surface-default text-[11px] font-semibold text-ceci-secondary hover:bg-surface-rose hover:text-ceci-brand-strong transition-colors tap-interactive cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
            >
              hoje
            </button>
            {clearable && (
              <button
                type="button"
                onClick={clearDate}
                className="flex-1 min-h-[36px] rounded-xl border border-ceci-border-default bg-surface-default text-[11px] font-semibold text-status-danger-strong hover:bg-red-50 transition-colors tap-interactive cursor-pointer"
              >
                sem data
              </button>
            )}
          </div>

          {/* rodapé: concluir */}
          <div className="px-5 pb-4 pt-2 border-t border-ceci-border-subtle">
            <button
              type="button"
              onClick={closeSheet}
              className="w-full min-h-[44px] rounded-2xl bg-ceci-brand-strong text-ceci-on-brand text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> concluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
