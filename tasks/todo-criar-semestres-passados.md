# Plano — Criar semestres passados retroativamente (mobile)

> Fonte: pedido do usuário + JSON `SPEC-SEMESTRES-PASSADOS-MEMORIAS-REDESIGN`.
> Objeto: permitir criar um `AcademicTerm` encerrado com datas passadas, para que apareça no histórico de semestres passados (`ordinal < activeTerm.ordinal`) e o usuário registre memórias dele (vida real).
> Regras: não alterar `SemesterMemory` nem `SCHEMA_VERSION`; não criar regra no desktop; cópia de voz sempre em `voice.ts`; UTF-8 via `write`/`edit`.

## Decisões de domínio

- **Nova função pura** em `packages/domain/src/core/domain/term.ts`: `createClosedAcademicTerm({ ordinal, startedAt, endedAt, label?, now?, id?, workspaceId? })` cria um termo diretamente como `encerrado`, com `endedAt` informado. Puro, sem `Date.now()`, `now` por argumento. Não quebra `createAcademicTerm` existente.
- **Invariante de ordinal único**: ao criar, rejeitar se já existir um `encerrado` com mesmo `ordinal` (evita colisão na timeline, SPEC-008 N7).
- **Não há `summary` congelado** (o usuário cria retroativamente, sem dados de aula/foco/leitura) — o termo aparece no histórico sem métricas, mas aceita memórias. Isso é intencional (não é transcript oficial; non-goal do JSON).
- Action mobile `createPastTerm(ordinal, label, startedAt, endedAt)` no `dataActions.ts`, exposta via `AppContext` e `useMobileApp`.
- UI: botão "+ criar semestre passado" no `TermHistoryScreen` → modal `CeciCreatePastTerm` com campos ordinal (1..12), label, startedAt, endedAt; validação startedAt <= endedAt; chaves de voz em `voice.ts`.

## Tarefas

### Fase 0 — Domínio (função pura + teste de domain)
- [ ] Task 1: Adicionar `createClosedAcademicTerm` a `packages/domain/src/core/domain/term.ts` (após `createAcademicTerm`).
  - Acceptance: função pura, cria `encerrado` com `endedAt`, `statusTransitionAt = endedAt`, `now` por argumento, label derivado do ordinal, clamp 1..12.
  - Verify: `npm run test:domain` (ou teste focado de term).
  - Files: `packages/domain/src/core/domain/term.ts`.
  - Scope: S.
- [ ] Task 2: Testes de domain para `createClosedAcademicTerm` em `packages/domain/src/core/domain/__tests__/term.test.ts`.
  - Acceptance: cria encerrado com endedAt informado; clampa ordinal; label deriva do ordinal; não aceita `Date.now()` (now por argumento).
  - Verify: `npm run test -- packages/domain/src/core/domain/__tests__/term.test.ts`.
  - Files: `packages/domain/src/core/domain/__tests__/term.test.ts`.
  - Scope: S.

### Fase 1 — Action mobile + exposição
- [ ] Task 3: Adicionar `createPastTerm(ordinal, label, startedAt, endedAt)` a `src/context/dataActions.ts`, chamando `createClosedAcademicTerm` + `setAcademicTerms`, com validação de ordinal não duplicado entre encerrados.
  - Acceptance: cria termo encerrado; rejeita ordinal duplicado entre encerrados (no-op ou aviso); não cria segundo ativo.
  - Verify: `npm run lint` (tsc).
  - Files: `src/context/dataActions.ts`.
  - Scope: M.
- [ ] Task 4: Expor `createPastTerm` em `src/context/AppContext.tsx` (tipo) e garantir que `DataClientProvider` a monta (já monta groupTerm; adicionar ao grupo).
  - Acceptance: tipo em `AppContextValue`; action disponível via `useMobileApp()`.
  - Verify: `npm run lint`.
  - Files: `src/context/AppContext.tsx`, `src/context/dataActions.ts`.
  - Scope: S.

### Fase 2 — UI (modal + entrada no histórico)
- [ ] Task 5: Criar `src/components/terms/CeciCreatePastTerm.tsx` (modal: ordinal, label, startedAt, endedAt; validação startedAt <= endedAt; botão salvar chama `createPastTerm`; chaves de voz em `voice.ts`).
  - Acceptance: modal com 4 campos; botão salvar; erro inline se startedAt > endedAt; copy de voz.
  - Verify: `npm run lint` + `npm run test -- src/components/terms`.
  - Files: `src/components/terms/CeciCreatePastTerm.tsx`, `src/lib/voice.ts` (chaves novas).
  - Scope: M.
- [ ] Task 6: Adicionar botão "+ criar semestre passado" no `TermHistoryScreen` que abre o modal; após salvar, o termo aparece na lista (filtro existente já o inclui).
  - Acceptance: botão visível; clicar abre modal; salvar adiciona termo encerrado à lista de semestres passados.
  - Verify: `npm run lint` + `npm run test -- src/components/terms/__tests__/TermHistoryScreen.test.tsx` (atualizar/adicionar teste se necessário).
  - Files: `src/components/terms/TermHistoryScreen.tsx`.
  - Scope: S.

### Fase 3 — Gate
- [ ] Task 7: Rodar `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs` + `npm run test:voz` + `npm run verify:contract` + `npm run inventario:copy`.
  - Acceptance: gate verde; nenhum texto de camada 1 sem chave em `voice.ts`; sem U+FFFD; `packages/*` não importa react/capacitor.
  - Verify: `npm run verify:fast` (ou partes).
  - Files: nenhum (validação).
  - Scope: S.

## Checkpoints
- Depois da Task 2: domain puro verde.
- Depois da Task 4: action exposta e tipada.
- Depois da Task 6: UI funciona (termo passado aparece no histórico).
- Depois da Task 7: gate verde.

## Riscos e mitigações
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Dois termos encerrados com mesmo ordinal → colisão na timeline | média | Validar duplicidade na action antes de criar. |
| Quebrar `createAcademicTerm` existente | baixa | Função nova, não modificar a existente. |
| U+FFFD por edição via shell | alta | Usar apenas `write`/`edit`; validar UTF-8 depois. |
| Texto de camada 1 sem chave em voice.ts | média | Todas as strings novas do modal vão em `voice.ts`; rodar inventário de copy. |

## Questões em aberto (não bloqueiam)
- O usuário quer também editar o label/ordinal de um semestre passado já criado? (Fora do escopo inicial — ficaria para próxima iteração.)
- Deveria permitir criar múltiplos semestres passados de uma vez? (Não, um por vez, mais simples.)
