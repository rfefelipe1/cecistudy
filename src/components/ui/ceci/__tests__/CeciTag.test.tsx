import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciTag } from '../CeciTag';

describe('CeciTag', () => {
  it('chama onRemove ao clicar no ×', () => {
    const onRemove = vi.fn();
    render(<CeciTag value="a" label="tag a" removable onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'remover tag a' }));
    expect(onRemove).toHaveBeenCalledWith('a');
  });

  it('não chama onRemove quando não é removível', () => {
    const onRemove = vi.fn();
    render(<CeciTag value="a" label="tag a" removable={false} onRemove={onRemove} />);
    expect(screen.queryByRole('button', { name: 'remover tag a' })).not.toBeInTheDocument();
  });

  it('exibe a variante rose quando solicitada', () => {
    render(<CeciTag value="a" label="tag a" variant="rose" />);
    expect(screen.getByText('tag a')).toHaveClass('bg-surface-rose');
  });
});
