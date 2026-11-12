import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WizardScaffoldHeader } from '../WizardScaffoldHeader';

const renderHeader = (over: Partial<React.ComponentProps<typeof WizardScaffoldHeader>> = {}) =>
  render(
    <WizardScaffoldHeader
      title="novo flashcard"
      subtitle="crie o conteúdo principal"
      icon={<span />}
      step={0}
      stepTitles={['pergunta', 'resposta', 'revisar']}
      stepsLength={3}
      showStepCount={true}
      isLast={false}
      onBack={vi.fn()}
      {...over}
    />,
  );

describe('WizardScaffoldHeader', () => {
  it('exibe o contador de etapa com linguagem acessível', () => {
    const { container } = renderHeader();
    const counter = container.querySelector('[aria-label="etapa 1 de 3"]');
    expect(counter).toBeInTheDocument();
    expect(counter?.textContent).toBe('1/3');
  });

  it('o botão de retorno tem aria-label coerente com o passo', () => {
    renderHeader({ isLast: false });
    expect(screen.getByRole('button', { name: 'cancelar' })).toHaveAttribute(
      'aria-label',
      'cancelar',
    );
    renderHeader({ isLast: true });
    expect(screen.getByRole('button', { name: 'voltar' })).toHaveAttribute('aria-label', 'voltar');
  });


});
