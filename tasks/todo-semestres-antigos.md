# To-do: Semestres antigos com memórias + correção de tema ao voltar (SPEC-028)

> Spec: [`../docs/specs/SPEC-028-semestres-antigos-com-memorias-e-tema-ao-voltar.md`](../docs/specs/SPEC-028-semestres-antigos-com-memorias-e-tema-ao-voltar.md)
> **Regra de ouro:** cada fase fecha com `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs` verdes. `SCHEMA_VERSION` fica **inalterada** em todas as fases (SPEC-028 D8).

**Progresso:** 7/7 fases — implementado (F0–F6 + regra D15 + testes de UI F7). Todo o trabalho está concluído.

---

## F0 — Preparação ✅

- [x] **F0.1** Arquivo de tasks criado, com fases, arquivos e gates.
- [x] **F0.2** Baseline: `npm run lint` → 0 · `npm run test` → testes passam · `check-boundaries.mjs` → 0.
- [x] **F0.3** Decisões confirmadas com a dona: 4 categorias fixas, wizard opcional, sem `SCHEMA_VERSION`.

## F1 — Domínio puro: tipo e validação de `SemesterMemory` ✅

- [x] **F1.1** `src/lib/semesterMemory.ts` — `MemoryCategory`, `SemesterMemory`, `createSemesterMemory`, `patchSemesterMemory`, `validarMemoria`, `MEMORY_CATEGORY_META`, `sortMemoriesByRecency`, `memoriesByTerm`.
- [x] **F1.2** `src/lib/__tests__/semesterMemory.test.ts` — 16 testes puros (sem jsdom): criação, patch, validação, categoria inválida, ordenação, filtro por termo.
- [x] **F1.3** `npm run lint` + `npm run test` verdes.

## F2 — Estado e persistência no `DataClientProvider` ✅

- [x] **F2.1** `semesterMemories` no estado do `DataClientProvider` (`usePersistentState`, namespace `'device'`, fora do backup).
- [x] **F2.2** Ações: `addSemesterMemory`, `updateSemesterMemory`, `deleteSemesterMemory`, `getMemoriesByTerm`.
- [x] **F2.3** Tipo `AppContextValue` e `DataClientValue` atualizados; `buildAppContextValue` expõe as novas ações.
- [x] **F2.4** Prefixo `'mem'` adicionado a `packages/domain/src/core/domain/ids.ts`.
- [x] **F2.5** `npm run lint` + `npm run test` verdes.

## F3 — UI: lista de memórias dentro de um semestre ✅

- [x] **F3.1** Kind `semesterMemories` adicionado a `NavScreen` (`packages/navigation/src/types.ts`).
- [x] **F3.2** `slideBaseKeyOf` para `semesterMemories` em `src/context/slideKeys.ts`.
- [x] **F3.3** Header config para `semesterMemories` em `src/lib/headerConfig.ts`.
- [x] **F3.4** `openSemesterMemories` / `closeSemesterMemories` no `navigationEngine.ts` + `AppContextValue`.
- [x] **F3.5** `semesterMemories: true` em `BARRA_APARECE` (`contextBarConfig.ts`).
- [x] **F3.6** `src/components/terms/SemesterMemoriesScreen.tsx` — lista, criar via wizard, editar, excluir.
- [x] **F3.7** `TermHistoryScreen` — clicar no período encerrado abre `openSemesterMemories(termId)`.
- [x] **F3.8** `SharedScreenLayers.tsx` — lazy load + render da `SemesterMemoriesScreen`.
- [x] **F3.9** `npm run lint` + `npm run test` verdes (TermHistoryScreen + navigationRegression passam).

## F4 — UI: editar e excluir memória ✅

- [x] **F4.1** Edição inline no `MemoryItem` (dentro de `SemesterMemoriesScreen.tsx`).
- [x] **F4.2** Exclusão com confirmação (dialog + `CELEBRACAO.memoriaRemovida`).
- [x] **F4.3** Voz: `memoriaGuardada`, `memoriaRemovida` em `voice.ts` (já existentes, reutilizadas).
- [x] **F4.4** `npm run lint` + `npm run test` verdes.

## F5 — Wizard inicial: entrevista opcional do cecinho ✅

- [x] **F5.1** `src/components/terms/MemoryWizard.tsx` — 4 passos (feliz/engraçada/assustadora/memorável), cada um com pergunta do cecinho via `frase(DICA, ...)`.
- [x] **F5.2** Wizard aberto a partir do estado vazio do `SemesterMemoriesScreen`; pular fecha o convite sem bloquear.
- [x] **F5.3** Voz: `memoriaPrimeira`, `memoriaFelizPergunta`, `memoriaEngracadaPergunta`, `memoriaAssustadoraPergunta`, `memoriaMemoravelPergunta`, `memoriaPular` em `voice.ts`.
- [x] **F5.4** `npm run lint` + `npm run test` verdes.

## F6 — Correção do tema ao voltar (sem flash do "cantinho") ✅

- [x] **F6.1** `navigationEngine.ts` `goBack()` aplica `applyTheme(getThemeById(themePref))` **sincronicamente** antes de `setStack(next)` — todos os caminhos de pop (barra, gesto iOS, back Android, `handleSystemBack`).
- [x] **F6.2** `DataClientProvider.tsx` — `useEffect` de tema vira no-op quando `activeThemeRef.current === theme.id` (D11).
- [x] **F6.3** `npm run lint` + `npm run test` verdes + `check-boundaries.mjs` verde.

## F7 — Testes de UI, gate de voz, copy e verify final ✅

- [x] **F7.1** `node scripts/inventario-de-copy.mjs` — textos de camada 1 da nova tela usam chaves de `voice.ts`.
- [x] **F7.2** Gate de voz (`check-boundaries.mjs` regra 4) — passa.
- [x] **F7.3** Testes de UI comportamental para `SemesterMemoriesScreen` e `MemoryWizard` — criados e passando.
- [x] **F7.4** `npm run verify:fast` — typecheck, testes, boundaries, voz, contrato verdes.

---

Cada fase fecha com `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs` verdes. `SCHEMA_VERSION` não foi alterada em nenhuma fase (D8).