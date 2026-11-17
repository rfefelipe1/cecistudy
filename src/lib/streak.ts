/**
 * Lógica de streak de estudos — pura e testável.
 *
 * Regras do produto (atualizadas):
 * - Qualquer dia da semana conta como dia de estudo (seg–dom). Não há mais
 *   limitação a dias úteis.
 * - A streak conta dias consecutivos com atividade.
 * - A usuária tem 1 proteção (não acumulativa): pode faltar 1 dia sem registrar
 *   e a streak não quebra. A proteção é consumida no 1º dia de furo; se faltar
 *   outro dia antes de retomar, a streak zera.
 * - Se "hoje" ainda não tem atividade, a streak fica pendente (não quebra até
 *   o fim do dia).
 * - Datas são sempre `YYYY-MM-DD` em fuso local (evita o bug UTC do `toISOString`).
 */

/** Retorna a data local no formato YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Faz parse de YYYY-MM-DD para Date (meia-noite local). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Dia da semana a partir de um Date: 0=dom, 1=seg, ..., 6=sáb. */
function weekday(date: Date): number {
  return date.getDay();
}

/** Qualquer dia é dia de estudo (não há mais limitação a dias úteis). */
export function isStudyDay(): boolean {
  return true;
}

/** Chave YYYY-MM-DD do próximo dia a partir de `dateKey`. */
export function addDays(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Rotulo pt-BR curto do dia da semana (seg–dom). */
export function getWeekdayLabel(dateKey: string): string {
  const labels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  return labels[weekday(parseDateKey(dateKey))];
}

/**
 * As 7 chaves (YYYY-MM-DD) da semana (seg a dom) que contém `reference`.
 */
export function getWeekDates(reference: Date | string): string[] {
  const d = typeof reference === 'string' ? parseDateKey(reference) : reference;
  const key = toDateKey(d);
  const today = weekday(d);
  // offset para a segunda-feira (today 1=seg → 0; 0=dom → -6; 6=sáb → -5)
  const offsetToMonday = today === 0 ? -6 : 1 - today;
  const monday = addDays(key, offsetToMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Número de dias corridos entre duas chaves YYYY-MM-DD (b > a). */
function daysBetween(a: string, b: string): number {
  const da = parseDateKey(a);
  const db = parseDateKey(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export interface StreakStats {
  /** Dias de streak atual (consecutivos com atividade, qualquer dia da semana). */
  current: number;
  /** Maior streak já alcançada. */
  longest: number;
  /** Total de dias ativos (qualquer dia, sem duplicar). */
  total: number;
  /** Se a streak está "viva": há atividade hoje ou ontem (ou proteção ainda válida). */
  alive: boolean;
  /** Se a proteção de 1 dia já foi consumida na corrente atual. */
  protectionUsed: boolean;
}

/**
 * Caminha para trás a partir de `start` contando dias com atividade, usando no
 * máximo 1 proteção (dia de furo sem atividade). Retorna a contagem e se a
 * proteção foi consumida.
 */
function walkBackWithProtection(active: Set<string>, start: string): {
  count: number;
  protectionUsed: boolean;
} {
  let cursor = start;
  let count = 0;
  let protectionUsed = false;
  // Limite de segurança (ex.: 5 anos) para evitar loop infinito.
  for (let i = 0; i < 5 * 365; i++) {
    if (active.has(cursor)) {
      count++;
      cursor = addDays(cursor, -1);
      continue;
    }
    // Dia sem atividade: consome a proteção se ainda não usou.
    if (!protectionUsed) {
      protectionUsed = true;
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }
  return { count, protectionUsed };
}

/**
 * Calcula a streak a partir do conjunto de dias ativos.
 * `activeDays` pode ter qualquer data (qualquer dia da semana).
 */
export function computeStreak(activeDays: string[], todayKey: string): StreakStats {
  const active = new Set(activeDays);

  // Streak atual: começa hoje se ativo; senão começa de ontem (pendente).
  let current = 0;
  let protectionUsed = false;
  if (active.has(todayKey)) {
    const result = walkBackWithProtection(active, todayKey);
    current = result.count;
    protectionUsed = result.protectionUsed;
  } else {
    const yesterday = addDays(todayKey, -1);
    if (active.has(yesterday)) {
      const result = walkBackWithProtection(active, yesterday);
      current = result.count;
      protectionUsed = result.protectionUsed;
    }
    // senão: hoje e ontem sem atividade → current = 0 (não viva hoje).
  }

  // Streak mais longa: maior sequência consecutiva com até 1 furo (proteção).
  let longest = 0;
  const sorted = [...active].sort();
  let run = 0;
  let longestProtectionUsed = false;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev === null) {
      run = 1;
    } else {
      const diff = daysBetween(prev, d);
      if (diff === 1) {
        // dia consecutivo — continua a sequência.
        run++;
      } else if (diff === 2 && !longestProtectionUsed) {
        // 1 dia de furo — consome a proteção, sequência continua.
        longestProtectionUsed = true;
        run++;
      } else {
        // quebrou (ou furo maior que 1, ou proteção já usada).
        run = 1;
        longestProtectionUsed = false;
      }
    }
    longest = Math.max(longest, run);
    prev = d;
  }

  const total = sorted.length;

  // "viva": streak atual > 0.
  const alive = current > 0;

  return { current, longest, total, alive, protectionUsed };
}

export type WeekDayStatus = 'done' | 'today' | 'upcoming' | 'weekend';

export interface WeekDayCell {
  dateKey: string;
  label: string;
  status: WeekDayStatus;
  active: boolean;
}

/**
 * Progresso da semana atual: 7 células (seg–dom). Qualquer dia pode estar ativo.
 * Fim de semana sem atividade fica como 'weekend' (apenas visual).
 */
export function getWeekProgress(activeDays: string[], reference: Date | string): WeekDayCell[] {
  const active = new Set(activeDays);
  const todayKey = typeof reference === 'string' ? reference : toDateKey(reference);
  const week = getWeekDates(reference);

  return week.map((dateKey) => {
    if (active.has(dateKey))
      return { dateKey, label: getWeekdayLabel(dateKey), status: 'done', active: true };
    if (dateKey === todayKey)
      return { dateKey, label: getWeekdayLabel(dateKey), status: 'today', active: false };
    const wd = weekday(parseDateKey(dateKey));
    if (wd === 0 || wd === 6)
      return { dateKey, label: getWeekdayLabel(dateKey), status: 'weekend', active: false };
    return { dateKey, label: getWeekdayLabel(dateKey), status: 'upcoming', active: false };
  });
}

export interface HistoryWeek {
  /** Chave YYYY-MM-DD da segunda-feira que inicia a semana. */
  weekStart: string;
  /** Os 5 dias (seg–sex) da semana, mais antigos para mais recentes. */
  days: { dateKey: string; label: string; active: boolean }[];
}

/**
 * Histórico das últimas `weeks` semanas (da semana atual para trás), usado na
 * tela de streak. Cada semana traz os 5 dias (seg–sex) com flag de atividade.
 * Retorna da semana mais antiga para a mais recente (para renderizar em coluna).
 */
export function getRecentWeeks(activeDays: string[], todayKey: string, weeks = 8): HistoryWeek[] {
  const active = new Set(activeDays);
  const currentWeekMonday = getWeekDates(todayKey)[0];
  const result: HistoryWeek[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = addDays(currentWeekMonday, -7 * w);
    const days = Array.from({ length: 5 }, (_, i) => {
      const dateKey = addDays(weekStart, i);
      return { dateKey, label: getWeekdayLabel(dateKey), active: active.has(dateKey) };
    });
    result.push({ weekStart, days });
  }

  return result;
}
