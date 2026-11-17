import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciNumberField } from '../CeciNumberField';

describe('CeciNumberField', () => {
  it('chama onChange com o número digitado', () => {
    const onChange = vi.fn();
    render(<CeciNumberField value={42} onChange={onChange} unit="horas" />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '100' } });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('chama onChange com undefined quando esvaziado', () => {
    const onChange = vi.fn();
    render(<CeciNumberField value={42} onChange={onChange} unit="horas" />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('exibe a unidade ao lado do campo', () => {
    render(<CeciNumberField value={42} onChange={() => {}} unit="horas" />);
    expect(screen.getByText('horas')).toBeInTheDocument();
  });
});
