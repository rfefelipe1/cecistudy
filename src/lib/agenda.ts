// Agenda do mobile (SPEC-035): o view model derivado da tela.
//
// Uma fonte só, e ela não é nova: eventos vêm de `buildCalendarEntries` (D4 da
// SPEC-024) e tarefas vêm de `tasks`. Nada é persistido aqui e nada é inventado —
// tarefa sem data fica na inbox, evento nunca vira atraso e item sem data real
// não entra em dia nenhum.
//
// O relógio entra por `today`/`selectedDate` (`DateKey`): o arquivo é puro, e o
// teste não precisa de `Date.now()` nem de fuso.
import type {
  Course,
  DateKey,
  Exam,
  InternshipLog,
  StudySession,
  Task,
  ThesisChapter,
  ThesisMeeting,
  ThesisProject,
  ThesisTask,
} from '../types';
import { addDaysKey } from './dateBR';
import {
  buildCalendarEntries,
  type CalendarEntry,
  type CalendarEntryKind,
} from './schedule';

/** Os recortes rápidos da tela (`SPEC-035` D7). */
export type AgendaFilter = 'tudo' | 'atrasadas' | 'hoje' | 'proximos' | 'sem-data';

/** O que precisa ser feito. `date` ausente = inbox. */
export interface AgendaTaskItem {
  kind: 'task';
  id: string;
  task: Task;
  date?: DateKey;
  overdue: boolean;
}

/** O que acontece. Nunca tem checkbox, nunca fica atrasado. */
export interface AgendaEventItem {
  kind: 'event';
  id: string;
  entry: CalendarEntry;
  date: DateKey;
}

export type AgendaItem = AgendaTaskItem | AgendaEventItem;

/** O tom do recado do Cecinho. A frase mora em `voice.ts` (D6). */
export type AgendaTone = 'overdue' | 'exam' | 'busy' | 'inbox' | 'empty' | 'calm';

export interface AgendaViewModel {
  today: DateKey;
  selectedDate: DateKey;
  overdue: AgendaTaskItem[];
  /** Ordenado e limitado a 5; o resto é contado em `attentionRest`. */
  attention: AgendaItem[];
  attentionRest: number;
  todayItems: AgendaItem[];
  selectedDay: AgendaItem[];
  inbox: AgendaTaskItem[];
  upcoming: Array<{ date: DateKey; items: AgendaItem[] }>;
  counts: { overdue: number; today: number; upcoming: number; inbox: number };
  tone: AgendaTone;
  /** Nada marcado em lugar nenhum — o vazio de verdade, não o de filtro. */
  empty: boolean;
}

export interface BuildAgendaArgs {
  courses: Course[];
  exams: Exam[];
  tasks: Task[];
  thesis?: ThesisProject;
  chapters: ThesisChapter[];
  thesisTasks: ThesisTask[];
  meetings: ThesisMeeting[];
  internshipLogs: InternshipLog[];
  studySessions: StudySession[];
  /** Hoje, em `DateKey` local. Relógio injetado. */
  today: DateKey;
  selectedDate: DateKey;
  /** Dias olhados para frente a partir de hoje (padrão 13 → 14 dias). */
  horizon?: number;
}

const PRIORITY_RANK: Record<Task['priority'], number> = { alta: 0, media: 1, baixa: 2 };
const ATTENTION_LIMIT = 5;

const taskItem = (task: Task, today: DateKey): AgendaTaskItem => ({
  kind: 'task',
  id: `tarefa-${task.id}`,
  task,
  date: task.dueDate,
  overdue: !!task.dueDate && task.dueDate < today,
});

const eventItem = (entry: CalendarEntry): AgendaEventItem => ({
  kind: 'event',
  id: entry.id,
  entry,
  date: entry.date,
});

const timeOf = (item: AgendaItem): string =>
  item.kind === 'event' ? (item.entry.start ?? '99:99') : '99:99';

const titleOf = (item: AgendaItem): string =>
  item.kind === 'event' ? item.entry.title : item.task.title;

const priorityOf = (item: AgendaItem): number =>
  item.kind === 'task' ? PRIORITY_RANK[item.task.priority] : 3;

/** Desempate determinístico: data, horário, prioridade, título, `id`. */
const byWhen = (a: AgendaItem, b: AgendaItem): number =>
  (a.date ?? '').localeCompare(b.date ?? '') ||
  timeOf(a).localeCompare(timeOf(b)) ||
  priorityOf(a) - priorityOf(b) ||
  titleOf(a).localeCompare(titleOf(b), 'pt-BR') ||
  a.id.localeCompare(b.id);

const byTaskPriority = (a: AgendaTaskItem, b: AgendaTaskItem): number =>
  PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority] ||
  a.task.title.localeCompare(b.task.title, 'pt-BR') ||
  a.id.localeCompare(b.id);

const eventKindOf = (item: AgendaItem): CalendarEntryKind | null =>
  item.kind === 'event' ? item.entry.kind : null;

/**
 * Deriva a Agenda de todas as fontes.
 *
 * Ordem de atenção (`SPEC-035` D3): atrasadas → eventos de hoje → tarefas de hoje
 * → amanhã → provas próximas → prioridade alta → eventos próximos → resto datado.
 */
