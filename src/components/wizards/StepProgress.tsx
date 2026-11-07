import React from 'react';
<<<<<<< HEAD
=======
import { motion } from '../../lib/motion';
import { BASE_D, EASE } from '../../lib/motion';

export type StepProgressVariant = 'linear' | 'labeled' | 'none';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

interface StepProgressProps {
  steps: string[];
  current: number;
<<<<<<< HEAD
}

/**
 * Mapa de passos do wizard: uma linha contínua com o quanto já andou, e uma
 * pastilha com o nome do passo.
 *
 * Aqui já houve três versões. As bolinhas numeradas saíram porque eram um
 * terceiro contador de "onde estou" ao lado do "N de M" e da lista `aria-current`
 * do header. A linha segui segmentada — mas da uma leitura de "botão", e a
 * linha do texto repetia o que a pastilha já diz.
 *
 * Agora a linha é **contínua**: um trilho claro com o preenchimento rosa por
 * cima, o que importa é *quanto* já andou e não em qual botão. O nome do passo
 * vai na pastilha, encostado na ponta da barra — o olho vai lá primeiro, e o
 * "N de M" do header segue sendo o contador (a `aria-current` dos passos também
 * mora no header, na `ol` sr-only — SPEC-008 F4.7).
 */
export const StepProgress: React.FC<StepProgressProps> = ({ steps, current }) => {
  const ratio = (current / Math.max(steps.length - 1, 1)) * 100;
=======
  /** Qual indicador renderizar. `none` não renderiza nada (o header fica sozinho). */
  variant?: StepProgressVariant;
  /** Mostra o nome do passo atual ao lado da barra (modo rotulado). */
  showLabel?: boolean;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  current,
  variant = 'linear',
  showLabel = true,
}) => {
  if (variant === 'none' || steps.length === 0) return null;

  const last = steps.length - 1;
  // sem divisão por zero em fluxo de etapa única
  const ratio = last === 0 ? 100 : (current / last) * 100;
  const step = steps[current] ?? '';
  const currentStep = Math.min(Math.max(current, 0), last);
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
<<<<<<< HEAD
      aria-valuenow={current + 1}
      aria-label={`passo ${current + 1} de ${steps.length}: ${steps[current]}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-[3px] flex-1 rounded-full bg-ceci-border-subtle overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-ceci-brand transition-[width] duration-500 ease-out"
            style={{ width: `${ratio}%` }}
          />
        </div>
        <span className="shrink-0 rounded-full bg-surface-rose border border-ceci-border-brand px-2.5 py-1 text-[11px] font-semibold text-ceci-brand-strong">
          {steps[current]}
        </span>
=======
      aria-valuenow={currentStep + 1}
      aria-label={`passo ${currentStep + 1} de ${steps.length}: ${step}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-[3px] flex-1 rounded-full bg-ceci-border-subtle overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-ceci-brand"
            initial={false}
            animate={{ width: `${ratio}%` }}
            // duração de passo (não de rede), vinda dos tokens de movimento
            transition={{ duration: BASE_D.step, ease: EASE.standard }}
          />
        </div>
        {showLabel && step && (
          <span
            className="shrink-0 rounded-full bg-surface-rose border border-ceci-border-brand px-2.5 py-1 text-[11px] font-semibold text-ceci-brand-strong"
          >
            {step}
          </span>
        )}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      </div>
    </div>
  );
};
