// Mensagem da conversa (SPEC-037 T007 · SPEC-M-040 D2).
//
// Cada `kind` tem render próprio; nenhum deles lê raciocínio interno. A pergunta
// é respondida no sheet (`CecinhoQuestionSheet`), nunca aqui — a bolha mostra a
// pergunta e, depois, o que já foi respondido.
//
// Layout de chat: a fala do agente é texto aberto (sem caixa), ancorada pelo
// selo do cecinho; a da usuária é bolha à direita. `first`/`last` vêm do
// agrupamento do pai — o selo e o horário aparecem uma vez por grupo, não em
// cada balão.
import React from 'react';
import { AlertCircle, ArrowUpRight, FileText } from 'lucide-react';
import type { AgentMessage } from '@/types';
import { DICA, frase } from '@/lib/voice';
import { StreamingMessage } from './StreamingMessage';

interface CecinhoMessageProps {
  message: AgentMessage;
  /** Revela a resposta aos poucos — só a que acabou de chegar (D6). */
  streaming?: boolean;
  onStreamDone?: () => void;
  /** Reabre o sheet quando a pergunta pendente foi dispensada. */
  onOpenAnswers?: () => void;
  onOpenArtifact?: (artifactId: string) => void;
  /** Primeira fala do grupo: mostra o selo do cecinho. */
  first?: boolean;
  /** Última fala do grupo: mostra o horário. */
  last?: boolean;
}

/** "14:32" — horário curto, como em qualquer conversa. */
const horaDe = (iso: string): string => {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const Selo: React.FC = () => (
  <span
    aria-hidden="true"
    className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[9px] bg-ceci-brand-strong font-display text-[12px] font-bold text-ceci-on-brand"
  >
    c
  </span>
);

export const CecinhoMessage: React.FC<CecinhoMessageProps> = ({
  message,
  streaming = false,
  onStreamDone,
  onOpenAnswers,
  onOpenArtifact,
  first = true,
  last = true,
}) => {
  const isUser = message.role === 'user';
  const answered = message.kind === 'question' ? message.question?.answerKind : undefined;
  const hora = last ? horaDe(message.createdAt) : '';
  const pendente = message.kind === 'question' && answered === undefined;

  if (message.kind === 'activity') {
    return (
      <p className="px-2 text-center text-[11px] italic text-ceci-tertiary">{message.content}</p>
    );
  }

  if (message.kind === 'error') {
    return (
      <div className="flex items-start gap-2.5">
        <div className="w-[26px] shrink-0" />
        <div className="flex flex-1 items-start gap-2 rounded-[16px] border border-status-danger-border bg-status-danger-surface px-3.5 py-2.5">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-status-danger-strong"
            aria-hidden="true"
          />
          <p className="text-[13px] leading-relaxed text-ceci-primary">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[82%] rounded-[18px] rounded-br-[6px] bg-ceci-brand-strong px-3.5 py-2 text-ceci-on-brand shadow-2xs">
          <p className="whitespace-pre-wrap text-[14px] leading-[1.55]">{message.content}</p>
        </div>
        {hora && <span className="pr-1 text-[10px] text-ceci-tertiary">{hora}</span>}
      </div>
    );
  }

  // Pergunta é o momento que pede ação: ganha cartão próprio, não texto solto.
  if (pendente) {
    return (
      <div className="flex items-start gap-2.5">
        {first ? <Selo /> : <div className="w-[26px] shrink-0" />}
        <div className="min-w-0 flex-1 rounded-[18px] rounded-tl-[6px] border border-ceci-border-brand bg-surface-rose px-3.5 py-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ceci-brand-strong">
            pergunta
          </p>
          <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-ceci-primary">
            {message.content}
          </p>
          {onOpenAnswers && (
            <button
              type="button"
              onClick={onOpenAnswers}
              className="mt-2.5 inline-flex min-h-[36px] items-center gap-1 rounded-full bg-ceci-brand-strong px-3.5 text-[12px] font-semibold text-ceci-on-brand transition active:scale-[0.98] cursor-pointer"
            >
              {frase(DICA, 'cecinhoPerguntaResponder')}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          {hora && <span className="mt-2 block text-[10px] text-ceci-tertiary">{hora}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      {first ? <Selo /> : <div className="w-[26px] shrink-0" />}
      <div className="min-w-0 flex-1">
        {message.kind === 'plan' && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ceci-brand-strong">
            plano
          </p>
        )}

        <p className="whitespace-pre-wrap text-[14px] leading-[1.65] text-ceci-primary">
          {message.kind === 'text' ? (
            <StreamingMessage
              content={message.content}
              streaming={streaming}
              onDone={onStreamDone}
            />
          ) : (
            message.content
          )}
        </p>

        {message.kind === 'artifact' && (
          <button
            type="button"
            onClick={() => message.artifactId && onOpenArtifact?.(message.artifactId)}
            className="mt-2 inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-ceci-border-default bg-surface-default px-3 text-[12px] font-semibold text-ceci-brand-strong transition active:scale-[0.98] cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            abrir arquivo
          </button>
        )}

        {answered === 'texto' && message.question?.answer && (
          <p className="mt-1.5 text-[12px] italic text-ceci-tertiary">
            respondi: {message.question.answer}
          </p>
        )}
        {answered === 'nao_sei' && (
          <p className="mt-1.5 text-[12px] italic text-ceci-tertiary">respondi: não sei</p>
        )}
        {answered === 'depois' && (
          <p className="mt-1.5 text-[12px] italic text-ceci-tertiary">respondi: depois</p>
        )}

        {hora && <span className="mt-1 block text-[10px] text-ceci-tertiary">{hora}</span>}
      </div>
    </div>
  );
};
