import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ReorderGrip, ReorderList } from '../reorder-list';

type Track = { id: string; title: string };

const makeTracks = (n: number): Track[] =>
  Array.from({ length: n }, (_, i) => ({ id: `t${i}`, title: `track ${i}` }));

function renderList(items: Track[], onReorder: (next: Track[]) => void) {
  return render(
    <ReorderList
      items={items}
      getId={(t) => t.id}
      getLabel={(t) => t.title}
      onReorder={onReorder}
      label="lista"
    >
      {(t) => (
        <div data-testid={`row-${t.id}`} key={t.id}>
          <ReorderGrip />
          <span>{t.title}</span>
        </div>
      )}
    </ReorderList>
  );
}

describe('ReorderList', () => {
  it('reordena pelo teclado: Espaço pega, seta baixa move, Espaço solta', () => {
    const onReorder = vi.fn();
    const items = makeTracks(3);
    renderList(items, onReorder);

    const grip = screen.getByRole('button', { name: /arrastar track 0/ });
    fireEvent.focus(grip);
    // pega a linha
    fireEvent.keyDown(grip, { key: ' ' });
    // move para baixo (posição 0 -> 1)
    fireEvent.keyDown(grip, { key: 'ArrowDown' });
    // solta e grava
    fireEvent.keyDown(grip, { key: ' ' });

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder).toHaveBeenLastCalledWith([
      items[1],
      items[0],
      items[2],
    ]);
  });

  it('Esc cancela a prévia e não grava', () => {
    const onReorder = vi.fn();
    const items = makeTracks(3);
    renderList(items, onReorder);

    const grip = screen.getByRole('button', { name: /arrastar track 0/ });
    fireEvent.focus(grip);
    fireEvent.keyDown(grip, { key: ' ' });
    fireEvent.keyDown(grip, { key: 'ArrowDown' });
    fireEvent.keyDown(grip, { key: 'Escape' });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('solta no mesmo lugar não grava', () => {
    const onReorder = vi.fn();
    const items = makeTracks(3);
    renderList(items, onReorder);

    const grip = screen.getByRole('button', { name: /arrastar track 1/ });
    fireEvent.focus(grip);
    fireEvent.keyDown(grip, { key: ' ' });
    fireEvent.keyDown(grip, { key: 'ArrowUp' }); // sobe para a posição 0
    fireEvent.keyDown(grip, { key: 'ArrowDown' }); // desce de volta para 1
    fireEvent.keyDown(grip, { key: ' ' });

    expect(onReorder).not.toHaveBeenCalled();
  });
});
