// Sheet pequeno de fundo (position="bottom") para criar uma tarefa na tela de
// home. Substitui o formulário inline "adicionar sem nada".
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { Task } from '@/types';
import { Modal } from '../../ui/Modal';
import { TextInput, DeadlineField } from '../../wizards/wizardFields';
import { ChoiceCardGrid } from '../../ui/ChoiceCardGrid';
import { CourseSelect } from '../../wizards/CourseSelect';
import { PRIORITIES, TASK_CATEGORIES } from '../../wizards/note/constants';
import { hapticSuccess } from '@/lib/haptics';
import { CELEBRACAO, frase } from '@/lib/voice';
import { Toggle } from '../../ui/Toggle';
import { useCecinho } from '@/agent/useCecinho';

interface TaskSheetValues {
  taskTitle: string;
  taskCategory: Task['category'];
  taskPriority: Task['priority'];
  taskDueDate: string;
  courseId: string;
  /** Opcional (SPEC-037 D2): chama o Cecinho depois de guardar. */
  askCecinho: boolean;
}

interface TaskSheetProps {
  open: boolean;
  onClose: () => void;
  /** Dia do `+` no calendário (SPEC-024 D20): o formulário já nasce com a data. */
  defaultDate?: string;
}

const EMPTY_VALUES: TaskSheetValues = {
  taskTitle: '',
  taskCategory: 'outro',
  taskPriority: 'media',
  taskDueDate: '',
  courseId: '',
  askCecinho: false,
};

