import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciDatePicker } from '../CeciDatePicker';

describe('CeciDatePicker', () => {
  it('exibe a data amigável no trigger quando selecionada', () => {
    // 2026-10-28 é quarta-feira
    render(<CeciDatePicker value="2026-10-28" onChange={() => {}} />);
    expect(screen.getByText('quarta-feira, 28 de outubro')).toBeInTheDocument();
  });

  it('mostra placeholder quando não há seleção', () => {
    render(<CeciDatePicker value={null} onChange={() => {}} placeholder="escolher uma data" />);
    expect(screen.getByRole('button', { name: 'escolher uma data' })).toBeInTheDocument();
  });

  it('chama onChange ao selecionar um dia no calendário', () => {
    const onChange = vi.fn();
    render(<CeciDatePicker value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'escolher uma data' }));
    const day1 = screen.getAllByRole('option', { name: '1' }).find((el) =>
      el.closest('[role="dialog"]') !== null,
    );
    expect(day1).toBeInTheDocument();
    fireEvent.click(day1);
    expect(onChange).toHaveBeenCalled();
  });
});
