import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AgentQuestion } from '@/types';
import { CecinhoQuestionSheet } from '../CecinhoQuestionSheet';

const questions: AgentQuestion[] = [
  { id: 'q1', text: 'qual o tema do resumo?' },
  { id: 'q2', text: 'quantas páginas?' },
];

describe('CecinhoQuestionSheet', () => {
  it('avança uma pergunta por etapa e confirma as respostas', () => {
    const onConfirm = vi.fn();
    render(
      <CecinhoQuestionSheet
        open
        questions={questions}
        onConfirm={onConfirm}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText('1 de 2')).toBeInTheDocument();
    // Sem resposta, não dá para avançar.
    expect(screen.getByRole('button', { name: 'próxima' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('qual o tema do resumo?'), {
      target: { value: 'memória de trabalho' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'próxima' }));

    expect(screen.getByText('2 de 2')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('quantas páginas?'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'próxima' }));

    // Última etapa: revisão do que foi digitado, sem edição.
    expect(screen.getByText('memória de trabalho')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'já pode enviar' }));
    expect(onConfirm).toHaveBeenCalledWith([
      { questionId: 'q1', answer: 'memória de trabalho' },
      { questionId: 'q2', answer: '3' },
    ]);
  });

  it('fechar não confirma nada', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <CecinhoQuestionSheet open questions={questions} onConfirm={onConfirm} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'fechar' }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
