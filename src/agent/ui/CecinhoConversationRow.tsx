// Linha de conversa da Central (SPEC-037 T006).
//
// Mostra a tarefa, o contexto, o estado traduzido, a última mensagem e o que
// ainda não foi lido. Nada de raciocínio interno: `activity` é rótulo curto.
import React from 'react';
import type { AgentConversation, AssistedTask, Task } from '@/types';
import { lastMessage } from '../domain/conversation';
import type { AgentStatusLabel } from '../domain/assistedTask';
import { CecinhoPendingBadge } from './CecinhoPendingBadge';
import { CecinhoStatusPill } from './CecinhoStatusPill';

interface CecinhoConversationRowProps {
  assisted: AssistedTask;
  conversation: AgentConversation | undefined;
  task: Task | undefined;
  courseName?: string;
  estado: AgentStatusLabel;
  onOpen: () => void;
}

function preview(conversation: AgentConversation | undefined): string {
  const message = conversation ? lastMessage(conversation.messages) : undefined;
  if (!message) return '';
  if (message.kind === 'plan') return 'plano pronto para revisar';
  if (message.kind === 'artifact') return 'arquivo pronto';
  if (message.kind === 'question') return message.question?.text ?? message.content;
  return message.content;
}

function shortDate(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export const CecinhoConversationRow: React.FC<CecinhoConversationRowProps> = ({
  assisted,
  conversation,
  task,
  courseName,
  estado,
  onOpen,
}) => {
  const title = task?.title ?? assisted.taskId;
  const meta = [courseName, task?.category].filter(Boolean).join(' · ');
  const unread = assisted.unreadOutput + (assisted.pendingQuestion ? 1 : 0);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-2xl border border-ceci-border-default bg-surface-default px-3.5 py-3 hover:bg-surface-muted transition-colors cursor-pointer"
      aria-label={`abrir a conversa de ${title}`}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className="shrink-0 w-9 h-9 rounded-xl bg-ceci-brand-strong text-ceci-on-brand flex items-center justify-center font-display font-bold text-sm"
        >
          c
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-xs font-semibold text-ceci-primary line-clamp-1">
              {title}
            </p>
            <CecinhoPendingBadge count={unread} compact />
          </div>
          {meta && <p className="text-[11px] text-ceci-secondary line-clamp-1">{meta}</p>}
          <p className="text-[12px] text-ceci-primary leading-snug line-clamp-2 mt-1">
            {preview(conversation)}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <CecinhoStatusPill estado={estado} />
            <span className="ml-auto text-[10px] text-ceci-tertiary">
              {shortDate(conversation?.updatedAt ?? assisted.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};
