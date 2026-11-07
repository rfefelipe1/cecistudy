import React from 'react';
<<<<<<< HEAD
import { VAZIO, CELEBRACAO, frase } from '../../lib/voice';
=======
import { VAZIO, CELEBRACAO, DICA, frase } from '../../lib/voice';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { Sparkles } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { useWizardForm } from '../../lib/useWizardForm';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
<<<<<<< HEAD
import { FieldHint, FieldLabel, ReviewCard, TextArea, TextInput } from './wizardFields';
import { PillGroupMulti } from '../ui/PillGroupMulti';
=======
import { Field, FieldHint, ReviewCard, TextArea, TextInput } from './wizardFields';
import { CeciMultiSelect } from '../ui/ceci';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { Picker } from '../ui/Picker';
import { TagField } from '../ui/TagField';
import { useAcervoTheory } from './useAcervoTheory';

interface ConceptValues {
  name: string;
  definition: string;
  approachId: string;
  authorIds: string[];
  courseIds: string[];
  tags: string[];
}

export const ConceptWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const {
    approaches,
    authors,
    courses,
    concepts,
    wizardCourseId,
    handleAddConcept,
    handleUpdateConcept,
    closeWizard,
    showToast,
  } = useMobileApp();
  const { authorOptions, resolveIds } = useAcervoTheory();
  const editingConcept =
    editing?.kind === 'concept' ? concepts.find((c) => c.id === editing.id) : undefined;

  const { values, patch, step, setStep } = useWizardForm<ConceptValues>({
    initial: {
      name: editingConcept?.name ?? '',
      definition: editingConcept?.definition ?? '',
      approachId: editingConcept?.approachId ?? '',
      authorIds: editingConcept?.authorIds ?? [],
      courseIds: editingConcept?.courseIds.length
        ? editingConcept.courseIds
        : wizardCourseId
          ? [wizardCourseId]
          : [],
      tags: editingConcept?.tags ?? [],
    },
    editing: !!editingConcept,
  });
  const { name, definition, approachId, authorIds, courseIds, tags } = values;

  const approachName = approaches.find((a) => a.id === approachId)?.shortName ?? 'sem abordagem';
  const authorsNames = authors
    .filter((x) => authorIds.includes(x.id))
    .map((x) => x.name)
    .join(' · ');
  const coursesNames = courses
    .filter((x) => courseIds.includes(x.id))
    .map((x) => x.name)
    .join(' · ');

  const steps: WizardStep[] = [
    {
      id: 'conceito-nome',
      title: 'conceito',
      headline: 'qual é o conceito?',
      subtitle: 'nome + uma definição com as suas palavras — o resto fica opcional ♡',
      content: (
        <div className="space-y-4">
<<<<<<< HEAD
          <TextInput
            value={name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="nome do conceito — ex: tríade cognitiva"
            autoFocus
          />
          <div>
            <FieldLabel>definição</FieldLabel>
            <TextArea
=======
          <Field
            label="nome"
            htmlFor="conceito-nome-input"
            required
            description={frase(VAZIO, 'conceitoDescricaoNomeDefinicao')}
            error={!name.trim() && 'dê um nome para o conceito'}
            importance="primary"
          >
            <TextInput
              id="conceito-nome-input"
              value={name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="nome do conceito — ex: tríade cognitiva"
              autoFocus
            />
          </Field>
          <Field
            label="definição"
            htmlFor="conceito-definicao-input"
            optional
            description={frase(VAZIO, 'conceitoDefinicaoSimples')}
            importance="secondary"
          >
            <TextArea
              id="conceito-definicao-input"
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
              rows={4}
              value={definition}
              onChange={(e) => patch({ definition: e.target.value })}
              placeholder="o que é esse conceito?"
            />
<<<<<<< HEAD
            <FieldHint>uma definição simples já ajuda: depois dá para aprofundar.</FieldHint>
          </div>
=======
          </Field>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
        </div>
      ),
    },
    {
      id: 'conceito-contexto',
      title: 'contexto',
      headline: 'onde esse conceito se encaixa?',
      subtitle: 'abordagem, autores, disciplinas e tags conectam o conceito ao seu repertório ♡',
      content: (
        <div className="space-y-4">
          <Picker
            label="abordagem (opcional)"
            value={approachId}
            onChange={(v) => patch({ approachId: v })}
            options={approaches.map((x) => ({ value: x.id, label: x.shortName || x.name }))}
            placeholder="sem abordagem"
            emptyMessage={frase(VAZIO, 'semAbordagensRegistradas')}
          />
<<<<<<< HEAD
          <PillGroupMulti
            label="autores relacionados"
            variant="rose"
            options={authorOptions}
            value={authorIds}
            onChange={(v) => patch({ authorIds: resolveIds(v) })}
          />
          <PillGroupMulti
            label="disciplinas"
            variant="rose"
            options={courses.map((x) => ({ value: x.id, label: x.name }))}
            value={courseIds}
            onChange={(v) => patch({ courseIds: v })}
=======
          <CeciMultiSelect
            label="autores relacionados"
            value={authorIds}
            onChange={(v) => patch({ authorIds: resolveIds(v) })}
            options={authorOptions.map((o) => ({ value: o.value, label: o.label }))}
          />
          <CeciMultiSelect
            label="disciplinas"
            value={courseIds}
            onChange={(v) => patch({ courseIds: v })}
            options={courses.map((x) => ({ value: x.id, label: x.name }))}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
          />
          <TagField
            tags={tags}
            onChange={(v) => patch({ tags: v })}
            placeholder="tags do conceito (ex: ansiedade)"
            emptyMessage={frase(VAZIO, 'campoOpcional')}
          />
        </div>
      ),
    },
    {
      id: 'conceito-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
<<<<<<< HEAD
      subtitle: 'confere nome e definição antes de guardar o conceito.',
=======
      subtitle: frase(DICA, 'confereConceito'),
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      content: (
        <ReviewCard
          rows={[
            { label: 'conceito', value: name.trim() },
            { label: 'definição', value: definition.trim() || 'sem definição' },
            { label: 'abordagem', value: approachName },
            { label: 'autores', value: authorsNames || '—' },
            { label: 'disciplinas', value: coursesNames || '—' },
            { label: 'tags', value: tags.join(' · ') || '—' },
          ]}
        />
      ),
    },
  ];

  const handleSave = () => {
    const payload = {
      name: name.trim(),
      definition: definition.trim(),
      approachId: approachId || undefined,
      authorIds,
      courseIds,
      tags,
    };
    if (editingConcept) {
      handleUpdateConcept({ ...editingConcept, ...payload });
      hapticSuccess();
      closeWizard();
      showToast(frase(CELEBRACAO, 'conceitoAtualizado'));
      return;
    }
    handleAddConcept({ id: 'con-' + Date.now(), ...payload });
    hapticSuccess();
    closeWizard();
    showToast(frase(CELEBRACAO, 'conceitoGuardadoNoCantinho'));
  };

  return (
    <WizardScaffold
<<<<<<< HEAD
=======
      tone="compact"
      progress="linear"
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      title={editing ? 'editar conceito' : 'novo conceito'}
      icon={<Sparkles className="w-3.5 h-3.5" />}
      iconClass="bg-status-warning-surface border-status-warning-border text-status-warning-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={name.trim().length > 0}
      blockedReason="dê um nome para o conceito"
<<<<<<< HEAD
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? 'guardar alterações ♡' : 'guardar conceito ♡'}
=======
      invalidFieldId={name.trim().length > 0 ? undefined : 'conceito-nome-input'}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel={editing ? frase(CELEBRACAO, 'guardarAlteracoes') : 'guardar conceito ♡'}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    />
  );
};
