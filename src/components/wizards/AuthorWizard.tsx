import React from 'react';
<<<<<<< HEAD
import { VAZIO, CELEBRACAO, frase } from '../../lib/voice';
=======
import { VAZIO, CELEBRACAO, DICA, frase } from '../../lib/voice';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { UserCheck } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { useWizardForm } from '../../lib/useWizardForm';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
<<<<<<< HEAD
import { ReviewCard, TextArea, TextInput } from './wizardFields';
=======
import { Field, ReviewCard, TextArea, TextInput } from './wizardFields';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { Picker } from '../ui/Picker';
import { TagField } from '../ui/TagField';

interface AuthorValues {
  name: string;
  bio: string;
  lifespan: string;
  approachId: string;
  keyConcepts: string[];
  majorWorks: string[];
}

export const AuthorWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const { approaches, authors, handleAddAuthor, handleUpdateAuthor, closeWizard, showToast } =
    useMobileApp();
  const editingAuthor =
    editing?.kind === 'author' ? authors.find((a) => a.id === editing.id) : undefined;

  const { values, patch, step, setStep } = useWizardForm<AuthorValues>({
    initial: {
      name: editingAuthor?.name ?? '',
      bio: editingAuthor?.bio ?? '',
      lifespan: editingAuthor?.lifespan ?? '',
      approachId: editingAuthor?.approachId ?? '',
      keyConcepts: editingAuthor?.keyConcepts ?? [],
      majorWorks: editingAuthor?.majorWorks ?? [],
    },
    editing: !!editingAuthor,
  });
  const { name, bio, lifespan, approachId, keyConcepts, majorWorks } = values;

  const approachName = approaches.find((a) => a.id === approachId)?.name ?? '';

  const steps: WizardStep[] = [
    {
      id: 'autor-nome',
      title: 'nome',
      headline: 'quem é esse autor?',
      subtitle: 'nome e, se souber, o período de vida — o essencial para identificar.',
      content: (
        <div className="space-y-4">
<<<<<<< HEAD
          <TextInput
            value={name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="nome do autor — ex: aaron beck"
            autoFocus
          />
          <TextInput
            value={lifespan}
            onChange={(e) => patch({ lifespan: e.target.value })}
            placeholder="lifespan (opcional) — ex: 1921–2021"
          />
=======
          <Field
            label="nome"
            htmlFor="autor-nome-input"
            required
            description={frase(VAZIO, 'autorDescricaoNomeVida')}
            error={!name.trim() && 'dê um nome para o autor'}
            importance="primary"
          >
            <TextInput
              id="autor-nome-input"
              value={name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="nome do autor — ex: aaron beck"
              autoFocus
            />
          </Field>
          <Field
            label="período de vida"
            htmlFor="autor-lifespan-input"
            optional
            description={frase(VAZIO, 'autorExemploLifespan')}
            importance="secondary"
          >
            <TextInput
              id="autor-lifespan-input"
              value={lifespan}
              onChange={(e) => patch({ lifespan: e.target.value })}
              placeholder="lifespan (opcional) — ex: 1921–2021"
            />
          </Field>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
        </div>
      ),
    },
    {
      id: 'autor-bio',
      title: 'biografia',
      headline: 'conta um pouco sobre ele.',
      subtitle: 'o que você quer lembrar da contribuição dele para a psicologia.',
      content: (
        <div className="space-y-4">
          <TextArea
            rows={6}
            value={bio}
            onChange={(e) => patch({ bio: e.target.value })}
            placeholder="a biografia e a contribuição dele para a psicologia..."
          />
          <Picker
            label="abordagem (opcional)"
            value={approachId}
            onChange={(v) => patch({ approachId: v })}
            options={approaches.map((a) => ({ value: a.id, label: a.name }))}
            emptyMessage={frase(VAZIO, 'semAbordagensRegistradas')}
          />
        </div>
      ),
    },
    {
      id: 'autor-obras',
      title: 'obras & ideias',
      headline: 'quais obras e ideias são dele?',
      subtitle: 'obras principais e conceitos-chave — tudo opcional, pode completar depois ♡',
      content: (
        <div className="space-y-5">
          <TagField
            label="obras principais"
            tags={majorWorks}
            onChange={(v) => patch({ majorWorks: v })}
            placeholder="ex: terapia cognitiva da depressão"
            emptyMessage={frase(VAZIO, 'campoOpcionalCurto')}
          />
          <TagField
            label="conceitos-chave"
            tags={keyConcepts}
            onChange={(v) => patch({ keyConcepts: v })}
            placeholder="ex: tríade cognitiva"
          />
        </div>
      ),
    },
    {
      id: 'autor-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
<<<<<<< HEAD
      subtitle: 'confere as informações antes de guardar o autor no cantinho.',
=======
      subtitle: frase(DICA, 'confereAutor'),
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      content: (
        <ReviewCard
          rows={[
            { label: 'autor', value: name.trim() },
            { label: 'lifespan', value: lifespan.trim() || '—' },
            { label: 'biografia', value: bio.trim() },
            { label: 'abordagem', value: approachName || 'sem abordagem' },
            {
              label: 'obras principais',
              value: majorWorks.length ? majorWorks.join(' · ') : 'sem obras',
            },
            {
              label: 'conceitos-chave',
              value: keyConcepts.length ? keyConcepts.join(' · ') : 'sem conceitos',
            },
          ]}
        />
      ),
    },
  ];

  const handleSave = () => {
    if (editingAuthor) {
      handleUpdateAuthor({
        ...editingAuthor,
        name: name.trim(),
        bio: bio.trim() || 'autor estudado na minha jornada de psicologia.',
        lifespan: lifespan.trim() || undefined,
        approachId: approachId || undefined,
        keyConcepts,
        majorWorks,
      });
      hapticSuccess();
      closeWizard();
      showToast(frase(CELEBRACAO, 'autorAtualizado'));
      return;
    }
    handleAddAuthor({
      id: 'aut-' + Date.now(),
      name: name.trim(),
      bio: bio.trim() || 'autor estudado na minha jornada de psicologia.',
      lifespan: lifespan.trim() || undefined,
      approachId: approachId || undefined,
      keyConcepts,
      majorWorks,
    });
    hapticSuccess();
    closeWizard();
    showToast(frase(CELEBRACAO, 'autorGuardado'));
  };

  return (
    <WizardScaffold
<<<<<<< HEAD
=======
      tone="compact"
      progress="linear"
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      title={editing ? 'editar autor' : 'novo autor'}
      icon={<UserCheck className="w-3.5 h-3.5" />}
      iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={name.trim().length > 0}
      blockedReason="dê um nome para o autor"
<<<<<<< HEAD
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar autor ♡'}
=======
      invalidFieldId={name.trim().length > 0 ? undefined : 'autor-nome-input'}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? frase(CELEBRACAO, 'guardarAlteracoes') : 'guardar autor ♡'}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    />
  );
};
