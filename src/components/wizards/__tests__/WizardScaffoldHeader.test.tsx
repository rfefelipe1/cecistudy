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

  it('o botão de retorno tem alvo de toque e aria-label coerente', () => {
    renderHeader({ isLast: false });
    expect(screen.getByRole('button', { name: 'cancelar fluxo' })).toHaveAttribute(
      'title',
      'cancelar',
    );
    renderHeader({ isLast: true });
    expect(screen.getByRole('button', { name: 'voltar etapa' })).toHaveAttribute('title', 'voltar');
  });

  it('não exibe contador nem barra quando progress é none', () => {
    const { container } = renderHeader({ progress: 'none', showStepCount: true });
    expect(container.querySelector('[aria-label="etapa 1 de 3"]')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-ceci-brand-strong')).not.toBeInTheDocument();
  });

  it('renderiza barra única quando progress é linear', () => {
    const { container } = renderHeader({ progress: 'linear' });
    expect(container.querySelector('[aria-label="etapa 1 de 3"]')).toBeInTheDocument();
    expect(container.querySelector('.bg-ceci-brand-strong')).toBeInTheDocument();
  });

  it('modo rotulado mostra o nome do passo atual', () => {
    const { container } = renderHeader({ progress: 'labeled', currentStepTitle: 'pergunta' });
    expect(container.textContent).toContain('etapa 1 de 3: pergunta');
  });

  it('título não é truncado no modo narrativo', () => {
    renderHeader({ tone: 'narrative', title: 'um título bem longo que cabe em duas linhas' });
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).not.toHaveClass('truncate');
  });
});
