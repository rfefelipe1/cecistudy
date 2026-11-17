// Badge de pendência da Central (SPEC-037 T009).
//
// Conta outputs não lidos + pergunta pendente. Zero não desenha nada: badge
// que aparece com "0" treina a usuária a ignorar badge.
import React from 'react';

interface CecinhoPendingBadgeProps {
  count: number;
  /** Versão compacta para a linha de tarefa da Agenda. */
  compact?: boolean;
}

export const CecinhoPendingBadge: React.FC<CecinhoPendingBadgeProps> = ({
  count,
  compact = false,
}) => {
  if (count <= 0) return null;
  const label = count === 1 ? '1 novidade do cecinho' : `${count} novidades do cecinho`;
  return (
    <span
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full bg-ceci-brand-strong text-ceci-on-brand font-bold ${
        compact ? 'min-w-[18px] h-[18px] px-1 text-[10px]' : 'min-w-[22px] h-[22px] px-1.5 text-[11px]'
      }`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
};
