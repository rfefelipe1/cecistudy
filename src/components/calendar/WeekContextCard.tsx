// Resumo afetivo e objetivo da semana atual (SPEC-redesign-calendario §10).
import React from 'react';
import { formatDateBR } from '../../lib/dateBR';

interface WeekContextCardProps {
  startDate: string;
  endDate: string;
  classes: number;
  exams: number;
  tasks: number;
  studyActivities: number;
  internship: number;
  empty?: boolean;
}

export const WeekContextCard: React.FC<WeekContextCardProps> = ({
  startDate,
  endDate,
  classes,
  exams,
  tasks,
  studyActivities,
  internship,
  empty = false,
}) => {
  const total =
    classes + exams + tasks + studyActivities + internship;

  if (empty) {
    return (
      <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-4 space-y-2">
        <h2 className="font-display text-sm font-bold text-ceci-primary">
          sua semana ainda está quietinha
        </h2>
        <p className="text-[12px] text-ceci-secondary leading-relaxed">
          nada marcado por aqui — um espaço bom para planejar com calma ♡
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-4 space-y-2">
      <h2 className="font-display text-sm font-bold text-ceci-primary">
        sua semana ♡
      </h2>
      <p className="text-[12px] font-semibold text-ceci-secondary">
        {classes} aula{classes !== 1 ? 's' : ''} ·
        {exams} prova{exams !== 1 ? 's' : ''} ·
        {tasks} tarefa{tasks !== 1 ? 's' : ''}
      </p>
      {studyActivities > 0 && (
        <p className="text-[12px] text-ceci-secondary">
          {studyActivities} momento{studyActivities !== 1 ? 's' : ''} de estudo
        </p>
      )}
      {internship > 0 && (
        <p className="text-[12px] text-ceci-secondary">
          {internship} momento{internship !== 1 ? 's' : ''} de estágio
        </p>
      )}
      <p className="text-[11px] text-ceci-tertiary">
        {formatDateBR(startDate)} a {formatDateBR(endDate)}
      </p>
    </section>
  );
};
