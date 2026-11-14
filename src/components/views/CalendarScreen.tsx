// Agenda do mobile (SPEC-035): a subtela que responde "o que merece atenção
// agora, e o que posso organizar depois?". Substitui a composição de lista de
// 14 dias + mês desconectado; o nome técnico da rota continua `calendar`, e a
// navegação global não muda (D1).
//
// Fonte única: `buildAgenda` (lib/agenda.ts). Nada aqui lê relógio além do
// `todayKeyLocal()` da borda, e nada é escrito durante o render.
import React, { useMemo, useState } from 'react';
import { ChevronLeft, Inbox, Sparkles } from 'lucide-react';
import {
  useDataClientApp,
  useDataClientCourses,
  useDataClientStudy,
} from '@/context/DataClientProvider';
import { useMobileApp } from '@/context/mobileApp';
import { useNavValue } from '@/context/shellNavContexts';
import {
  buildAgenda,
  itemsForFilter,
  type AgendaFilter,
  type AgendaItem,
} from '../../lib/agenda';
import { buildCalendarEntries, daysInMonth } from '../../lib/schedule';
import { addDaysKey, formatDateBR, todayKeyLocal, weekStartKey } from '../../lib/dateBR';
import type { DateKey } from '../../types';
import { VAZIO, frase } from '../../lib/voice';
import { destinationForEntry } from '../../lib/calendarDestination';
import CalendarMonth, { dateKeyOf } from './faculdade/CalendarMonth';
import { CalendarEntryRow } from './CalendarEntryRow';
import { SectionTitle } from '../ui/SectionTitle';
import { AgendaDateStrip } from '../agenda/AgendaDateStrip';
import { AgendaQuickFilters } from '../agenda/AgendaQuickFilters';
import { AgendaTaskRow } from '../agenda/AgendaTaskRow';
import { CecinhoAgendaNote } from '../agenda/CecinhoAgendaNote';
import { CecinhoAssistCard } from '../agenda/CecinhoAssistCard';
import { CecinhoPendingBadge } from '@/agent/ui/CecinhoPendingBadge';
import { CecinhoStatusPill } from '@/agent/ui/CecinhoStatusPill';
import { useCecinho } from '@/agent/useCecinho';
import { evaluateEligibility } from '@/agent/domain/eligibility';
import { AgendaCreateAction } from '../agenda/AgendaCreateAction';
import { TaskSheet } from './home/TaskSheet';
import { MeetingSheet } from '../tcc/MeetingSheet';

type Door = 'task' | 'meeting' | null;

const FILTER_LABEL: Record<AgendaFilter, string> = {
  tudo: 'tudo',
  atrasadas: 'atrasadas',
  hoje: 'hoje',
  proximos: 'próximos prazos',
  'sem-data': 'sem data',
};

/** Quantos grupos de dia a seção "próximos prazos" mostra antes de contar. */
const UPCOMING_GROUPS = 5;

