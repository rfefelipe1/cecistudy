import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
<<<<<<< HEAD
=======
import { cn } from '../../lib/utils';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { stepVariants } from '../../lib/motion';
import { Mascote, type MascoteExpression } from '../ui/Mascote';
import { WizardScaffoldHeader } from './WizardScaffoldHeader';
import { WizardScaffoldFooter } from './WizardScaffoldFooter';
<<<<<<< HEAD
import { StepProgress } from './StepProgress';
=======
import { frase, DICA } from '../../lib/voice';

export type WizardTone = 'compact' | 'content' | 'narrative';
export type WizardProgress = 'linear' | 'labeled' | 'none';
export type WizardMascoteSize = 'none' | 'small' | 'medium' | 'large';
export type WizardFooterMode = 'standard' | 'compact' | 'minimal';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

export interface WizardStep {
  id: string;
  title: string;
  /** Pergunta direta exibida em destaque no topo do passo (título em vez de rótulo de campo). */
  headline?: string;
  /** Microlinha de apoio logo abaixo do headline, explicando o propósito do passo. */
  subtitle?: string;
  content: React.ReactNode;
}

interface WizardScaffoldProps {
  /** Título exibido no header (ex.: "novo conceito"). */
  title: string;
  subtitle?: string;
  /** Ícone decorativo do header. */
  icon: React.ReactNode;
  /** Classes do badge do ícone (ex.: bg-surface-rose border-ceci-border-brand text-ceci-brand-strong). */
  iconClass?: string;
  steps: WizardStep[];
  step: number;
  onStepChange: (step: number) => void;
  /** Habilita o botão "continuar" (validação do step atual). */
  canNext?: boolean;
  /**
   * Motivo pelo qual o passo atual não pode avançar — exibido abaixo do botão
   * desabilitado (§5.1: "o botão não deve ficar silenciosamente desabilitado").
   */
  blockedReason?: string;
  /** Habilita o botão "guardar" no último step (default: canNext). */
  canSave?: boolean;
  /** Esconde o botão principal (usado em steps de escolha, ex.: tarefa × prova). */
  hideNext?: boolean;
  saveLabel?: string;
  onSave: () => void;
  onClose: () => void;
  /** Mascotinha ao lado do título (companhia da usuária no fluxo). */
  mascote?: MascoteExpression;
<<<<<<< HEAD
=======
  /** Tamanho do mascote; quando não informado, deriva do tom. */
  mascoteSize?: WizardMascoteSize;
  /** Modo visual declarativo do fluxo. */
  tone?: WizardTone;
  /** Qual indicador de progresso mostrar (sempre um só, nunca dois). */
  progress?: WizardProgress;
  /** Modo visual do footer. */
  footerMode?: WizardFooterMode;
  /** Texto da ação primária (sobrescreve saveLabel). */
  primaryActionLabel?: string;
  /** Ação secundária opcional renderizada ao lado da primária. */
  secondaryAction?: React.ReactNode;
  /** id do primeiro campo inválido: recebe foco quando o avanço é bloqueado. */
  invalidFieldId?: string;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  /** Mostra estado "salvando..." e impede duplo envio (§5.1). */
  saving?: boolean;
  /** Exibe o indicador "2 de 4" ao lado do título (default: true). */
  showStepCount?: boolean;
  /**
   * Ação de salvamento mínimo disponível antes do último passo
   * (§5.7: registro essencial salvável sozinho).
   */
  onSaveMinimal?: () => void;
  saveMinimalLabel?: string;
  /**
   * Confirma descarte ao fechar somente quando há alteração real
   * (§5.1: "fechamento: confirmar descarte apenas se houver alteração real").
   */
  isDirty?: boolean;
}

<<<<<<< HEAD
=======
const MASCOTE_SIZE_CLASS: Record<WizardMascoteSize, string> = {
  none: 'hidden',
  small: 'w-10 h-10 shrink-0 object-contain',
  medium: 'w-16 h-16 shrink-0 object-contain',
  large: 'w-20 h-20 shrink-0 object-contain',
};

/** Caso o tamanho não seja informado, o tom define o padrão (§5.1 a 5.3). */
function defaultMascoteSize(tone: WizardTone): WizardMascoteSize {
  if (tone === 'compact') return 'none';
  if (tone === 'narrative') return 'medium';
  return 'small';
}

