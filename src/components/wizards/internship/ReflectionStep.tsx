import React from 'react';
import type { WizardStep } from '../WizardScaffold';
import { TextArea } from '../wizardFields';
import type { InternshipLogType } from '../../../types';

interface ReflectionStepProps {
  reflections: string;
  isFuture: boolean;
  extra: React.ReactNode | undefined;
  onPatch: (reflections: string) => void;
}

/** Retorna o objeto WizardStep do passo de reflexão clínica. */
export function ReflectionStep(props: ReflectionStepProps): WizardStep {
  const { reflections, isFuture, extra, onPatch } = props;
  return {
    id: 'reflexao',
    title: 'reflexão',
    headline: 'como foi essa experiência pra você?',
    subtitle: 'suas impressões e aprendizados — é o coração do diário de estágio ♡',
    content: (
      <div className="space-y-4">
        {isFuture && <p className="text-[11px] text-ceci-tertiary">dá pra preencher depois</p>}
        {extra}
        <TextArea
          rows={5}
          value={reflections}
          onChange={(e) => onPatch(e.target.value)}
          placeholder="como foi pra você? o que aprendeu?"
        />
      </div>
    ),
  };
}
