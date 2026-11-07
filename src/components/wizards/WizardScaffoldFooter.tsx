import React from 'react';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
<<<<<<< HEAD
=======
import { frase, DICA } from '../../lib/voice';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { FixedBottomBar } from '../ui/FixedBottomBar';

interface WizardScaffoldFooterProps {
  isLast: boolean;
  hideNext: boolean;
  canConfirm: boolean;
  saving: boolean;
  saveLabel: string;
<<<<<<< HEAD
  blockedReason?: string;
  showBlockedHint: boolean;
  canNext: boolean;
  onSaveMinimal?: () => void;
  saveMinimalLabel: string;
  confirmingDiscard: boolean;
=======
  /** Texto da ação primária (sobrescreve saveLabel quando informado). */
  primaryActionLabel?: string;
  blockedReason?: string;
  showBlockedHint?: boolean;
  canNext: boolean;
  onSaveMinimal?: () => void;
  saveMinimalLabel?: string;
  confirmingDiscard?: boolean;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  onCancelDiscard: () => void;
  onPrimary: () => void;
  onClose: () => void;
  onBack: () => void;
  isFirst: boolean;
<<<<<<< HEAD
=======
  /** Modo visual do footer: standard | compact | minimal. */
  footerMode?: 'standard' | 'compact' | 'minimal';
  /** Ação secundária renderizada ao lado/abaixo da primária. */
  secondaryAction?: React.ReactNode;
  /** Modo visual do fluxo (influi na densidade do rodapé). */
  tone?: 'compact' | 'content' | 'narrative';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
}

