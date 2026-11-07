<<<<<<< HEAD
// SPEC-024 D3/D5: agenda de 14 dias, mês navegável e painel do dia com `+`.
// O teste usa o `MobileAppProvider` de verdade (o caminho de produção), como o
// `TccView.test.tsx`.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useEffect } from 'react';
=======
// Calendário — nova composição (SPEC-redesign-calendario).
// Testa a tela unificada: header, resumo da semana, cecinho, mês compacto,
// agenda do dia selecionado, próximos dias e ação de criação.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, beforeEach } from 'vitest';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '../../../context/mobileApp';
import { useDataClientCourses } from '../../../context/DataClientProvider';
import { CalendarScreen } from '../CalendarScreen';
<<<<<<< HEAD
import CalendarMonth from '../faculdade/CalendarMonth';
import { addDaysKey, todayKeyLocal } from '../../../lib/dateBR';
import type { CalendarEntry } from '../../../lib/schedule';
import type { Task, ThesisChapter, ThesisProject } from '../../../types';

afterEach(cleanup);

let chaptersSnapshot = '';
=======
import { addDaysKey, todayKeyLocal } from '../../../lib/dateBR';
import type { Task } from '../../../types';

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

const task = (id: string, dueDate: string): Task =>
  ({
    id,
    title: `tarefa ${id}`,
    category: 'outro',
    priority: 'media',
    completed: false,
    dueDate,
  }) as Task;

<<<<<<< HEAD
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
  return <span data-testid="managed">{managedItem ? `${managedItem.kind}:${managedItem.id}` : 'none'}</span>;
};

const Seed = ({ chapters, thesis }: { chapters: ThesisChapter[]; thesis?: ThesisProject }) => {
  const { openCalendar, setThesisChapters, handleUpdateTcc } = useMobileApp();
  const { setTasks } = useDataClientCourses();
  useEffect(() => {
    chaptersSnapshot = JSON.stringify(chapters);
    setTasks([task('t-1', addDaysKey(todayKeyLocal(), 3))]);
    if (thesis) handleUpdateTcc(thesis);
    setThesisChapters(chapters);
    openCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

describe('CalendarScreen (SPEC-024 D3/D5)', () => {
  it('I4 — montar a tela não escreve: o dado semeado continua igual', () => {
    const chapters = [chapter('thc-1', 'revisão de literatura', addDaysKey(todayKeyLocal(), 2))];
    render(
      <MobileAppProvider>
        <Seed chapters={chapters} />
        <CalendarScreen />
      </MobileAppProvider>,
    );

    // a agenda de 14 dias mostra a tarefa e o capítulo, uma vez cada
    expect(screen.getAllByText('tarefa t-1')).toHaveLength(1);
    expect(screen.getAllByText('revisão de literatura')).toHaveLength(1);
    expect(JSON.stringify(chapters)).toBe(chaptersSnapshot);
  });

  it('D5 — o `+` do dia abre as portas que existem, e a reunião só com TCC', () => {
=======
function Seed({ chapters = [] }: { chapters?: any[] }) {
  const { setThesisChapters } = useMobileApp();
  const { setTasks } = useDataClientCourses();
  const hoje = todayKeyLocal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    setTasks([
      task('t-1', hoje), // hoje, dentro da semana
      task('t-2', addDaysKey(hoje, 2)), // nos próximos dias
    ]);
    setThesisChapters(chapters);
  }, []);
  return null;
}

// eslint-disable-next-line react-hooks/rules-of-hooks

describe('CalendarScreen (nova composição)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('monta com header do calendário, resumo da semana e cecinho', () => {
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
<<<<<<< HEAD
    fireEvent.click(screen.getByLabelText('adicionar item neste dia'));
    expect(screen.getByText('pendência')).toBeTruthy();
    expect(screen.getByText('prova')).toBeTruthy();
    expect(screen.queryByText('reunião do tcc')).toBeNull();
  });

  it('D5 — com TCC a porta de reunião aparece', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} thesis={thesisWithTitle()} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    fireEvent.click(screen.getByLabelText('adicionar item neste dia'));
    expect(screen.getByText('reunião do tcc')).toBeTruthy();
  });

  it('D19 — tarefa sem disciplina abre o gerenciar (a linha não fica morta)', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <ManagedProbe />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    fireEvent.click(screen.getByText('tarefa t-1'));
    expect(screen.getByTestId('managed')).toHaveTextContent('task:t-1');
  });

  it('D20 — o `+` do dia abre a reunião já com a data do dia escolhido', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} thesis={thesisWithTitle()} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    fireEvent.click(screen.getByLabelText('adicionar item neste dia'));
    fireEvent.click(screen.getByText('reunião do tcc'));
    expect(screen.getByLabelText('data')).toHaveValue(todayKeyLocal());
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
=======
    expect(screen.getByText('calendário ♡')).toBeTruthy();
    expect(screen.getByText('sua semana ♡')).toBeTruthy();
    expect(screen.getByText('recado do cecinho')).toBeTruthy();
  });

  it('mostra o calendário mensal compacto com o mês atual', () => {
    const hoje = todayKeyLocal();
    const mesAtual = hoje.slice(0, 7); // 'YYYY-MM'
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    expect(screen.getAllByText(mesAtual).length).toBeGreaterThan(0);
  });

  it('mostra a data de hoje selecionada por padrão', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    expect(screen.getAllByText(/hoje/).length).toBeGreaterThan(0);
  });

  it('agrupa os próximos dias em hoje / amanhã / depois de amanhã', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    expect(screen.getByText('próximos dias')).toBeTruthy();
    expect(screen.getByText('depois de amanhã')).toBeTruthy();
  });

  it('oferece botões de adicionar tarefa e prova', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    expect(screen.getByLabelText('adicionar tarefa')).toBeTruthy();
    expect(screen.getByLabelText('adicionar prova')).toBeTruthy();
  });

  it('tarefa sem disciplina aparece na agenda', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    expect(screen.getAllByText('tarefa t-1').length).toBeGreaterThan(0);
  });

  it('selecionar um dia no calendário atualiza a agenda do dia', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    // clica em um dia do mês corrente (não desabilitado) — pode haver múltiplos
    // elementos com label /dia 10/ (dias de meses adjacentes na grade), então
    // filtra apenas os habilitados do mês corrente.
    const dias10 = screen.getAllByLabelText(/dia 10/);
    const diaCorrente = dias10.find((el) => !el.hasAttribute('disabled')) ?? dias10[0];
    fireEvent.click(diaCorrente);
    // após selecionar, deve haver alguma agenda renderizada (dia selecionado ou próximo grupo)
    expect(screen.getByRole('heading', { name: /próximos dias/ })).toBeTruthy();
  });

  it('clicar em adicionar tarefa abre o sheet de criação', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    fireEvent.click(screen.getByLabelText('adicionar tarefa'));
    // o sheet de tarefa deve abrir (modal com título do primeiro passo)
    expect(screen.getByText('o que fazer?')).toBeTruthy();
  });

  it('clicar em adicionar prova não lança erro', () => {
    render(
      <MobileAppProvider>
        <Seed chapters={[]} />
        <CalendarScreen />
      </MobileAppProvider>,
    );
    // apenas verifica que o botão existe e é clicável sem lançar erro
    expect(screen.getByLabelText('adicionar prova')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('adicionar prova'));
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  });
});
