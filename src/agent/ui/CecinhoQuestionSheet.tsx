// Sheet de perguntas do Cecinho (SPEC-M-040 D2/D3/D4).
//
// Uma pergunta por etapa; a última etapa mostra o que foi digitado e confirma o
// envio. Sem atalhos de "não sei"/"depois": quem quiser responde por texto.
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { AgentQuestion } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { DICA, frase } from '@/lib/voice';

export interface CecinhoAnswer {
  questionId: string;
  answer: string;
}

export interface CecinhoQuestionSheetProps {
  open: boolean;
  /** Perguntas pendentes, na ordem da conversa. */
  questions: AgentQuestion[];
  onConfirm: (answers: CecinhoAnswer[]) => void;
  onClose: () => void;
}

const TITLE_ID = 'cecinho-sheet-titulo';

export const CecinhoQuestionSheet: React.FC<CecinhoQuestionSheetProps> = ({
  open,
  questions,
  onConfirm,
  onClose,
}) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rodada nova (ou reabertura) começa da primeira pergunta.
  const roundKey = questions.map((question) => question.id).join('|');
  useEffect(() => {
    setStep(0);
    setAnswers([]);
  }, [roundKey, open]);

  // O foco vai para o campo de cada etapa — quem abre o sheet já pode digitar.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open, step]);

  const total = questions.length;
  const confirming = step >= total;
  const current = questions[step];
  const answer = answers[step] ?? '';

  // Sem pergunta não há sheet — o chamador só abre quando há rodada pendente.
  if (total === 0) return null;

  const setAnswer = (value: string) => {
    setAnswers((previous) => {
      const next = [...previous];
      next[step] = value;
      return next;
    });
  };

  const confirm = () => {
    onConfirm(
      questions.map((question, index) => ({
        questionId: question.id,
        answer: (answers[index] ?? '').trim(),
      })),
    );
  };

  return (
    <Modal open={open} onClose={onClose} position="bottom" labelledBy={TITLE_ID} className="w-full max-w-md">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl p-5 sm:p-6 text-ceci-primary">
        <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-ceci-border-subtle">
          <div className="min-w-0">
            <h3 id={TITLE_ID} className="font-display font-bold text-base text-ceci-primary">
              {frase(DICA, confirming ? 'cecinhoSheetRevisar' : 'cecinhoSheetTitulo')}
            </h3>
            {!confirming && (
              <p className="text-[11px] text-ceci-secondary mt-0.5">
                {frase(DICA, 'cecinhoSheetProgresso', { atual: step + 1, total })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="fechar"
            className="touch-target p-1.5 rounded-full hover:bg-surface-muted text-ceci-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {confirming ? (
          <div className="space-y-4">
            <ul className="space-y-3">
              {questions.map((question, index) => (
                <li key={question.id} className="rounded-2xl border border-ceci-border-default bg-surface-subtle px-4 py-3">
                  <p className="text-[11px] text-ceci-secondary">{question.text}</p>
                  <p className="text-[12px] font-semibold text-ceci-primary mt-1 whitespace-pre-wrap">
                    {(answers[index] ?? '').trim()}
                  </p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={confirm}
              className="w-full px-4 py-3 rounded-xl bg-ceci-brand-strong text-ceci-on-brand text-[12px] font-semibold min-h-[44px] cursor-pointer"
            >
              {frase(DICA, 'cecinhoSheetConfirmar')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ceci-primary leading-relaxed">{current?.text}</p>
            <input
              ref={inputRef}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || !answer.trim()) return;
                event.preventDefault();
                setStep((currentStep) => currentStep + 1);
              }}
              placeholder={frase(DICA, 'cecinhoSheetPlaceholder')}
              aria-label={current?.text ?? 'resposta'}
              className="w-full rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2.5 text-[12px] text-ceci-primary"
            />
            <p className="text-[11px] text-ceci-secondary">{frase(DICA, 'cecinhoPerguntaAjuda')}</p>
            <button
              type="button"
              onClick={() => setStep((currentStep) => currentStep + 1)}
              disabled={!answer.trim()}
              className="w-full px-4 py-3 rounded-xl bg-ceci-brand-strong text-ceci-on-brand text-[12px] font-semibold min-h-[44px] disabled:opacity-40 cursor-pointer"
            >
              {frase(DICA, 'cecinhoSheetProxima')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
