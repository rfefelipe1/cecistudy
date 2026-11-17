import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const addSemesterMemory = vi.fn();
const showToast = vi.fn();
const academicTerms = [
  { id: 'trm-1', ordinal: 1, label: '1º semestre', status: 'encerrado', startedAt: '2026-01-01' },
];

vi.mock('@/context/mobileApp', () => ({
  useMobileApp: () => ({
    academicTerms,
    addSemesterMemory,
    showToast,
  }),
}));

import { MemoryWizard } from '../MemoryWizard';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MemoryWizard — entrevista do cecinho', () => {
  it('abre com a primeira pergunta (feliz)', () => {
    render(<MemoryWizard termId="trm-1" onFinish={vi.fn()} />);
    expect(screen.getByText(/entrevista de memórias/i)).toBeDefined();
    expect(screen.getByText(/qual memória feliz desse semestre você quer guardar\?/i)).toBeDefined();
  });

  it('o botão continuar está sempre habilitado (o usuário pode pular qualquer passo)', () => {
    render(<MemoryWizard termId="trm-1" onFinish={vi.fn()} />);
    const continuar = screen.getByRole('button', { name: /continuar/i });
    expect(continuar).not.toBeDisabled();
  });

  it('chama addSemesterMemory com os dados corretos ao salvar o primeiro passo', () => {
    render(<MemoryWizard termId="trm-1" onFinish={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/conte brevemente o que aconteceu…/i);
    fireEvent.change(textarea, { target: { value: 'minha memória feliz' } });
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(addSemesterMemory).toHaveBeenCalledTimes(1);
    expect(addSemesterMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        termId: 'trm-1',
        title: 'minha memória feliz',
        category: 'feliz',
        termDate: '2026-01-01',
      }),
    );
  });
});
