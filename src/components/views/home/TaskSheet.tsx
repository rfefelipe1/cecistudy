// Sheet pequeno de fundo (position="bottom") para criar uma tarefa na tela de
// home. Substitui o formulário inline "adicionar sem nada".
<<<<<<< HEAD
import React, { useCallback, useEffect, useState } from 'react';
=======
import React, { useCallback, useEffect, useRef, useState } from 'react';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { Task } from '@/types';
import { Modal } from '../../ui/Modal';
<<<<<<< HEAD
import { TextInput, DeadlineField } from '../../wizards/wizardFields';
=======
import { TextInput } from '../../wizards/wizardFields';
import { CeciDatePicker } from '../../ui/ceci';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { ChoiceCardGrid } from '../../ui/ChoiceCardGrid';
import { CourseSelect } from '../../wizards/CourseSelect';
import { PRIORITIES, TASK_CATEGORIES } from '../../wizards/note/constants';
import { hapticSuccess } from '@/lib/haptics';
<<<<<<< HEAD
import { CELEBRACAO, frase } from '@/lib/voice';
=======
import { CELEBRACAO, DICA, frase } from '@/lib/voice';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

interface TaskSheetValues {
  taskTitle: string;
  taskCategory: Task['category'];
  taskPriority: Task['priority'];
  taskDueDate: string;
  courseId: string;
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
};

export const TaskSheet: React.FC<TaskSheetProps> = ({ open, onClose, defaultDate }) => {
  const { courses, handleAddTask, showToast } = useMobileApp();
  const [step, setStep] = useState(0);
<<<<<<< HEAD
  const [busy, setBusy] = useState(false);
  const [triedNext, setTriedNext] = useState(false);

=======
  const [triedNext, setTriedNext] = useState(false);

  /**
   * Uma folha, uma gravação (SPEC-029 D2).
   *
   * É um `ref`, não `useState`: durante a animação de saída o `Modal` serve o
   * render **anterior** — o `AnimatePresence` (`src/components/ui/Modal.tsx:197`)
   * segura o filho antigo enquanto ele sai. Nesse render o bloqueio de estado
   * ainda valia `false`, e o toque seguinte gravava uma segunda tarefa. O `ref`
   * é lido em tempo de chamada, então o toque repetido não passa, mesmo pelo
   * handler antigo.
   */
  const gravouRef = useRef(false);

>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  const [values, setValues] = useState<TaskSheetValues>(EMPTY_VALUES);

  // Reabrir começa do zero — sem o passo e o título do registro anterior. O dia
  // do `+` do calendário (SPEC-024 D20) entra como prazo inicial. Não limpar no
  // fechamento: o conteúdo precisa ficar visível durante a animação de saída.
<<<<<<< HEAD
  useEffect(() => {
    if (!open) return;
    setStep(0);
=======
  // O bloqueio de toque repetido (SPEC-029 D2) também é solto aqui: ele segura
  // o botão até a folha abrir de novo.
  useEffect(() => {
    if (!open) return;
    setStep(0);
    gravouRef.current = false;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    setTriedNext(false);
    setValues({ ...EMPTY_VALUES, taskDueDate: defaultDate ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const patch = useCallback((p: Partial<TaskSheetValues>) => {
    setValues((prev) => ({ ...prev, ...p }));
  }, []);

  const { taskTitle, taskCategory, taskPriority, taskDueDate, courseId } = values;
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
<<<<<<< HEAD
    if (busy || !taskTitle.trim()) return;
    setBusy(true);
=======
    if (gravouRef.current || !taskTitle.trim()) return;
    gravouRef.current = true;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    handleAddTask({
      id: 't-' + Date.now(),
      title: taskTitle.trim(),
      disciplineId: courseId || undefined,
      category: taskCategory,
      dueDate: taskDueDate || undefined,
      completed: false,
      priority: taskPriority,
    });
    hapticSuccess();
<<<<<<< HEAD
    showToast(frase(CELEBRACAO, 'tarefaSalva'));
    onClose();
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    busy,
=======
    // Fecha **antes** do aviso (SPEC-029 D1): `frase()` lança em chave ausente
    // e, com o aviso na frente, uma frase quebrada derrubava o fechamento —
    // a tarefa ficava gravada, a folha aberta e um toque a mais criava outra.
    onClose();
    showToast(frase(CELEBRACAO, 'tarefaGuardadaPlano'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    taskTitle,
    courseId,
    taskCategory,
    taskDueDate,
    taskPriority,
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
<<<<<<< HEAD
              <DeadlineField
                label="data limite (prazo)"
                value={taskDueDate}
=======
              <CeciDatePicker
                label="data limite (prazo)"
                value={taskDueDate ?? null}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
                onChange={(v) => patch({ taskDueDate: v })}
              />
            </div>
          )}
        </div>

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
<<<<<<< HEAD
            {isLast ? 'guardar tarefa ♡' : 'continuar'}
=======
            {isLast ? frase(DICA, 'guardarTarefa') : 'continuar'}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
          </button>
        </div>
      </div>
    </Modal>
  );
};