/** Barra de ação fixa na base da tela (sticky footer). */
export const WizardScaffoldFooter: React.FC<WizardScaffoldFooterProps> = ({
  isLast,
  hideNext,
  canConfirm,
  saving,
  saveLabel,
<<<<<<< HEAD
=======
  primaryActionLabel,
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  blockedReason,
  showBlockedHint,
  canNext,
  onSaveMinimal,
<<<<<<< HEAD
  saveMinimalLabel,
  confirmingDiscard,
=======
  saveMinimalLabel = frase(DICA, 'guardarEssencial'),
  confirmingDiscard = false,
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  onCancelDiscard,
  onPrimary,
  onClose,
  onBack,
  isFirst,
<<<<<<< HEAD
}) => (
  <FixedBottomBar>
    <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex flex-col gap-1.5 px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      {/* confirmação de descarte com alteração real */}
      {confirmingDiscard ? (
        <div className="rounded-2xl bg-surface-default border border-ceci-border-default p-3 space-y-2">
          <p className="text-xs font-semibold text-ceci-primary text-center">
            tem coisas escritas aqui — sair sem guardar?
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancelDiscard}
              className="flex-1 min-h-[44px] rounded-xl bg-ceci-primary text-ceci-on-primary text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
            >
              continuar editando
            </button>
            <button
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl border border-ceci-border-default bg-surface-default text-status-danger-strong text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
            >
              descartar
            </button>
          </div>
        </div>
      ) : (
        <>
          {!hideNext && (
            <>
              <button
                onClick={onPrimary}
                disabled={!canConfirm || saving}
                className={cn(
                  'w-full min-h-[56px] rounded-[14px] text-sm font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-[0.98] cursor-pointer',
                  isLast
                    ? 'bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand'
                    : 'bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary',
                  (!canConfirm || saving) && 'opacity-40 cursor-not-allowed',
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>salvando...</span>
                  </>
                ) : isLast ? (
                  <>
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>{saveLabel}</span>
                  </>
                ) : (
                  <>
                    <span>continuar</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* motivo explicado do bloqueio — nunca um botão mudo */}
              {showBlockedHint && (
                <p className="text-[11px] text-ceci-tertiary text-center">{blockedReason}</p>
              )}

              {/* salvamento mínimo antes do fim (registro essencial) */}
              {!isLast && onSaveMinimal && canNext && (
                <button
                  onClick={onSaveMinimal}
                  className="w-full min-h-[36px] rounded-lg text-[11px] font-semibold text-ceci-academic-strong hover:bg-surface-blue transition-colors cursor-pointer"
                >
                  {saveMinimalLabel}
                </button>
              )}
            </>
          )}

          <button
            onClick={onBack}
            className="w-full min-h-[40px] rounded-xl text-xs font-medium text-ceci-tertiary hover:text-ceci-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            {isFirst ? 'cancelar' : 'voltar'}
          </button>
        </>
      )}
    </div>
  </FixedBottomBar>
);
=======
  footerMode = 'standard',
  secondaryAction,
  tone = 'compact',
}) => {
  const label = primaryActionLabel ?? (isLast ? saveLabel : 'continuar');
  const isCompact = footerMode === 'compact' || tone === 'compact';
  const isMinimal = footerMode === 'minimal';
  const padY = isMinimal ? 'pt-1.5' : isCompact ? 'pt-2' : 'pt-3';

  return (
    <FixedBottomBar>
      <div
        className={cn(
          'max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex flex-col gap-1.5 px-3.5 sm:px-5',
          padY,
          'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]',
        )}
      >
        {/* confirmação de descarte com alteração real — destrutiva, dentro do
            footer, mas com maior contraste e sem parecer mais uma etapa. */}
        {confirmingDiscard ? (
          <div className="rounded-2xl bg-surface-default border border-ceci-border-default p-3 space-y-2">
            <p className="text-xs font-semibold text-ceci-primary text-center">
              tem coisas escritas aqui — sair sem guardar?
            </p>
            <div className="flex gap-2">
              <button
                onClick={onCancelDiscard}
                className="flex-1 min-h-[44px] rounded-xl bg-ceci-primary text-ceci-on-primary text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
              >
                continuar editando
              </button>
              <button
                onClick={onClose}
                className="flex-1 min-h-[44px] rounded-xl border border-status-danger-strong bg-surface-default text-status-danger-strong text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
              >
                descartar
              </button>
            </div>
          </div>
        ) : (
          <>
            {!hideNext && (
              <>
                {/* ação primária — única, dominante, explica o efeito */}
                <button
                  onClick={onPrimary}
                  disabled={!canConfirm || saving}
                  className={cn(
                    'w-full min-h-[48px] rounded-[14px] text-sm font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-[0.98] cursor-pointer',
                    isLast
                      ? 'bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand'
                      : 'bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary',
                    (!canConfirm || saving) && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>salvando...</span>
                    </>
                  ) : (
                    <>
                      <span>{label}</span>
                      {!isLast && <ChevronRight className="w-5 h-5" />}
                    </>
                  )}
                </button>

                {/* motivo explicado do bloqueio — nunca um botão mudo */}
                {showBlockedHint && (
                  <p className="text-[11px] text-ceci-tertiary text-center">{blockedReason}</p>
                )}

                {/* ação secundária opcional (ex.: salvar essencial) */}
                {secondaryAction && <div className="w-full">{secondaryAction}</div>}

                {/* salvamento mínimo antes do fim (registro essencial) — só aparece
                    quando o wizard realmente implementa salvamento parcial. */}
                {!isLast && onSaveMinimal && canNext && (
                  <button
                    onClick={onSaveMinimal}
                    className="w-full min-h-[36px] rounded-lg text-[11px] font-semibold text-ceci-academic-strong hover:bg-surface-blue transition-colors cursor-pointer"
                  >
                    {saveMinimalLabel}
                  </button>
                )}
              </>
            )}

            {/* voltar e cancelar são ações distintas, nunca o mesmo botão com rótulo
                trocado. `voltar` (etapa > 0) retrocede; `cancelar` (etapa 0) fecha
                o fluxo e, se houver alteração, dispara a confirmação de descarte. */}
            <button
              onClick={onBack}
              className={cn(
                'w-full min-h-[40px] rounded-xl text-xs font-medium transition-colors cursor-pointer active:scale-[0.98]',
                isFirst
                  ? // cancelar: mais evidente quando há alteração real (descarte)
                    'text-status-danger-strong border border-status-danger-strong/20 hover:bg-surface-rose'
                  : // voltar: neutro, secundário
                    'text-ceci-tertiary hover:text-ceci-primary hover:bg-surface-muted',
              )}
            >
              {isFirst ? 'cancelar' : 'voltar'}
            </button>
          </>
        )}
      </div>
    </FixedBottomBar>
  );
};
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
