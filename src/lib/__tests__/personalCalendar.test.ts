// View model da agenda pessoal (SPEC-redesign-calendario §23 / §29).
// Testa a derivação única de eventos sem alterar fontes persistidas.
// Datas fixas: não depende de `todayKeyLocal()` (que varia pelo fuso do ambiente).
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { buildPersonalCalendar } from '../personalCalendar';
import type { Course, Exam, Task, StudySession, InternshipLog } from '../../types';
import type { ThesisProject, ThesisChapter, ThesisTask, ThesisMeeting } from '../../types';
import type { ReadingItem, Flashcard } from '../../types';

const HOJE = '2026-10-30'; // sexta-feira

const course = (id: string, name: string): Course =>
  ({
    id,
    name,
    professor: 'Prof.',
    semester: '6',
    status: 'ativo',
    schedule: [{ day: 4, start: '09:00', end: '11:00' }], // quinta
    color: '#4A879F',
    icon: 'BookOpen',
  } as Course);

const exam = (id: string, title: string, date: string, time?: string): Exam =>
  ({ id, title, date, time, weight: '40%', topics: [], completed: false } as Exam);

const task = (id: string, title: string, dueDate: string): Task =>
  ({
    id,
    title,
    category: 'outro',
    priority: 'media',
    completed: false,
    dueDate,
  } as Task);

const session = (id: string, topic: string, date: string, startTime?: string): StudySession =>
  ({ id, topic, date, startTime, durationMinutes: 30 } as StudySession);

const internship = (id: string, activity: string, date: string): InternshipLog =>
  ({
    id,
    activity,
    date,
    patientKey: 'paciente-1',
    hours: 4,
    type: 'atendimento',
    reflections: [],
  } as unknown as InternshipLog);

const argsBase = {
  courses: [course('c-1', 'psicopatologia I')],
  exams: [
    exam('e-1', 'prova de psicopatologia', HOJE, '09:00'),
    exam('e-2', 'prova de novembro', '2026-11-02', '09:00'),
  ],
  tasks: [task('t-1', 'resumo capítulo 3', '2026-10-31')],
  thesis: { id: 'tcc-main', title: 'luto', advisor: 'Helena', status: 'em_andamento' } as ThesisProject,
  chapters: [],
  thesisTasks: [],
  meetings: [],
  internshipLogs: [internship('i-1', 'estágio supervisionado', '2026-11-03')],
  studySessions: [session('s-1', 'revisar cartões', HOJE)],
  readings: [],
  flashcards: [],
  selectedDate: HOJE,
  visibleYear: 2026,
  visibleMonth: 10,
};

