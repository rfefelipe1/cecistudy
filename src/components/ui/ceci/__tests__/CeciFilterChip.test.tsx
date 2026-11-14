import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciFilterChip } from '../CeciFilterChip';

describe('CeciFilterChip', () => {
  it('chama onChange ao clicar no chip ativo', () => {
    const onChange = vi.fn();
    render(<CeciFilterChip value="a" label="filtro a" active={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'filtro a' }));
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('aria-checked reflete o estado ativo', () => {
    render(<CeciFilterChip value="a" label="filtro a" active={true} onChange={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'filtro a' })).toHaveAttribute('aria-checked', 'true');
  });

  it('não chama onChange quando desabilitado', () => {
    const onChange = vi.fn();
    render(
      <CeciFilterChip value="a" label="filtro a" active={false} onChange={onChange} disabled />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'filtro a' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
