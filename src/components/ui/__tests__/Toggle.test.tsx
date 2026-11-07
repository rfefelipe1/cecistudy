import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('marca o switch com aria-checked conforme o estado', () => {
    render(<Toggle checked label="ativar" onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'ativar' })).toHaveAttribute('aria-checked', 'true');
  });

  it('chama onChange ao clicar', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} label="ativar" onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('fica desabilitado quando disabled', () => {
    const onChange = vi.fn();
    render(<Toggle checked disabled label="ativar" onChange={onChange} />);
    const sw = screen.getByRole('switch');
<<<<<<< HEAD
    expect(sw).toBeDisabled();
=======
    expect(sw).toHaveAttribute('aria-disabled', 'true');
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fica desabilitado quando loading', () => {
    render(<Toggle checked loading label="ativar" onChange={() => {}} />);
<<<<<<< HEAD
    expect(screen.getByRole('switch')).toBeDisabled();
=======
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  });
});
