import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BASE_D, EASE } from '../../lib/motion';
import { cn } from '../../lib/utils';

<<<<<<< HEAD
=======
export type WizardProgress = 'linear' | 'labeled' | 'none';

>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
interface WizardScaffoldHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconClass?: string;
  step: number;
  /** Rótulos dos passos, para a lista acessível (`aria-current="step"`, SPEC-008 F4.7). */
  stepTitles?: string[];
  stepsLength: number;
  showStepCount: boolean;
<<<<<<< HEAD
  isLast: boolean;
=======
  /** Qual indicador de progresso renderizar (sempre um só, nunca dois). */
  progress?: WizardProgress;
  /** Título do passo atual, usado no modo rotulado e anunciado ao leitor de tela. */
  currentStepTitle?: string;
  isLast: boolean;
  /** Modo visual: compacto | conteúdo | narrativo. */
  tone?: 'compact' | 'content' | 'narrative';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  onBack: () => void;
}

/** Lista de passos só para leitor de tela — o indicador visual é o "N de M". */
const STEP_LIST_CLASS =
  'sr-only absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]';

/** Cabeçalho fixo do wizard: voltar, título + mascote-badge, etapa e progresso. */
export const WizardScaffoldHeader: React.FC<WizardScaffoldHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconClass,
  step,
  stepTitles,
  stepsLength,
  showStepCount,
<<<<<<< HEAD
  isLast,
  onBack,
}) => (
  <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
    <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex items-center justify-between gap-2">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-2xl bg-surface-default border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition active:scale-95 cursor-pointer"
        title="voltar"
        aria-label={isLast ? 'voltar' : 'cancelar'}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            'w-7 h-7 rounded-xl border flex items-center justify-center shrink-0',
            iconClass ?? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 text-center">
          <h1 className="font-display font-bold text-sm text-ceci-primary truncate leading-tight">
            {title}
          </h1>
          {subtitle && <p className="text-[11px] text-ceci-secondary truncate">{subtitle}</p>}
        </div>
      </div>

      {/* indicador de etapa — "a usuária sabe em que passo está" */}
      {showStepCount && (
        <span
          className="w-9 h-9 shrink-0 flex items-center justify-center text-[10px] font-bold text-ceci-tertiary tabular-nums"
          aria-label={`etapa ${step + 1} de ${stepsLength}`}
        >
          {step + 1}/{stepsLength}
        </span>
      )}
      {!showStepCount && <span className="w-9 h-9 shrink-0" aria-hidden />}
    </div>

    {/* Barra de progresso linear fina (o único indicador de progresso) */}
    <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto mt-3 h-0.5 rounded-full bg-ceci-border-subtle overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-ceci-brand-strong"
        initial={false}
        animate={{ width: `${((step + 1) / stepsLength) * 100}%` }}
        // Tokens de movimento (SPEC-007 §D6): a barra é um indicador de **passo**
        // de wizard, então `BASE_D.step` + `EASE.standard` — o literal
        // `duration: 0.35` vivia aqui desde antes do gate e não tinha dono.
        transition={{ duration: BASE_D.step, ease: EASE.standard }}
      />
    </div>

    {/*
      Lista de passos acessível (SPEC-008 F4.7). O contador "2 de 4" é um único
      `span` com `aria-label`: ele diz *quantos*, não *qual*. Um leitor de tela
      que chega no meio do passo 1 ouve "virar o semestre", a pergunta e o
      conteúdo, e não sabe se é o primeiro de quatro ou o último. Esta `ol` dá a
      estrutura completa com `aria-current="step"` no passo atual.
    */}
    {stepTitles && stepTitles.length > 1 && (
      <ol className={STEP_LIST_CLASS}>
        {stepTitles.map((t, i) => (
          <li key={`${t}-${i}`} aria-current={i === step ? 'step' : undefined}>
            {t}
          </li>
        ))}
      </ol>
    )}
  </div>
);
=======
  progress = 'linear',
  currentStepTitle,
  isLast,
  tone = 'compact',
  onBack,
}) => {
  const showCounter = showStepCount && progress !== 'none';
  const showBar = progress !== 'none';
  const ratio = stepsLength > 0 ? ((step + 1) / stepsLength) * 100 : 0;

  return (
    <div
      className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle"
    >
      <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex items-center justify-between gap-2">
        {/* Botão de retorno — alvo de toque mínimo 44 × 44 px. */}
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-surface-default border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition active:scale-95 cursor-pointer"
          title={isLast ? 'voltar' : 'cancelar'}
          aria-label={isLast ? 'voltar etapa' : 'cancelar fluxo'}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'w-7 h-7 rounded-xl border flex items-center justify-center shrink-0',
              iconClass ?? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
            )}
          >
            {icon}
          </span>
          <div className="min-w-0 text-center">
            <h1
              className={cn(
                'font-display font-bold text-ceci-primary leading-tight',
                // no modo narrativo o título pode ocupar duas linhas; nos demais,
                // trunca sem deslocar o contador do lado.
                tone === 'narrative' ? 'text-sm sm:text-base' : 'text-sm truncate',
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p className={cn('text-[11px] text-ceci-secondary', tone === 'narrative' ? '' : 'truncate')}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* único indicador de progresso: contador + (opcional) barra fina */}
        {showCounter && (
          <span
            className="w-9 h-9 shrink-0 flex items-center justify-center text-[10px] font-bold text-ceci-tertiary tabular-nums"
            aria-label={`etapa ${step + 1} de ${stepsLength}`}
          >
            {step + 1}/{stepsLength}
          </span>
        )}
        {!showCounter && <span className="w-9 h-9 shrink-0" aria-hidden />}
      </div>

      {showBar && (
        <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto mt-3 h-0.5 rounded-full bg-ceci-border-subtle overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-ceci-brand-strong"
            initial={false}
            animate={{ width: `${ratio}%` }}
            // Barra de passo do wizard (não é carregamento de rede): duração curta
            // e discreta, vinda dos tokens de movimento.
            transition={{ duration: BASE_D.step, ease: EASE.standard }}
          />
        </div>
      )}

      {/* Modo rotulado: nome do passo atual abaixo do contador, discreto. */}
      {progress === 'labeled' && currentStepTitle && (
        <p className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto mt-2 text-[11px] text-ceci-tertiary text-center leading-snug">
          etapa {step + 1} de {stepsLength}: {currentStepTitle}
        </p>
      )}

      {/* Lista de passos acessível (SPEC-008 F4.7). Estrutura completa com
          aria-current no passo atual; o contador "N de M" diz quantos, esta lista
          diz qual. */}
      {stepTitles && stepTitles.length > 1 && (
        <ol className={STEP_LIST_CLASS}>
          {stepTitles.map((t, i) => (
            <li key={`${t}-${i}`} aria-current={i === step ? 'step' : undefined}>
              {t}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
