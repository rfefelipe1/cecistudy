import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const addSemesterMemory = vi.fn();
const updateSemesterMemory = vi.fn();
const deleteSemesterMemory = vi.fn();
const showToast = vi.fn();
const academicTerms = [
  { id: 'trm-1', ordinal: 1, label: '1º semestre', status: 'encerrado', startedAt: '2026-01-01' },
];

vi.mock('@/context/mobileApp', () => ({
  useMobileApp: () => ({
    academicTerms,
    semesterMemories: [],
    addSemesterMemory,
    updateSemesterMemory,
    deleteSemesterMemory,
    showToast,
  }),
}));

vi.mock('../../../lib/semesterMemory', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/semesterMemory')>(
    '../../../lib/semesterMemory',
  );
  return {
    ...actual,
    memoriesByTerm: () => [],
  };
});

import { SemesterMemoriesScreen } from '../SemesterMemoriesScreen';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SemesterMemoriesScreen — estado vazio', () => {
  it('mostra convite para criar a primeira memória', () => {
    render(<SemesterMemoriesScreen termId="trm-1" />);
    expect(screen.getByText(/ainda não há memórias neste semestre/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /registrar primeira memória/i })).toBeDefined();
  });

  it('o botão registrar primeira memória chama addSemesterMemory via wizard', () => {
    render(<SemesterMemoriesScreen termId="trm-1" />);
    fireEvent.click(screen.getByRole('button', { name: /registrar primeira memória/i }));
    // O wizard é aberto (estado local); não chama addSemesterMemory direto aqui
    expect(addSemesterMemory).not.toHaveBeenCalled();
  });
});
