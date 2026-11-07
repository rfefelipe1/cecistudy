// Botão de criação de tarefa/prova (SPEC-redesign-calendario §16).
// Abre o sheet/wizard existente com a data selecionada como default.
import React from 'react';
import { Plus } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';

interface CalendarCreateActionProps {
  defaultDate?: string;
  onOpenTask: () => void;
  onOpenExam: () => void;
}

export const CalendarCreateAction: React.FC<CalendarCreateActionProps> = ({
  defaultDate,
  onOpenTask,
  onOpenExam,
}) => {
  return (
    <div className="flex items-center justify-end gap-2 pt-2 px-0.5">
      <button
        type="button"
        onClick={onOpenTask}
        aria-label="adicionar tarefa"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand text-[11px] font-medium shadow-2xs transition-transform active:scale-95 min-h-[44px] cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        adicionar tarefa
      </button>
      <button
        type="button"
        onClick={onOpenExam}
        aria-label="adicionar prova"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-ceci-border-default bg-surface-default hover:bg-surface-muted text-[11px] font-medium text-ceci-primary min-h-[44px] cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        adicionar prova
      </button>
    </div>
  );
};
