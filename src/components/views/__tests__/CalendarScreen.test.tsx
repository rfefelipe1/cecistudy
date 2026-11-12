// Agenda (SPEC-035): a subtela continua abrindo pelo mesmo `openCalendar`, o
// toque abre a entidade real, e a criação continua sendo a que já existe.
// O teste usa o `MobileAppProvider` de verdade — o caminho de produção.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '../../../context/mobileApp';
import { useDataClientCourses } from '../../../context/DataClientProvider';
import { CalendarScreen } from '../CalendarScreen';
import CalendarMonth from '../faculdade/CalendarMonth';
import { addDaysKey, todayKeyLocal } from '../../../lib/dateBR';
import type { CalendarEntry } from '../../../lib/schedule';
import type { Task, ThesisChapter, ThesisProject } from '../../../types';

afterEach(cleanup);

let chaptersSnapshot = '';
let tasksSnapshot = '';

const task = (id: string, dueDate?: string, over: Partial<Task> = {}): Task =>
  ({
    id,
    title: `tarefa ${id}`,
    category: 'outro',
    priority: 'media',
    completed: false,
    dueDate,
    ...over,
  }) as Task;

const chapter = (id: string, title: string, dueDate: string): ThesisChapter =>
  ({
    id,
    thesisId: 'tcc-main',
    position: 0,
    title,
    kind: 'capitulo',
    requiredness: 'obrigatorio',
    stage: 'escrevendo',
    dueDate,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  }) as ThesisChapter;

const thesisWithTitle = (): ThesisProject =>
  ({
    id: 'tcc-main',
    title: 'luto e escuta clínica',
    advisor: 'Helena Duarte',
    status: 'em_andamento',
  }) as ThesisProject;

/** Espia o menu universal: prova que a linha chamou `openManageItem`. */
const ManagedProbe = () => {
  const { managedItem } = useMobileApp();
  return (
    <span data-testid="managed">{managedItem ? `${managedItem.kind}:${managedItem.id}` : 'none'}</span>
  );
};

/** Espia as tarefas persistidas: prova que a criação mínima gravou. */
const TasksProbe = () => {
  const { tasks } = useDataClientCourses();
  return <span data-testid="tasks">{tasks.map((t) => `${t.id}:${t.dueDate ?? 'sem-data'}`).join(',')}</span>;
};

