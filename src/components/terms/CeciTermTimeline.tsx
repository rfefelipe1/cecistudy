import React from 'react';
import type { AcademicTerm } from '@/types';
import { CeciTermCard } from './CeciTermCard';
import { cn } from '@/lib/utils';

export interface CeciTermTimelineProps {
  terms: AcademicTerm[];
  totalSemesters: number;
  memoryCountByTerm: Record<string, number>;
  expandedId: string | undefined;
  onExpand: (termId: string) => void;
  onOpenArchive: (termId: string) => void;
  onOpenMemories: (termId: string) => void;
  onReopen: (termId: string) => void;
}

/**
 * Timeline vertical editorial do histórico.
 *
 * Uma coluna única (leitura mobile e consistência), linha fina em
 * `ceci-border-subtle` e um nó por semestre encerrado. O semestre mais recente
 * (primeiro da lista ordenada) ganha destaque no nó.
 */
export const CeciTermTimeline: React.FC<CeciTermTimelineProps> = ({
  terms,
  totalSemesters,
  memoryCountByTerm,
  expandedId,
  onExpand,
  onOpenArchive,
  onOpenMemories,
  onReopen,
}) => {
  if (terms.length === 0) return null;

  return (
    <div className="relative space-y-6">
      <div
        className="absolute left-[11px] top-3 bottom-[30px] w-[1px] bg-ceci-border-subtle"
        aria-hidden
      />
      {terms.map((term, index) => {
        const isRecent = index === 0;
        const memoryCount = memoryCountByTerm[term.id] ?? 0;
        return (
          <div key={term.id} className="relative pl-8">
            <div
              className={cn(
                'absolute left-[10px] top-3 z-10 flex h-3 w-3 items-center justify-center rounded-full border-2',
                isRecent
                  ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
                  : 'bg-surface-default border-ceci-border-default text-ceci-tertiary',
              )}
            >
              <span className="text-[10px] font-semibold">{term.ordinal}</span>
            </div>
            <CeciTermCard
              term={term}
              totalSemesters={totalSemesters}
              isRecent={isRecent}
              memoryCount={memoryCount}
              expanded={expandedId === term.id}
              onExpand={() => onExpand(term.id)}
              onOpenArchive={() => onOpenArchive(term.id)}
              onOpenMemories={() => onOpenMemories(term.id)}
              onReopen={() => onReopen(term.id)}
            />
          </div>
        );
      })}
    </div>
  );
};
