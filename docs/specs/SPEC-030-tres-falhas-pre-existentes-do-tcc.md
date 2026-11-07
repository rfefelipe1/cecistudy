# SPEC-030 · Três falhas pré-existentes do TCC (dreno, escrita, filtro por capítulo)

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **em andamento** (2026-10-31)
> App afetado: mobile
> Origem: regressão de `verify:fast` em `src/components/tcc/__tests__/TccView.test.tsx`
> Decisões: D1..D3
> Supersede: —
> Depende de: SPEC-012 (gestão do TCC), SPEC-024 (filtro por capítulo)
> Espelha: —
> Data: 2026-10-31

---

## 1. Contexto

- **Situação.** `npm run verify:fast` fecha com 9 falhas, todas em
  `src/components/tcc/__tests__/TccView.test.tsx`. São falhas de testes
  pré-existentes, não causadas pela correção anterior (SPEC-029).
- **O que acontece.** (a) Teste "tcc legado no localStorage aparece como
  thesisChapters na tela": o dreno do boot não converte o `tcc` legado
  (com `chapters` dentro) em `thesisChapters`, então o hero não mostra
  '0 de 1 capítulos'. (b) Teste F5.2 "registrar escrita": o capítulo não é
  definido no `WritingLogSheet` porque o teste usa `fireEvent.change` num
  `CeciSelect` (botão de sheet, não `<select>`), então o log grava sem
  `chapterId` e o `wordCount` não sobe. (c) Teste T4.1 "filtro por capítulo":
  procura por `role="button"` mas o `CeciFilterChip` (`removable=true`) é
  `<span role="checkbox">`.
- **Como se sabe.** `verify:fast` relata as 9 falhas; a inspeção de
  `DataClientProvider.tsx:608`, `WritingLogSheet.tsx`, `TccView.tsx` e
  `CeciFilterChip.tsx` confirma as causas acima.

## 2. Decisões

### D1 · Dreno aplica a migração 22 (não a 23)

- **Decisão.** O dreno do boot chama `migrateDatabase(21, …)` (ou
  `SCHEMA_VERSION - 2`) para que a migração 22 — a que converte o `tcc`
  legado em `thesisChapters`/`thesisReferences` — seja aplicada.
- **Justificativa.** `SCHEMA_VERSION` é 23; `SCHEMA_VERSION - 1 = 22` aplica
  só a migração 23 (foto de perfil), pulando a 22. O comentário do código
  (`DataClientProvider.tsx:590`) já dizia `migrateDatabase(21, …)` — o código
  divergia do comentário.
- **Alternativa rejeitada.** Chamar `migrateDatabase(SCHEMA_VERSION, …)`:
  aplicaria zero migrações (fromVersion == SCHEMA_VERSION), nem a 22 nem a 23.
- **Consequência aceita.** O dreno reaplica a migração 23 (inofensiva, idempotente)
  junto com a 22.

### D2 · Teste F5.2 interage com o CeciSelect como sheet (não com change)

- **Decisão.** O teste F5.2 clica no botão do `CeciSelect` ("capítulo") para
  abrir a sheet, depois clica na opção do capítulo, em vez de `fireEvent.change`.
- **Justificativa.** `CeciSelect` com `useSheet=true` renderiza um `<button>`
  que abre uma `Modal` bottom; `fireEvent.change` nele é no-op. O capítulo
  nunca é definido no componente, então o log grava sem `chapterId`.
- **Alternativa rejeitada.** Mudar o `CeciSelect` para aceitar `change`:
  quebraria o contrato do componente (sheet é a UI canônica) para atender um
  teste.
- **Consequência aceita.** O teste fica mais próximo do uso real (clicar no
  select, escolher a opção).

### D3 · Teste T4.1 procura o chip de capítulo como checkbox

- **Decisão.** O teste T4.1 usa `getByRole('checkbox', { name: 'revisão de literatura' })`
  em vez de `getByRole('button', …)`.
- **Justificativa.** `CeciFilterChip` com `removable=true` (default) renderiza
  `<span role="checkbox" aria-label={label}>`, não `<button>`.
- **Alternativa rejeitada.** Passar `removable={false}` no `TccView`: mudaria a
  UI de produção (chip sem o `×` de remover) só para atender o teste.
- **Consequência aceita.** O teste usa o seletor correto do DOM real.

## 3. Escopo

| Item | Tipo |
|---|---|
| `src/context/DataClientProvider.tsx` — dreno chama `migrateDatabase(21, …)` | código |
| `src/components/tcc/__tests__/TccView.test.tsx` — F5.2 usa sheet do select; T4.1 usa checkbox | teste |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Alterar `CeciSelect` ou `CeciFilterChip` de produção | Os componentes estão corretos; os testes é que usam seletores/interações errados |
| Outras falhas de `TccView.test.tsx` | Só as 9 falhas relatadas pelo `verify:fast`; as demais passam |
| Escrever goldens para o TCC | Não é pedido; o escopo é consertar os 3 testes falhos |

## 5. Contrato

- `migrateDatabase(fromVersion, data)` aplica migrações de `fromVersion+1` até `SCHEMA_VERSION` (`packages/data/src/schema.ts:713`).
- `CeciSelect` com `useSheet=true` expõe um `<button aria-label={label}>` que abre uma sheet de opções (`role="radio"`).
- `CeciFilterChip` com `removable=true` expõe `<span role="checkbox" aria-label={label}>`.

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | O dreno converte `tcc.chapters` legado em `thesisChapters` | `src/context/DataClientProvider.tsx` | `TccView.test.tsx` "tcc legado" |
| I2 | Gravar escrita com capítulo soma `wordCount` do capítulo | `src/components/tcc/WritingLogSheet.tsx` | `TccView.test.tsx` F5.2 |
| I3 | O filtro por capítulo é acionado pelo chip do capítulo | `src/components/views/TccView.tsx` | `TccView.test.tsx` T4.1 |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| TCC legado sem `chapters` | O dreno não dispara (`legacy.chapters` não é array) |
| TCC já drenado (sem `chapters`) | O dreno não dispara (guarda desarmada) — idempotente |
| Escrita sem capítulo | Log gravado sem `chapterId`, `wordCount` não alterado |
| Filtro por capítulo quando não há capítulos | Não renderiza chips de capítulo (`ordered.length > 0`) |

## 8. Critérios de aceite

- [ ] `npm run test -- src/components/tcc/__tests__/TccView.test.tsx` sai com 0
- [ ] `npm run lint` sai com 0

## 9. Medição

| Métrica | Como medir | Antes | Depois | Gate |
|---|---|---|---|---|
| Falhas de `TccView.test.tsx` | `npm run test -- src/components/tcc/__tests__/TccView.test.tsx` | 9 | 0 | o mesmo comando |

## 10. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| Mudar `SCHEMA_VERSION - 1` para `21` afetar outros chamadores do dreno | baixa | dreno duplo | o dreno é idempotente (guarda desarma) |
| O teste F5.2 com sheet demorar (animação) | média | timeout | `waitFor` com `asyncUtilTimeout: 3000` já configurado |

## 11. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `src/context/DataClientProvider.tsx:608` | `TccView.test.tsx` "tcc legado" | `npm run test` |
| D2 | `TccView.test.tsx:570-590` | `TccView.test.tsx` F5.2 | `npm run test` |
| D3 | `TccView.test.tsx:841-859` | `TccView.test.tsx` T4.1 | `npm run test` |