>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
export const WizardScaffold: React.FC<WizardScaffoldProps> = ({
  title,
  subtitle,
  icon,
  iconClass,
  steps,
  step,
  onStepChange,
  canNext = true,
  blockedReason,
  canSave,
  hideNext = false,
  saveLabel = 'guardar ♡',
  onSave,
  onClose,
  mascote = 'writing-note',
<<<<<<< HEAD
  saving = false,
  showStepCount = true,
  onSaveMinimal,
  saveMinimalLabel = 'guardar só o essencial ♡',
=======
  mascoteSize,
  tone = 'compact',
  progress = 'linear',
  footerMode = 'standard',
  primaryActionLabel,
  secondaryAction,
  invalidFieldId,
  saving = false,
  showStepCount = true,
  onSaveMinimal,
  saveMinimalLabel = frase(DICA, 'guardarEssencial'),
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  isDirty = false,
}) => {
  const dirRef = useRef<number>(1);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const isLast = step === steps.length - 1;
  const canConfirm = isLast ? (canSave ?? canNext) : canNext;
<<<<<<< HEAD
=======
  const size = mascoteSize ?? defaultMascoteSize(tone);
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

  /**
   * O foco vai para a pergunta do passo (SPEC-008 F4.7).
   *
   * Trocar de passo substitui o conteúdo inteiro por baixo do dedo/teclado: sem
   * isto, quem navega por teclado continua "dentro" de um botão que sumiu (o foco
   * cai no `body` e o leitor de tela anuncia o cabeçalho do app inteiro). O
   * `h2` da pergunta é o alvo natural — é a primeira coisa nova da tela.
   *
   * Só depois do primeiro passo, para não roubar o foco de quem acabou de abrir
   * o wizard por um clique num botão que agora é outro.
   */
  useEffect(() => {
    if (step > 0) headlineRef.current?.focus();
  }, [step]);

<<<<<<< HEAD
=======
  // Quando o avanço é bloqueado por validação, leva o foco ao primeiro campo
  // inválido declarado pelo passo (sem movimentação excessiva).
  useEffect(() => {
    if (!canConfirm && invalidFieldId) {
      const el = document.getElementById(invalidFieldId);
      if (el) el.focus();
    }
  }, [!canConfirm, invalidFieldId]);

>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    dirRef.current = clamped > step ? 1 : -1;
    onStepChange(clamped);
  };

  const requestClose = () => {
    if (isDirty && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  const handleNext = () => {
    if (saving) return;
    if (isLast) onSave();
    else goTo(step + 1);
  };

  const showBlockedHint = !hideNext && !canConfirm && !!blockedReason && !confirmingDiscard;

  return (
    <div className="min-h-[70vh] flex flex-col pb-44">
<<<<<<< HEAD
      {/* Header */}
=======
      {/* Header fixo do fluxo — único indicador de progresso vive aqui. */}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      <WizardScaffoldHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconClass={iconClass}
        step={step}
        stepTitles={steps.map((s) => s.title)}
        stepsLength={steps.length}
<<<<<<< HEAD
        showStepCount={showStepCount}
        isLast={isLast}
        onBack={requestClose}
      />

      {/* Corpo — um passo por vez, com pergunta em destaque. Troca CONCORRENTE
          (popLayout): o passo que sai desliza enquanto o novo entra — sem o
          "vazio" do mode="wait" entre passos. */}
      <div className="flex-1 pt-4">
        <StepProgress steps={steps.map((s) => s.title)} current={step} />
=======
        showStepCount={showStepCount && progress !== 'none'}
        progress={progress}
        currentStepTitle={steps[step]?.title}
        isLast={isLast}
        tone={tone}
        onBack={requestClose}
      />

      {/* Corpo — um passo por vez, rolagem apenas no conteúdo. */}
      <div className="flex-1 pt-4">
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
        <AnimatePresence mode="popLayout" initial={false} custom={dirRef.current}>
          <motion.div
            key={steps[step].id}
            custom={dirRef.current}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {(steps[step].headline || steps[step].subtitle) && (
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  {steps[step].headline && (
                    <h2
                      ref={headlineRef}
                      tabIndex={-1}
                      className="font-display font-bold text-[22px] sm:text-[26px] leading-[1.18] text-ceci-primary focus:outline-none"
                    >
                      {steps[step].headline}
                    </h2>
                  )}
                  {steps[step].subtitle && (
                    <p className="mt-2 text-[12px] text-ceci-secondary leading-relaxed">
                      {steps[step].subtitle}
                    </p>
                  )}
                </div>
<<<<<<< HEAD
                <Mascote
                  expression={mascote}
                  decorative
                  className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 object-contain -mt-0.5 drop-shadow-sm"
                />
=======
                {size !== 'none' && (
                  <Mascote
                    expression={mascote}
                    decorative
                    className={cn(MASCOTE_SIZE_CLASS[size], '-mt-0.5 drop-shadow-sm')}
                  />
                )}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
              </div>
            )}
            <div className="pt-4">{steps[step].content}</div>
          </motion.div>
        </AnimatePresence>
      </div>

<<<<<<< HEAD
      {/* Barra de ação fixa na base da tela (sticky footer) */}
=======
      {/* Barra de ação fixa na base da tela (sticky footer). */}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      <WizardScaffoldFooter
        isLast={isLast}
        hideNext={hideNext}
        canConfirm={canConfirm}
        saving={saving}
        saveLabel={saveLabel}
<<<<<<< HEAD
=======
        primaryActionLabel={primaryActionLabel}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
        blockedReason={blockedReason}
        showBlockedHint={showBlockedHint}
        canNext={canNext}
        onSaveMinimal={onSaveMinimal}
        saveMinimalLabel={saveMinimalLabel}
        confirmingDiscard={confirmingDiscard}
        onCancelDiscard={() => setConfirmingDiscard(false)}
        onPrimary={handleNext}
        onClose={onClose}
        onBack={() => (step === 0 ? requestClose() : goTo(step - 1))}
        isFirst={step === 0}
<<<<<<< HEAD
=======
        footerMode={footerMode}
        secondaryAction={secondaryAction}
        tone={tone}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      />
    </div>
  );
};
