// Modelo unificado da agenda pessoal de estudos (SPEC-redesign-calendario §23).
// Deriva eventos de todas as fontes em um único pipeline, sem alterar as
// fontes persistidas. Itens sem data real (leituras, revisões de flashcards)
// não geram eventos artificiais — regra contra dados inventados (§17).
import type {
  Course,
  Exam,
  Task,
  StudySession,
  InternshipLog,
  ThesisProject,
  ThesisChapter,
  ThesisTask,
  ThesisMeeting,
  ReadingItem,
  Flashcard,
} from '../types';
import {
  buildCalendarEntries,
  type CalendarEntry,
  type CalendarEntryKind,
} from './schedule';
import { addDaysKey, todayKeyLocal, formatDateBR } from './dateBR';
import type { DateKey } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

/** `DateKey` a partir de ano/mês/dia locais — sem passar por UTC. */
const dateKeyOf = (year: number, month: number, day: number): DateKey =>
  `${year}-${pad(month)}-${pad(day)}`;

export type PersonalCalendarEventKind =
  | 'class'
  | 'exam'
  | 'task'
  | 'internship'
  | 'focus'
  | 'reading'
  | 'review'
  | 'tcc';

export type CalendarEventSource =
  | 'schedule'
  | 'exam'
  | 'task'
  | 'internship'
  | 'session'
  | 'reading'
  | 'flashcards'
  | 'tcc';

export interface PersonalCalendarEvent {
  id: string;
  kind: PersonalCalendarEventKind;
  date: DateKey;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  title: string;
  subtitle?: string;
  courseId?: string;
  sourceId?: string;
  source: CalendarEventSource;
  completed?: boolean;
  actionable: boolean;
  destination?:
    | 'course'
    | 'exam'
    | 'task'
    | 'internship'
    | 'focus-history'
    | 'reading'
    | 'review'
    | 'tcc';
}

export interface CalendarViewModel {
  selectedDate: DateKey;
  visibleMonth: string; // YYYY-MM
  week: {
    startDate: DateKey;
    endDate: DateKey;
    classes: number;
    exams: number;
    tasks: number;
    studyActivities: number;
    internship: number;
  };
  cecinho: {
    message: string;
    tone: 'calm' | 'busy' | 'exam' | 'study' | 'empty';
  };
  month: {
    days: Array<{
      date: DateKey;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      eventKinds: PersonalCalendarEventKind[];
      eventCount: number;
    }>;
  };
  selectedDayEvents: PersonalCalendarEvent[];
  today: PersonalCalendarEvent[];
  tomorrow: PersonalCalendarEvent[];
  upcomingDays: Array<{
    date: DateKey;
    events: PersonalCalendarEvent[];
  }>;
}

const KIND_OF_ENTRY: Record<CalendarEntryKind, PersonalCalendarEventKind> = {
  aula: 'class',
  prova: 'exam',
  tarefa: 'task',
  tcc: 'tcc',
  estagio: 'internship',
  estudo: 'focus',
};

const SOURCE_OF_ENTRY: Record<CalendarEntryKind, CalendarEventSource> = {
  aula: 'schedule',
  prova: 'exam',
  tarefa: 'task',
  tcc: 'tcc',
  estagio: 'internship',
  estudo: 'session',
};

const DESTINATION_OF_ENTRY: Record<CalendarEntryKind, PersonalCalendarEvent['destination']> = {
  aula: 'course',
  prova: 'exam',
  tarefa: 'task',
  tcc: 'tcc',
  estagio: 'internship',
  estudo: 'focus-history',
};

const ICON_OF_KIND: Record<PersonalCalendarEventKind, string> = {
  class: 'BookOpen',
  exam: 'ClipboardCheck',
  task: 'CheckSquare',
  internship: 'HeartHandshake',
  focus: 'Timer',
  reading: 'BookOpen',
  review: 'Sparkles',
  tcc: 'GraduationCap',
};

