import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ThinkingLoader } from '../ThinkingLoader';

describe('ThinkingLoader', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('mostra a primeira fase', () => {
    render(<ThinkingLoader phases={['analisando a tarefa', 'montando o plano']} />);
    expect(screen.getByText('analisando a tarefa')).toBeInTheDocument();
  });

  it('troca de fase no intervalo e para na última', () => {
    render(<ThinkingLoader phases={['analisando', 'montando']} interval={200} />);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByText('montando')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByText('montando')).toBeInTheDocument();
  });

  it('termina em check: o rótulo vira o pronto e o status fica acessível', () => {
    render(<ThinkingLoader phases={['analisando']} done />);
    expect(screen.getByRole('status')).toHaveAttribute('data-done');
    expect(screen.getByText('prontinho ♡')).toBeInTheDocument();
  });
});
