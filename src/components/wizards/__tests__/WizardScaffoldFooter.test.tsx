import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardScaffoldFooter } from '../WizardScaffoldFooter';

const renderFooter = (over: Partial<React.ComponentProps<typeof WizardScaffoldFooter>> = {}) =>
  render(
    <WizardScaffoldFooter
      isLast={false}
      hideNext={false}
      canConfirm={true}
      saving={false}
      saveLabel="guardar ♡"
      canNext={true}
      onPrimary={vi.fn()}
      onClose={vi.fn()}
      onCancelDiscard={vi.fn()}
      onBack={vi.fn()}
      isFirst={false}
      {...over}
    />,
  );

describe('WizardScaffoldFooter', () => {
  it('ação primária explica o efeito e tem altura mínima', () => {
    renderFooter({ primaryActionLabel: 'continuar' });
    const btn = screen.getByRole('button', { name: 'continuar' });
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveClass('min-h-[48px]');
  });

  it('no primeiro passo o botão é "cancelar", não "voltar"', () => {
    renderFooter({ isFirst: true });
    expect(screen.getByRole('button', { name: 'cancelar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'voltar' })).not.toBeInTheDocument();
  });

  it('em passos seguintes o botão é "voltar"', () => {
    renderFooter({ isFirst: false });
    expect(screen.getByRole('button', { name: 'voltar' })).toBeInTheDocument();
  });

  it('confirmar descarte mostra ações distintas e destrutiva não compete com a primária', () => {
    renderFooter({ confirmingDiscard: true });
    expect(screen.getByRole('button', { name: 'continuar editando' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'descartar' })).toHaveClass(
      /text-status-danger-strong/,
    );
  });

  it('botão primário desabilitado quando o avanço está bloqueado', () => {
    renderFooter({ primaryActionLabel: 'continuar', canConfirm: false });
    expect(screen.getByRole('button', { name: 'continuar' })).toBeDisabled();
  });
});
