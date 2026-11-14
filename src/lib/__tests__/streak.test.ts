import { describe, expect, it } from 'vitest';
import {
  toDateKey,
  parseDateKey,
  isStudyDay,
  addDays,
  getWeekdayLabel,
  getWeekDates,
  computeStreak,
  getWeekProgress,
  getRecentWeeks,
} from '../streak';

// Semana de referência: segunda 2026-08-10 ... domingo 2026-08-16 (hoje sexta 2026-08-14).
const MON = '2026-08-10';
const TUE = '2026-08-11';
const WED = '2026-08-12';
const THU = '2026-08-13';
const FRI = '2026-08-14';
const SAT = '2026-08-15';
const SUN = '2026-08-16';
const NEXT_MON = '2026-08-17';

describe('datas', () => {
  it('toDateKey/parseDateKey fazem round-trip', () => {
    expect(toDateKey(parseDateKey(FRI))).toBe(FRI);
  });

  it('isStudyDay reconhece qualquer dia da semana (sem limitação a úteis)', () => {
    expect(isStudyDay()).toBe(true);
  });

  it('addDays soma/subtrai dias', () => {
    expect(addDays(FRI, 1)).toBe(SAT);
    expect(addDays(FRI, -1)).toBe(THU);
    expect(addDays(SUN, 1)).toBe(NEXT_MON);
  });

  it('getWeekdayLabel retorna rótulos pt-BR', () => {
    expect(getWeekdayLabel(MON)).toBe('seg');
    expect(getWeekdayLabel(FRI)).toBe('sex');
    expect(getWeekdayLabel(SAT)).toBe('sáb');
    expect(getWeekdayLabel(SUN)).toBe('dom');
  });

  it('getWeekDates inicia a semana na segunda', () => {
    expect(getWeekDates(FRI)).toEqual([MON, TUE, WED, THU, FRI, SAT, SUN]);
    expect(getWeekDates(SUN)).toEqual([MON, TUE, WED, THU, FRI, SAT, SUN]);
  });
});

describe('computeStreak', () => {
  it('começa zerada sem dias ativos', () => {
    expect(computeStreak([], FRI)).toEqual({
      current: 0,
      longest: 0,
      total: 0,
      alive: false,
      protectionUsed: false,
    });
  });

  it('conta 1 quando só hoje está ativo', () => {
    const stats = computeStreak([FRI], FRI);
    expect(stats.current).toBe(1);
    expect(stats.alive).toBe(true);
  });

  it('conta a sequência de dias consecutivos ativos', () => {
    expect(computeStreak([WED, THU, FRI], FRI).current).toBe(3);
  });

  it('mantém a streak pendente quando ontem esteve ativo e hoje ainda não', () => {
    expect(computeStreak([TUE, WED, THU], FRI).current).toBe(3);
  });

  it('zera a corrente quando hoje e ontem não tiveram atividade', () => {
    expect(computeStreak([MON, TUE, WED], FRI).current).toBe(0);
  });

  it('conta fins de semana como dias ativos (não só úteis)', () => {
    expect(computeStreak([THU, FRI, SAT], SAT).current).toBe(3);
  });

  it('usa a proteção para pular 1 dia sem quebrar a corrente', () => {
    // hoje (dom) sem atividade, ontem (sáb) ativo, sexta pulada, quinta ativa
    // proteção consome o furo de sexta → corrente = sábado + quinta = 2
    expect(computeStreak([THU, SAT], SUN).current).toBe(2);
  });

  it('não começa a corrente quando nem hoje nem ontem tiveram atividade', () => {
    expect(computeStreak([FRI], SUN).current).toBe(0);
  });

  it('deduplica dias repetidos', () => {
    expect(computeStreak([FRI, FRI, FRI], FRI).total).toBe(1);
  });

  it('longest conta todos os dias, incluindo fins de semana', () => {
    // qua–dom todos ativos → 5 dias consecutivos
    expect(computeStreak([WED, THU, FRI, SAT, SUN], SUN).longest).toBe(5);
  });

  it('longest usa a proteção para unir 2 blocos separados por 1 dia', () => {
    // seg–qua (3) + furo qui (proteção) + sex (1) → 4
    expect(computeStreak([MON, TUE, WED, FRI], FRI).longest).toBe(4);
  });

  it('longest não acumula proteções: 2 furos quebram a sequência', () => {
    // seg–ter (2) + furo qua (proteção) + qui (1) + furo sex (2º furo → quebra) → longest 3
    expect(computeStreak([MON, TUE, THU], THU).longest).toBe(3);
  });
});

describe('getWeekProgress', () => {
  it('marca done, today, upcoming e weekend corretamente', () => {
    const cells = getWeekProgress([TUE, FRI], FRI);
    expect(cells.map((c) => c.status)).toEqual([
      'upcoming', // seg 10
      'done', // ter 11
      'upcoming', // qua 12
      'upcoming', // qui 13
      'done', // sex 14 (já ativo hoje)
      'weekend', // sáb 15
      'weekend', // dom 16
    ]);
    expect(cells.map((c) => c.label)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']);
  });

  it('marca today quando hoje ainda não tem atividade', () => {
    const cells = getWeekProgress([TUE], FRI);
    expect(cells.find((c) => c.dateKey === FRI)).toMatchObject({ status: 'today' });
  });

  it('marca a semana da segunda-feira de referência', () => {
    const cells = getWeekProgress([], MON);
    expect(cells[0]).toMatchObject({ dateKey: MON, status: 'today' });
  });
});

describe('getRecentWeeks', () => {
  it('retorna o número padrão de semanas (8), da mais antiga para a mais recente', () => {
    const weeks = getRecentWeeks([], FRI);
    expect(weeks).toHaveLength(8);
    expect(weeks[7].weekStart).toBe(MON); // última = semana atual
    expect(weeks[0].weekStart).toBe('2026-06-22'); // 8 semanas antes
  });

  it('cada semana traz apenas os 5 dias úteis (seg–sex)', () => {
    const [week] = getRecentWeeks([], FRI, 1);
    expect(week.days).toHaveLength(5);
    expect(week.days.map((d) => d.label)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex']);
    expect(week.days.some((d) => d.label === 'sáb')).toBe(false);
  });

  it('marca active apenas nos dias úteis presentes em activeDays', () => {
    const weeks = getRecentWeeks([TUE, FRI], FRI, 1);
    const current = weeks[0];
    expect(current.days.map((d) => d.active)).toEqual([false, true, false, false, true]);
  });

  it('semanas anteriores aparecem corretamente', () => {
    const prevWeekMon = '2026-08-03';
    const prevWeekFri = '2026-08-07';
    const weeks = getRecentWeeks([prevWeekFri], FRI, 2);
    expect(weeks[0].weekStart).toBe(prevWeekMon);
    expect(weeks[0].days[4]).toMatchObject({ dateKey: prevWeekFri, active: true });
    expect(weeks[1].weekStart).toBe(MON);
  });

  it('ignora fins de semana mesmo que estejam em activeDays', () => {
    const weeks = getRecentWeeks([SAT, SUN, FRI], FRI, 1);
    expect(weeks[0].days.some((d) => d.active)).toBe(true);
    expect(weeks[0].days.filter((d) => d.active)).toHaveLength(1); // só sex
  });

  it('aceita um número custom de semanas', () => {
    expect(getRecentWeeks([], FRI, 3)).toHaveLength(3);
  });
});