export function buildAgenda(args: BuildAgendaArgs): AgendaViewModel {
  const { tasks, today, selectedDate } = args;
  const horizonEnd = addDaysKey(today, args.horizon ?? 13);

  // A janela cobre a atenção (hoje…horizonte) **e** o dia consultado, que pode
  // estar fora dela. Uma janela, um pipeline — nunca um cálculo por seção.
  const from = selectedDate < today ? selectedDate : today;
  const to = selectedDate > horizonEnd ? selectedDate : horizonEnd;

  // `tasks: []` de propósito: o agregador transformaria cada tarefa num evento
  // "de dia inteiro", e a Agenda tem duas listas, não uma. Tarefa é derivada de
  // `tasks` logo abaixo; o agregador fica com o que **acontece** (D1).
  const entries = buildCalendarEntries({
    courses: args.courses,
    exams: args.exams,
    tasks: [],
    thesis: args.thesis,
    chapters: args.chapters,
    thesisTasks: args.thesisTasks,
    meetings: args.meetings,
    internshipLogs: args.internshipLogs,
    studySessions: args.studySessions,
    from,
    to,
  });

  const events = entries.map(eventItem);
  const pending = tasks.filter((t) => !t.completed);
  const tomorrow = addDaysKey(today, 1);
  const nextWeek = addDaysKey(today, 7);

  const overdue = pending
    .filter((t) => !!t.dueDate && t.dueDate < today)
    .map((t) => taskItem(t, today))
    .sort(byWhen);

  const inbox = pending
    .filter((t) => !t.dueDate)
    .map((t) => taskItem(t, today))
    .sort(byTaskPriority);

  const eventsOn = (date: DateKey) => events.filter((e) => e.date === date);

  // O dia mostra também o que já foi concluído: a seção é "o dia", não "atenção".
  const dayTasks = (date: DateKey) =>
    tasks
      .filter((t) => t.dueDate === date)
      .map((t) => taskItem(t, today));

  const todayItems = [...eventsOn(today), ...dayTasks(today)].sort(byWhen);
  const selectedDay =
    selectedDate === today
      ? todayItems
      : [...eventsOn(selectedDate), ...dayTasks(selectedDate)].sort(byWhen);

  const pendingOn = (date: DateKey) =>
    pending.filter((t) => t.dueDate === date).map((t) => taskItem(t, today));

  const upcomingMap = new Map<DateKey, AgendaItem[]>();
  const addUpcoming = (item: AgendaItem) => {
    if (!item.date || item.date <= today || item.date > horizonEnd) return;
    const list = upcomingMap.get(item.date) ?? [];
    list.push(item);
    upcomingMap.set(item.date, list);
  };
  events.forEach(addUpcoming);
  pending.forEach((t) => {
    if (t.dueDate) addUpcoming(taskItem(t, today));
  });
  const upcoming = [...upcomingMap.entries()]
    .map(([date, items]) => ({ date, items: items.sort(byWhen) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Ordem de atenção: cada balde ordena por si, e o `Set` garante que um item
  // que cabe em dois baldes aparece uma vez só.
  const ranked: AgendaItem[] = [];
  const seen = new Set<string>();
  const push = (items: AgendaItem[]) => {
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      ranked.push(item);
    }
  };

  const todayEvents = eventsOn(today).filter((e) => !!e.entry.start);
  const todayTasks = pendingOn(today);
  const tomorrowTasks = pendingOn(tomorrow);
  const examsSoon = events
    .filter((e) => eventKindOf(e) === 'prova' && e.date > today && e.date <= nextWeek)
    .sort(byWhen);
  const highPrioritySoon = pending
    .filter((t) => t.priority === 'alta' && !!t.dueDate && t.dueDate > tomorrow && t.dueDate <= nextWeek)
    .map((t) => taskItem(t, today))
    .sort(byWhen);
  const eventsSoon = events
    .filter((e) => e.date > today && e.date <= nextWeek)
    .sort(byWhen);
  const restDated = [
    ...events.filter((e) => e.date > today && e.date <= horizonEnd),
    ...pending
      .filter((t) => !!t.dueDate && t.dueDate > today && t.dueDate <= horizonEnd)
      .map((t) => taskItem(t, today)),
  ].sort(byWhen);

  push(overdue);
  push(todayEvents);
  push(todayTasks);
  push(tomorrowTasks);
  push(examsSoon);
  push(highPrioritySoon);
  push(eventsSoon);
  push(restDated);

  const attention = ranked.slice(0, ATTENTION_LIMIT);
  const attentionRest = Math.max(0, ranked.length - attention.length);

  const empty = ranked.length === 0 && inbox.length === 0 && todayItems.length === 0;

  let tone: AgendaTone = 'calm';
  if (overdue.length > 0) tone = 'overdue';
  else if (examsSoon.length > 0) tone = 'exam';
  else if (todayItems.length >= 3) tone = 'busy';
  else if (inbox.length > 0 && todayItems.length === 0) tone = 'inbox';
  else if (empty) tone = 'empty';

  return {
    today,
    selectedDate,
    overdue,
    attention,
    attentionRest,
    todayItems,
    selectedDay,
    inbox,
    upcoming,
    counts: {
      overdue: overdue.length,
      today: todayItems.length,
      upcoming: upcoming.reduce((n, group) => n + group.items.length, 0),
      inbox: inbox.length,
    },
    tone,
    empty,
  };
}

/** O conjunto que um recorte manual mostra. `tudo` é a hierarquia, não uma lista. */
export function itemsForFilter(
  vm: AgendaViewModel,
  filter: Exclude<AgendaFilter, 'tudo'>,
): AgendaItem[] {
  switch (filter) {
    case 'atrasadas':
      return vm.overdue;
    case 'hoje':
      return vm.todayItems;
    case 'proximos':
      return vm.upcoming.flatMap((group) => group.items);
    case 'sem-data':
      return vm.inbox;
  }
}
