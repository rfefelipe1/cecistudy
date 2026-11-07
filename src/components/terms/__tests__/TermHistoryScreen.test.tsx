import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const reopenTermById = vi.fn();
const showToast = vi.fn();
<<<<<<< HEAD
const openTermHistory = vi.fn();
=======
const openSemesterMemories = vi.fn();
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
const focusedTermId = null;

vi.mock('@/context/mobileApp', () => ({
  useMobileApp: () => ({
    academicTerms: [
      {
        id: 'trm-2',
        ordinal: 7,
        label: '7º semestre',
        status: 'encerrado',
        startedAt: '2026-08-01',
        endedAt: '2026-12-31',
        statusTransitionAt: '2026-12-31T00:00:00.000Z',
        updatedAt: '2026-12-31T00:00:00.000Z',
        totalSemesters: 10,
        summary: { classNotes: 32, focusMinutes: 900, pagesRead: 210, highlights: [], grades: [] },
      },
      {
        id: 'trm-3',
        ordinal: 8,
        label: '8º semestre',
        status: 'ativo',
        startedAt: '2027-02-01',
        statusTransitionAt: '2027-02-01T00:00:00.000Z',
        updatedAt: '2027-02-01T00:00:00.000Z',
        totalSemesters: 10,
      },
    ],
    profile: { totalSemesters: 10, semester: 3 },
<<<<<<< HEAD
    focusedTermId,
    openTermHistory,
=======
    semesterMemories: [],
    focusedTermId,
    openSemesterMemories,
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  }),
}));

vi.mock('@/context/shellNavContexts', () => ({
  useTermActions: () => ({ reopenTermById, showToast }),
}));

vi.mock('@/lib/termScope', async () => {
  const actual = await vi.importActual<typeof import('@/lib/termScope')>('@/lib/termScope');
  return {
    ...actual,
    useActiveTerm: (terms: Parameters<typeof actual.activeTermOf>[0]) => actual.activeTermOf(terms),
  };
});

import { TermHistoryScreen } from '../TermHistoryScreen';

beforeEach(() => {
  reopenTermById.mockClear();
  showToast.mockClear();
<<<<<<< HEAD
});

/**
 * B7 (SPEC-006 D7): quando a virada fechou o semestre errado, a usuária ficava
 * presa — o período certo estava encerrado, congelado e sem nenhuma forma de
 * voltar a ser o atual. A saída é **reabrir**, offered por período encerrado.
 */
describe('TermHistoryScreen — reabrir período', () => {
  it('oferece reabrir só no período encerrado', () => {
    render(<TermHistoryScreen />);
    // um botão de reabrir: o encerrado (7º) reabre, o ativo (8º) não
    expect(screen.getAllByRole('button', { name: /reabrir como atual/i })).toHaveLength(1);
  });

  it('reabrir chama reopenTermById com o id do período', () => {
    render(<TermHistoryScreen />);
    fireEvent.click(screen.getByRole('button', { name: /reabrir como atual/i }));
    expect(reopenTermById).toHaveBeenCalledWith('trm-2');
    expect(showToast).toHaveBeenCalledWith('7º semestre voltou a ser o seu semestre atual ♡');
  });

  it('o progresso do cabeçalho vem do período ativo, não do campo legado', () => {
    // `profile.semester` = 3 (legado divergente) enquanto o período ativo é o 8º.
    // O TermHistoryScreen antigo mostrava `degreeProgress(profile.semester, …)`
    // → 30%; a versão correta mostra 80% (SPEC-005 §D4).
    render(<TermHistoryScreen />);
    expect(screen.getByText(/80% do curso/)).toBeDefined();
    expect(screen.queryByText(/30% do curso/)).toBeNull();
    expect(screen.getByText('você está aqui agora ♡')).toBeDefined();
  });
});

/**
 * N3e (SPEC-008 D5): expandir um período **não empilha mais** uma tela. Cada
 * expansão antiga chamava `openTermHistory(term.id)`, que fazia `setStack` — e
 * o back da usuária tinha que descer um frame por card que ela tinha aberto.
 */
