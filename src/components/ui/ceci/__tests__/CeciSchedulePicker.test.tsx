import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciSchedulePicker } from '../CeciSchedulePicker';

describe('CeciSchedulePicker', () => {
  it('renderiza um card de rotina por slot', () => {
    const onChange = vi.fn();
    render(
      <CeciSchedulePicker
        value={[{ day: 1, start: '08:00', end: '10:00' }]}
        onChange={onChange}
      />,
    );
    // O dia da semana aparece como chip selecionado no card do slot
    expect(screen.getAllByText('segunda-feira')[0]).toBeInTheDocument();
    // Os valores de time aparecem nos chips do seletor (renderizados em span,
    // não em input type=time — getByText bate com o que o componente mostra).
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('chama onChange ao adicionar horário', () => {
    const onChange = vi.fn();
    render(<CeciSchedulePicker value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /adicionar horário/i }));
    expect(onChange).toHaveBeenCalledWith([
      { day: 1, start: '08:00', end: '10:00' },
    ]);
  });

  it('remove um slot ao clicar no ícone de lixeira', () => {
    const onChange = vi.fn();
    render(
      <CeciSchedulePicker
        value={[{ day: 1, start: '08:00', end: '10:00' }]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'remover horário' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
