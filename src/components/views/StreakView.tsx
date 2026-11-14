import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Flame,
  Lightbulb,
  Play,
  Shield,
  Trophy,
} from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { useNavValue } from '@/context/shellNavContexts';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Mascote } from '../ui/Mascote';
import { addDays, getRecentWeeks, toDateKey, getWeekdayLabel } from '../../lib/streak';
import { Reveal } from '@/lib/motion';
import { frase } from '../../lib/voice';
import { CELEBRACAO } from '../../lib/voice';

const fmtShort = (key: string): string => {
  const d = new Date(`${key}T00:00:00`);
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Estado da cápsula da ofensiva, com base no streak atual. */
const estadoCapsula = (current: number, alive: boolean): string => {
  if (current === 0) return 'recomeçando ♡';
  if (current === 1) return 'começando! ♡';
  if (alive) return 'em chamas 🔥';
  return 'vamos recomeçar?';
};

/** 5 dias consecutivos a partir de hoje (qualquer dia da semana, incluindo fim de semana). */
const proximosCincoDias = (todayKey: string): string[] =>
  Array.from({ length: 5 }, (_, i) => addDays(todayKey, i));

export const StreakView: React.FC = () => {
  const { streakStats, streakData, showToast } = useMobileApp();
  const { handleNavigate } = useNavValue();
  const todayKey = toDateKey(new Date());
  const cincoDias = proximosCincoDias(todayKey);
  const active = new Set(streakData.activeDays);
  const recentWeeks = getRecentWeeks(streakData.activeDays, todayKey);

  const capsula = estadoCapsula(streakStats.current, streakStats.alive);

  // Toggle entre "últimas semanas" e "últimas ações" dentro do card de histórico.
  const [mostrarHistorico, setMostrarHistorico] = useState(true);

  const handleIniciarEstudo = useCallback(() => {
    // Leva para a tela principal de faculdade; não registra streak automática.
    handleNavigate('faculdade');
  }, [handleNavigate]);

  const handleAlternarHistorico = useCallback(() => {
    setMostrarHistorico((prev) => !prev);
  }, []);

  return (
    <div className="space-y-5">
      {/* Cabeçalho da tela vem do HeaderNav (modo detail: "sua ofensiva de estudos"). */}

      {/* Área principal de ofensiva — composição horizontal, sem card gigante centralizado. */}
      <section className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm flex items-center gap-4">
        {/* Grupo esquerdo: mascote + chama, visualmente conectados. */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-14 h-14 rounded-full bg-surface-rose border border-ceci-border-brand flex items-center justify-center shadow-sm">
            <Flame
              className={`w-7 h-7 ${streakStats.alive ? 'fill-ceci-brand text-ceci-brand-strong' : 'text-ceci-muted'}`}
            />
          </div>
          <Mascote
            expression={streakStats.alive ? 'celebrate-small' : 'pause-kind'}
            className="w-14 h-14"
            decorative
          />
        </div>

        {/* Grupo direito: número de dias, texto e cápsula de estado. */}
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-4xl text-ceci-primary leading-none">
            <AnimatedNumber value={streakStats.current} />
          </div>
          <p className="text-sm font-medium text-ceci-secondary mt-0.5">
            {streakStats.current === 1 ? 'dia' : 'dias'} de ofensiva
          </p>
          <span
            className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              streakStats.alive
                ? 'bg-surface-default text-ceci-brand-strong border-ceci-border-brand'
                : 'bg-surface-muted text-ceci-secondary border-ceci-border-default'
            }`}
          >
            {capsula}
          </span>
        </div>
      </section>

      {/* Botão de ação principal — leva para a tela de faculdade. */}
      <button
        onClick={handleIniciarEstudo}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[22px] bg-ceci-brand-strong text-ceci-on-brand font-display font-bold text-sm shadow-sm tap-interactive cursor-pointer active:scale-95 hover:bg-ceci-brand transition-colors duration-200"
      >
        <Play className="w-4 h-4 fill-ceci-on-brand" />
        iniciar um estudo
      </button>

      {/* Card de semana — 5 dias consecutivos (qualquer dia da semana). */}
      <section className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-ceci-primary">sua semana</h2>
          <button
            onClick={() => {}}
            className="text-[11px] font-bold text-ceci-brand-strong underline underline-offset-4 hover:text-ceci-brand-strong"
          >
            ver calendário
          </button>
        </div>

        {/* 5 dias consecutivos — design de mês (grade de dias). */}
        <div className="grid grid-cols-5 gap-1.5">
          {cincoDias.map((dateKey) => {
            const isAtivo = active.has(dateKey);
            const isHoje = dateKey === todayKey;
            const label = getWeekdayLabel(dateKey);
            return (
              <div
                key={dateKey}
                className={`p-2 rounded-[18px] border text-center flex flex-col items-center justify-between ${
                  isAtivo
                    ? 'bg-surface-rose border-ceci-border-brand text-ceci-primary'
                    : isHoje
                      ? 'bg-surface-default border-ceci-brand shadow-2xs ring-2 ring-rose-300/50'
                      : 'bg-surface-muted border-ceci-border-subtle text-ceci-secondary'
                }`}
              >
                <span className="text-[10px] font-medium lowercase text-ceci-secondary">
                  {label}
                </span>
                <div className="my-1">
                  {isAtivo ? (
                    <span className="w-6 h-6 rounded-full bg-ceci-brand-strong text-ceci-on-brand font-bold text-[10px] flex items-center justify-center shadow-2xs">
                      ✓
                    </span>
                  ) : isHoje ? (
                    <span className="w-6 h-6 rounded-full bg-ceci-brand-strong text-ceci-on-brand font-bold text-[10px] flex items-center justify-center">
                      ✨
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-surface-muted border border-ceci-border-default" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Explicação do escudo — 5 dias consecutivos ganha um escudo. */}
        <div
          className={`rounded-xl border p-3 flex items-center gap-2.5 ${
            streakStats.current >= 5
              ? 'bg-surface-rose border-ceci-border-brand'
              : 'bg-surface-muted border-ceci-border-subtle'
          }`}
        >
          <Shield
            className={`w-5 h-5 ${
              streakStats.current >= 5
                ? 'text-ceci-brand-strong'
                : 'text-ceci-muted'
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ceci-primary leading-tight">
              {streakStats.current >= 5 ? 'escudo desbloqueado ♡' : '5 dias seguidos = 1 escudo'}
            </p>
            <p className="text-[10px] text-ceci-secondary leading-relaxed">
              {streakStats.current >= 5
                ? 'você completou 5 dias seguidos e ganhou sua proteção.'
                : 'estude por 5 dias consecutivos (qualquer dia da semana) e ganhe um escudo que protege sua ofensiva de 1 dia de furo.'}
            </p>
          </div>
        </div>
      </section>

      {/* Estatísticas — dois cards lado a lado, mesmo tamanho. */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-brand shadow-sm flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-1 text-ceci-brand-strong">
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">seu recorde</span>
          </div>
          <p className="font-display font-bold text-2xl text-ceci-primary">
            <AnimatedNumber value={streakStats.longest} />
            <span className="text-xs font-normal text-ceci-secondary ml-0.5">dias</span>
          </p>
        </div>
        <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-1 text-ceci-brand-strong">
            <CalendarDays className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">dias ativos</span>
          </div>
          <p className="font-display font-bold text-2xl text-ceci-primary">
            <AnimatedNumber value={streakStats.total} />
            <span className="text-xs font-normal text-ceci-secondary ml-0.5">no total</span>
          </p>
        </div>
      </section>

      {/* Mensagem motivacional — card horizontal compacto. */}
      <section className="rounded-2xl p-4 bg-surface-rose border border-ceci-border-brand shadow-sm flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-default flex items-center justify-center shadow-sm">
          <Lightbulb className="w-4 h-4 text-ceci-brand-strong" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-ceci-primary">você consegue!</p>
          <p className="text-[11px] text-ceci-secondary mt-0.5 leading-relaxed">
            retome seus estudos e mantenha sua sequência ♡
          </p>
        </div>
      </section>

      {/* Card de histórico — toggle entre "últimas semanas" e "últimas ações". */}
      <section
        className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-3.5"
        onClick={handleAlternarHistorico}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAlternarHistorico();
          }
        }}
        aria-label={mostrarHistorico ? 'ver últimas semanas' : 'ver últimas semanas de volta'}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-ceci-primary cursor-pointer select-none">
            {mostrarHistorico ? 'últimas semanas' : 'últimas ações'}
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAlternarHistorico();
            }}
            className="text-[11px] font-bold text-ceci-brand-strong underline underline-offset-4 hover:text-ceci-brand-strong"
          >
            {mostrarHistorico ? 'ver histórico' : 'ver semanas'}
          </button>
        </div>

        {mostrarHistorico ? (
          <div className="space-y-2.5">
            {recentWeeks.map((week, i) => (
              <Reveal key={week.weekStart} index={i}>
                <div className="flex items-center gap-3">
                  <span className="w-14 text-[10px] font-semibold text-ceci-tertiary shrink-0">
                    {fmtShort(week.weekStart)}–{fmtShort(addDays(week.weekStart, 4))}
                  </span>
                  <div className="flex-1 flex gap-1.5">
                    {week.days.map((d) => (
                      <div
                        key={d.dateKey}
                        title={d.active ? `${d.label} ativo` : d.label}
                        className={`flex-1 h-7 rounded-lg ${
                          d.active
                            ? 'bg-ceci-brand shadow-2xs'
                            : 'bg-surface-muted border border-ceci-border-subtle'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[10px] text-ceci-tertiary font-semibold tracking-wide lowercase px-1 pt-1">
              dias com atividade registrada
            </p>
            {recentWeeks.flatMap((week) =>
              week.days
                .filter((d) => d.active)
                .map((d) => (
                  <div
                    key={d.dateKey}
                    className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-surface-muted border border-ceci-border-subtle"
                  >
                    <span className="text-xs font-medium text-ceci-primary">{d.label}</span>
                    <span className="text-[10px] font-bold text-ceci-brand-strong">
                      ativo
                    </span>
                  </div>
                ))
            ).slice(0, 8)}
            {recentWeeks.flatMap((week) => week.days.filter((d) => d.active)).length === 0 && (
              <p className="text-xs text-ceci-secondary text-center py-2">
                ainda não há dias registrados ♡
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
