import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SemesterMemory } from '../../../lib/semesterMemory';
import { CeciMemoryCategorySummary } from '../CeciMemoryCategorySummary';

const onCategoryChange = vi.fn();

const memorias: SemesterMemory[] = [
  { id: 'm1', termId: 'trm-1', termDate: '2026-01-01', title: 'feliz 1', category: 'feliz', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'm2', termId: 'trm-1', termDate: '2026-01-01', title: 'feliz 2', category: 'feliz', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
  { id: 'm3', termId: 'trm-1', termDate: '2026-01-01', title: 'engracada 1', category: 'engracada', createdAt: '2026-01-03T00:00:00.000Z', updatedAt: '2026-01-03T00:00:00.000Z' },
  { id: 'm4', termId: 'trm-1', termDate: '2026-01-01', title: 'memoravel 1', category: 'memoravel', createdAt: '2026-01-04T00:00:00.000Z', updatedAt: '2026-01-04T00:00:00.000Z' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CeciMemoryCategorySummary — filtro por categoria', () => {
  it('mostra o contador total de memórias', () => {
    render(
      <CeciMemoryCategorySummary
        memories={memorias}
        activeCategory="todas"
        onCategoryChange={onCategoryChange}
      />,
    );
    expect(screen.getByText(/4 memórias no semestre/i)).toBeDefined();
  });

  it('chama onCategoryChange ao clicar em um chip de categoria', () => {
    render(
      <CeciMemoryCategorySummary
        memories={memorias}
        activeCategory="todas"
        onCategoryChange={onCategoryChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /feliz \(\d\)/i }));
    expect(onCategoryChange).toHaveBeenCalledWith('feliz');
  });

  it('o chip "todas" limpa o filtro', () => {
    render(
      <CeciMemoryCategorySummary
        memories={memorias}
        activeCategory="feliz"
        onCategoryChange={onCategoryChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^todas$/i }));
    expect(onCategoryChange).toHaveBeenCalledWith('todas');
  });
});
