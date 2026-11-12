import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciStepper } from '../CeciStepper';

describe('CeciStepper', () => {
  it('incrementa o valor ao clicar em +', () => {
    const onChange = vi.fn();
    render(<CeciStepper value={10} onChange={onChange} unit="páginas" />);
    fireEvent.click(screen.getByRole('button', { name: 'aumentar' }));
    expect(onChange).toHaveBeenCalledWith(11);
  });

  it('decrementa o valor ao clicar em −', () => {
    const onChange = vi.fn();
    render(<CeciStepper value={10} onChange={onChange} unit="páginas" />);
    fireEvent.click(screen.getByRole('button', { name: 'diminuir' }));
    expect(onChange).toHaveBeenCalledWith(9);
  });

  it('não decrementa abaixo do min', () => {
    const onChange = vi.fn();
    render(<CeciStepper value={0} onChange={onChange} min={0} unit="páginas" />);
    fireEvent.click(screen.getByRole('button', { name: 'diminuir' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
