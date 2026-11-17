import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { StreamingMessage } from '../StreamingMessage';

describe('StreamingMessage', () => {
  afterEach(() => vi.useRealTimers());

  it('sem streaming mostra o texto inteiro de uma vez', () => {
    render(<StreamingMessage content="plano pronto" />);
    expect(screen.getByText('plano pronto')).toBeInTheDocument();
  });

  it('com streaming revela aos poucos e avisa quando termina', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<StreamingMessage content="plano pronto" streaming onDone={onDone} />);

    // Começa vazio: a primeira bolha não mostra o texto completo.
    expect(screen.queryByText('plano pronto')).toBeNull();

    // Cada tick é agendado no efeito seguinte: avança em ciclos, não de uma vez.
    for (let tick = 0; tick < 60; tick += 1) {
      act(() => {
        vi.advanceTimersByTime(30);
      });
    }
    expect(screen.getByText('plano pronto')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalled();
  });
});
