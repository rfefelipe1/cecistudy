import React, { useMemo, useState } from 'react';
<<<<<<< HEAD
import { HeartHandshake, Compass, AlertCircle, Users, Sparkles } from 'lucide-react';
=======
import { HeartHandshake, Compass, AlertCircle, Users, Sparkles, Target } from 'lucide-react';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { useMobileApp } from '@/context/mobileApp';
import { InternshipLogCard } from '../InternshipLogCard';
import { SupervisionView } from './SupervisionView';
import { HeroCard } from '../ui/HeroCard';
<<<<<<< HEAD
=======
import { InternshipGoalSheet } from '../internship/InternshipGoalSheet';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { Mascote } from '../ui/Mascote';
import { EmptyState } from '../ui/EmptyState';
import { DitherGrowthChart } from '../ui/dither-growth';
import { UnderlineTabBar, type UnderlineTab } from '../ui/UnderlineTabBar';
import { SwipeableTabPanel, useTabPager } from '../ui/SwipeableTabPanel';
<<<<<<< HEAD
import { VAZIO, erro, frase } from '../../lib/voice';
import { PillGroup } from '../ui/PillGroup';
=======
import { VAZIO, frase } from '../../lib/voice';
import { CeciFilterChip } from '../ui/ceci';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
import { ProgressBar } from '../ui/ProgressBar';
import { StatusChip } from '../internship/StatusChip';
import { InternshipCaseCard } from '../internship/InternshipCaseCard';
import {
  deriveCases,
  computeStats,
  computePendencies,
  groupByWeek,
} from '../../lib/internshipCases';
import { todayKeyLocal } from '../../lib/dateBR';
import { formatHours } from '../../lib/formatHours';
import { pluralPt } from '../../lib/pluralPt';
import { isDarkTheme } from '../../lib/themes';
import { Reveal } from '@/lib/motion';
import type { InternshipLog } from '../../types';
import type { LogGroupId } from '../../types';

export type InternshipTab = 'diario' | 'pacientes' | 'supervisao';

/** Ordem das abas do diário — define para onde o arrasto avança (SPEC-015). */
const DIARIO_TAB_ORDER: readonly InternshipTab[] = ['diario', 'pacientes', 'supervisao'];

/** Nome legível da aba — o `aria-label` do painel mostra isto, não o id cru. */
const DIARIO_TAB_LABEL: Record<InternshipTab, string> = {
  diario: 'diário',
  pacientes: 'pacientes',
  supervisao: 'supervisão',
};

/** As abas do diário com o badge de pendência que cada uma mostra. */
const DIARIO_TABS = (pend: {
  noReflection: string[];
  noSupervision: string[];
}): UnderlineTab<InternshipTab>[] => [
  {
    id: 'diario',
    label: 'diário',
    icon: <HeartHandshake className="w-4 h-4" />,
    badge: pend.noReflection.length,
  },
  { id: 'pacientes', label: 'pacientes', icon: <Users className="w-4 h-4" /> },
  {
    id: 'supervisao',
    label: 'supervisão',
    icon: <Compass className="w-4 h-4" />,
    badge: pend.noSupervision.length,
  },
];

type Filter = 'todos' | 'campo' | 'clinico' | 'supervisao';
type PendingFilter = 'reflexao' | 'supervisao' | null;

const FILTER_TYPES: Record<Filter, InternshipLog['type'][]> = {
  todos: [],
  campo: ['estagio', 'outro'],
  clinico: ['atendimento_clinico'],
  supervisao: ['supervisao', 'intervisao'],
};

/**
 * Tela do Estágio — v2 (`SPEC-009 §9.2`–`§9.3`).
 *
 * **Uma derivação só.** Antes as horas eram somadas em três lugares diferentes
 * (`F6`) e as pendências eram derivadas por caso, o que fazia atendimento sem
 * iniciais sumir de todo contador (`F9`). Agora um `useMemo` produz
 * `stats`, `pendências`, `linkIndex` e `casos`, e as abas recebem por props.
 */
