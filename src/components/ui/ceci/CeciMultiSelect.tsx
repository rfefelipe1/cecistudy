import React, { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CeciFieldShell } from './CeciFieldShell';
import { Modal } from '../Modal';

export interface CeciMultiSelectOption {
  value: string;
  label: string;
  hint?: string;
}

export interface CeciMultiSelectProps {
  label?: string;
  htmlFor?: string;
  /** Valores selecionados. */
  value: string[];
  onChange: (value: string[]) => void;
  options: CeciMultiSelectOption[];
  placeholder?: string;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  sheetTitle?: string;
  /** Mensagem de empty state (quando não há opções). */
  emptyMessage?: string;
  className?: string;
}

/**
 * Seleção múltipla com chips de seleção atual, remoção e contagem.
 *
 * O trigger exibe os chips dos valores selecionados. Ao abrir a sheet, cada
 * opção tem checkbox e o rodapé mostra a contagem. Suporta busca para listas
 * longas e limpar tudo.
 *
 * Substitui `CatalogMultiSelect` e `PillGroupMulti` em consumidores que
 * precisam de seleção múltipla com busca.
 */
export const CeciMultiSelect: React.FC<CeciMultiSelectProps> = ({
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
  emptyMessage,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');

  const selectedOptions = options.filter((o) => value.includes(o.value));
  const filtered = useMemo(() => {
    if (!term.trim()) return options;
    const t = term.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(t) || o.hint?.toLowerCase().includes(t));
  }, [options, term]);

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const closeSheet = () => {
    setOpen(false);
    setTerm('');
  };

  const clearAll = () => {
    onChange([]);
    closeSheet();
  };

  const triggerContent = (
    <div className="flex flex-wrap gap-1.5 min-w-0">
      {selectedOptions.length > 0 ? (
        selectedOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-label={`remover ${o.label}`}
            onClick={() => toggle(o.value)}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand text-[10px] font-semibold tap-interactive cursor-pointer transition"
          >
            {o.label}
            <X className="w-3 h-3" />
          </button>
        ))
      ) : (
        <span className={cn('truncate', value.length ? 'text-ceci-primary' : 'text-ceci-faded')}>
          {value.length > 0 ? `${value.length} selecionado${value.length > 1 ? 's' : ''}` : placeholder}
        </span>
      )}
    </div>
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
            'w-full bg-surface-input border border-transparent rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand cursor-pointer transition-colors',
            className,
          )}
        >
          {triggerContent}
          <span className="text-[10px] text-ceci-tertiary">{selectedOptions.length > 0 ? `(${selectedOptions.length})` : ''}</span>
        </button>
      </CeciFieldShell>

      <Modal open={open} onClose={closeSheet} position="bottom" className="w-full max-w-md">
        <div className="bg-surface-default rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden text-ceci-primary">
          <div className="px-5 pt-4 pb-2 border-b border-ceci-border-subtle">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
              {sheetTitle ?? label ?? 'escolher'}
            </p>
          </div>

          <div className="px-5 pt-3 pb-1">
            <div className="relative">
              <Search className="w-4 h-4 text-ceci-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="buscar por nome..."
                aria-label={`buscar em ${sheetTitle ?? label ?? 'opções'}`}
                className="w-full bg-surface-input rounded-2xl pl-10 pr-8 py-3 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-ceci-brand/30"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm('')}
                  aria-label="limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ceci-tertiary hover:text-ceci-primary cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* chips selecionados no topo da sheet */}
          {selectedOptions.length > 0 && (
            <div className="px-5 pt-2 pb-1 flex flex-wrap gap-1.5">
              {selectedOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  aria-label={`remover ${o.label}`}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand text-[10px] font-semibold tap-interactive cursor-pointer transition"
                >
                  {o.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          <div className="max-h-[45vh] overflow-y-auto py-1">
            {term.trim() && filtered.length === 0 && (
              <p className="px-5 py-6 text-xs text-ceci-tertiary text-center">
                nada encontrado para “{term}” ♡
              </p>
            )}
            {!term.trim() && options.length === 0 && (
              <p className="px-5 py-6 text-xs text-ceci-tertiary text-center">
                {emptyMessage ?? 'ainda não há opções no cantinho.'}
              </p>
            )}
            <div role="listbox" aria-label={sheetTitle ?? label ?? 'escolher'} className="divide-y divide-ceci-border-subtle">
              {filtered.map((o) => {
                const sel = value.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="checkbox"
                    aria-checked={sel}
                    onClick={() => toggle(o.value)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-5 py-3.5 text-sm text-left cursor-pointer transition-colors',
                      sel
                        ? 'bg-surface-rose text-ceci-brand-strong font-semibold'
                        : 'text-ceci-primary hover:bg-surface-muted',
                    )}
                  >
                    <span className="min-w-0 flex flex-col">
                      <span className="line-clamp-1">{o.label}</span>
                      {o.hint && (
                        <span className="text-[10px] font-normal text-ceci-tertiary leading-snug">
                          {o.hint}
                        </span>
                      )}
                    </span>
                    {sel && <Check className="w-4 h-4 text-ceci-brand-strong shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 pb-5 pt-2 border-t border-ceci-border-subtle flex items-center justify-between">
            <span className="text-[11px] font-bold text-ceci-secondary">
              {value.length} selecionado{value.length === 1 ? '' : 's'}
            </span>
            {value.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-semibold text-ceci-tertiary hover:text-status-danger-strong transition-colors cursor-pointer"
              >
                limpar tudo
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
