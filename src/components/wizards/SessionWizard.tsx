import React from 'react';
<<<<<<< HEAD
import { CELEBRACAO, frase } from '../../lib/voice';
=======
import { CELEBRACAO, DICA, VAZIO, frase } from '../../lib/voice';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { Timer } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { useWizardForm } from '../../lib/useWizardForm';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
<<<<<<< HEAD
import { FieldHint, FieldLabel, ReviewCard, TextInput } from './wizardFields';
=======
import { Field, FieldHint, FieldLabel, ReviewCard, TextInput } from './wizardFields';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { CourseSelect } from './CourseSelect';
import { today } from './note/constants';

interface SessionValues {
  topic: string;
  minutes: string;
  courseId: string;
}

export const SessionWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const {
    courses,
    sessions,
    wizardCourseId,
    handleAddSession,
    handleUpdateSession,
    closeWizard,
    showToast,
  } = useMobileApp();
  const editingSession =
    editing?.kind === 'session' ? sessions.find((s) => s.id === editing.id) : undefined;
  const { values, patch, step, setStep } = useWizardForm<SessionValues>({
    initial: {
      topic: editingSession?.topic ?? '',
      minutes: String(editingSession?.durationMinutes ?? '25'),
      courseId: editingSession?.courseId ?? (wizardCourseId || courses[0]?.id || ''),
    },
    editing: !!editingSession,
  });
  const { topic, minutes, courseId } = values;

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'sessao-tema',
      title: 'tema',
      headline: 'o que você vai estudar?',
      subtitle: 'o assunto da sessão de foco — ex: revisar semiologia dos transtornos do humor.',
      content: (
<<<<<<< HEAD
        <TextInput
          value={topic}
          onChange={(e) => patch({ topic: e.target.value })}
          placeholder="ex: revisar semiologia dos transtornos do humor"
          autoFocus
        />
=======
        <Field
          label="tema"
          htmlFor="sessao-tema-input"
          required
          description={frase(VAZIO, 'sessaoDescricaoAssunto')}
          error={!topic.trim() && 'dê um assunto para a sessão'}
          importance="primary"
        >
          <TextInput
            id="sessao-tema-input"
            value={topic}
            onChange={(e) => patch({ topic: e.target.value })}
            placeholder="ex: revisar semiologia dos transtornos do humor"
            autoFocus
          />
        </Field>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      ),
    },
    {
      id: 'sessao-ritmo',
      title: 'ritmo',
      headline: 'por quanto tempo?',
      subtitle: 'a duração que combina com a sua disponibilidade de agora.',
      content: (
        <div>
<<<<<<< HEAD
          <FieldLabel>duração (minutos)</FieldLabel>
          <TextInput
            type="number"
            value={minutes}
            onChange={(e) => patch({ minutes: e.target.value })}
            placeholder="ex: 25"
          />
          <FieldHint>25 minutos é um bom começo — você ajusta sempre que quiser.</FieldHint>
=======
          <Field
            label="duração (minutos)"
            htmlFor="sessao-minutos-input"
            importance="secondary"
            description={frase(VAZIO, 'sessaoDuracaoExemplo')}
          >
            <TextInput
              id="sessao-minutos-input"
              type="number"
              value={minutes}
              onChange={(e) => patch({ minutes: e.target.value })}
              placeholder="ex: 25"
            />
          </Field>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
        </div>
      ),
    },
    {
      id: 'sessao-disciplina',
      title: 'disciplina',
      headline: 'quer conectar a uma disciplina?',
      subtitle: 'opcional — ajuda a separar o foco por matéria no seu histórico ♡',
      content: (
        <CourseSelect
          value={courseId}
          onChange={(v) => patch({ courseId: v })}
          label="disciplina (opcional)"
          optional
        />
      ),
    },
    {
      id: 'sessao-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
<<<<<<< HEAD
      subtitle: 'confere o tema e a duração da sessão antes de guardar no histórico.',
=======
      subtitle: frase(DICA, 'confereSessao'),
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      content: (
        <ReviewCard
          rows={[
            { label: 'estudo', value: topic.trim() },
            { label: 'duração', value: `${minutes} min` },
            { label: 'disciplina', value: courseName || 'sem disciplina' },
          ]}
        />
      ),
    },
  ];

  const handleSave = () => {
    if (editingSession) {
      handleUpdateSession({
        ...editingSession,
        courseId: courseId || undefined,
        topic: topic.trim(),
        durationMinutes: parseInt(minutes) || 25,
      });
      hapticSuccess();
      closeWizard();
      showToast(frase(CELEBRACAO, 'sessaoAtualizada'));
      return;
    }
    handleAddSession({
      id: 'ss-' + Date.now(),
      courseId: courseId || undefined,
      topic: topic.trim(),
      date: today(),
      durationMinutes: parseInt(minutes) || 25,
    });
    hapticSuccess();
    closeWizard();
    showToast(frase(CELEBRACAO, 'sessaoGuardadaNoHistorico'));
  };

  return (
    <WizardScaffold
<<<<<<< HEAD
=======
      tone="compact"
      progress="linear"
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      title={editing ? 'editar sessão' : 'nova sessão de estudo'}
      icon={<Timer className="w-3.5 h-3.5" />}
      iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={topic.trim().length > 0}
      blockedReason="dê um assunto para a sessão"
<<<<<<< HEAD
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar sessão ♡'}
=======
      invalidFieldId={topic.trim().length > 0 ? undefined : 'sessao-tema-input'}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? frase(CELEBRACAO, 'guardarAlteracoes') : 'guardar sessão ♡'}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    />
  );
};
