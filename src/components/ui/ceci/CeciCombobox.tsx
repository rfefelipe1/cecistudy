import React, { useMemo, useState } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CeciFieldShell } from './CeciFieldShell';
import { CeciPickerSheet } from './CeciPickerSheet';

export interface CeciComboboxOption {
  value: string;
  label: string;
  hint?: string;
}

export interface CeciComboboxProps {
  label?: string;
  htmlFor?: string;
  value: string | null;
  onChange: (value: string) => void;
  options: CeciComboboxOption[];
  placeholder?: string;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  sheetTitle?: string;
  clearable?: boolean;
  /** Rótulo do CTA de criação contextual. */
  createLabel?: string;
  /** Ação de criação contextual. Recebe o termo digitado. */
  onCreate?: (term: string) => void;
  /** Mensagem de empty state. */
  emptyMessage?: string;
  className?: string;
}

/**
 * Combobox: lista grande com busca, seleção única e criação contextual.
 * Abre uma bottom sheet com busca sempre visível. Quando o usuário digita um
 * termo que não corresponde a nenhuma opção e `onCreate` está definido, pode
 * criar a opção no momento.
 *
 * Substitui `<select>` nativo em listas longas e `Picker` em consumidores que
 * precisam de busca e criação contextual.
 */
export const CeciCombobox: React.FC<CeciComboboxProps> = ({
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
  clearable = false,
  createLabel,
  onCreate,
  emptyMessage,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const selected = options.find((o) => o.value === value);
  const showCreate = Boolean(onCreate && term.trim() && !options.find((o) => o.label.toLowerCase() === term.trim().toLowerCase()));

  const closeSheet = () => {
    setOpen(false);
    setTerm('');
  };

  const optionsForSheet = useMemo(() => {
    if (!term.trim()) return options;
    const t = term.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(t) || o.hint?.toLowerCase().includes(t));
  }, [options, term]);

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
          onClick={() => {
            setTerm('');
            setOpen(true);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          {...(label ? { 'aria-label': label } : {})}
          className={cn(
            'w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand cursor-pointer transition-colors',
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('truncate text-left min-w-0 flex flex-col leading-tight', selected ? 'text-ceci-primary' : 'text-ceci-faded')}>
              {selected ? selected.label : placeholder}
            </span>
            {selected?.hint && (
              <span className="text-[10px] text-ceci-tertiary leading-tight">{selected.hint}</span>
            )}
          </div>
          <ChevronDown
            className="w-4 h-4 text-ceci-tertiary shrink-0 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : undefined }}
          />
        </button>
      </CeciFieldShell>

      <CeciPickerSheet
        open={open}
        onClose={closeSheet}
        title={sheetTitle ?? label ?? 'escolher'}
        options={optionsForSheet}
        value={value ?? ''}
        onChange={onChange}
        clearable={clearable}
        searchThreshold={0} // busca sempre visível no combobox
        createLabel={showCreate ? `criar “${term}”` : createLabel}
        onCreate={() => {
          if (showCreate && onCreate) {
            onCreate(term.trim());
            closeSheet();
          } else if (onCreate) {
            closeSheet();
            onCreate(term.trim());
          }
        }}
        emptyMessage={emptyMessage ?? (term.trim() ? `nada encontrado para “${term}”` : 'ainda não há opções no cantinho.')}
      />
    </div>
  );
};
