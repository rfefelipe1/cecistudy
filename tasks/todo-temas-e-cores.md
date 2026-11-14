# Todo: temas e cores — consistência entre telas + seletor visual (SPEC-M-029)

> Plano: [`./plan-temas-e-cores.md`](./plan-temas-e-cores.md) (não existirá; a spec é o plano)
> Spec: [`../docs/specs/mobile/SPEC-M-029-temas-e-cores-consistencia-e-seletor-visual.md`](../docs/specs/mobile/SPEC-M-029-temas-e-cores-consistencia-e-seletor-visual.md)

## F0 — Governança e blindagem

- [x] Criar `SPEC-M-029` em `docs/specs/mobile/`
- [x] Congelar baseline: `npm run lint` + `npm run test:ci` verde (2 falhas pré-existentes de `framer-motion` em `HeroSection.tsx`, não relacionadas)
- [x] Registro de decisão: D1..D8 na spec (todas com alternativa rejeitada e consequência)

## F1 — Hook `useTheme()` centralizado

- [x] **1.1** Adicionar `useTheme()` em `src/lib/themes.ts`
  - Retorna `{ currentTheme, isDark, selectTheme, themes }`
  - Lê `themePref` do `useMobileApp()` (DataClientProvider)
  - Files: `src/lib/themes.ts`
- [x] **1.2** Verificar que `useTheme()` é exportado e type-safe
  - Verify: `npm run lint` → 0

## F2 — Tokenização de `bg-white`/`text-white`/`border-white`/`hover:bg-white`

Arquivos corrigidos (caminho:linha da varredura):

- [x] **2.1** `src/components/terms/CeciCreatePastTerm.tsx` — 6 ocorrências
- [x] **2.2** `src/components/terms/CeciMemoryCard.tsx` — 2 ocorrências
- [x] **2.3** `src/components/terms/CeciMemoryCategorySummary.tsx` — 2 ocorrências
- [x] **2.4** `src/components/terms/CeciMemoryCapture.tsx` — 6 ocorrências
- [x] **2.5** `src/components/terms/CeciMemoryEditSheet.tsx` — 10 ocorrências
- [x] **2.6** `src/components/terms/CeciTermHistoryHeader.tsx` — 1 ocorrência
- [x] **2.7** `src/components/terms/SemesterMemoriesScreen.tsx` — 8 ocorrências
- [x] **2.8** `src/components/wizards/SemesterWizard.tsx` — 5 ocorrências
- [x] **2.9** `src/components/views/faculdade/DisciplinasGrid.tsx` — 1 ocorrência
- [x] **2.10** `src/components/views/faculdade/TermRolloverCta.tsx` — 1 ocorrência
- [x] **2.11** `src/components/flashcards/Paper3DCard.tsx` — 2 ocorrências

Arquivos adicionais encontrados na varredura pós-edição:

- [x] **2.12** `src/components/terms/TermHistoryScreen.tsx` — 1 ocorrência
- [x] **2.13** `src/components/terms/CeciTermCard.tsx` — 5 ocorrências
- [x] **2.14** `src/components/terms/CeciTermTimeline.tsx` — 2 ocorrências
- [x] **2.15** `src/components/terms/MemoryWizard.tsx` — 1 ocorrência

Substituições padrão (D1 da spec):
- `bg-white` → `bg-surface-default` (ou `bg-surface-input` para campos)
- `text-white` sobre marca/preenchimento → `text-ceci-on-primary` / `text-ceci-on-brand` / `text-ceci-on-academic`
- `border-white/40` → `border-ceci-border-default`
- `hover:bg-white` → `hover:bg-surface-default`

Verify após cada arquivo: `npm run lint` → 0

- [x] **2.16** Varredura final: `rg "bg-white|text-white|border-white|hover:bg-white" src --glob '!*.test.*'` → vazio

## F3 — Reescrita do `ThemePickerCard` como grid visual

- [x] **3.1** Reescrever `src/components/views/perfil/ThemePickerCard.tsx`
  - Grid 2×3 (mobile estreito: 1 coluna; `sm:` 2 colunas; `lg:` 3 colunas)
  - Cada card: faixa `canvas`, superfície `surface-default`, círculos `ceci-brand`/`ceci-academic`/`ceci-primary`
  - Label com emoji + nome do tema + descrição
  - Tema ativo: borda `border-ceci-border-brand-strong` + ícone `Check`
  - Ao tocar: `hapticSuccess()` + `onSelect(id)` + persistência via `setThemePref` (no pai)
  - Não importar `CeciSelect`
  - Files: `src/components/views/perfil/ThemePickerCard.tsx`
- [x] **3.2** `ProfilePreferences.tsx` continua abrindo o sheet com o novo componente (inalterado)

## F4 — Teste de contraste WCAG AA para todos os 7 temas

- [x] **4.1** Estender `src/lib/__tests__/themes.test.ts`
  - Novo teste: pares on-fill de marca e acadêmico ≥ 4.5:1 em todos os 7 temas
  - Teste existente `firstWcagFail` já cobre pares principais
  - Files: `src/lib/__tests__/themes.test.ts`
- [x] **4.2** Verify: `npx vitest run src/lib/__tests__/themes.test.ts` → 19/19

## F5 — QA e gate final

- [x] **5.1** `npm run lint` → 0
- [x] **5.2** `npm run test:ci` → 201 arquivos, 1935 testes, 0 falhas
- [x] **5.3** `node .github/scripts/check-boundaries.mjs` → OK: fronteiras respeitadas
- [x] **5.4** Build web não rodado (CI bloqueado por TLS nesta máquina)
- [x] **5.5** Zero U+FFFD (editado com ferramenta `edit` que preserva UTF-8)

## Ordem de execução

F0 → F1 → F2 → F3 → F4 → F5. Todas concluídas.
