// Botão persistente de criação da Agenda (SPEC-035 D5/D8). Abre as portas que
// já existem — tarefa, prova, reunião do TCC — com a data selecionada como
// inicial. Nenhum formulário novo nasce aqui.
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface AgendaCreateActionProps {
  hasTcc: boolean;
  onNewTask: () => void;
  onNewExam: () => void;
  onNewMeeting: () => void;
}

export const AgendaCreateAction: React.FC<AgendaCreateActionProps> = ({
  hasTcc,
  onNewTask,
  onNewExam,
  onNewMeeting,
}) => {
  const [open, setOpen] = useState(false);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-30 lg:bottom-10">
        <div className="mx-auto w-full max-w-md sm:max-w-xl lg:max-w-3xl px-3.5 sm:px-5 lg:px-8 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="adicionar à agenda"
            className="pointer-events-auto w-14 h-14 rounded-full bg-ceci-brand-strong text-ceci-on-brand shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        position="bottom"
        labelledBy="agenda-create-title"
        className="w-full max-w-lg"
      >
        <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl p-5 sm:p-6 text-ceci-primary space-y-3">
          <h2
            id="agenda-create-title"
            className="font-display font-bold text-lg text-ceci-primary"
          >
            adicionar à agenda
          </h2>
          <button
            type="button"
            onClick={() => choose(onNewTask)}
            className="w-full text-left px-4 py-3 rounded-xl bg-ceci-brand-strong text-ceci-on-brand font-semibold text-sm min-h-[44px] cursor-pointer"
          >
            nova tarefa
          </button>
          <button
            type="button"
            onClick={() => choose(onNewExam)}
            className="w-full text-left px-4 py-3 rounded-xl bg-surface-default border border-ceci-border-default font-semibold text-sm min-h-[44px] cursor-pointer"
          >
            nova prova
          </button>
          {hasTcc && (
            <button
              type="button"
              onClick={() => choose(onNewMeeting)}
              className="w-full text-left px-4 py-3 rounded-xl bg-surface-default border border-ceci-border-default font-semibold text-sm min-h-[44px] cursor-pointer"
            >
              reunião do tcc
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full text-center px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted min-h-[44px] cursor-pointer"
          >
            cancelar
          </button>
        </div>
      </Modal>
    </>
  );
};
