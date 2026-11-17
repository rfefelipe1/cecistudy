import React from 'react';
import {
  HeartHandshake,
  Stethoscope,
  Compass,
  Users,
  Sparkles,
} from 'lucide-react';
import type { WizardStep } from '../WizardScaffold';
import type { InternshipLogType } from '../../../types';

const KINDS: { value: InternshipLogType; label: string; caption: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  {
    value: 'estagio',
    label: 'estágio',
    caption: 'dia de campo na clínica escola',
    Icon: HeartHandshake,
  },
  {
    value: 'atendimento_clinico',
    label: 'atendimento clínico',
    caption: 'sessão com paciente',
    Icon: Stethoscope,
  },
  { value: 'supervisao', label: 'supervisão', caption: 'orientação da supervisora', Icon: Compass },
  {
    value: 'intervisao',
    label: 'intervisão',
    caption: 'troca com colegas de estágio',
    Icon: Users,
  },
  { value: 'outro', label: 'outro', caption: 'registro avulso de campo', Icon: Sparkles },
];

interface ChoiceStepProps {
  onSelect: (value: InternshipLogType) => void;
}

/** Retorna o objeto WizardStep de escolha do tipo de registro. */
export function ChoiceStep({ onSelect }: ChoiceStepProps): WizardStep {
  return {
    id: 'tipo',
    title: 'tipo',
    headline: 'o que você quer registrar agora?',
    subtitle:
      'cada tipo tem campos próprios — escolhe o que combina com o que viveu hoje.',
    content: (
      <div className="space-y-3">
        {KINDS.map((k) => {
          const Icon = k.Icon;
          return (
            <button
              key={k.value}
              onClick={() => onSelect(k.value)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface-default border-2 border-ceci-border-default hover:border-ceci-border-brand text-left transition active:scale-[0.98] cursor-pointer shadow-sm min-h-[44px]"
            >
              <span className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span>
                <span className="block font-display font-bold text-base text-ceci-primary">
                  {k.label}
                </span>
                <span className="block text-xs text-ceci-secondary mt-0.5 leading-snug">
                  {k.caption}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    ),
  };
}
