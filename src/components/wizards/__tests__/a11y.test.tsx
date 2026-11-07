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

  it('não duplica indicador de progresso no corpo quando progress é none', () => {
    const { container } = renderWizard({ progress: 'none' });
    expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
  });

  it('não há progressbar no corpo quando progress é linear (o header usa barra visual sem role)', () => {
    const { container } = renderWizard({ progress: 'linear' });
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
  });
});

describe('A11y — erro associado ao campo', () => {
  it('campo com erro tem aria-invalid="true" e aria-describedby apontando para o alert', () => {
    render(
      <Field label="título" htmlFor="campo-erro" error="preencha o título para continuar">
        <TextInput id="campo-erro" />
      </Field>,
    );
    const input = screen.getByLabelText('título');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'campo-erro-error');
    expect(screen.getByRole('alert')).toHaveTextContent(/preencha o título/);
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

describe('A11y — rótulo do botão de retorno coerente', () => {
  it('botão é "voltar etapa" no último passo', () => {
    renderWizard({ step: 2 }); // último passo (steps.length=3)
    expect(screen.getByRole('button', { name: 'voltar etapa' })).toBeInTheDocument();
  });

  it('botão é "cancelar fluxo" no primeiro passo', () => {
    renderWizard({ step: 0 });
    expect(screen.getByRole('button', { name: 'cancelar fluxo' })).toBeInTheDocument();
  });

  it('botão é "cancelar fluxo" nos passos intermediários', () => {
    renderWizard({ step: 1 });
    expect(screen.getByRole('button', { name: 'cancelar fluxo' })).toBeInTheDocument();
  });
});

describe('A11y — alvos de toque mínimo', () => {
  it('botão de retorno tem pelo menos 44px (w-11 h-11)', () => {
    renderWizard();
    const btn = screen.getByRole('button', { name: 'cancelar fluxo' });
    expect(btn).toHaveClass('w-11 h-11');
  });

  it('ação primária tem pelo menos 48px (min-h-[48px])', () => {
    renderWizard({ primaryActionLabel: 'continuar' });
    const btn = screen.getByRole('button', { name: 'continuar' });
    expect(btn).toHaveClass('min-h-[48px]');
  });
});

describe('A11y — não há dois indicadores de progresso', () => {
  it('header não mostra contador quando progress é none', () => {
    const { container } = renderWizard({ progress: 'none', showStepCount: true });
    expect(container.querySelector('[aria-label="etapa 1 de 3"]')).not.toBeInTheDocument();
  });

  it('corpo não renderiza StepProgress por padrão (só o header tem barra visual, sem role)', () => {
    const { container } = renderWizard({ progress: 'linear' });
    // o corpo do scaffold não renderiza StepProgress; o header usa barra visual sem role="progressbar"
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
  });
});
