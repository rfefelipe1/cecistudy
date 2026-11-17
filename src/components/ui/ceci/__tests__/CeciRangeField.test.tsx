import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciRangeField } from '../CeciRangeField';

describe('CeciRangeField', () => {
  it('chama onChange com o valor do slider', () => {
    const onChange = vi.fn();
    render(<CeciRangeField value={10} onChange={onChange} unit="h" min={1} max={24} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('chama onChange com undefined quando esvaziado', () => {
    const onChange = vi.fn();
    render(<CeciRangeField value={10} onChange={onChange} unit="h" />);
    const input = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('exibe a unidade ao lado do campo', () => {
    render(<CeciRangeField value={10} onChange={() => {}} unit="h" />);
    expect(screen.getByText('h')).toBeInTheDocument();
  });
});
