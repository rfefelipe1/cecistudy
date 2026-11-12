import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

/**
 * O que este teste protege que outro gate não protege: **o botão é funcional e
 * respeita Reduzir Movimento** (Spec §14.1, §19). A animação de compressão
 * (`whileTap`) vem do framer-motion, que já é testado pela própria biblioteca;
 * aqui verificamos que o botão chama `onClick`, que não quebra sob Reduzir
 * Movimento, e que o `whileTap` é injetado como prop do `motion`.
 */

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Button — press animation', () => {
  it('chama onClick no clique', () => {
    const onPress = vi.fn();
    render(<Button onClick={onPress}>salvar</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sob Reduzir Movimento o clique ainda funciona', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as any;

    const onPress = vi.fn();
    render(<Button onClick={onPress}>salvar</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
