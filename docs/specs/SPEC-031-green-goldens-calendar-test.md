# SPEC-031 · Green dos goldens e do CalendarScreen (bomba-relógio de data e seletor ambíguo)

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **em andamento** (2026-10-31)
> App afetado: mobile
> Origem: falhas pré-existentes do `verify:fast` em `goldenFixtures.test.ts` e `CalendarScreen.test.tsx`
> Decisões: D1..D3
> Supersede: —
> Depende de: —
> Espelha: —
> Data: 2026-10-31

---

## 1. Contexto

- **Situação.** `npm run verify:fast` fecha com 6 falhas fora do escopo da tarefa anterior (SPEC-029/030): 3 em `src/lib/__tests__/goldenFixtures.test.ts` e 3 em `src/components/views/__tests__/CalendarScreen.test.tsx`.
- **O que acontece.** (a) O golden `full_backup.*.json` e as coleções `profile.json` esperam o campo `dailyQuote` no profile, mas `UserProfile` (`src/types/profile.ts`) e `emptyProfile` (`src/data/empty.ts:49-61`) **não têm** `dailyQuote` — o campo é órfão nos goldens. (b) O teste "tarefa sem disciplina aparece na agenda" usa `dueDate: addDaysKey('2026-10-30', 0)`, fixa em 30/10; hoje é 31/10, então a tarefa já passou e não aparece em "próximos dias". (c) O teste "selecionar um dia no calendário atualiza a agenda do dia" usa `getByText(/próximos dias/)`, que casa com o `<h2>` do `UpcomingAgenda` **e** o `<p>` do `CecinhoCalendarNote` ("nada marcado nos próximos dias…") → múltiplos elementos.
- **Como se sabe.** `verify:fast` relata as 6 falhas; inspeção de `src/types/profile.ts`, `src/data/empty.ts`, `src/data/fixtures/goldenSample.ts` e `CalendarScreen.test.tsx` confirma.

## 2. Decisões

### D1 · Regenerar os golden files (remover `dailyQuote` órfão)

- **Decisão.** Regenerar `contracts/golden/` com `GOLDEN_WRITE=1` para bater com o código atual (sem `dailyQuote` no profile).
- **Justificativa.** `dailyQuote` não existe em nenhum lugar do código fonte (nem tipo, nem fixture). O golden é o oráculo que deve refletir o código, não o inverso. Regenerar é o procedimento documentado no próprio teste (`goldenFixtures.test.ts:18-21`).
- **Alternativa rejeitada.** Adicionar `dailyQuote` ao `UserProfile`/`emptyProfile`/`sampleSnapshot`: criaria um campo sem uso, sem consumidor, sem tipo — dívida pura.
- **Consequência aceita.** Os arquivos em `contracts/golden/` mudam (removem `dailyQuote` do `profile`). É o esperado quando o estado vazio/cênico muda.

### D2 · Teste CalendarScreen usa datas relativas a hoje

- **Decisão.** A tarefa `t-1` passa a ter `dueDate = todayKeyLocal()` (hoje) e `t-2` `addDaysKey(hoje, 2)` (futuro), em vez de strings fixas '2026-10-30' / '2026-11-02'.
- **Justificbara.** Data fixa é bomba-relógio: deixa de funcionar quando o dia do sistema avança. O padrão do grupo já foi aplicado em `TccView.test.tsx` F3.6 ("asserção de prazo não pode ser bomba-relógio").
- **Alternativa rejeitada.** Manter data fixa e "consertar" só quando quebrar: adia o problema e o teste fica instável.
- **Consequência aceita.** O teste fica determinístico independentemente do dia da máquina.

### D3 · Seletor específico para "próximos dias"

- **Decisão.** O teste usa `screen.getByRole('heading', { name: /próximos dias/ })` (o `<h2>` do `UpcomingAgenda`), não `getByText(/próximos dias/)`.
- **Justificbara.** O `<h2>` é o heading da seção "próximos dias"; o `<p>` do cecinho é um parágrafo de texto, não o heading. `getByRole('heading')` é semântico e não casa com o parágrafo.
- **Alternativa rejeitada.** `getAllByText(/próximos dias/)[0]`: funciona, mas é frágil (depende da ordem do DOM) e não comunica intenção.
- **Consequência aceita.** Nenhuma; o heading existe e é único.

## 3. Escopo

| Item | Tipo |
|---|---|
| `contracts/golden/full_backup.empty.json` | dado (regenerado) |
| `contracts/golden/full_backup.sample.json` | dado (regenerado) |
| `contracts/golden/collections/empty/profile.json` | dado (regenerado) |
| `contracts/golden/collections/sample/profile.json` | dado (regenerado) |
| `src/components/views/__tests__/CalendarScreen.test.tsx` | teste |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Adicionar `dailyQuote` ao `UserProfile` | Campo sem uso/consumidor — dívida |
| Outras coleções de golden | Só `profile` diverge; as demais batem |
| Código de produção do CalendarScreen | A tela está correta; só o teste usa seletor/data ruins |

## 5. Contrato

- `canonicalize(goldenEnvelope(snapshot))` deve bater com `contracts/golden/full_backup.{empty,sample}.json`.
- Cada coleção do payload deve bater com `contracts/golden/collections/{empty,sample}/{key}.json`.

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | O golden reflete o estado atual do snapshot (sem campos órfãos) | `contracts/golden/*` | `goldenFixtures.test.ts` |
| I2 | O teste de tarefa na agenda usa data relativa a hoje | `CalendarScreen.test.tsx` | `CalendarScreen.test.tsx` |
| I3 | O seletor "próximos dias" aponta para o heading único | `CalendarScreen.test.tsx` | `CalendarScreen.test.tsx` |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| `GOLDEN_WRITE=1` não definido | Os goldens existentes são lidos e comparados (não escreve) |
| Teste rodado em qualquer dia | `t-1` é sempre hoje, `t-2` sempre +2 dias |
| `getByRole('heading', /próximos dias/)` | Casa com o `<h2>` do `UpcomingAgenda`, não com o `<p>` do cecinho |

## 8. Critérios de aceite

- [ ] `npm run test -- src/lib/__tests__/goldenFixtures.test.ts` sai com 0
- [ ] `npm run test -- src/components/views/__tests__/CalendarScreen.test.tsx` sai com 0
- [ ] `npm run lint` sai com 0

## 9. Medição

| Métrica | Como medir | Antes | Depois | Gate |
|---|---|---|---|---|
| Falhas de goldenFixtures | `npm run test -- src/lib/__tests__/goldenFixtures.test.ts` | 4 | 0 | o mesmo comando |
| Falhas de CalendarScreen | `npm run test -- src/components/views/__tests__/CalendarScreen.test.tsx` | 2 | 0 | o mesmo comando |

## 10. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| Regenerar golden muda mais que `dailyQuote` | baixa | diff maior no golden | revisar o diff gerado antes de aceitar |
| `getByRole('heading')` não encontrar se a tag mudar | baixa | teste falha | ajustar seletor para o heading real |

## 11. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `contracts/golden/*` | `goldenFixtures.test.ts` | `npm run test` |
| D2 | `CalendarScreen.test.tsx:30-38` | `CalendarScreen.test.tsx` | `npm run test` |
| D3 | `CalendarScreen.test.tsx:126` | `CalendarScreen.test.tsx` | `npm run test` |