describe('buildPersonalCalendar', () => {
  const AGORA = new Date(2026, 9, 30, 10, 0); // 30/10/2026, sexta-feira

  beforeEach(() => {
    vi.useFakeTimers({ now: AGORA });
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it('semana atual com aulas, provas e tarefas', () => {
    const vm = buildPersonalCalendar(argsBase);
    expect(vm.week.classes).toBeGreaterThan(0);
    expect(vm.week.exams).toBe(1);
    expect(vm.week.tasks).toBe(1);
    // o estágio de 03/11 está fora da semana atual (25/10 a 31/10)
    expect(vm.week.internship).toBe(0);
    // a prova de hoje está no dia selecionado
    expect(vm.selectedDayEvents.find((e) => e.kind === 'exam')).toBeDefined();
  });

  it('prova de novembro aparece nos próximos dias', () => {
    const vm = buildPersonalCalendar(argsBase);
    const prova = vm.upcomingDays
      .flatMap((d) => d.events)
      .find((e) => e.kind === 'exam' && e.date === '2026-11-02');
    expect(prova).toBeDefined();
    expect(prova?.title).toBe('prova de novembro');
  });

  it('tarefa de amanhã aparece agrupada por data', () => {
    const vm = buildPersonalCalendar(argsBase);
    const tarefa = vm.upcomingDays
      .flatMap((d) => d.events)
      .find((e) => e.kind === 'task' && e.date === '2026-10-31');
    expect(tarefa).toBeDefined();
    expect(tarefa?.title).toBe('resumo capítulo 3');
  });

  it('estágio aparece no dia do log', () => {
    const vm = buildPersonalCalendar(argsBase);
    const estagio = vm.upcomingDays.flatMap((d) => d.events).find((e) => e.kind === 'internship');
    expect(estagio).toBeDefined();
    expect(estagio?.date).toBe('2026-11-03');
  });

  it('sessão de foco com data aparece como focus', () => {
    const vm = buildPersonalCalendar(argsBase);
    const foco = vm.upcomingDays.flatMap((d) => d.events).find((e) => e.kind === 'focus');
    expect(foco).toBeDefined();
    expect(foco?.title).toBe('revisar cartões');
  });

  it('hoje sem eventos', () => {
    const vm = buildPersonalCalendar({ ...argsBase, studySessions: [], exams: [], tasks: [] });
    expect(vm.today).toEqual([]);
    expect(vm.cecinho.tone).not.toBe('busy');
  });

  it('amanhã sem eventos', () => {
    const vm = buildPersonalCalendar({ ...argsBase, tasks: [] });
    const tarefaAmanha = vm.upcomingDays
      .flatMap((d) => d.events)
      .find((e) => e.kind === 'task' && e.date === '2026-10-31');
    expect(tarefaAmanha).toBeUndefined();
  });

  it('próximos 14 dias agrupados por data, sem datas duplicadas', () => {
    const vm = buildPersonalCalendar(argsBase);
    expect(vm.upcomingDays.length).toBeGreaterThan(0);
    const datas = vm.upcomingDays.map((d) => d.date);
    expect(new Set(datas).size).toBe(datas.length);
  });

  it('data passada é consultável (não polui próximos dias)', () => {
    const vm = buildPersonalCalendar({
      ...argsBase,
      selectedDate: '2026-10-05', // segunda, sem eventos recorrentes
    });
    expect(vm.selectedDate).toBe('2026-10-05');
    expect(vm.selectedDayEvents).toEqual([]);
  });

  it('múltiplos tipos no mesmo dia', () => {
    const vm = buildPersonalCalendar({
      ...argsBase,
      exams: [exam('e-1', 'prova', '2026-10-30', '09:00')],
      tasks: [task('t-1', 'tarefa', '2026-10-30')],
    });
    const hoje = vm.upcomingDays.find((d) => d.date === '2026-10-30');
    expect(hoje?.events.find((e) => e.kind === 'exam')).toBeDefined();
    expect(hoje?.events.find((e) => e.kind === 'task')).toBeDefined();
  });

  it('evento sem disciplina continua com destino', () => {
    const vm = buildPersonalCalendar({
      ...argsBase,
      tasks: [task('t-1', 'tarefa avulsa', '2026-10-31')],
    });
    const tarefa = vm.upcomingDays
      .flatMap((d) => d.events)
      .find((e) => e.kind === 'task');
    expect(tarefa?.destination).toBe('task');
  });

  it('leituras sem data não viram evento artificial', () => {
    const leitura = {
      id: 'r-1',
      title: 'psicologia do desenvolvimento',
      author: 'Autor',
      type: 'livro' as const,
      status: 'lendo' as const,
    } as ReadingItem;
    const vm = buildPersonalCalendar({ ...argsBase, readings: [leitura] });
    const leituraEvento = vm.upcomingDays.flatMap((d) => d.events).find((e) => e.kind === 'reading');
    expect(leituraEvento).toBeUndefined();
  });

  it('change de mês atualiza o mês visível', () => {
    const vm = buildPersonalCalendar({ ...argsBase, visibleYear: 2026, visibleMonth: 11 });
    expect(vm.visibleMonth).toBe('2026-11');
  });

  it('seleção de data atualiza o dia selecionado', () => {
    const vm = buildPersonalCalendar({ ...argsBase, selectedDate: '2026-11-02' });
    expect(vm.selectedDate).toBe('2026-11-02');
    expect(vm.selectedDayEvents.find((e) => e.kind === 'exam')).toBeDefined();
  });
});
