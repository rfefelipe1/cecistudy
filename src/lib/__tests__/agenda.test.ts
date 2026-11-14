// View model da Agenda (SPEC-035 D2/D3/D4). Datas fixas: nada aqui lê o relógio
// do ambiente — `today` e `selectedDate` entram por argumento.
import { describe, expect, it } from 'vitest';
import { buildAgenda, itemsForFilter } from '../agenda';
import type { BuildAgendaArgs } from '../agenda';
import type { Course, Exam, Task } from '../../types';

const HOJE = '2026-11-11'; // quarta-feira
const AMANHA = '2026-11-12';
const ONTEM = '2026-11-10';

const course = (id: string, name: string): Course =>
  ({
    id,
    name,
    professor: 'Prof.',
    semester: '6',
    status: 'ativo',
    schedule: [{ day: 3, start: '09:00', end: '11:00' }], // quarta
    color: '#4A879F',
    icon: 'BookOpen',
  }) as Course;

const exam = (id: string, title: string, date: string, time?: string): Exam =>
  ({ id, title, date, time, weight: '40%', topics: [], completed: false }) as Exam;

const task = (id: string, title: string, dueDate?: string, over: Partial<Task> = {}): Task =>
  ({
    id,
    title,
    category: 'outro',
    priority: 'media',
    completed: false,
    dueDate,
    ...over,
  }) as Task;

const args = (over: Partial<BuildAgendaArgs> = {}): BuildAgendaArgs => ({
  courses: [course('c-1', 'psicopatologia I')],
  exams: [],
  tasks: [],
  chapters: [],
  thesisTasks: [],
  meetings: [],
  internshipLogs: [],
  studySessions: [],
  today: HOJE,
  selectedDate: HOJE,
  ...over,
});

describe('buildAgenda — atenção primeiro (D3)', () => {
  it('atrasada vem antes de hoje e de futura', () => {
    const vm = buildAgenda(
      args({
        tasks: [
          task('t-futura', 'entregar análise', '2026-11-20'),
          task('t-hoje', 'revisar resumo', HOJE),
          task('t-atrasada', 'ler capítulo 4', ONTEM),
        ],
      }),
    );

    expect(vm.overdue.map((i) => i.task.id)).toEqual(['t-atrasada']);
    expect(vm.attention[0].id).toBe('tarefa-t-atrasada');
    expect(vm.attention.map((i) => i.id)).toContain('tarefa-t-hoje');
  });

  it('ordena por prazo, prioridade, título e id — sem empate aleatório', () => {
    const vm = buildAgenda(
      args({
        courses: [],
        tasks: [
          task('t-b', 'b — revisar', '2026-11-13'),
          task('t-a', 'a — revisar', '2026-11-13'),
          task('t-alta', 'z — urgente', '2026-11-13', { priority: 'alta' }),
        ],
      }),
    );

    const ordem = vm.attention.map((i) => (i.kind === 'task' ? i.task.id : i.id));
    expect(ordem).toEqual(['t-alta', 't-a', 't-b']);
  });

  it('tarefa concluída sai da atenção, mas continua visível no dia', () => {
    const vm = buildAgenda(
      args({
        courses: [],
        tasks: [
          task('t-feita', 'já fiz', ONTEM, { completed: true }),
          task('t-hoje-feita', 'fiz hoje', HOJE, { completed: true }),
        ],
      }),
    );

    expect(vm.overdue).toHaveLength(0);
    expect(vm.attention).toHaveLength(0);
    expect(vm.todayItems.map((i) => i.id)).toEqual(['tarefa-t-hoje-feita']);
  });

  it('limita a atenção a 5 e conta o resto', () => {
    const tasks = Array.from({ length: 8 }, (_, i) => task(`t-${i}`, `tarefa ${i}`, ONTEM));
    const vm = buildAgenda(args({ courses: [], tasks }));

    expect(vm.attention).toHaveLength(5);
    expect(vm.attentionRest).toBe(3);
  });
});

describe('buildAgenda — tarefa e evento não são a mesma coisa (D1)', () => {
  it('evento nunca entra como atraso', () => {
    const vm = buildAgenda(
      args({ courses: [], exams: [exam('e-passada', 'prova antiga', ONTEM)], selectedDate: ONTEM }),
    );

    expect(vm.overdue).toHaveLength(0);
    expect(vm.attention).toHaveLength(0);
    // e ele continua consultável no dia em que aconteceu
    expect(vm.selectedDay.map((i) => i.id)).toEqual(['prova-e-passada']);
    expect(vm.selectedDay[0].kind).toBe('event');
  });

  it('aula derivada da grade é evento e aparece no dia, sem checkbox', () => {
    const vm = buildAgenda(args());

    const aula = vm.todayItems.find((i) => i.kind === 'event');
    expect(aula?.kind).toBe('event');
    expect(aula?.kind === 'event' && aula.entry.kind).toBe('aula');
  });
});

