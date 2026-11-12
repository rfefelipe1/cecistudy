import React, { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { degreeProgress } from '@/lib/termScope';
import { formatDateBR, type AcademicTerm } from '@/core/domain';
import { cn } from '@/lib/utils';

export interface CeciTermCardProps {
  term: AcademicTerm;
  totalSemesters: number;
  memoryCount: number;
  isRecent?: boolean;
  expanded: boolean;
  onExpand: () => void;
  onOpenArchive: () => void;
  onOpenMemories: () => void;
  onReopen?: () => void;
}

/**
 * Resumo navegável de um semestre encerrado.
 *
 * As ações são intencionais e nunca competem:
 * - o card inteiro abre o arquivo do semestre (`onOpenArchive`);
 * - "ver o resumo inteiro" expande localmente (`onExpand`);
 * - "abrir memórias" é um CTA explícito (`onOpenMemories`);
 * - "reabrir como semestre atual" fica numa área de ação separada, de maior
 *   impacto (`onReopen`).
 */
export const CeciTermCard: React.FC<CeciTermCardProps> = ({
  term,
  totalSemesters,
  memoryCount,
  isRecent = false,
  expanded,
  onExpand,
  onOpenArchive,
  onOpenMemories,
  onReopen,
}) => {
  const s = term.summary;
  const [confirmingReopen, setConfirmingReopen] = useState(false);
  const progress = degreeProgress(term.ordinal, totalSemesters);

  const metrics = s
    ? [
        { label: 'aulas', value: String(s.classNotes) },
        { label: 'foco', value: `${Math.round(s.focusMinutes / 60)}h` },
        { label: 'leitura', value: String(s.pagesRead) },
      ]
    : null;

  return (
    <div
      className={cn(
        'rounded-[24px] border p-4',
        'border-ceci-border-default bg-surface-default shadow-xs',
        isRecent ? 'border-ceci-border-soft shadow-brand-xs' : '',
        'transition-colors',
      )}
      onClick={onOpenArchive}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenArchive();
        }
      }}
      aria-label={`arquivo do ${term.label}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ceci-primary">{term.label}</p>
          <p className="text-xs text-ceci-secondary">
            encerrado em {formatDateBR(term.endedAt ?? term.startedAt)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-ceci-border-default px-2.5 py-0.5 text-[10px] font-semibold text-ceci-tertiary"
            >
              <Sparkles className="w-3 h-3" aria-hidden />
              {memoryCount} memórias
            </span>
            <span className="text-xs font-semibold text-ceci-tertiary">
              {progress}% do curso
            </span>
          </div>
        </div>
      </div>

      {metrics && (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl bg-surface-muted px-2 py-2">
              <dt className="text-[10px] uppercase tracking-wider text-ceci-tertiary">
                {m.label}
              </dt>
              <dd className="text-sm font-semibold text-ceci-primary">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-3 space-y-2">
        {/* Expansão local — nunca o card inteiro. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          aria-expanded={expanded}
          aria-controls={`resumo-${term.id}`}
          className="w-full rounded-full border border-ceci-border-default bg-surface-default py-2 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted cursor-pointer"
        >
          {expanded ? 'esconder o resumo' : 'ver o resumo inteiro'}
        </button>

        {/* CTA explícito de memórias, separado da expansão. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMemories();
          }}
          className="w-full rounded-full border border-ceci-border-brand bg-surface-rose py-2 text-xs font-semibold text-ceci-brand-strong hover:bg-surface-rose cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" aria-hidden />
          abrir memórias
        </button>
      </div>

      {expanded && s && (
        <div className="mt-3 space-y-2" id={`resumo-${term.id}`}>
          <ul className="space-y-1 text-xs text-ceci-secondary">
            {s.highlights.map((h) => (
              <li key={h} className="leading-snug">
                {h}
              </li>
            ))}
          </ul>
          {s.grades.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-ceci-border-subtle pt-2">
              {s.grades.map((g) => (
                <li key={`${g.courseId}-${g.label}`} className="flex justify-between text-xs">
                  <span className="text-ceci-secondary">{g.label}</span>
                  <span className="font-semibold text-ceci-primary">
                    {g.grade !== undefined ? g.grade : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {onReopen && (
        <div className="mt-4 pt-3 border-t border-ceci-border-subtle">
          {confirmingReopen ? (
            <div className="space-y-2">
              <p className="text-xs text-ceci-secondary">
                reabrir torna o {term.label} o semestre atual e deixa de tratar o
                resumo como registro final.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingReopen(false)}
                  className="rounded-full border border-ceci-border-default bg-surface-default px-3 py-1.5 text-xs text-ceci-secondary hover:bg-surface-muted cursor-pointer"
                >
                  cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReopen();
                    setConfirmingReopen(false);
                  }}
                  className="rounded-full border border-ceci-border-brand bg-ceci-brand px-3 py-1.5 text-xs text-ceci-on-brand hover:bg-ceci-brand-strong cursor-pointer"
                >
                  confirmar reabertura
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingReopen(true);
              }}
              className="w-full rounded-full border border-ceci-border-default bg-surface-default py-2 text-xs font-semibold text-ceci-tertiary hover:bg-surface-muted cursor-pointer"
            >
              era este semestre mesmo — reabrir como atual
            </button>
          )}
        </div>
      )}
    </div>
  );
};