export const TaskSheet: React.FC<TaskSheetProps> = ({ open, onClose, defaultDate }) => {
  const { courses, handleAddTask, showToast } = useMobileApp();
  const cecinho = useCecinho();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [triedNext, setTriedNext] = useState(false);
  const savingRef = useRef(false);

  const [values, setValues] = useState<TaskSheetValues>(EMPTY_VALUES);

  // Reabrir começa do zero — sem o passo e o título do registro anterior. O dia
  // do `+` do calendário (SPEC-024 D20) entra como prazo inicial. Não limpar no
  // fechamento: o conteúdo precisa ficar visível durante a animação de saída.
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setTriedNext(false);
    setValues({ ...EMPTY_VALUES, taskDueDate: defaultDate ?? '' });
    savingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const patch = useCallback((p: Partial<TaskSheetValues>) => {
    setValues((prev) => ({ ...prev, ...p }));
  }, []);

  const { taskTitle, taskCategory, taskPriority, taskDueDate, courseId, askCecinho } = values;
  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';
  const isLast = step === 3;
  const canNext = taskTitle.trim().length > 0;

  const steps = [
    { id: 'titulo', title: 'o que fazer?', hint: 'anota numa frase' },
    { id: 'categoria', title: 'categoria', hint: 'onde essa tarefa se encaixa' },
    { id: 'prioridade', title: 'prioridade', hint: 'onde começar primeiro' },
    { id: 'prazo', title: 'disciplina e prazo', hint: 'quando precisa estar pronta' },
  ];

  const handleSave = useCallback(() => {
    // Lock síncrono: o `busy` é state (assíncrono) e deixa passar um segundo
    // clique rápido antes de atualizar. O ref trava imediatamente.
    if (savingRef.current || !taskTitle.trim()) return;
    savingRef.current = true;
    setBusy(true);
    const taskId = 't-' + Date.now();
    handleAddTask({
      id: taskId,
      title: taskTitle.trim(),
      disciplineId: courseId || undefined,
      category: taskCategory,
      dueDate: taskDueDate || undefined,
      completed: false,
      priority: taskPriority,
    });
    if (askCecinho) cecinho.activate(taskId);
    hapticSuccess();
    // SPEC-035 D5: sem prazo, a tarefa não some — ela fica na inbox, e o toast diz isso.
    showToast(frase(CELEBRACAO, taskDueDate ? 'tarefaSalvaNaAgenda' : 'tarefaNaInbox'));
    onClose();
    setBusy(false);
    // savingRef.current fica true até o sheet reabrir (useEffect acima) —
    // impede clique duplo rápido gravar duas vezes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    busy,
    taskTitle,
    courseId,
    taskCategory,
    taskDueDate,
    taskPriority,
    askCecinho,
    cecinho,
    handleAddTask,
    showToast,
    onClose,
  ]);

  const next = () => {
    if (!canNext) {
      setTriedNext(true);
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => {
    if (step === 0) onClose();
    else setStep((s) => s - 1);
  };

  const current = steps[step];

  return (
    <Modal
      open={open}
      onClose={onClose}
      position="bottom"
      labelledBy="task-sheet-title"
      className="w-full max-w-lg"
    >
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary">
        {/* Cabeçalho — mesmo padrão dos demais sheets (título + fechar visível) */}
        <div className="flex items-start gap-3 pb-3 mb-4 border-b border-ceci-border-subtle">
          <div className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="task-sheet-title"
              className="font-display font-bold text-lg sm:text-xl leading-snug text-ceci-primary"
            >
              {current.title}
            </h2>
            <p className="text-[12px] text-ceci-secondary leading-relaxed mt-1">{current.hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-1.5 -mr-1 -mt-1 rounded-full hover:bg-surface-muted text-ceci-secondary transition-colors cursor-pointer shrink-0"
            aria-label="fechar"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>

        {/* Conteúdo do passo */}
        <div className="space-y-4 overflow-y-auto overscroll-contain max-h-[60dvh]">
          {step === 0 && (
            <div className="space-y-2">
              <TextInput
                value={taskTitle}
                onChange={(e) => patch({ taskTitle: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                placeholder="ex: ler capítulo 4 de psicopatologia"
                autoFocus
              />
              {!canNext && triedNext && (
                <p className="text-[11px] text-status-danger-strong">
                  preencha o título para continuar
                </p>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <ChoiceCardGrid
                label="categoria"
                options={TASK_CATEGORIES}
                value={taskCategory}
                onChange={(v) => patch({ taskCategory: v })}
              />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <ChoiceCardGrid
                label="prioridade"
                options={PRIORITIES}
                value={taskPriority}
                onChange={(v) => patch({ taskPriority: v })}
              />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <CourseSelect
                value={courseId}
                onChange={(v) => patch({ courseId: v })}
                placeholder="sem disciplina — tarefa avulsa"
              />
              <DeadlineField
                label="data limite (prazo)"
                id="task-due-date"
                value={taskDueDate}
                onChange={(v) => patch({ taskDueDate: v })}
              />
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-ceci-border-default bg-surface-default px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ceci-primary">
                    quero que o cecinho me ajude
                  </p>
                  <p className="text-[11px] text-ceci-secondary">
                    opcional — ele pergunta antes de fazer qualquer coisa
                  </p>
                </div>
                <Toggle
                  checked={askCecinho}
                  onChange={() => patch({ askCecinho: !askCecinho })}
                  label="pedir ajuda ao cecinho"
                />
              </div>
            </div>
          )}
        </div>

        {/* CF-005: título basta. O fluxo detalhado continua ali para quem quiser. */}
        {step === 0 && canNext && (
          <button
            type="button"
            onClick={handleSave}
            className="w-full text-center px-4 py-2.5 mt-3 rounded-xl text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand min-h-[44px] cursor-pointer"
          >
            guardar só com o título
          </button>
        )}

        {/* Rodapé com navegação entre steps */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-4 border-t border-ceci-border-subtle">
          <button
            type="button"
            onClick={back}
            className="flex items-center px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
          >
            {step === 0 ? (
              'fechar'
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> voltar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={isLast ? handleSave : next}
            className="bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[44px] cursor-pointer shrink-0"
          >
            {isLast ? 'guardar tarefa ♡' : 'continuar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
