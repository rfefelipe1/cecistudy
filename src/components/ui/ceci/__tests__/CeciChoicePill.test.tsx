import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciChoicePill } from '../CeciChoicePill';

describe('CeciChoicePill', () => {
  it('chama onChange ao clicar na pill não selecionada', () => {
    const onChange = vi.fn();
    render(
      <CeciChoicePill value="a" label="opção a" selected={false} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'opção a' }));
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('não chama onChange quando desabilitada', () => {
    const onChange = vi.fn();
    render(
      <CeciChoicePill value="a" label="opção a" selected={false} onChange={onChange} disabled />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'opção a' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('aria-checked reflete a seleção', () => {
    render(
      <CeciChoicePill value="a" label="opção a" selected={true} onChange={() => {}} />,
    );
    expect(screen.getByRole('radio', { name: 'opção a' })).toHaveAttribute('aria-checked', 'true');
  });
});
