import React from 'react';
import { AlertTriangle, BookOpen, Lightbulb, Sparkles } from 'lucide-react';
import { MEMORY_CATEGORY_META, type MemoryCategory, type SemesterMemory } from '../../lib/semesterMemory';
import { cn } from '@/lib/utils';

export type CategoryFilter = MemoryCategory | 'todas';

const ICON_BY_CATEGORY: Record<MemoryCategory, React.ElementType> = {
  feliz: Sparkles,
  engracada: Lightbulb,
  assustadora: AlertTriangle,
  memoravel: BookOpen,
};

export interface CeciMemoryCategorySummaryProps {
  memories: SemesterMemory[];
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
}

/**
 * Contagens de memórias e filtro local por categoria.
 *
 * Não altera a navegação; só re-renderiza a lista com o filtro escolhido.
 */
export const CeciMemoryCategorySummary: React.FC<CeciMemoryCategorySummaryProps> = ({
  memories,
  activeCategory,
  onCategoryChange,
}) => {
  const total = memories.length;
  const byCategory: Record<MemoryCategory, number> = {
    feliz: 0,
    engracada: 0,
    assustadora: 0,
    memoravel: 0,
  };
  for (const m of memories) {
    byCategory[m.category] += 1;
  }

  const maisUsada =
    total > 0
      ? Object.entries(byCategory).reduce<[string, number] | null>(
          (acc, [cat, n]) => (n > (acc?.[1] ?? 0) ? [cat, n] : acc),
          null,
        )?.[0]
      : null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ceci-secondary">
          {total} memórias no semestre
        </span>
        {maisUsada && total > 0 && (
          <span className="text-xs text-ceci-tertiary">
            {maisUsada.charAt(0).toUpperCase() + maisUsada.slice(1)} é a mais presente
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onCategoryChange('todas')}
          aria-pressed={activeCategory === 'todas'}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-semibold transition',
            activeCategory === 'todas'
              ? 'border-ceci-border-brand bg-surface-rose text-ceci-brand-strong'
              : 'border-ceci-border-default bg-surface-default text-ceci-secondary hover:bg-surface-muted',
          )}
        >
          todas
        </button>
        {(['feliz', 'engracada', 'assustadora', 'memoravel'] as const).map((cat) => {
          const Icon = ICON_BY_CATEGORY[cat];
          const meta = MEMORY_CATEGORY_META[cat];
          const n = byCategory[cat];
          const sel = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              aria-pressed={sel}
              disabled={n === 0 && !sel}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition',
                sel
                  ? 'border-ceci-border-brand bg-surface-rose text-ceci-brand-strong'
                  : n === 0
                    ? 'border-ceci-border-subtle bg-surface-muted text-ceci-tertiary'
                    : 'border-ceci-border-default bg-surface-default text-ceci-secondary hover:bg-surface-muted',
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
              {meta.label} ({n})
            </button>
          );
        })}
      </div>
    </section>
  );
};
