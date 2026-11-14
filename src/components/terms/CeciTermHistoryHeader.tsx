import React from 'react';
import { degreeProgress } from '@/lib/termScope';
import { type AcademicTerm } from '@/types';
import { ProgressBar } from '../ui/ProgressBar';
import { frase, VAZIO } from '../../lib/voice';
import { cn } from '@/lib/utils';

export interface CeciTermHistoryHeaderProps {
  completedTerms: number;
  totalSemesters: number;
  activeOrdinal: number | null;
  onBack?: () => void;
}

/**
 * Header da jornada do histórico de semestres passados.
 *
 * Estabelece o significado emocional do arquivo (eyebrow + título + descrição)
 * e mostra o progresso da graduação com barra visual, fonte ativa quando houver
 * um semestre atual e `profile.semester` apenas como fallback.
 */
export const CeciTermHistoryHeader: React.FC<CeciTermHistoryHeaderProps> = ({
  completedTerms,
  totalSemesters,
  activeOrdinal,
  onBack,
}) => {
  const progress = activeOrdinal
    ? degreeProgress(activeOrdinal, totalSemesters)
    : degreeProgress(completedTerms, totalSemesters);

  return (
    <section className="space-y-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="voltar"
          className="inline-flex items-center gap-1.5 rounded-full border border-ceci-border-default bg-surface-default px-3.5 py-1.5 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted cursor-pointer"
        >
          <span className="text-[12px]">←</span> semestres passados
        </button>
      )}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-ceci-tertiary uppercase tracking-wider">
          {frase(VAZIO, 'historicoEyebrow')}
        </span>
      </div>
      <h1 className="font-display font-bold text-[24px] sm:text-[30px] tracking-tight text-ceci-primary">
        {frase(VAZIO, 'historicoTitulo')}
      </h1>
      <p className="text-sm text-ceci-secondary leading-relaxed">
        {frase(VAZIO, 'historicoDescricao')}
      </p>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ceci-secondary">
            {frase(VAZIO, 'historicoTitulo')}
          </span>
          <span className="text-xs font-semibold text-ceci-primary">
            {completedTerms} de {totalSemesters} semestres guardados
          </span>
        </div>
        <ProgressBar
          value={progress}
          valueText={`${progress}% da graduação`}
          className="h-2"
          barClassName="bg-ceci-brand"
        />
      </div>
    </section>
  );
};
