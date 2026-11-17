# Tarefas: Biblioteca — famílias e abordagens de psicoterapia (SPEC-033)

> Tracking do plano `tasks/plan-biblioteca-abordagens.md` (não sobrescreve o plano principal).
> Fonte da verdade: `docs/specs/SPEC-033-biblioteca-familias-abordagens-psicoterapia.md`.

## Fase 0 — Copy e voz (D5)

- [ ] **TASK-1** Adicionar chaves novas em `src/lib/voice.ts`
  - Acceptance: chaves VAZIO (`semFamiliasEncontradas`, `semAbordagensNestaFamilia`), ERRO (`familiaNaoEncontrada`, `abordagemNaoEncontrada` com duas frases), títulos de seção da `ApproachDetailView` (8 chaves)
  - Verify: `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`
  - Files: `src/lib/voice.ts`

## Fase 1 — HeroCard nas 3 subtelas (D3)

- [ ] **TASK-2** `FamiliesView` com `HeroCard` no topo
  - Acceptance: hero com eyebrow `biblioteca`, título `10 famílias, 97 abordagens`, summary da taxonomia, mascote `library-shelf`, teste I1 (`getAllByTestId('hero-card').length === 1`)
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/FamiliesView.tsx`

- [ ] **TASK-3** `FamilyDetailView` com `HeroCard` no topo
  - Acceptance: hero com eyebrow `família`, título = nome da família, summary = `descricao_curta`, mascote `reading-curious`, ação `voltar às famílias`
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/FamilyDetailView.tsx`

- [ ] **TASK-4** `ApproachDetailView` com `HeroCard` no topo
  - Acceptance: hero com eyebrow `abordagem`, título = nome da abordagem, summary = `descricao_curta`, mascote `reading-curious`, ação `voltar à família`
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/ApproachDetailView.tsx`

## Fase 2 — 22 campos e progressive disclosure (D1, D2)

- [ ] **TASK-5** `ApproachDetailView` renderiza `periodo_historico` (gap I2)
  - Acceptance: `detail.periodo_historico` aparece na seção "história e contexto"; teste I2 (`getByText` com conteúdo real)
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/ApproachDetailView.tsx`

- [ ] **TASK-6** Reorganizar `ApproachDetailView` em seções colapsáveis
  - Acceptance: nível 1 (`descricao_curta` + `ideia_central`) sempre visível; seções colapsáveis com `aria-expanded`/`aria-controls`; seção "o que é" aberta por padrão; teste I3 (≥ 8 `aria-expanded`)
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/ApproachDetailView.tsx`

## Fase 3 — Classificação cruzada (D4)

- [ ] **TASK-7** `FamilyDetailView` com chip `também em: <família>`
  - Acceptance: chip discreto quando a abordagem aparece em mais de uma família (conforme `taxonomia_normalizada.md`); teste I5 (≥ 1 ocorrência de `também em`)
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/FamilyDetailView.tsx`

## Fase 4 — Link direto da grade principal (D7)

- [ ] **TASK-8** `BibliotecaView` modo `library` expõe entrada para famílias
  - Acceptance: seção "explorar o acervo" tem entrada visível para `mode='families'` (`FamiliesView`); teste de navegação
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/BibliotecaView.tsx`

## Fase 5 — Empty states e loading (D6)

- [ ] **TASK-9** Empty states e loading diferenciados por situação
  - Acceptance: mascote `no-results` + copy de `voice.ts` para busca vazia / família sem abordagens / abordagem não encontrada; skeleton + `loading-patient` para carregamento; teste de render de cada estado
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/FamiliesView.tsx`, `src/components/views/FamilyDetailView.tsx`, `src/components/views/ApproachDetailView.tsx`

## Fase 6 — Limpeza e gate final (I4, I6)

- [ ] **TASK-10** Remover todo texto de camada 1 inline das 3 views
  - Acceptance: zero texto de camada 1 escrito diretamente nos componentes; todas as frases vêm de `voice.ts`; gate `check-boundaries.mjs` regra 4 passa
  - Verify: `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs`
  - Files: `src/components/views/FamiliesView.tsx`, `src/components/views/FamilyDetailView.tsx`, `src/components/views/ApproachDetailView.tsx`

- [ ] **TASK-11** Verificar zero hex raw em `className` nas 3 views
  - Acceptance: `rg -n "#[0-9A-Fa-f]{6}"` nas 3 views → 0 ocorrências (I6)
  - Verify: `npm run lint` + `npm run test` + `npm run build`
  - Files: `src/components/views/FamiliesView.tsx`, `src/components/views/FamilyDetailView.tsx`, `src/components/views/ApproachDetailView.tsx`

## Checkpoint final

- [ ] Gate full verde: `npm run lint` + `npm run test` + `npm run build` + `node .github/scripts/check-boundaries.mjs`
- [ ] `npm run verify:fast` verde (ciclo de edição)
- [ ] Spec SPEC-033 marcada como entregue com data
- [ ] To-do de acompanhamento atualizado (ver seção abaixo)

---

## To-do de acompanhamento (pós-implementação)

Estes itens são **decisão de produto / documentação** e não entram nas tasks acima:

- [ ] Resolver conflito `pendencias_por_familia.md` vs `auditoria_97_canonica.md` (famílias 6–10: pendentes ou 97/97?) — decisão da dona do produto, não do agente
- [ ] Avaliar se `leituras_fundamentais` vira tabela própria (`abordagem → abordagem_obra → obra`) — `modelo_campos.txt:183-198` antecipa, mas é fora de escopo desta spec
- [ ] Considerar migrar `home/HeroSection` e `faculdade/HeroSection` para `HeroCard` (SPEC-010 §4 fora de escopo; registrar como task separada)
- [ ] Atualizar `docs/specs/README.md` (índice de specs) com SPEC-033
- [ ] Verificar se o desktop (`cecistudy-desktop`) precisa espelhar essa decisão de UI — contrato de portabilidade: compartilha decisão, não código
