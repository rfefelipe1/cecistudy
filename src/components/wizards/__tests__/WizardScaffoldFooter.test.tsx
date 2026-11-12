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
      showBlockedHint={false}
      saveMinimalLabel="guardar só o essencial ♡"
      confirmingDiscard={false}
      {...over}
    />,
  );

describe('WizardScaffoldFooter', () => {
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
    renderFooter({ canConfirm: false });
    expect(screen.getByRole('button', { name: 'continuar' })).toBeDisabled();
  });
});
