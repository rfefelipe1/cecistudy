// TaskSheet da Home — o fluxo de gravar uma tarefa (SPEC-029).
//
// Classe: **UI comportamental**. Protege o que nenhum outro gate protege:
// o gate de voz (`.github/scripts/voz-gate.mjs`) reprova frase escrita inline
// e o teste D12 (`src/lib/__tests__/voice.test.ts`) reprova chave sem
// consumidor. Nenhum dos dois via **chave pedida e inexistente** — que era
// exatamente o defeito: a folha não fechava depois de gravar.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MobileAppProvider } from '../../../../../apps/mobile/src/MobileAppProvider';
import { useDataClientCourses } from '../../../../context/DataClientProvider';
import type { Task } from '../../../../types';
import { TaskSheet } from '../TaskSheet';

/** Tarefas gravadas, lidas de fora do React. */
let gravadas: Task[] = [];
/** Quantas vezes a folha pediu para fechar. */
let fechadas = 0;

/**
 * Harness: abre a folha e espelha o estado que a Home consome
 * (`useDataClientCourses` — o mesmo slice que `AttentionSection` lê).
 */
const Harness: React.FC = () => {
  const [open, setOpen] = React.useState(true);
  const { tasks } = useDataClientCourses();
  React.useEffect(() => {
    gravadas = tasks;
  }, [tasks]);
  return (
    <TaskSheet
      open={open}
      onClose={() => {
        fechadas += 1;
        setOpen(false);
      }}
    />
  );
};

const abrirFolha = () =>
  render(
    <MobileAppProvider>
      <Harness />
    </MobileAppProvider>,
  );

/** Escreve o título e atravessa os passos até o último. */
const preencher = (titulo: string) => {
  fireEvent.change(screen.getByPlaceholderText(/ler capítulo 4/), { target: { value: titulo } });
  for (let passo = 0; passo < 3; passo++) {
    fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
  }
};

afterEach(() => {
  gravadas = [];
  fechadas = 0;
  localStorage.clear();
  sessionStorage.clear();
});

describe('TaskSheet da Home — gravar tarefa (SPEC-029)', () => {
  it('gravar fecha a folha e registra a tarefa', async () => {
    abrirFolha();
    preencher('revisar neuropsicologia');
    fireEvent.click(screen.getByRole('button', { name: /guardar tarefa/ }));

    // A folha **fecha**: `onClose` é o contrato do componente, e é o que o
    // defeito não cumpria — a tarefa era gravada e a folha ficava aberta.
    await waitFor(() => expect(fechadas).toBe(1));
    await waitFor(() => expect(gravadas).toHaveLength(1));
    expect(gravadas[0].title).toBe('revisar neuropsicologia');
    expect(gravadas[0].completed).toBe(false);
  });

  it('toque repetido em guardar grava uma tarefa só', async () => {
    abrirFolha();
    preencher('revisar neuropsicologia');
    const guardar = screen.getByRole('button', { name: /guardar tarefa/ });

    fireEvent.click(guardar);
    fireEvent.click(guardar);

    await waitFor(() => expect(fechadas).toBe(1));
    expect(gravadas).toHaveLength(1);
  });
});
