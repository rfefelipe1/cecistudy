import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciToggleButton } from '../CeciToggleButton';

describe('CeciToggleButton', () => {
  it('chama onChange ao clicar', () => {
    const onChange = vi.fn();
    render(<CeciToggleButton active={false} label="modo escuro" onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch', { name: 'modo escuro' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('aria-checked reflete o estado ativo', () => {
    render(<CeciToggleButton active={true} label="modo escuro" onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'modo escuro' })).toHaveAttribute('aria-checked', 'true');
  });

  it('não chama onChange quando desabilitado', () => {
    const onChange = vi.fn();
    render(<CeciToggleButton active={false} label="modo escuro" onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('switch', { name: 'modo escuro' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
