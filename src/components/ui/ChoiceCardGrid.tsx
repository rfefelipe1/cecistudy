import React from 'react';
import { cn, NoInfer } from '@/lib/utils';

export interface ChoiceCardOption<T extends string> {
  value: T;
  label: string;
  emoji?: string;
  caption?: string;
}

<<<<<<< HEAD
=======
export type ChoiceCardVariant = 'default' | 'compact' | 'narrative';

>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
interface ChoiceCardGridProps<T extends string> {
  label?: string;
  options: ChoiceCardOption<NoInfer<T>>[];
  /** Valor selecionado (escolha única). */
  value: T;
  onChange: (value: T) => void;
<<<<<<< HEAD
  columns?: 1 | 2;
  className?: string;
}

/**
 * Cards de escolha única (ícone + rótulo + legenda opcional) em grid de 1 ou 2 colunas.
 * Selecionado = borda da marca + fundo rosado (padrão dos wizards).
=======
  /** Força 1 ou 2 colunas independentemente da variante (compatibilidade com consumidores antigos). */
  columns?: 1 | 2;
  /** Variante visual: padrão, compacto (1 coluna, menos altura) ou narrativo (descrição com mais respiro). */
  variant?: ChoiceCardVariant;
  className?: string;
}

const VARIANT_COLS: Record<ChoiceCardVariant, 1 | 2> = {
  default: 2,
  compact: 1,
  narrative: 1,
};

/** Altura mínima do card por variante — descrição não estoura o layout. */
const VARIANT_MIN_H: Record<ChoiceCardVariant, string> = {
  default: 'min-h-[52px]',
  compact: 'min-h-[44px]',
  narrative: 'min-h-[64px]',
};

/** Padding interno por variante. */
const VARIANT_PADDING: Record<ChoiceCardVariant, string> = {
  default: 'px-3.5 py-3.5',
  compact: 'px-3 py-2.5',
  narrative: 'px-4 py-4',
};

/**
 * Cards de escolha única (ícone + rótulo + legenda opcional).
 * Selecionado = borda da marca + fundo rosado + sombra (três pistas visuais, nunca só a cor).
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
 */
export const ChoiceCardGrid = <T extends string>({
  label,
  options,
  value,
  onChange,
<<<<<<< HEAD
  columns = 2,
  className,
}: ChoiceCardGridProps<T>) => {
  return (
    <div>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className={cn('grid gap-2.5', columns === 1 ? 'grid-cols-1' : 'grid-cols-2', className)}>
=======
  columns,
  variant = 'default',
  className,
}: ChoiceCardGridProps<T>) => {
  const cols = columns ?? VARIANT_COLS[variant];
  const minH = VARIANT_MIN_H[variant];
  const padding = VARIANT_PADDING[variant];
  return (
    <div>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5">
          {label}
        </span>
      )}
      <div
        className={cn(
          'grid gap-2.5',
          cols === 1 ? 'grid-cols-1' : 'grid-cols-2',
          className,
        )}
      >
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
        {options.map((o) => {
          const sel = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={sel}
              className={cn(
                'border-2 rounded-[16px] text-left transition active:scale-[0.98] cursor-pointer',
<<<<<<< HEAD
                columns === 1 ? 'w-full px-4 py-3.5' : 'px-3.5 py-3.5',
=======
                padding,
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
                sel
                  ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong shadow-2xs'
                  : 'bg-surface-default border-ceci-border-subtle text-ceci-primary hover:bg-surface-muted',
              )}
            >
              {o.caption ? (
<<<<<<< HEAD
                <span className="flex flex-col gap-0.5 min-h-[52px] justify-center">
=======
                <span className={`flex flex-col gap-0.5 justify-center ${minH}`}>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
                  <span className="flex items-center gap-2">
                    {o.emoji && <span className="text-lg leading-none shrink-0">{o.emoji}</span>}
                    <span className="text-xs font-semibold leading-snug">{o.label}</span>
                  </span>
                  {o.caption && (
                    <span className="text-[11px] text-ceci-tertiary leading-snug font-normal">
                      {o.caption}
                    </span>
                  )}
                </span>
              ) : (
<<<<<<< HEAD
                <span className="flex items-center gap-2.5 min-h-[52px]">
=======
                <span className={`flex items-center gap-2.5 ${minH}`}>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
                  {o.emoji && <span className="text-lg leading-none shrink-0">{o.emoji}</span>}
                  <span className="text-xs font-semibold leading-snug">{o.label}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