const LABEL_OF_KIND: Record<PersonalCalendarEventKind, string> = {
  class: 'aula',
  exam: 'prova',
  task: 'tarefa',
  internship: 'estágio',
  focus: 'foco',
  reading: 'leitura',
  review: 'revisão',
  tcc: 'TCC',
};

const COLOR_OF_KIND: Record<PersonalCalendarEventKind, string> = {
  class: 'text-ceci-academic-strong bg-surface-default border-ceci-border-academic',
  exam: 'text-ceci-brand-strong bg-surface-rose border-ceci-border-brand',
  task: 'text-ceci-brand-strong bg-surface-warm border-ceci-border-warm',
  internship: 'text-ceci-brand-strong bg-surface-mint border-ceci-border-mint',
  focus: 'text-ceci-brand-strong bg-surface-rose border-ceci-border-brand',
  reading: 'text-ceci-academic-strong bg-surface-blue border-ceci-border-academic',
  review: 'text-ceci-brand-strong bg-surface-lilac border-ceci-border-lilac',
  tcc: 'text-ceci-primary bg-surface-brand border-ceci-border-brand',
};

function mapEntry(entry: CalendarEntry): PersonalCalendarEvent {
  const kind = KIND_OF_ENTRY[entry.kind];
  return {
    id: entry.id,
    kind,
    date: entry.date,
    startTime: entry.start,
    endTime: entry.end,
    title: entry.title,
    source: SOURCE_OF_ENTRY[entry.kind],
    sourceId: entry.ref.id,
    courseId: entry.ref.kind === 'class' ? entry.ref.id : undefined,
    actionable: true,
    destination: DESTINATION_OF_ENTRY[entry.kind],
  };
}

function entriesInRange(
  entries: CalendarEntry[],
  from: DateKey,
  to: DateKey,
): PersonalCalendarEvent[] {
  return entries
    .filter((e) => e.date >= from && e.date <= to)
    .map(mapEntry)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99') ||
        a.title.localeCompare(b.title, 'pt-BR'),
    );
}

/** Dias com eventos do mês, indexados por data. */
function daysWithEventsOfMonth(
  entries: CalendarEntry[],
  year: number,
  month: number,
): Map<DateKey, PersonalCalendarEventKind[]> {
  const map = new Map<DateKey, PersonalCalendarEventKind[]>();
  for (const e of entries) {
    const [y, m] = e.date.split('-').map(Number);
    if (y !== year || m !== month) continue;
    const kinds = map.get(e.date) ?? [];
    if (!kinds.includes(KIND_OF_ENTRY[e.kind])) kinds.push(KIND_OF_ENTRY[e.kind]);
    map.set(e.date, kinds);
  }
  return map;
}

function weekdayLabel(index: number): string {
  return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][index];
}

function cecinhoMessage(
  tone: CalendarViewModel['cecinho']['tone'],
  todayEvents: PersonalCalendarEvent[],
  tomorrowEvents: PersonalCalendarEvent[],
  weekClasses: number,
  weekExams: number,
): string {
  if (tone === 'exam') {
    return 'tem uma prova chegando. ainda dá para dividir essa preparação em pedacinhos ♡';
  }
  if (tone === 'study') {
    return 'separei também seus momentos de foco, leitura e revisão.';
  }
  if (tone === 'busy') {
    return 'sua semana está cheinha, mas vamos começar por hoje?';
  }
  if (tone === 'empty') {
    return 'seu calendário está quietinho por enquanto. isso também pode ser um respiro.';
  }
  return 'hoje está mais calminho. quer planejar uma coisinha para cuidar?';
}

function toneOf(
  weekClasses: number,
  weekExams: number,
  todayEvents: PersonalCalendarEvent[],
  tomorrowEvents: PersonalCalendarEvent[],
): CalendarViewModel['cecinho']['tone'] {
  if (weekExams > 0 || tomorrowEvents.some((e) => e.kind === 'exam')) return 'exam';
  if (weekClasses >= 3 || todayEvents.length >= 3) return 'busy';
  if (todayEvents.length > 0 || tomorrowEvents.length > 0) return 'study';
  if (weekClasses === 0 && weekExams === 0) return 'empty';
  return 'calm';
}