describe('buildAgenda — inbox (D4)', () => {
  it('tarefa sem data vai para a inbox e não recebe data inventada', () => {
    const vm = buildAgenda(
      args({ tasks: [task('t-sem-data', 'separar referências')] }),
    );

    expect(vm.inbox.map((i) => i.task.id)).toEqual(['t-sem-data']);
    expect(vm.inbox[0].date).toBeUndefined();
    expect(vm.attention.map((i) => i.id)).not.toContain('tarefa-t-sem-data');
    expect(vm.upcoming.flatMap((g) => g.items).map((i) => i.id)).not.toContain(
      'tarefa-t-sem-data',
    );
  });

  it('inbox vazia quando todas as tarefas têm data', () => {
    const vm = buildAgenda(args({ tasks: [task('t-1', 'com prazo', AMANHA)] }));
    expect(vm.inbox).toHaveLength(0);
  });
});

describe('buildAgenda — mesma entidade, mesmo id e destino (CF-010)', () => {
  it('a tarefa que aparece na atenção e nos próximos dias é a mesma', () => {
    const vm = buildAgenda(args({ tasks: [task('t-1', 'entregar análise', AMANHA)] }));

    const naAtencao = vm.attention.find((i) => i.id === 'tarefa-t-1');
    const nosProximos = vm.upcoming
      .flatMap((g) => g.items)
      .find((i) => i.id === 'tarefa-t-1');

    expect(naAtencao?.kind).toBe('task');
    expect(nosProximos?.kind).toBe('task');
    expect(naAtencao?.kind === 'task' && naAtencao.task.id).toBe('t-1');
    expect(nosProximos?.kind === 'task' && nosProximos.task.id).toBe('t-1');
  });

  it('todo evento aponta para a entrada que o originou', () => {
    const vm = buildAgenda(args({ exams: [exam('e-1', 'prova', AMANHA, '09:00')] }));
    const prova = vm.upcoming.flatMap((g) => g.items).find((i) => i.kind === 'event');

    expect(prova?.kind === 'event' && prova.entry.ref).toEqual({ kind: 'exam', id: 'e-1' });
    expect(prova?.date).toBe(AMANHA);
  });
});

describe('buildAgenda — filtros (D7)', () => {
  const vm = () =>
    buildAgenda(
      args({
        tasks: [
          task('t-atrasada', 'atrasada', ONTEM),
          task('t-hoje', 'de hoje', HOJE),
          task('t-futura', 'futura', '2026-11-15'),
          task('t-inbox', 'sem data'),
        ],
        exams: [exam('e-1', 'prova', '2026-11-18', '09:00')],
      }),
    );

  it('atrasadas devolve só o que está atrasado', () => {
    expect(itemsForFilter(vm(), 'atrasadas').map((i) => i.id)).toEqual(['tarefa-t-atrasada']);
  });

  it('hoje devolve o dia atual inteiro', () => {
    const ids = itemsForFilter(vm(), 'hoje').map((i) => i.id);
    expect(ids).toContain('tarefa-t-hoje');
    expect(ids).toContain('aula-c-1-09:00-2026-11-11');
    expect(ids).not.toContain('tarefa-t-futura');
  });

  it('próximos prazos devolve só o que vem depois de hoje', () => {
    const datas = itemsForFilter(vm(), 'proximos').map((i) => i.date);
    expect(datas.every((d) => !!d && d > HOJE)).toBe(true);
  });

  it('sem data devolve só a inbox', () => {
    expect(itemsForFilter(vm(), 'sem-data').map((i) => i.id)).toEqual(['tarefa-t-inbox']);
  });
});

describe('buildAgenda — tempo e dia consultado (CF-012)', () => {
  it('o prazo de hoje é hoje: data civil não desloca por fuso', () => {
    const vm = buildAgenda(args({ courses: [], tasks: [task('t-1', 'prazo hoje', HOJE)] }));
    expect(vm.todayItems.map((i) => i.id)).toEqual(['tarefa-t-1']);
    expect(vm.overdue).toHaveLength(0);
  });

  it('consultar uma data fora da janela ainda mostra o dia', () => {
    const vm = buildAgenda(
      args({
        selectedDate: '2026-12-20',
        tasks: [task('t-natal', 'entrega de dezembro', '2026-12-20')],
      }),
    );

    expect(vm.selectedDay.map((i) => i.id)).toEqual(['tarefa-t-natal']);
    // e o dia consultado não contamina a atenção de hoje
    expect(vm.attention.map((i) => i.id)).not.toContain('tarefa-t-natal');
  });

  it('sem nada marcado, o vazio é o vazio de verdade', () => {
    const vm = buildAgenda(args({ courses: [] }));
    expect(vm.empty).toBe(true);
    expect(vm.tone).toBe('empty');
  });
});