describe('TermHistoryScreen — expandir sem mexer na navegação', () => {
  it('abre e fecha o resumo no estado local, sem chamar openTermHistory', () => {
=======
  openSemesterMemories.mockClear();
});

describe('TermHistoryScreen — header de jornada', () => {
  it('mostra eyebrow e título do arquivo', () => {
    render(<TermHistoryScreen />);
    expect(screen.getByText(/sua jornada/i)).toBeDefined();
    expect(screen.getByRole('heading', { name: /semestres passados/i })).toBeDefined();
  });

  it('mostra progresso com base no período ativo, não no campo legado', () => {
    render(<TermHistoryScreen />);
    // ativo é o 8º de 10 → "1 de 10 semestres guardados" (somente o 7º encerrado passa)
    expect(screen.getByText(/1 de 10 semestres guardados/)).toBeDefined();
    expect(screen.queryByText(/3 de 10 semestres guardados/)).toBeNull();
  });
});

describe('TermHistoryScreen — lista de períodos encerrados', () => {
  it('mostra só períodos encerrados anteriores ao ativo', () => {
    render(<TermHistoryScreen />);
    expect(screen.getByText('7º semestre')).toBeDefined();
    expect(screen.queryByText('8º semestre')).toBeNull();
  });

  it('formata a data de encerramento com helper de data civil', () => {
    render(<TermHistoryScreen />);
    expect(screen.getByText(/31\/12\/2026/)).toBeDefined();
  });

  it('mostra a quantidade de memórias do semestre', () => {
    render(<TermHistoryScreen />);
    // sem memórias no mock: chip mostra "0 memórias"
    expect(screen.getByText(/0 memórias/)).toBeDefined();
  });
});

describe('TermHistoryScreen — reabrir período (alto impacto, com confirmação)', () => {
  it('oferece reabrir só no período encerrado', () => {
    render(<TermHistoryScreen />);
    expect(screen.getAllByRole('button', { name: /reabrir como atual/i })).toHaveLength(1);
  });

  it('o primeiro clique abre a confirmação sem chamar reopenTermById', () => {
    render(<TermHistoryScreen />);
    fireEvent.click(screen.getByRole('button', { name: /reabrir como atual/i }));
    expect(reopenTermById).not.toHaveBeenCalled();
    expect(screen.getByText(/reabrir torna o 7º semestre o semestre atual/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /confirmar reabertura/i })).toBeDefined();
  });

  it('confirmar reabertura chama reopenTermById com o id do período', () => {
    render(<TermHistoryScreen />);
    fireEvent.click(screen.getByRole('button', { name: /reabrir como atual/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar reabertura/i }));
    expect(reopenTermById).toHaveBeenCalledWith('trm-2');
    expect(showToast).toHaveBeenCalledWith('7º semestre voltou a ser o seu semestre atual ♡');
  });
});

describe('TermHistoryScreen — expansão local sem mexer na navegação', () => {
  it('abre e fecha o resumo no estado local, sem abrir arquivo nem memórias', () => {
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    render(<TermHistoryScreen />);

    fireEvent.click(screen.getByRole('button', { name: /ver o resumo inteiro/i }));
    expect(screen.getByRole('button', { name: /esconder o resumo/i })).toBeDefined();
<<<<<<< HEAD
    expect(openTermHistory).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /esconder o resumo/i }));
    expect(screen.getByRole('button', { name: /ver o resumo inteiro/i })).toBeDefined();
    expect(openTermHistory).not.toHaveBeenCalled();
  });

  it('cinco expansões não abrem cinco telas (a pilha continua com 2 frames)', () => {
    // o botão de expandir só existe em período com `summary`, então o 7º (único
    // encerrado no mock) é o alvo; o efeito observado é o mesmo para qualquer um
    const toggle = () => screen.getByRole('button', { name: /resumo/i });
    render(<TermHistoryScreen />);

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(toggle());
    }

    // nenhuma navegação foi disparada — o ponto é esse
    expect(openTermHistory).not.toHaveBeenCalled();
=======
    expect(openSemesterMemories).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /esconder o resumo/i }));
    expect(screen.getByRole('button', { name: /ver o resumo inteiro/i })).toBeDefined();
    expect(openSemesterMemories).not.toHaveBeenCalled();
  });
});

describe('TermHistoryScreen — ações explícitas', () => {
  it('abrir memórias é um CTA separado e chama openSemesterMemories', () => {
    render(<TermHistoryScreen />);
    fireEvent.click(screen.getByRole('button', { name: /abrir memórias/i }));
    expect(openSemesterMemories).toHaveBeenCalledWith('trm-2');
  });

  it('o card inteiro abre o arquivo do semestre', () => {
    render(<TermHistoryScreen />);
    fireEvent.click(screen.getByRole('button', { name: /arquivo do 7º semestre/i }));
    expect(openSemesterMemories).toHaveBeenCalledWith('trm-2');
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  });
});
