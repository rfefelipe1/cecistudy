import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CeciStatusBadge } from '../CeciStatusBadge';

describe('CeciStatusBadge', () => {
  it('renderiza o conteúdo com a variante success', () => {
    render(<CeciStatusBadge variant="success">concluído</CeciStatusBadge>);
    expect(screen.getByText('concluído')).toHaveClass('bg-status-success-surface');
  });

  it('renderiza a variante neutra por padrão', () => {
    render(<CeciStatusBadge>pendente</CeciStatusBadge>);
    expect(screen.getByText('pendente')).toHaveClass('text-ceci-secondary');
  });

  it('não é um botão (sem role interativo)', () => {
    render(<CeciStatusBadge variant="warning">atrasado</CeciStatusBadge>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
