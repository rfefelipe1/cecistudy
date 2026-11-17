import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CeciFieldShell } from './CeciFieldShell';
import { CeciPickerSheet } from './CeciPickerSheet';

export interface CeciSelectOption {
  value: string;
  label: string;
  /** Contexto secundário exibido sob o label (ex.: código da matéria). */
  hint?: string;
}

export interface CeciSelectProps {
  label?: string;
  htmlFor?: string;
  /** Valor selecionado (vazio/nulo = sem seleção). */
  value: string | null;
  onChange: (value: string) => void;
  options: CeciSelectOption[];
  placeholder?: string;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  /** Rótulo exibido no topo da sheet. */
  sheetTitle?: string;
  /** Força sheet mesmo com poucas opções (default: abre sheet sempre). */
  useSheet?: boolean;
  /** Oferece "limpar seleção" dentro da sheet. */
  clearable?: boolean;
  /** Rótulo do CTA de criação contextual (aparece no empty state e rodapé). */
  createLabel?: string;
  /** Ação de criação contextual. */
  onCreate?: () => void;
  /** Mensagem de empty state. */
  emptyMessage?: string;
  className?: string;
}

/** Tipo das opções de select (reexportado para consumidores). */
/**
 * Select de opções curtas (até ~8), sem busca.
 * Abre uma bottom sheet com a lista. Quando `useSheet={false}` mostra pills
 * inline (escolha única).
 *
 * Compatível com `<select>` nativo: value/onChange de string, sem busca, sem
 * multi-select. Pode substituir Picker em consumidores existentes.
 */
export const CeciSelect: React.FC<CeciSelectProps> = ({
  label,
  htmlFor,
  value,
  onChange,
  options,
  placeholder = 'escolher...',
  description,
  error,
  required,
  optional,
  sheetTitle,
  useSheet = true,
  clearable = false,
  createLabel,
  onCreate,
  emptyMessage,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const closeSheet = () => setOpen(false);

  if (!useSheet) {
    return (
      <CeciFieldShell
        label={label}
        htmlFor={htmlFor}
        description={description}
        error={error}
        required={required}
        optional={optional}
      >
        <div className={cn('flex flex-wrap gap-1.5', className)}>
          {options.map((o) => {
            const sel = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={sel}
                aria-label={o.label}
                onClick={() => onChange(o.value)}
                className={cn(
                  'rounded-full font-semibold capitalize whitespace-nowrap tap-interactive cursor-pointer transition',
                  'px-3 py-1.5 text-xs',
                  sel
                    ? 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand'
                    : 'bg-surface-default text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted',
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </CeciFieldShell>
    );
  }

  const triggerContent = (
    <span className="truncate text-left min-w-0 flex flex-col leading-tight">
      {selected ? selected.label : placeholder}
    </span>
  );

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
          aria-haspopup="listbox"
          aria-expanded={open}
          {...(label ? { 'aria-label': label } : {})}
          className={cn(
            'w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand cursor-pointer transition-colors',
            className,
          )}
        >
          {triggerContent}
          <ChevronDown
            className="w-4 h-4 text-ceci-tertiary shrink-0 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : undefined }}
          />
        </button>
      </CeciFieldShell>

      {selected?.hint && (
        <p className="text-[11px] text-ceci-tertiary leading-relaxed">{selected.hint}</p>
      )}

      <CeciPickerSheet
        open={open}
        onClose={closeSheet}
        title={sheetTitle ?? label ?? 'escolher'}
        options={options}
        value={value ?? ''}
        onChange={onChange}
        clearable={clearable}
        createLabel={createLabel}
        onCreate={onCreate}
        emptyMessage={emptyMessage}
      />
    </div>
  );
};