const Seed = ({
  tasks,
  chapters,
  thesis,
}: {
  tasks: Task[];
  chapters: ThesisChapter[];
  thesis?: ThesisProject;
}) => {
  const { openCalendar, setThesisChapters, handleUpdateTcc } = useMobileApp();
  const { setTasks } = useDataClientCourses();
  useEffect(() => {
    chaptersSnapshot = JSON.stringify(chapters);
    setTasks(tasks);
    tasksSnapshot = JSON.stringify(tasks);
    if (thesis) handleUpdateTcc(thesis);
    setThesisChapters(chapters);
    openCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const renderAgenda = (props: {
  tasks: Task[];
  chapters?: ThesisChapter[];
  thesis?: ThesisProject;
  extra?: React.ReactNode;
}) =>
  render(
    <MobileAppProvider>
      <Seed tasks={props.tasks} chapters={props.chapters ?? []} thesis={props.thesis} />
      {props.extra}
      <CalendarScreen />
    </MobileAppProvider>,
  );

describe('Agenda — a subtela abre em hoje e não escreve no render', () => {
  it('I4 — montar a tela não altera o dado semeado', () => {
    const chapters = [chapter('thc-1', 'revisão de literatura', addDaysKey(todayKeyLocal(), 2))];
    renderAgenda({ tasks: [task('t-1', addDaysKey(todayKeyLocal(), 3))], chapters });

    expect(screen.getAllByText('tarefa t-1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('revisão de literatura').length).toBeGreaterThan(0);
    expect(JSON.stringify(chapters)).toBe(chaptersSnapshot);
    expect(JSON.stringify([task('t-1', addDaysKey(todayKeyLocal(), 3))])).toBe(tasksSnapshot);
  });

  it('CF-001 — o cabeçalho diz agenda e a data de hoje está selecionada', () => {
    renderAgenda({ tasks: [] });
    expect(screen.getByRole('heading', { name: 'agenda' })).toBeTruthy();
    const hoje = document.querySelector('[aria-current="date"]');
    expect(hoje?.getAttribute('aria-label')).toMatch(new RegExp(todayKeyLocal().slice(8, 10)));
  });
});

describe('Agenda — atenção e ordem (CF-002)', () => {
  it('a atrasada aparece antes da futura', () => {
    const hoje = todayKeyLocal();
    renderAgenda({
      tasks: [
        task('t-futura', addDaysKey(hoje, 5)),
        task('t-atrasada', addDaysKey(hoje, -2)),
      ],
    });

    const linhas = screen.getAllByText(/tarefa t-/).map((el) => el.textContent);
    expect(linhas[0]).toBe('tarefa t-atrasada');
    expect(screen.getAllByText('atrasada').length).toBeGreaterThan(0);
  });

  it('CF-003 — evento não tem checkbox de tarefa; tarefa tem', () => {
    const hoje = todayKeyLocal();
    renderAgenda({ tasks: [task('t-hoje', hoje)] });

    const daTarefa = screen.getAllByRole('checkbox', { name: 'concluir tarefa t-hoje' });
    expect(daTarefa.length).toBeGreaterThan(0);
    // a tarefa aparece na atenção e no dia — mas todo checkbox é dela: evento
    // nenhum ganha checkbox de conclusão.
    expect(screen.getAllByRole('checkbox')).toHaveLength(daTarefa.length);
  });

  it('D19 — o toque na tarefa abre o gerenciar dela', () => {
    renderAgenda({ tasks: [task('t-1', addDaysKey(todayKeyLocal(), 3))], extra: <ManagedProbe /> });

    fireEvent.click(screen.getAllByText('tarefa t-1')[0]);
    expect(screen.getByTestId('managed')).toHaveTextContent('task:t-1');
  });
});

describe('Agenda — inbox (CF-004)', () => {
  it('tarefa sem data aparece na inbox e não recebe prazo', () => {
    renderAgenda({ tasks: [task('t-sem-data')] });

    expect(screen.getByText('pendências para organizar depois')).toBeTruthy();
    expect(screen.getByText(/1 sem data/)).toBeTruthy();
    expect(screen.queryAllByText('tarefa t-sem-data')).toHaveLength(0);
  });

  it('o filtro sem data mostra a tarefa da inbox', () => {
    renderAgenda({ tasks: [task('t-sem-data')] });

    fireEvent.click(screen.getByRole('button', { name: /^sem data/ }));
    expect(screen.getAllByText('tarefa t-sem-data').length).toBeGreaterThan(0);
  });
});

describe('Agenda — criação (CF-005/CF-006)', () => {
  it('CF-005 — cria tarefa só com o título, com a data contextual', () => {
    renderAgenda({ tasks: [], extra: <TasksProbe /> });

    fireEvent.click(screen.getByLabelText('adicionar à agenda'));
    fireEvent.click(screen.getByRole('button', { name: 'nova tarefa' }));
    fireEvent.change(screen.getByPlaceholderText('ex: ler capítulo 4 de psicopatologia'), {
      target: { value: 'separar referências' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'guardar só com o título' }));

    // §11.4: a data contextual selecionada é o padrão do formulário.
    expect(screen.getByTestId('tasks')).toHaveTextContent(`:${todayKeyLocal()}`);
  });

  it('CF-006 — a criação a partir da data selecionada nasce com essa data', () => {
    renderAgenda({ tasks: [] });

    fireEvent.click(screen.getByLabelText('adicionar à agenda'));
    fireEvent.click(screen.getByRole('button', { name: 'nova tarefa' }));
    fireEvent.change(screen.getByPlaceholderText('ex: ler capítulo 4 de psicopatologia'), {
      target: { value: 'ler' },
    });
    for (let passo = 0; passo < 3; passo += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    }
    // o campo de prazo do sheet nasce com o dia selecionado (hoje)
    expect(screen.getByLabelText('data limite (prazo)')).toHaveValue(todayKeyLocal());
  });
});

describe('Agenda — portas de criação preservadas (SPEC-024 D5/D20)', () => {
  it('o `+` abre as portas que existem, e a reunião só com TCC', () => {
    renderAgenda({ tasks: [] });

    fireEvent.click(screen.getByLabelText('adicionar à agenda'));
    expect(screen.getByRole('button', { name: 'nova tarefa' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'nova prova' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'reunião do tcc' })).toBeNull();
  });

  it('com TCC a porta de reunião aparece, já com a data do dia', () => {
    renderAgenda({ tasks: [], thesis: thesisWithTitle() });

    fireEvent.click(screen.getByLabelText('adicionar à agenda'));
    fireEvent.click(screen.getByRole('button', { name: 'reunião do tcc' }));
    expect(screen.getByLabelText('data')).toHaveValue(todayKeyLocal());
  });
});

describe('Agenda — filtro sem resultado (CF-008)', () => {
  it('oferece limpar os filtros e voltar para tudo', () => {
    renderAgenda({ tasks: [] });

    fireEvent.click(screen.getByRole('button', { name: /^atrasadas/ }));
    expect(screen.getByText(/nada apareceu com esses filtros/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'limpar filtros' }));
    expect(screen.queryByText(/nada apareceu com esses filtros/)).toBeNull();
  });
});

describe('CalendarMonth (SPEC-024 D6)', () => {
  const entry = (date: string): CalendarEntry => ({
    id: `e-${date}`,
    date,
    kind: 'tarefa',
    layer: 'faculdade',
    title: 'antiga',
    ref: { kind: 'task', id: 't1' },
  });

  it('I10 — o dia 5 de dezembro não marca o dia 5 de janeiro', () => {
    render(
      <CalendarMonth
        year={2027}
        month={1}
        entries={[entry('2026-12-05')]}
        today="2027-01-10"
        selected={null}
        onShift={() => {}}
        onToday={() => {}}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByLabelText('dia 5')).toBeTruthy();
    expect(screen.queryByLabelText('dia 5, tem itens')).toBeNull();
    // e o dia certo do mês seguinte aparece marcado
    expect(screen.getByLabelText('dia 10')).toBeTruthy();
  });

  it('marca o dia do mês visível que tem item', () => {
    render(
      <CalendarMonth
        year={2027}
        month={1}
        entries={[entry('2027-01-05')]}
        today="2027-01-10"
        selected={null}
        onShift={() => {}}
        onToday={() => {}}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByLabelText('dia 5, tem itens')).toBeTruthy();
  });
});