export const InternshipDiaryView: React.FC = () => {
  const {
    internshipLogs,
    openWizard,
    openInternshipWizard,
    themePref,
    profile,
    handleUpdateProfile,
    internshipTab,
    openInternshipDiary,
    openInternshipCase,
  } = useMobileApp();
  const appIsDark = isDarkTheme(themePref);
  // A aba vem da **navegação** (D16), não de useState: voltar do caso ou do
  // wizard reabre na mesma aba, e a aba é deep-link.
  const tab: InternshipTab = internshipTab ?? 'diario';
  const setTab = (t: InternshipTab) => openInternshipDiary(t);
  const [filter, setFilter] = useState<Filter>('todos');
  const [pending, setPending] = useState<PendingFilter>(null);
  const [extraWeeks, setExtraWeeks] = useState(0);
<<<<<<< HEAD
=======
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

  // Arraste horizontal troca de aba (SPEC-015). Trocar de aba limpa o filtro de
  // pendência — vale para o toque na tab bar e para o arrasto, pelos dois
  // caminhos passando pelo `onChange` do pager.
  const pager = useTabPager<InternshipTab>({
    tabIds: DIARIO_TAB_ORDER,
    active: tab,
    onChange: (next) => {
      setTab(next);
      setPending(null);
    },
  });

  const today = todayKeyLocal();

  // A única derivação da tela. Tudo abaixo lê daqui.
  const derived = useMemo(() => {
    const stats = computeStats(internshipLogs, today);
    const pend = computePendencies(internshipLogs, today);
    const { cases, orphans } = deriveCases(internshipLogs, today);
    const groups = groupByWeek(internshipLogs, today);
    return { stats, pend, cases, orphans, groups };
  }, [internshipLogs, today]);

  const { stats, pend, cases, orphans, groups } = derived;

  const filtered = useMemo(() => {
    const byType = (logs: InternshipLog[]) => {
      const allowed = FILTER_TYPES[filter];
      if (!allowed.length) return logs;
      return logs.filter((l) => allowed.includes(l.type));
    };
    const byPending = (logs: InternshipLog[]) => {
      if (!pending) return logs;
      const ids = pending === 'reflexao' ? pend.noReflection : pend.noSupervision;
      return logs.filter((l) => ids.includes(l.id));
    };
    return groups
      .filter((g) => !(pending && g.id === 'upcoming'))
      .map((g) => ({ ...g, logs: byPending(byType(g.logs)) }))
      .filter((g) => g.logs.length > 0);
  }, [groups, filter, pending, pend]);

  const goal = profile?.internshipGoalHours;
  const goalPct = goal ? Math.min(100, (stats.doneHours / goal) * 100) : 0;
  const hasPending = pend.noReflection.length > 0 || pend.noSupervision.length > 0;

  const togglePending = (which: Exclude<PendingFilter, null>) => {
    setPending((p) => (p === which ? null : which));
  };

  // Hero único, acima da barra de abas (SPEC-010 D1/D3): o conteúdo muda com a
  // aba, a identidade não — trocar de aba não pula o topo da tela.
  const encontros = internshipLogs.filter(
    (l) => l.type === 'supervisao' || l.type === 'intervisao',
  ).length;
  const pendencias: string[] = [];
  if (pend.noReflection.length) pendencias.push(`${pend.noReflection.length} sem reflexão`);
  if (pend.noSupervision.length) pendencias.push(`${pend.noSupervision.length} sem supervisão`);
  const pendenciasSummary = pendencias.length ? pendencias.join(' · ') : 'tudo em dia ♡';

  const hero =
    tab === 'pacientes'
      ? {
          title: pluralPt(cases.length, 'paciente', 'pacientes'),
          summary:
            orphans.length > 0
              ? `${pluralPt(stats.clinicalDoneCount, 'sessão clínica feita', 'sessões clínicas feitas')} · ${pluralPt(orphans.length, 'sem iniciais', 'sem iniciais')}`
              : pluralPt(
                  stats.clinicalDoneCount,
                  'sessão clínica feita',
                  'sessões clínicas feitas',
                ),
          expression: 'connection-link' as const,
        }
      : tab === 'supervisao'
        ? {
            title: pluralPt(encontros, 'encontro', 'encontros'),
            summary: pend.noSupervision.length
              ? `${pluralPt(pend.noSupervision.length, 'sessão esperando supervisão', 'sessões esperando supervisão')}`
              : pendenciasSummary,
            expression: 'supervision-reflect' as const,
          }
        : {
            title: `${formatHours(stats.doneHours)} h de campo`,
            summary: `${goal ? `meta ${formatHours(goal)} h` : 'sem meta ainda'} · ${pendenciasSummary}`,
            expression: 'field-prepare' as const,
          };

  return (
    <div className="space-y-4 pb-1">
      {/* Hero (SPEC-010 D1) — acima da barra de abas.
          A primária **não** é do herói desde 2026-10-19 (SPEC-022 D2-ii): o
          herói do Estágio cedeu a ação para a barra contextual, que a
          executa com a mesma semente (`openInternshipWizard` com o `kind` da
          aba). O herói fica com identidade e resumo. */}
      <HeroCard
        eyebrow="estágio"
        title={hero.title}
        summary={hero.summary}
        expression={hero.expression}
      />

      {/* Abas com badge de pendência */}
      <UnderlineTabBar<InternshipTab>
        active={tab}
        onChange={(t) => pager.goTo(t)}
        tabs={DIARIO_TABS(pend)}
      />

      {/* Conteúdo das abas: o painel arrasta junto com o dedo (SPEC-015) */}
      <SwipeableTabPanel active={tab} pager={pager} label={DIARIO_TAB_LABEL[tab]}>
        {tab === 'supervisao' ? (
          <SupervisionView today={today} cases={cases} pendingIds={pend.noSupervision} />
        ) : tab === 'pacientes' ? (
          <section className="space-y-3">
            {cases.length > 0 && (
              <p className="text-[11px] text-ceci-tertiary">
                {pluralPt(cases.length, 'paciente', 'pacientes')} ·{' '}
                {pluralPt(stats.clinicalDoneCount, 'sessão feita', 'sessões feitas')}
              </p>
            )}
            {cases.length === 0 && orphans.length === 0 ? (
              <EmptyState
                description={frase(VAZIO, 'semPaciente')}
                actionLabel="anotar atendimento"
                onAction={() => openInternshipWizard({ kind: 'atendimento_clinico' })}
              />
            ) : (
              <div className="space-y-3">
                {cases.map((c, i) => (
                  <Reveal key={c.patientKey} index={i}>
                    <InternshipCaseCard
                      caseData={c}
                      onPress={() => openInternshipCase(c.patientKey)}
                    />
                  </Reveal>
                ))}
                {orphans.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openInternshipCase('')}
                    className="w-full text-left p-4 rounded-2xl bg-surface-muted border border-status-warning-border shadow-sm cursor-pointer tap-interactive"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-status-warning-strong" />
                      <span className="text-xs font-semibold text-status-warning-strong">
                        {pluralPt(
                          orphans.length,
                          'atendimento sem iniciais',
                          'atendimentos sem iniciais',
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-ceci-secondary mt-1">toque pra completar</p>
                  </button>
                )}
              </div>
            )}
          </section>
        ) : (
          <>
<<<<<<< HEAD
            {/* a) Resumo */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default shadow-sm text-center">
=======
            {/* a) Resumo — três cards de número; o primeiro traz o ícone de meta
                (Target) que abre a sheet de definir/editar meta de horas. */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default shadow-sm text-center relative">
                <button
                  type="button"
                  onClick={() => setGoalSheetOpen(true)}
                  aria-label={goal ? `editar meta de ${formatHours(goal)} h` : 'definir meta de horas'}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-surface-default/60 border border-ceci-border-default text-ceci-secondary flex items-center justify-center hover:bg-surface-default/80 tap-interactive transition-colors"
                >
                  <Target className="w-3 h-3" />
                </button>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
                <p className="font-bold text-ceci-academic-strong text-lg">
                  {formatHours(stats.doneHours)}
                </p>
                <p className="text-[12px] text-ceci-secondary">
                  {goal ? `de ${formatHours(goal)} h` : 'horas feitas'}
                </p>
              </div>
              <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default shadow-sm text-center">
                <p className="font-bold text-ceci-academic-strong text-lg">
                  {formatHours(stats.weekHours)}
                </p>
                <p className="text-[12px] text-ceci-secondary">esta semana</p>
              </div>
              <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default shadow-sm text-center">
                <p className="font-bold text-ceci-academic-strong text-lg">
                  {stats.clinicalDoneCount}
                </p>
                <p className="text-[12px] text-ceci-secondary">
                  {pluralPt(stats.clinicalDoneCount, 'sessão', 'sessões')}
                </p>
              </div>
            </div>

<<<<<<< HEAD
            {/* Meta de horas (D2) */}
            {goal ? (
              <div className="space-y-1.5">
                <ProgressBar
                  value={goalPct}
                  barClassName={goalPct >= 100 ? 'bg-status-success' : undefined}
                />
                <p className="text-[11px] text-ceci-secondary">
                  {goalPct >= 100
                    ? 'meta batida ♡'
                    : `faltam ${formatHours(Math.max(0, goal - stats.doneHours))} h`}
                </p>
              </div>
            ) : (
              <GoalCta onSet={(h) => handleUpdateProfile({ internshipGoalHours: h })} />
            )}
=======
            {/* Meta de horas (D2) — espaço de respiração em relação aos cards acima. */}
            <div className="mt-5">
              {goal ? (
                <div className="space-y-1.5">
                  <ProgressBar
                    value={goalPct}
                    barClassName={goalPct >= 100 ? 'bg-status-success' : undefined}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-ceci-secondary">
                      {goalPct >= 100
                        ? 'meta batida ♡'
                        : `faltam ${formatHours(Math.max(0, goal - stats.doneHours))} h`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setGoalSheetOpen(true)}
                      aria-label="editar meta de horas"
                      className="w-6 h-6 rounded-full bg-surface-default/60 border border-ceci-border-default text-ceci-secondary flex items-center justify-center hover:bg-surface-default/80 tap-interactive transition-colors"
                    >
                      <Target className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setGoalSheetOpen(true)}
                  className="w-full min-h-[48px] rounded-xl border border-ceci-border-default bg-surface-default flex items-center justify-center gap-3 cursor-pointer tap-interactive hover:bg-surface-rose transition-colors"
                >
                  <Target className="w-4 h-4 text-ceci-brand-strong" />
                  <span className="text-sm font-semibold text-ceci-brand-strong">
                    definir meta de horas
                  </span>
                  <span className="text-[11px] text-ceci-tertiary ml-auto">
                    sem meta ainda ♡
                  </span>
                </button>
              )}
            </div>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

            {/* c) Pendências — somem quando zeradas (D13) */}
            {hasPending && (
              <div className="rounded-2xl p-4 bg-surface-muted border border-status-warning-border space-y-2">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-status-warning-strong">
                  <AlertCircle className="w-4 h-4" aria-hidden />
                  pendências
                </div>
                <div className="flex flex-wrap gap-2">
                  {pend.noReflection.length > 0 && (
                    <StatusChip
                      tone="warning"
                      pressed={pending === 'reflexao'}
                      onClick={() => togglePending('reflexao')}
                      label={`${pend.noReflection.length} sem reflexão`}
                    />
                  )}
                  {pend.noSupervision.length > 0 && (
                    <StatusChip
                      tone="warning"
                      pressed={pending === 'supervisao'}
                      onClick={() => togglePending('supervisao')}
                      label={`${pend.noSupervision.length} sem supervisão`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* d) Gráfico — só com 2+ semanas de dado (U7) */}
            {stats.weeksWithData >= 2 && (
              <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm">
                <DitherGrowthChart
                  theme={appIsDark ? 'dark' : 'light'}
                  data={stats.weeklySeries}
                  title="horas de campo por semana"
                  unitLabel="h"
                  accentColor="#4A879F"
                  className="w-full"
                />
              </div>
            )}

            {/* e) Filtros */}
<<<<<<< HEAD
            <PillGroup<Filter>
              size="sm"
              variant="rose"
              value={filter}
              onChange={setFilter}
              options={[
=======
            <div className="flex flex-wrap gap-1.5">
              {[
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
                { value: 'todos', label: 'todos' },
                { value: 'campo', label: 'campo' },
                { value: 'clinico', label: 'clínico' },
                { value: 'supervisao', label: 'supervisão' },
<<<<<<< HEAD
              ]}
            />
=======
              ].map((o) => (
                <CeciFilterChip
                  key={o.value}
                  value={o.value}
                  label={o.label}
                  active={filter === o.value}
                  onChange={(v) => setFilter(v as Filter)}
                />
              ))}
            </div>
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

            {pending && (
              <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default flex items-center justify-between gap-2 text-[12px] text-ceci-secondary">
                <span>
                  mostrando{' '}
                  {pending === 'reflexao' ? pend.noReflection.length : pend.noSupervision.length}{' '}
                  {pending === 'reflexao' ? 'sem reflexão' : 'sem supervisão'}
                </span>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="min-h-[44px] px-4 rounded-full text-[12px] font-semibold bg-surface-default border border-ceci-border-default cursor-pointer tap-interactive"
                >
                  limpar
                </button>
              </div>
            )}

            {/* f) Lista agrupada por semana */}
            {internshipLogs.length === 0 ? (
              <EmptyState
                description={frase(VAZIO, 'semRegistroEstagio')}
                actionLabel="anotar"
                onAction={() => openWizard('internship')}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                description={frase(VAZIO, 'semResultadoFiltro')}
                actionLabel="limpar filtros"
                onAction={() => {
                  setFilter('todos');
                  setPending(null);
                }}
              />
            ) : (
              <div className="space-y-4">
                {visibleGroups(filtered, extraWeeks).map((g) => (
                  <section key={g.id as LogGroupId}>
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary">
                        {g.label}
                      </h3>
                      {g.hours > 0 && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ceci-tertiary">
                          · {formatHours(g.hours)} h
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {g.logs.map((log, i) => (
                        <Reveal key={log.id} index={i}>
                          <InternshipLogCard log={log} today={today} allLogs={internshipLogs} />
                        </Reveal>
                      ))}
                    </div>
                  </section>
                ))}
                {countDoneGroups(filtered) > 4 && (
                  <button
                    type="button"
                    onClick={() => setExtraWeeks((n) => n + 8)}
                    className="w-full min-h-[44px] rounded-full text-xs font-semibold bg-surface-default border border-ceci-border-default cursor-pointer tap-interactive"
                  >
                    ver semanas anteriores
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </SwipeableTabPanel>
<<<<<<< HEAD
=======

      {/* Sheet de baixo para cima que abre ao tocar o ícone Target do card
          "horas feitas" ou o botão de definir meta. */}
      <InternshipGoalSheet
        open={goalSheetOpen}
        onClose={() => setGoalSheetOpen(false)}
        currentHours={goal}
        onSet={(h) => handleUpdateProfile({ internshipGoalHours: h })}
      />
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    </div>
  );
};

/** `E11`: as 4 semanas mais recentes, mais o que a usuária pediu ver. */
const visibleGroups = (groups: ReturnType<typeof groupByWeek>, extra: number) => {
  const done = groups.filter((g) => g.id !== 'upcoming');
  const keep = 4 + extra;
  if (done.length <= keep) return groups;
  return [...groups.filter((g) => g.id === 'upcoming'), ...done.slice(0, keep)];
};

const countDoneGroups = (groups: ReturnType<typeof groupByWeek>) =>
  groups.filter((g) => g.id !== 'upcoming').length;
<<<<<<< HEAD

const GoalCta: React.FC<{ onSet: (hours: number) => void }> = ({ onSet }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const n = Number(value.replace(',', '.'));
    if (!Number.isInteger(n) || n < 1 || n > 5000) {
      setError(erro('metaDeHoras'));
      return;
    }
    onSet(n);
    setOpen(false);
    setValue('');
    setError('');
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-[44px] rounded-full text-xs font-semibold text-ceci-brand-strong border border-ceci-border-brand bg-surface-rose cursor-pointer tap-interactive"
      >
        definir meta
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-3 bg-surface-default border border-ceci-border-default space-y-2">
      <p className="text-[11px] font-semibold text-ceci-secondary">meta de horas</p>
      <input
        autoFocus
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError('');
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="ex.: 300"
        aria-label="meta de horas"
        className="w-full rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2 text-sm text-ceci-primary min-h-[44px]"
      />
      <p className="text-[11px] text-ceci-tertiary">
        quantas horas seu estágio pede no total? dá pra mudar quando quiser
      </p>
      {error && <p className="text-[11px] text-status-warning-strong">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-ceci-primary text-ceci-on-primary cursor-pointer tap-interactive"
        >
          guardar
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-muted border border-ceci-border-subtle text-ceci-secondary cursor-pointer tap-interactive"
        >
          cancelar
        </button>
      </div>
    </div>
  );
};
=======
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
