# Plano: tela de escolha de módulo após o boot (SPEC-M-033)

Objetivo: após o `BootSplash` sumir, mostrar uma tela que peça à usuária escolher entre "Acadêmico" (esquerda) e "Profissional" (direita) antes de entrar no app. Profissional abre, por enquanto, uma tela de "em construção". A escolha é persistida para não perguntar a cada boot.

Não entra em regras de negócio dos módulos (fora de escopo da SPEC-M-033, D6).

## Tarefas

- [ ] Task 1: persistir `moduloSelecionado` ('academico' | 'profissional' | null)
  - Acceptance: `DataClientProvider` expõe `moduloSelecionado` e `setModuloSelecionado(module)`; `AppContext.tsx` declara os tipos no `AppContextValue`.
  - Verify: `npm run lint` passa.
  - Files: `src/context/DataClientProvider.tsx`, `src/context/AppContext.tsx`.

- [ ] Task 2: copy da tela em `src/lib/voice.ts` (catálogo `MODULO`)
  - Acceptance: `MODULO.escolhaTitulo`, `MODULO.escolhaSubtitulo`, `MODULO.cardAcademico`, `MODULO.cardProfissional`, `MODULO.emConstrucao.*` existem; nenhum texto inline nas telas novas.
  - Verify: `npm run lint` passa; `grep` confirma zero copy hardcoded nas telas novas.
  - Files: `src/lib/voice.ts`.

- [ ] Task 3: criar `ModuleSelectionScreen.tsx` (bottom sheet do wireframe)
  - Acceptance: herói topo (68%) com livro aberto; bottom sheet (35%) com arrastador, título, subtítulo, dois cards lado a lado (Acadêmico esquerda / Profissional direita) com ícone + rótulo + chevron; clique em cada card chama `setModuloSelecionado`.
  - Verify: `npm run lint` passa.
  - Files: `src/components/views/ModuleSelectionScreen.tsx` (novo).

- [ ] Task 4: criar `ModuleUnderConstructionScreen.tsx` (Profissional)
  - Acceptance: tela cheia com aviso de construção + ação "escolher outro módulo" que volta à seleção.
  - Verify: `npm run lint` passa.
  - Files: `src/components/views/ModuleUnderConstructionScreen.tsx` (novo).

- [ ] Task 5: wire o gate em `MobileAppShell.tsx`
  - Acceptance: quando `!moduloSelecionado`, renderiza `ModuleSelectionScreen` antes do cheque de `onboarding.completed`; quando definido, segue o fluxo atual (onboarding ou shell).
  - Verify: `npm run lint` passa; `check-boundaries.mjs` passa.
  - Files: `src/shells/MobileAppShell.tsx`.

- [ ] Task 6: teste de comportamento da seleção
  - Acceptance: teste renderiza `ModuleSelectionScreen`, confirma ordem Acadêmico/Profissional e rótulos de `voice.ts`; escolher Profissional renderiza `ModuleUnderConstructionScreen`.
  - Verify: `npm run test -- src/components/views/__tests__/module-selection.test.tsx` passa.
  - Files: `src/components/views/__tests__/module-selection.test.tsx` (novo).

- [ ] Task 7: gate do ciclo de edição
  - Acceptance: `npm run lint` + `npm run test:domain` + `node .github/scripts/check-boundaries.mjs` todos verdes.
  - Verify: rodar os três comandos localmente.
  - Files: —.

## Ordem de execução

1 → 2 → 3 → 4 → 5 → 6 → 7. A Task 5 depende de 1 e 4; a Task 6 depende de 3, 4 e 5. Nada pode ser paralelizado com segurança além de leituras.

## Risco conhecido

- `moduloSelecionado` persistido com valor inválido trata-se como `null` e reapresenta a escolha (defensivo, não quebra o app).
