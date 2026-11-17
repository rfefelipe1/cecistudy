# Plano — Redesign visual de semestres passados e memórias (primeiro slice)

> Fonte: JSON `SPEC-SEMESTRES-PASSADOS-MEMORIAS-REDESIGN` (recommended_first_slice) + código existente em `src/components/terms/`.
> Objeto: deixar o histórico de semestres passados conforme o JSON (timeline acadêmica, diário de bordo, caixa de memórias, superfícies suaves, cards arredondados, paleta Ceci, ícones delicados, textos curtos), sem alterar o domínio `SemesterMemory` nem o schema.

## Arquitetura / decisões

- Não criar novo schema nem `SCHEMA_VERSION` (D8 da SPEC-028): `SemesterMemory`, `addSemesterMemory`, `updateSemesterMemory`, `deleteSemesterMemory`, `reopenTermById` permanecem inalterados.
- O filtro `ordinal < activeTerm.ordinal` já mostra todos os semestres encerrados anteriores ao ativo (vida real). Não tocar nesse recorte.
- Refinar só o visual/estrutura dos componentes `Ceci*` do primeiro slice; manter props e contratos.

## Tarefas

### Fase A — Revisão visual vs JSON (leitura, sem código)
- [ ] Task 1: Comparar `CeciTermHistoryHeader`, `CeciTermTimeline`, `CeciTermCard`, `TermHistoryScreen` contra o JSON primeiro slice; listar ajustes de design (tokens, shapes, cores por categoria, acessibilidade, copy).
  - Acceptance: lista de ajustes documentada neste plano.
  - Verify: leitura dos 4 arquivos + JSON. Nenhum teste novo.
  - Files: `src/components/terms/CeciTermHistoryHeader.tsx`, `CeciTermTimeline.tsx`, `CeciTermCard.tsx`, `TermHistoryScreen.tsx`, `src/lib/semesterMemory.ts` (cores), JSON (referência).
  - Scope: S.

### Fase B — Refinamento visual do header de jornada
- [ ] Task 2: Ajustar `CeciTermHistoryHeader` para casar com o JSON (eyebrow "sua jornada", título "semestres passados", descrição, barra de progresso {completedTerms} de {totalSemesters}, fonte ativa = activeTerm.ordinal, fallback profile.semester).
  - Acceptance: header usa tokens Ceci; progresso lê `activeOrdinal` primeiro; sem hex raw.
  - Verify: `npm run lint` + `npm run test -- src/components/terms/__tests__/TermHistoryScreen.test.tsx`.
  - Files: `src/components/terms/CeciTermHistoryHeader.tsx`.
  - Scope: S.

### Fase C — Refinamento visual da timeline + card
- [ ] Task 3: Ajustar `CeciTermTimeline` (linha fina `ceci-border-subtle`, nó por semestre, destaque no mais recente, coluna única).
  - Acceptance: timeline usa `ceci-border-subtle`; nó destaca o semestre mais recente; coluna única.
  - Verify: `npm run lint` + testes do TermHistoryScreen.
  - Files: `src/components/terms/CeciTermTimeline.tsx`.
  - Scope: S.
- [ ] Task 4: Ajustar `CeciTermCard` (nó/selo ordinal, label, período com helper de data civil, progresso, 3 métricas, chip contagem memórias com Sparkles, CTA abrir arquivo no card inteiro, "ver resumo inteiro" expande local, "abrir memórias" CTA explícito separado, "reabrir como atual" em área separada de maior impacto com confirmação).
  - Acceptance: card inteiro não abre memórias; expansão local (sem navegação); chip "X memórias" com ícone; reabrir separado com confirmação contextual.
  - Verify: `npm run lint` + testes do TermHistoryScreen.
  - Files: `src/components/terms/CeciTermCard.tsx`.
  - Scope: M.

### Fase D — Gate e verificação
- [ ] Task 5: Rodar gate do mobile (`npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs` + inventário de copy) e validar UTF-8 (sem U+FFFD, sem BOM).
  - Acceptance: gate verde; nenhum texto de camada 1 sem chave em `voice.ts`; sem U+FFFD.
  - Verify: `npm run verify:fast` (ou partes: lint + test + check:boundaries + test:voz + inventario:copy).
  - Files: nenhum (validação).
  - Scope: S.

## Checkpoints
- Depois da Task 4: TermHistoryScreen + Ceci* do primeiro slice conforme o JSON e testes verdes.
- Depois da Task 5: gate `verify:fast` verde.

## Riscos e mitigações
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Reescrever o que já está verde (desperdício) | média | Apenas ajustes finos; não reescrever componente que já atende o JSON. |
| Quebrar contratos de props dos Ceci* | média | Manter interfaces inalteradas; só ajustar classes/estrutura interna. |
| U+FFFD por edição via shell | alta | Usar apenas `write`/`edit`; validar UTF-8 depois. |

## Questões em aberto (não bloqueiam)
- Usuário quer "todas as telas como um todo" (memórias, captura, wizard, edição/exclusão/reabertura). Este plano cobre o primeiro slice (histórico + card). As demais telas ficam para próxima iteração, a pedido.
