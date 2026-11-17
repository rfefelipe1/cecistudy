// Resposta streamada (SPEC-M-040 D6).
//
// Híbrido por decisão: quem manda o texto é a cadeia (o polling entrega o
// conteúdo inteiro de uma vez); aqui só há o passo mínimo de UI para o texto
// não aparecer de estalo. Nada é interpretado como HTML.
import React, { useEffect, useRef, useState } from 'react';

const TICK_MS = 24;
/** Em quantos passos o texto aparece — ~1 s de leitura, qualquer tamanho. */
const TICKS = 40;

export interface StreamingMessageProps {
  content: string;
  streaming?: boolean;
  /** Chamado quando a revelação termina. */
  onDone?: () => void;
  className?: string;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  streaming = false,
  onDone,
  className,
}) => {
  const [shown, setShown] = useState(() => (streaming ? 0 : content.length));
  // A flag pode chegar um render depois do texto; sem isto a revelação começaria
  // no fim e o envio destravaria na hora.
  const wasStreaming = useRef(streaming);

  useEffect(() => {
    if (!streaming) {
      wasStreaming.current = false;
      setShown(content.length);
      return;
    }
    if (!wasStreaming.current) {
      wasStreaming.current = true;
      setShown(0);
      return;
    }
    if (shown >= content.length) {
      onDone?.();
      return;
    }
    const step = Math.max(1, Math.ceil(content.length / TICKS));
    const id = window.setTimeout(() => {
      setShown((current) => Math.min(content.length, current + step));
    }, TICK_MS);
    return () => window.clearTimeout(id);
  }, [shown, streaming, content, onDone]);

  const revealing = streaming && shown < content.length;

  return (
    <span className={className}>
      <span className="whitespace-pre-wrap">{content.slice(0, shown)}</span>
      {revealing && (
        <span
          aria-hidden="true"
          className="inline-block w-[2px] h-[1em] align-[-2px] ml-0.5 bg-current animate-pulse"
        />
      )}
    </span>
  );
};
