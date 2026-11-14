// Mensagem da conversa (SPEC-037 T007).
//
// Cada `kind` tem render próprio; nenhum deles lê raciocínio interno. A pergunta
// aceita texto, "não sei" e "depois" — as duas últimas são respostas válidas
// (D4) e não bloqueiam o plano.
import React, { useState } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import type { AgentMessage, AgentQuestion } from '@/types';
import { DICA, frase } from '@/lib/voice';

interface CecinhoMessageProps {
  message: AgentMessage;
  onAnswer?: (
    message: AgentMessage,
    answer: string,
    kind: NonNullable<AgentQuestion['answerKind']>,
  ) => void;
  onOpenArtifact?: (artifactId: string) => void;
}

const ANSWER_KIND = {
  naoSei: 'nao_sei',
  depois: 'depois',
} as const;

export const CecinhoMessage: React.FC<CecinhoMessageProps> = ({
  message,
  onAnswer,
  onOpenArtifact,
}) => {
  const [draft, setDraft] = useState('');
  const isUser = message.role === 'user';
  const pending = message.kind === 'question' && message.question?.answerKind === undefined;

  if (message.kind === 'activity') {
    return (
      <p className="text-[11px] text-ceci-tertiary italic px-2">{message.content}</p>
    );
  }

  if (message.kind === 'error') {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-status-danger-border bg-status-danger-surface px-3.5 py-2.5">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-status-danger-strong" aria-hidden="true" />
        <p className="text-[12px] text-ceci-primary leading-relaxed">{message.content}</p>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? 'bg-ceci-brand-strong text-ceci-on-brand'
            : 'bg-surface-default border border-ceci-border-default text-ceci-primary'
        }`}
      >
        {message.kind === 'plan' && (
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
            plano
          </p>
        )}
        <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {message.kind === 'artifact' && (
          <button
            type="button"
            onClick={() => message.artifactId && onOpenArtifact?.(message.artifactId)}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold underline cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            abrir arquivo
          </button>
        )}

        {pending && onAnswer && (
          <div className="mt-2.5 space-y-2">
            <p className="text-[11px] opacity-80">{frase(DICA, 'cecinhoPerguntaAjuda')}</p>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="sua resposta"
                aria-label="resposta da pergunta"
                className="min-w-0 flex-1 rounded-xl border border-ceci-border-default bg-surface-default text-ceci-primary px-3 py-2 text-[12px]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!draft.trim()) return;
                  onAnswer(message, draft.trim(), 'texto');
                  setDraft('');
                }}
                className="px-3 py-2 rounded-xl bg-ceci-brand-strong text-ceci-on-brand text-[11px] font-semibold cursor-pointer"
              >
                enviar
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onAnswer(message, '', ANSWER_KIND.naoSei)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-ceci-border-default bg-surface-default text-ceci-secondary cursor-pointer"
              >
                não sei
              </button>
              <button
                type="button"
                onClick={() => onAnswer(message, '', ANSWER_KIND.depois)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-ceci-border-default bg-surface-default text-ceci-secondary cursor-pointer"
              >
                depois
              </button>
            </div>
          </div>
        )}

        {message.kind === 'question' && !pending && message.question?.answer && (
          <p className="mt-1.5 text-[11px] opacity-80">
            {message.question.answerKind === 'nao_sei' ? 'respondi: não sei' : null}
            {message.question.answerKind === 'depois' ? 'respondi: depois' : null}
            {message.question.answerKind === 'texto' ? `respondi: ${message.question.answer}` : null}
          </p>
        )}
      </div>
    </div>
  );
};