export const CalendarScreen: React.FC = () => {
  const { internshipLogs, tcc, thesisChapters, thesisMeetings, thesisTasks } = useDataClientApp();
  const { courses, exams, tasks } = useDataClientCourses();
  const { sessions } = useDataClientStudy();
  const { handleToggleTask } = useMobileApp();
  const nav = useNavValue();
  const cecinho = useCecinho();

  const today = todayKeyLocal();
  const [selected, setSelected] = useState<DateKey>(nav.calendarDay ?? today);
  const [year, setYear] = useState(Number(selected.slice(0, 4)));
  const [month, setMonth] = useState(Number(selected.slice(5, 7)));
  const [monthOpen, setMonthOpen] = useState(false);
  const [filter, setFilter] = useState<AgendaFilter>('tudo');
  const [door, setDoor] = useState<Door>(null);
  const [cecinhoDismissed, setCecinhoDismissed] = useState(false);

  const sources = useMemo(
    () => ({
      courses,
      exams,
      tasks,
      thesis: tcc,
      chapters: thesisChapters,
      thesisTasks,
      meetings: thesisMeetings,
      internshipLogs,
      studySessions: sessions,
    }),
    [courses, exams, tasks, tcc, thesisChapters, thesisTasks, thesisMeetings, internshipLogs, sessions],
  );

  const agenda = useMemo(
    () => buildAgenda({ ...sources, today, selectedDate: selected }),
    [sources, today, selected],
  );

  const monthEntries = useMemo(
    () =>
      buildCalendarEntries({
        ...sources,
        from: dateKeyOf(year, month, 1),
        to: dateKeyOf(year, month, daysInMonth(year, month)),
      }),
    [sources, year, month],
  );

  const weekStart = weekStartKey(selected);
  const daysWithItems = useMemo(() => {
    const weekEntries = buildCalendarEntries({
      ...sources,
      from: weekStart,
      to: addDaysKey(weekStart, 6),
    });
    return new Set(weekEntries.map((e) => e.date));
  }, [sources, weekStart]);

  const courseName = (courseId?: string) =>
    courseId ? courses.find((c) => c.id === courseId)?.name : undefined;

  const openItem = (item: AgendaItem) => {
    if (item.kind === 'task') nav.openManageItem('task', item.task.id);
    else destinationForEntry(item.entry, nav, exams)?.();
  };

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const goToday = () => {
    setYear(Number(today.slice(0, 4)));
    setMonth(Number(today.slice(5, 7)));
    setSelected(today);
  };

  const hasTcc = tcc.title.trim().length > 0;
  const filtered = filter === 'tudo' ? [] : itemsForFilter(agenda, filter);

  const cecinhoActionLabel =
    agenda.tone === 'inbox'
      ? 'organizar inbox'
      : agenda.attention.length > 0
        ? 'ver próxima ação'
        : 'guardar uma tarefa';

  const runCecinhoAction = () => {
    if (agenda.tone === 'inbox') {
      setFilter('sem-data');
      return;
    }
    const next = agenda.attention[0];
    if (next) openItem(next);
    else setDoor('task');
  };

  // Sugestão da ajuda global: só quando não há nenhuma assistência ativa e o
  // toggle do Perfil está ligado. A decisão é local (sem rede).
  const cecinhoSuggestion = useMemo(() => {
    if (!cecinho.helpEnabled) return undefined;
    if (cecinho.collections.assistedTasks.length > 0) return undefined;
    const now = new Date().toISOString();
    return tasks.find(
      (task) => !task.completed && evaluateEligibility({ task, helpEnabled: true, now }).eligible,
    );
  }, [cecinho.helpEnabled, cecinho.collections.assistedTasks, tasks]);

  const renderItem = (item: AgendaItem) =>
    item.kind === 'task' ? (
      <AgendaTaskRow
        key={item.id}
        item={item}
        today={today}
        courseName={courseName(item.task.disciplineId)}
        onToggle={handleToggleTask}
        onOpen={() => nav.openManageItem('task', item.task.id)}
        agentBadge={
          cecinho.isActive(item.task.id) ? (
            <>
              <CecinhoStatusPill estado={cecinho.statusLabel(item.task.id)} />
              <CecinhoPendingBadge
                count={cecinho.assistedFor(item.task.id)?.unreadOutput ?? 0}
                compact
              />
            </>
          ) : undefined
        }
      />
    ) : (
      <CalendarEntryRow
        key={item.id}
        entry={item.entry}
        nav={nav}
        exams={exams}
        showDate={item.date !== selected}
      />
    );

  const sectionTitle = (icon: React.ReactNode, label: string, count?: number) => (
    <SectionTitle
      icon={icon}
      action={
        count !== undefined ? (
          <span className="text-[11px] font-semibold text-ceci-tertiary">{count}</span>
        ) : undefined
      }
    >
      {label}
    </SectionTitle>
  );

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-24">
      <header className="flex items-center gap-2">
        <button
          onClick={nav.closeCalendar}
          aria-label="voltar"
          className="w-11 h-11 shrink-0 rounded-xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
            subtela de organização
          </p>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg font-bold text-ceci-primary">agenda</h1>
            <CecinhoPendingBadge count={cecinho.totalUnread} compact />
          </div>
        </div>
      </header>

      <AgendaDateStrip
        today={today}
        selected={selected}
        daysWithItems={daysWithItems}
        onSelect={setSelected}
        onToday={goToday}
        monthOpen={monthOpen}
        onToggleMonth={() => {
          // Abrir o mês parte do dia selecionado — a faixa de 7 dias pode ter
          // atravessado a virada do mês.
          if (!monthOpen) {
            setYear(Number(selected.slice(0, 4)));
            setMonth(Number(selected.slice(5, 7)));
          }
          setMonthOpen((v) => !v);
        }}
      />

      {monthOpen && (
        <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-4">
          <CalendarMonth
            year={year}
            month={month}
            entries={monthEntries}
            today={today}
            selected={selected}
            onShift={shiftMonth}
            onToday={goToday}
            onSelect={(day) => {
              if (!day) return;
              setSelected(day);
              setMonthOpen(false);
            }}
          />
        </section>
      )}

      {!cecinhoDismissed && (
        <CecinhoAgendaNote
          tone={agenda.tone}
          actionLabel={cecinhoActionLabel}
          onAction={runCecinhoAction}
          onDismiss={() => setCecinhoDismissed(true)}
        />
      )}

      <CecinhoAssistCard
        unread={cecinho.totalUnread}
        assistedCount={cecinho.collections.assistedTasks.length}
        suggestionTitle={cecinhoSuggestion?.title}
        onOpenCenter={() => nav.openCecinhoCenter()}
        onActivateSuggestion={() => {
          if (!cecinhoSuggestion) return;
          cecinho.activate(cecinhoSuggestion.id);
          nav.openCecinhoTask(cecinhoSuggestion.id);
        }}
      />

      <AgendaQuickFilters active={filter} counts={agenda.counts} onChange={setFilter} />

      <p className="sr-only" aria-live="polite">
        {filter === 'tudo'
          ? `agenda de ${formatDateBR(selected)}`
          : `filtrando por ${FILTER_LABEL[filter]}, ${filtered.length} itens`}
      </p>

      {filter === 'tudo' ? (
        <>
          {agenda.empty && (
            <section className="rounded-2xl border border-ceci-border-default bg-surface-default p-5 text-center space-y-3">
              <p className="text-sm font-semibold text-ceci-primary">{frase(VAZIO, 'agendaVazia')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setDoor('task')}
                  className="px-4 py-2.5 rounded-xl bg-ceci-brand-strong text-ceci-on-brand text-[11px] font-semibold min-h-[44px] cursor-pointer"
                >
                  adicionar tarefa
                </button>
                <button
                  type="button"
                  onClick={() => nav.openWizard('exam', undefined, undefined, selected)}
                  className="px-4 py-2.5 rounded-xl border border-ceci-border-default bg-surface-default text-[11px] font-semibold text-ceci-primary min-h-[44px] cursor-pointer"
                >
                  adicionar evento
                </button>
              </div>
            </section>
          )}

          {agenda.attention.length > 0 && (
            <section className="space-y-2">
              {sectionTitle(
                <Sparkles className="w-4 h-4 text-ceci-brand-strong" aria-hidden="true" />,
                'atenção primeiro',
                agenda.attention.length + agenda.attentionRest,
              )}
              <div className="divide-y divide-ceci-border-subtle rounded-2xl border border-ceci-border-default bg-surface-default px-4">
                {agenda.attention.map(renderItem)}
              </div>
              {agenda.attentionRest > 0 && (
                <p className="text-[11px] text-ceci-secondary px-1">
                  + {agenda.attentionRest} {agenda.attentionRest === 1 ? 'item' : 'itens'} esperando por você ♡
                </p>
              )}
            </section>
          )}

          <section className="space-y-2">
            {sectionTitle(
              <Sparkles className="w-4 h-4 text-ceci-tertiary" aria-hidden="true" />,
              selected === today ? 'hoje' : `dia · ${formatDateBR(selected)}`,
              agenda.selectedDay.length,
            )}
            {agenda.selectedDay.length === 0 ? (
              <p className="text-xs text-ceci-secondary px-1">{frase(VAZIO, 'diaSemNada')}</p>
            ) : (
              <div className="divide-y divide-ceci-border-subtle rounded-2xl border border-ceci-border-default bg-surface-default px-4">
                {agenda.selectedDay.map(renderItem)}
              </div>
            )}
          </section>

          <section className="space-y-2">
            {sectionTitle(
              <Inbox className="w-4 h-4 text-ceci-brand-strong" aria-hidden="true" />,
              'inbox',
              agenda.inbox.length,
            )}
            {agenda.inbox.length === 0 ? (
              <p className="text-xs text-ceci-secondary px-1">{frase(VAZIO, 'agendaInboxVazia')}</p>
            ) : (
              <button
                type="button"
                onClick={() => setFilter('sem-data')}
                className="w-full text-left rounded-2xl border border-dashed border-ceci-border-default bg-surface-default px-4 py-3 flex items-center justify-between gap-3 min-h-[44px] cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-ceci-primary">
                    pendências para organizar depois
                  </span>
                  <span className="block text-[11px] text-ceci-secondary">
                    {agenda.inbox.length} sem data — capturar sem prazo também é válido
                  </span>
                </span>
                <span className="text-[11px] font-bold text-ceci-brand-strong shrink-0">abrir →</span>
              </button>
            )}
          </section>

          {agenda.upcoming.length > 0 && (
            <section className="space-y-2">
              {sectionTitle(
                <Sparkles className="w-4 h-4 text-ceci-tertiary" aria-hidden="true" />,
                'próximos prazos',
                agenda.counts.upcoming,
              )}
              <div className="space-y-2">
                {agenda.upcoming.slice(0, UPCOMING_GROUPS).map((group) => (
                  <div
                    key={group.date}
                    className="rounded-2xl border border-ceci-border-default bg-surface-default px-4 py-2"
                  >
                    <p className="text-[11px] font-semibold text-ceci-tertiary">
                      {formatDateBR(group.date)}
                      {group.date === addDaysKey(today, 1) ? ' · amanhã' : ''}
                    </p>
                    {group.items.map(renderItem)}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="space-y-2">
          {sectionTitle(
            <Sparkles className="w-4 h-4 text-ceci-brand-strong" aria-hidden="true" />,
            FILTER_LABEL[filter],
            filtered.length,
          )}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-ceci-border-default bg-surface-default p-5 text-center space-y-3">
              <p className="text-xs text-ceci-secondary">{frase(VAZIO, 'agendaSemResultadoFiltro')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilter('tudo')}
                  className="px-4 py-2.5 rounded-xl border border-ceci-border-default bg-surface-default text-[11px] font-semibold text-ceci-primary min-h-[44px] cursor-pointer"
                >
                  limpar filtros
                </button>
                <button
                  type="button"
                  onClick={() => setDoor('task')}
                  className="px-4 py-2.5 rounded-xl bg-ceci-brand-strong text-ceci-on-brand text-[11px] font-semibold min-h-[44px] cursor-pointer"
                >
                  adicionar
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-ceci-border-subtle rounded-2xl border border-ceci-border-default bg-surface-default px-4">
              {filtered.map(renderItem)}
            </div>
          )}
        </section>
      )}

      <TaskSheet
        open={door === 'task'}
        defaultDate={selected}
        onClose={() => setDoor(null)}
      />
      <MeetingSheet
        open={door === 'meeting'}
        meetingId="new"
        intent="agendar"
        defaultDate={selected}
        onClose={() => setDoor(null)}
      />
      <AgendaCreateAction
        hasTcc={hasTcc}
        onNewTask={() => setDoor('task')}
        onNewExam={() => nav.openWizard('exam', undefined, undefined, selected)}
        onNewMeeting={() => setDoor('meeting')}
      />
    </div>
  );
};
