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
});
