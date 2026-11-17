// "Pensando…" da bolha do agente (SPEC-M-040 D5).
//
// Adaptado do `thinking-loader` de terceiro: spinner de oito raios, rótulo que
// rola entre fases e vira check quando termina. Sem dependência nova — o
// `pill` é Tailwind e o resto é um `<style>` injetado uma vez pelo React 19.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DICA, frase } from '@/lib/voice';

export interface ThinkingLoaderProps {
  /** Fases, uma por vez. Padrão: "pensando…". */
  phases?: readonly string[];
  /** Tempo de cada fase, em ms. */
  interval?: number;
  /** Terminou: o spinner vira check. */
  done?: boolean;
  /** `pill` = cápsula com borda; `plain` = só spinner e rótulo (dentro da bolha). */
  variant?: 'pill' | 'plain';
  className?: string;
}

const RAYS = [0, 1, 2, 3, 4, 5, 6, 7];
const FASE_PADRAO: readonly string[] = [frase(DICA, 'cecinhoPensando')];

export const ThinkingLoader: React.FC<ThinkingLoaderProps> = ({
  phases = FASE_PADRAO,
  interval = 2200,
  done = false,
  variant = 'plain',
  className,
}) => {
  const labels = phases.length > 0 ? phases : FASE_PADRAO;
  const [step, setStep] = useState(0);
  const label = done
    ? frase(DICA, 'cecinhoPensandoPronto')
    : (labels[Math.min(step, labels.length - 1)] ?? FASE_PADRAO[0]!);

  useEffect(() => {
    if (done || labels.length < 2) return;
    const id = window.setInterval(() => {
      setStep((current) => (current + 1 < labels.length ? current + 1 : current));
    }, Math.max(interval, 200));
    return () => window.clearInterval(id);
  }, [done, interval, labels.length]);

  // O rótulo que sai e o que entra são trocados durante o render para os dois
  // animarem no mesmo frame (mesmo padrão do componente original).
  const [shown, setShown] = useState({ key: 0, text: label });
  const [leaving, setLeaving] = useState<{ key: number; text: string } | null>(null);
  if (label !== shown.text) {
    setLeaving(shown);
    setShown({ key: shown.key + 1, text: label });
  }

  // A caixa de texto acompanha a largura do rótulo novo, então a cápsula desliza.
  const box = useRef<HTMLSpanElement>(null);
  const current = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (box.current && current.current) {
      box.current.style.width = `${current.current.scrollWidth}px`;
    }
  }, [shown.key]);

  return (
    <span
      className={['ui-tl inline-flex items-center gap-[7px] max-w-full text-[11px]', className]
        .filter(Boolean)
        .join(' ')}
      data-variant={variant}
      data-done={done || undefined}
      role="status"
      aria-live="polite"
    >
      {/* React 19 hoista este style para o <head> uma vez, mesmo com vários loaders. */}
      <style href="ui-thinking-loader" precedence="default">
        {css}
      </style>

      <span className="ui-tl__icon" aria-hidden="true">
        <svg className="ui-tl__spinner" viewBox="0 0 16 16">
          {RAYS.map((ray) => (
            <line
              key={ray}
              x1="8"
              y1="1.75"
              x2="8"
              y2="4.75"
              transform={`rotate(${ray * 45} 8 8)`}
              style={{ animationDelay: `${(ray - 8) * 100}ms` }}
            />
          ))}
        </svg>
        <svg className="ui-tl__check" viewBox="0 0 16 16">
          <path d="M3.5 8.4 6.6 11.3 12.5 4.9" pathLength={1} />
        </svg>
      </span>

      <span ref={box} className="ui-tl__text">
        {leaving && (
          <span
            key={leaving.key}
            className="ui-tl__label ui-tl__label--out"
            aria-hidden="true"
            onAnimationEnd={() => setLeaving(null)}
          >
            {leaving.text}
          </span>
        )}
        <span
          key={shown.key}
          ref={current}
          className={['ui-tl__label', shown.key > 0 && 'ui-tl__label--in', !done && 'ui-tl__shine']
            .filter(Boolean)
            .join(' ')}
          data-text={shown.text}
          title={shown.text}
        >
          {shown.text}
        </span>
      </span>
    </span>
  );
};

const css = /* css */ `
.ui-tl { color: inherit; line-height: 1; vertical-align: middle; }
.ui-tl[data-variant="pill"] {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--color-ceci-border-default, #e7e7e7);
}
.ui-tl__icon { position: relative; flex: none; width: 13px; height: 13px; }
.ui-tl__icon svg {
  position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible;
  transition: opacity 240ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}
.ui-tl__spinner line {
  stroke: currentColor; stroke-width: 1.6; stroke-linecap: round;
  opacity: 0.2; animation: ui-tl-ray 800ms linear infinite;
}
.ui-tl__check {
  opacity: 0; transform: scale(0.6); fill: none; stroke: currentColor;
  stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
}
.ui-tl__check path { stroke-dasharray: 1; stroke-dashoffset: 1; }
.ui-tl[data-done] .ui-tl__spinner { opacity: 0; transform: scale(0.6) rotate(-45deg); }
.ui-tl[data-done] .ui-tl__check { opacity: 1; transform: none; }
.ui-tl[data-done] .ui-tl__check path { animation: ui-tl-draw 360ms cubic-bezier(0.22, 1, 0.36, 1) 120ms forwards; }
.ui-tl__text {
  position: relative; display: block; min-width: 0; height: 1.3em; overflow: hidden;
  transition: width 420ms cubic-bezier(0.22, 1, 0.36, 1);
}
.ui-tl__label { position: absolute; top: 0; left: 0; line-height: 1.3em; white-space: nowrap; }
.ui-tl__label--in { animation: ui-tl-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.ui-tl__label--out { animation: ui-tl-out 300ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.ui-tl__shine::after {
  content: attr(data-text); position: absolute; inset: 0; white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, rgba(255, 255, 255, 0.85) 50%, transparent 62%) 100% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text; background-clip: text;
  animation: ui-tl-sweep 1.8s linear infinite; pointer-events: none;
}
@keyframes ui-tl-ray { 0% { opacity: 1; } 100% { opacity: 0.2; } }
@keyframes ui-tl-in {
  from { opacity: 0; transform: translateY(70%); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-tl-out {
  from { opacity: 1; transform: none; filter: none; }
  to { opacity: 0; transform: translateY(-70%); filter: blur(3px); }
}
@keyframes ui-tl-draw { to { stroke-dashoffset: 0; } }
@keyframes ui-tl-sweep { from { background-position: 100% 0; } to { background-position: 0% 0; } }
@media (prefers-reduced-motion: reduce) {
  .ui-tl *, .ui-tl *::after {
    animation-duration: 1ms !important; animation-delay: 0ms !important;
    animation-iteration-count: 1 !important; transition-duration: 1ms !important;
  }
  .ui-tl__spinner line { opacity: 0.6; }
  .ui-tl__shine::after { display: none; }
  .ui-tl__check path { stroke-dashoffset: 0; }
}
`;