export interface BuildPersonalCalendarArgs {
  courses: Course[];
  exams: Exam[];
  tasks: Task[];
  thesis?: ThesisProject;
  chapters: ThesisChapter[];
  thesisTasks: ThesisTask[];
  meetings: ThesisMeeting[];
  internshipLogs: InternshipLog[];
  studySessions: StudySession[];
  /** Leituras — só entram se tiverem data real (não há fonte com data hoje). */
  readings: ReadingItem[];
  /** Flashcards — revisões agrupadas, só com data real (não há fonte com data hoje). */
  flashcards: Flashcard[];
  selectedDate: DateKey;
  visibleYear: number;
  visibleMonth: number;
}

/**
 * Constrói o `CalendarViewModel` a partir de todas as fontes.
 * Única fonte de eventos: `buildCalendarEntries` + leituras/revisões quando tiverem data.
 */
export function buildPersonalCalendar(args: BuildPersonalCalendarArgs): CalendarViewModel {
  const {
    courses,
    exams,
    tasks,
    thesis,
    chapters,
    thesisTasks,
    meetings,
    internshipLogs,
    studySessions,
    readings,
    flashcards,
    selectedDate,
    visibleYear,
    visibleMonth,
  } = args;

  const today = todayKeyLocal();
  const visibleMonthKey = `${String(visibleYear)}-${String(visibleMonth).padStart(2, '0')}`;

  const monthStart = dateKeyOf(visibleYear, visibleMonth, 1);
  const monthEnd = dateKeyOf(
    visibleYear,
    visibleMonth,
    new Date(visibleYear, visibleMonth, 0).getDate(),
  );

  // Semana atual (domingo…sábado) que contém a data selecionada (ou hoje).
  const refDate = new Date(
    Number(selectedDate.slice(0, 4)),
    Number(selectedDate.slice(5, 7)) - 1,
    Number(selectedDate.slice(8, 10)),
  );
  const weekStartDate = new Date(refDate);
  weekStartDate.setDate(refDate.getDate() - refDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(weekStartDate.getDate() + i);
    return d;
  });
  const weekStartKey = dateKeyOf(
    weekDays[0].getFullYear(),
    weekDays[0].getMonth() + 1,
    weekDays[0].getDate(),
  );
  const weekEndKey = dateKeyOf(
    weekDays[6].getFullYear(),
    weekDays[6].getMonth() + 1,
    weekDays[6].getDate(),
  );

  // Janela de busca ampliada: deve cobrir o mês visível, a semana atual e os
  // próximos 14 dias (que podem cruzar o mês visível).
  const upcomingEnd = addDaysKey(today, 13);
  const rangeFrom = [monthStart, weekStartKey, today].reduce((a, b) =>
    a < b ? a : b,
  );
  const rangeTo = [monthEnd, weekEndKey, upcomingEnd].reduce((a, b) =>
    a > b ? a : b,
  );

  const allEntries = buildCalendarEntries({
    courses,
    exams,
    tasks,
    thesis,
    chapters,
    thesisTasks,
    meetings,
    internshipLogs,
    studySessions,
    from: rangeFrom,
    to: rangeTo,
  });

  const weekEntries = entriesInRange(allEntries, weekStartKey, weekEndKey);

  const weekClasses = weekEntries.filter((e) => e.kind === 'class').length;
  const weekExams = weekEntries.filter((e) => e.kind === 'exam').length;
  const weekTasks = weekEntries.filter((e) => e.kind === 'task').length;
  const weekStudy = weekEntries.filter((e) => e.kind === 'focus').length;
  const weekInternship = weekEntries.filter((e) => e.kind === 'internship').length;

  const todayEvents = entriesInRange(allEntries, today, today);
  const tomorrow = addDaysKey(today, 1);
  const tomorrowEvents = entriesInRange(allEntries, tomorrow, tomorrow);

  const selectedDayEvents = entriesInRange(allEntries, selectedDate, selectedDate);

  // Próximos 14 dias a partir de hoje, agrupados por hoje / amanhã / próximos dias.
  const upcomingEntries = entriesInRange(allEntries, today, upcomingEnd);

  const upcomingDays: Array<{ date: DateKey; events: PersonalCalendarEvent[] }> = [];
  for (const e of upcomingEntries) {
    const last = upcomingDays[upcomingDays.length - 1];
    if (last?.date === e.date) last.events.push(e);
    else upcomingDays.push({ date: e.date, events: [e] });
  }

  const monthDays = new Date(visibleYear, visibleMonth, 0).getDate();
  const firstWeekday = new Date(visibleYear, visibleMonth - 1, 1).getDay(); // 0=domingo
  const daysInGrid: CalendarViewModel['month']['days'] = [];
  const daysWithEvents = daysWithEventsOfMonth(allEntries, visibleYear, visibleMonth);

  // Dias vazios do mês anterior (preenchimento da grade).
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(visibleYear, visibleMonth - 1, 0 - i);
    // ordem inversa para ficar crescente: domingo primeiro
  }
  // Reconstruir preenchimento anterior em ordem correta (domingo..sábado).
  const prevMonth = visibleMonth === 1 ? 12 : visibleMonth - 1;
  const prevYear = visibleMonth === 1 ? visibleYear - 1 : visibleYear;
  const prevTotal = new Date(prevYear, prevMonth, 0).getDate();
  const offset = (firstWeekday + 6) % 7; // segunda=0 → ajustar para domingo=0
  // Simples: domingo=0. firstWeekday já é 0=domingo.
  const beforeCount = firstWeekday;
  for (let i = beforeCount - 1; i >= 0; i--) {
    const day = prevTotal - i;
    const key = dateKeyOf(prevYear, prevMonth, day);
    daysInGrid.push({
      date: key,
      isCurrentMonth: false,
      isToday: key === today,
      isSelected: key === selectedDate,
      eventKinds: [],
      eventCount: 0,
    });
  }
  for (let day = 1; day <= monthDays; day++) {
    const key = dateKeyOf(visibleYear, visibleMonth, day);
    const kinds = daysWithEvents.get(key) ?? [];
    daysInGrid.push({
      date: key,
      isCurrentMonth: true,
      isToday: key === today,
      isSelected: key === selectedDate,
      eventKinds: kinds,
      eventCount: kinds.length,
    });
  }
  const afterCount = 42 - daysInGrid.length;
  const nextMonth = visibleMonth === 12 ? 1 : visibleMonth + 1;
  const nextYear = visibleMonth === 12 ? visibleYear + 1 : visibleYear;
  for (let day = 1; day <= afterCount; day++) {
    const key = dateKeyOf(nextYear, nextMonth, day);
    daysInGrid.push({
      date: key,
      isCurrentMonth: false,
      isToday: key === today,
      isSelected: key === selectedDate,
      eventKinds: [],
      eventCount: 0,
    });
  }

  const tone = toneOf(weekClasses, weekExams, todayEvents, tomorrowEvents);
  const cecinho = {
    message: cecinhoMessage(tone, todayEvents, tomorrowEvents, weekClasses, weekExams),
    tone,
  };

  return {
    selectedDate,
    visibleMonth: visibleMonthKey,
    week: {
      startDate: weekStartKey,
      endDate: weekEndKey,
      classes: weekClasses,
      exams: weekExams,
      tasks: weekTasks,
      studyActivities: weekStudy,
      internship: weekInternship,
    },
    cecinho,
    month: { days: daysInGrid },
    selectedDayEvents,
    today: todayEvents,
    tomorrow: tomorrowEvents,
    upcomingDays,
  };
}

export { ICON_OF_KIND, LABEL_OF_KIND, COLOR_OF_KIND };
