import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { WizardScaffold, type WizardStep } from '../WizardScaffold';
import { WizardScaffoldHeader } from '../WizardScaffoldHeader';
import { WizardScaffoldFooter } from '../WizardScaffoldFooter';
import { StepProgress } from '../StepProgress';
import { Field } from '../wizardFields';
import { TextInput } from '../wizardFields';

const steps: WizardStep[] = [
  { id: 's1', title: 'identificação', headline: 'quem é essa aula?', content: <p>passo um</p> },
  { id: 's2', title: 'conteúdo', headline: 'o que anotou?', content: <p>passo dois</p> },
  { id: 's3', title: 'revisão', headline: 'confere?', content: <p>passo três</p> },
];

const renderWizard = (over: Partial<React.ComponentProps<typeof WizardScaffold>> = {}) =>
  render(
    <WizardScaffold
      title="anotar aula"
      icon={<span />}
      steps={steps}
      step={0}
      onStepChange={vi.fn()}
      onSave={vi.fn()}
      onClose={vi.fn()}
      {...over}
    />,
  );

describe('A11y — hierarquia de headings', () => {
  it('tem um único h1 no header (título do fluxo)', () => {
    renderWizard();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('o headline do passo é um h2', () => {
    renderWizard();
    expect(screen.getByRole('heading', { level: 2, name: 'quem é essa aula?' })).toBeInTheDocument();
  });

  it('não há heading h1 duplicado no conteúdo', () => {
    renderWizard();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s.map((h) => h.textContent)).toEqual(['anotar aula']);
  });
});

describe('A11y — lista de passos com aria-current', () => {
  it('expõe aria-current="step" no passo atual', () => {
    renderWizard();
    const current = screen.getByRole('listitem', { current: 'step' });
    expect(current.textContent).toBe('identificação');
  });

  it('aria-current acompanha o passo ativo', () => {
    renderWizard({ step: 2 });
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toBe('revisão');
  });
});

describe('A11y — progressbar com nome acessível', () => {
  it('expõe role="progressbar" com aria-valuenow/aria-valuemin/aria-valuemax', () => {
    render(<StepProgress steps={['a', 'b', 'c']} current={1} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemin', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
    expect(bar).toHaveAttribute('aria-label', 'passo 2 de 3: b');
  });


});

describe('A11y — foco muda de etapa corretamente', () => {
  it('move o foco para o h2 do novo passo ao trocar', async () => {
    function Harness() {
      const [step, setStep] = useState(0);
      return (
        <WizardScaffold
          title="anotar aula"
          icon={<span />}
          steps={steps}
          step={step}
          onStepChange={setStep}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByText('continuar'));
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'o que anotou?' })),
    );
  });

  it('não rouba o foco ao abrir (passo 0)', () => {
    renderWizard();
    expect(document.activeElement).not.toBe(screen.getByRole('heading', { level: 2 }));
  });
});


