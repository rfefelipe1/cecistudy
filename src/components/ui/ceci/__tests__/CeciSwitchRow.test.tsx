import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciSwitchRow } from '../CeciSwitchRow';

describe('CeciSwitchRow', () => {
  it('chama onChange ao clicar no switch', () => {
    const onChange = vi.fn();
    render(
      <CeciSwitchRow label="lembrete" checked={false} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'lembrete' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('aria-checked reflete o estado', () => {
    render(
      <CeciSwitchRow label="lembrete" checked={true} onChange={() => {}} />,
    );
    expect(screen.getByRole('switch', { name: 'lembrete' })).toHaveAttribute('aria-checked', 'true');
  });

  it('não chama onChange quando desabilitado', () => {
    const onChange = vi.fn();
    render(
      <CeciSwitchRow label="lembrete" checked={false} onChange={onChange} disabled />,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'lembrete' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
