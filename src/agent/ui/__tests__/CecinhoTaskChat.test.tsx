import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CecinhoTaskChat } from '../CecinhoTaskChat';

// A tela é cola: o teste prova o que ela decide (loader, envio bloqueado, sheet
// abrindo e confirmando). Contexto e hook entram mockados — o domínio tem os
// próprios testes.
const chat = vi.hoisted(() => ({
  asking: false,
  messages: [] as Array<{
    id: string;
    role: 'user' | 'assistant';
    kind: 'text' | 'question';
    content: string;
    createdAt: string;
    question?: { id: string; text: string };
  }>,
  append: vi.fn(),
  answerRound: vi.fn(),
  ask: vi.fn(async () => true),
}));

vi.mock('@/agent/useCecinho', () => ({
  useCecinho: () => ({
    assistedFor: () => ({ taskId: 'task-1', conversationId: 'conv-task-1' }),
    conversationFor: () => ({ id: 'conv-task-1', taskId: 'task-1', messages: chat.messages }),
    planFor: () => undefined,
    artifactsFor: () => [],
    statusLabel: () => 'analisando',
    asking: chat.asking,
    markRead: () => undefined,
    activate: () => undefined,
    append: chat.append,
    answerRound: chat.answerRound,
    ask: chat.ask,
    rejectPlan: () => undefined,
    editStep: () => undefined,
    removeStep: () => undefined,
    markStepDone: () => undefined,
    confirmPlan: () => undefined,
    removeArtifact: () => undefined,
  }),
}));

vi.mock('@/context/DataClientProvider', () => ({
  useDataClientCourses: () => ({
    tasks: [{ id: 'task-1', title: 'resumo de skinner', category: 'leitura', priority: 'alta' }],
  }),
}));
vi.mock('@/context/mobileApp', () => ({
  useMobileApp: () => ({ handleAddTask: vi.fn(), showToast: vi.fn() }),
}));
vi.mock('@/context/shellNavContexts', () => ({
  useNavValue: () => ({ closeCecinho: vi.fn() }),
}));

const pergunta = {
  id: 'm1',
  role: 'assistant' as const,
  kind: 'question' as const,
  content: 'qual o tema do resumo?',
  createdAt: '2026-11-17T12:00:00.000Z',
  question: { id: 'q1', text: 'qual o tema do resumo?' },
};

describe('CecinhoTaskChat', () => {
  beforeEach(() => {
    chat.asking = false;
    chat.messages = [];
    vi.clearAllMocks();
  });

  it('enquanto o cecinho pensa, a bolha mostra o loader e o envio fica bloqueado', () => {
    chat.asking = true;
    render(<CecinhoTaskChat taskId="task-1" />);

    expect(screen.getByText('analisando a tarefa')).toBeInTheDocument();
    expect(screen.getByLabelText('mensagem para o cecinho')).toBeDisabled();
    expect(screen.getByLabelText('enviar mensagem')).toBeDisabled();
  });

  it('abre o sheet na pergunta pendente e confirma jogando a resposta no chat', async () => {
    chat.messages = [pergunta];
    render(<CecinhoTaskChat taskId="task-1" />);

    fireEvent.change(screen.getByLabelText('qual o tema do resumo?'), {
      target: { value: 'memória de trabalho' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'próxima' }));
    fireEvent.click(screen.getByRole('button', { name: 'já pode enviar' }));

    expect(chat.answerRound).toHaveBeenCalledWith('task-1', [
      { questionId: 'q1', answer: 'memória de trabalho' },
    ]);
    expect(chat.append).toHaveBeenCalledWith('task-1', {
      role: 'user',
      kind: 'text',
      content: 'memória de trabalho',
    });
    expect(chat.ask).toHaveBeenCalledWith('task-1', 'memória de trabalho');
  });

  it('fechar o sheet não perde a pergunta: a bolha oferece responder de novo', async () => {
    chat.messages = [pergunta];
    render(<CecinhoTaskChat taskId="task-1" />);

    expect(screen.getByLabelText('qual o tema do resumo?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'fechar' }));
    await waitFor(() =>
      expect(screen.queryByLabelText('qual o tema do resumo?')).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'responder' }));
    expect(await screen.findByLabelText('qual o tema do resumo?')).toBeInTheDocument();
  });

  it('a resposta nova streama e libera o envio quando termina', async () => {
    const { rerender } = render(<CecinhoTaskChat taskId="task-1" />);
    const input = screen.getByLabelText('mensagem para o cecinho');
    expect(input).not.toBeDisabled();

    chat.messages = [
      {
        id: 'm2',
        role: 'assistant',
        kind: 'text',
        content: 'comecei pelo capítulo 2',
        createdAt: '2026-11-17T12:01:00.000Z',
      },
    ];
    rerender(<CecinhoTaskChat taskId="task-1" />);

    expect(input).toBeDisabled();
    await waitFor(() => expect(input).not.toBeDisabled());
    expect(screen.getByText('comecei pelo capítulo 2')).toBeInTheDocument();
  });
});
