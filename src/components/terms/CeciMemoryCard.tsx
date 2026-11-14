import React from 'react';
import { AlertTriangle, BookOpen, Lightbulb, Sparkles, Trash2 } from 'lucide-react';
import { formatDateBR } from '@/core/domain';
import { MEMORY_CATEGORY_META, type MemoryCategory, type SemesterMemory } from '../../lib/semesterMemory';
import { cn } from '@/lib/utils';

export interface CeciMemoryCardProps {
  memory: SemesterMemory;
  onEdit: (memoria: SemesterMemory) => void;
  onDelete: (memoria: SemesterMemory) => void;
}

const CATEGORY_VISUAL: Record<MemoryCategory, { label: string; icon: React.ElementType }> = {
  feliz: { label: 'feliz', icon: Sparkles },
  engracada: { label: 'engraçada', icon: Lightbulb },
  assustadora: { label: 'assustadora', icon: AlertTriangle },
  memoravel: { label: 'memorável', icon: BookOpen },
};

const CATEGORY_CLASSES: Record<MemoryCategory, string> = {
  feliz: 'border-ceci-border-brand bg-surface-rose text-ceci-brand-strong',
  engracada: 'border-ceci-border-default bg-surface-blue text-ceci-academic-strong',
  assustadora: 'border-ceci-border-default bg-status-danger-soft text-status-danger-strong',
  memoravel: 'border-ceci-border-default bg-surface-muted text-ceci-tertiary',
};

/**
 * Uma memória de maneira editorial e acessível.
 *
 * Nunca é um botão cego: editar e excluir são botões visíveis e nomeados.
 */
export const CeciMemoryCard: React.FC<CeciMemoryCardProps> = ({ memory, onEdit, onDelete }) => {
  const visual = CATEGORY_VISUAL[memory.category];

  return (
    <div className="rounded-[22px] border border-ceci-border-default bg-surface-default p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
            CATEGORY_CLASSES[memory.category],
          )}
        >
          <visual.icon className="w-3 h-3" aria-hidden />
          {visual.label}
        </span>
        {memory.memoryDate ? (
          <span className="text-xs text-ceci-tertiary">{formatDateBR(memory.memoryDate)}</span>
        ) : null}
      </div>
      <h3 className="font-display font-bold text-ceci-primary leading-snug line-clamp-2">
        {memory.title}
      </h3>
      {memory.description && (
        <p className="mt-1.5 text-sm text-ceci-secondary line-clamp-3">
          {memory.description}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(memory);
          }}
          className="rounded-full border border-ceci-border-default bg-surface-default px-3 py-1.5 text-xs text-ceci-brand-strong hover:bg-surface-rose cursor-pointer"
          aria-label="editar memória"
        >
          editar
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(memory);
          }}
          className="rounded-full border border-ceci-border-default bg-surface-default px-3 py-1.5 text-xs text-status-danger hover:bg-surface-rose cursor-pointer"
          aria-label="excluir memória"
        >
          <Trash2 className="w-3 h-3" aria-hidden />
        </button>
      </div>
    </div>
  );
};
