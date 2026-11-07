import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepProgress } from '../StepProgress';

describe('StepProgress', () => {
  it('renderiza barra de progresso com atributos de acessibilidade', () => {
    render(<StepProgress steps={['a', 'b', 'c']} current={1} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemin', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
    expect(bar).toHaveAttribute('aria-label', 'passo 2 de 3: b');
  });

  it('variante none não renderiza nada', () => {
    const { container } = render(
      <StepProgress steps={['a', 'b']} current={0} variant="none" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('fluxo de etapa única não divide por zero', () => {
    render(<StepProgress steps={['só um']} current={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });

  it('não se comporta como lista de botões', () => {
    render(<StepProgress steps={['a', 'b']} current={0} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
