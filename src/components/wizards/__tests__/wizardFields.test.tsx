import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field, FieldLabel, TextInput } from '../wizardFields';

describe('wizardFields', () => {
  it('rótulo não é uppercase por padrão', () => {
    render(
      <Field label="título da tarefa" htmlFor="t">
        <TextInput id="t" />
      </Field>,
    );
    const label = screen.getByLabelText('título da tarefa');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveClass('uppercase');
  });

  it('erro é exibido inline, associado ao campo por aria-describedby', () => {
    render(
      <Field label="título" htmlFor="t" error="preencha o título para continuar">
        <TextInput id="t" />
      </Field>,
    );
    const input = screen.getByLabelText('título');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 't-error');
    expect(screen.getByRole('alert')).toHaveTextContent(/preencha o título/);
  });

  it('marca campo obrigatório e opcional no rótulo', () => {
    render(
      <Field label="título" htmlFor="t" required>
        <TextInput id="t" />
      </Field>,
    );
    expect(screen.getByLabelText(/título/)).toBeInTheDocument();
    const label = screen.getByText('obrigatório').closest('label');
    expect(label).toBeInTheDocument();
  });

  it('importance advanced reduz o peso visual do grupo', () => {
    const { container } = render(
      <Field label="tags" htmlFor="t" importance="advanced">
        <TextInput id="t" />
      </Field>,
    );
    expect(container.firstChild).toHaveClass('text-ceci-secondary');
  });
});
