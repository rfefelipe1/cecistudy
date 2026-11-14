// Estado visível do agente (SPEC-037 T006).
//
// O domínio devolve um rótulo (`AgentStatusLabel`); a frase vem da voz. O
// componente nunca recebe raciocínio interno bruto — só o rótulo fechado.
import React from 'react';
import { DICA, frase } from '@/lib/voice';
import type { AgentStatusLabel } from '../domain/assistedTask';

/** Rótulo → chave de voz. Exaustivo de propósito. */
const CHAVE_POR_ESTADO: Record<AgentStatusLabel, string> = {
  analisando: 'cecinhoStatusAnalisando',
  pergunta: 'cecinhoStatusPergunta',
  plano: 'cecinhoStatusPlano',
  arquivo: 'cecinhoStatusArquivo',
  sincronizando: 'cecinhoStatusSincronizando',
  concluido: 'cecinhoStatusConcluido',
  ocioso: 'cecinhoStatusOcioso',
};

const TOM_POR_ESTADO: Record<AgentStatusLabel, string> = {
  analisando: 'text-ceci-brand-strong bg-surface-rose border-ceci-border-brand',
  pergunta: 'text-status-warning-strong bg-status-warning-surface border-status-warning-border',
  plano: 'text-ceci-brand-strong bg-surface-rose border-ceci-border-brand',
  arquivo: 'text-ceci-primary bg-surface-warm border-ceci-border-gold',
  sincronizando: 'text-ceci-secondary bg-surface-muted border-ceci-border-default',
  concluido: 'text-ceci-secondary bg-surface-muted border-ceci-border-default',
  ocioso: 'text-ceci-secondary bg-surface-muted border-ceci-border-default',
};

interface CecinhoStatusPillProps {
  estado: AgentStatusLabel;
  className?: string;
}

export const CecinhoStatusPill: React.FC<CecinhoStatusPillProps> = ({ estado, className = '' }) => (
  <span
    className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${TOM_POR_ESTADO[estado]} ${className}`}
  >
    {frase(DICA, CHAVE_POR_ESTADO[estado])}
  </span>
);
