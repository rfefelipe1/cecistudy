import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CeciMemoryCapture } from '../CeciMemoryCapture';

const onSaved = vi.fn();
const onClose = vi.fn();
const onGuided = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CeciMemoryCapture — captura rápida', () => {
  it('salva com categoria, título e sem data quando não informada', () => {
    render(
      <CeciMemoryCapture termId="trm-1" onSaved={onSaved} onClose={onClose} />,
    );

    const titulo = screen.getByPlaceholderText(/conte brevemente o que aconteceu…/i);
    fireEvent.input(titulo, { target: { value: 'minha memória feliz' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar memória/i }));

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        termId: 'trm-1',
        title: 'minha memória feliz',
        category: 'feliz',
        memoryDate: undefined,
        description: undefined,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não salva quando o título está vazio', () => {
    render(
      <CeciMemoryCapture termId="trm-1" onSaved={onSaved} onClose={onClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /guardar memória/i }));

    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByText(/o título é obrigatório/i)).toBeDefined();
  });

  it('abre o modo guiado quando solicitado (não fecha o capture)', () => {
    render(
      <CeciMemoryCapture termId="trm-1" onSaved={onSaved} onClose={onClose} onGuided={onGuided} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /responder por categorias/i }));

    expect(onGuided).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
