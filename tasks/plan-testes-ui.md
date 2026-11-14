# Plano de implementação — SPEC-038 (revisão e enxugamento dos testes de UI)

Objetivo: remover todos os testes RENDER_ONLY de `src/`, manter os COMPORTAMENTO sem duplicata, e deixar `test:ui` verde abaixo do tempo alvo `[A]`.

## T01 — Levantar lista final de RENDER_ONLY a remover
- Objetivo: confirmar exatamente quais arquivos de teste de `src/` são RENDER_ONLY (apresentação pura, sem interação).
- Descrição: usar a classificação já feita pelos subagents exploradores (4 grupos) como base, e confirmar arquivo por arquivo no disco. Fonte da verdade: o disco, não `tasks/audit-testes.md`.
- Arquivos envolvidos: `src/components/ui/__tests__/*`, `src/components/ui/ceci/__tests__/*`, `src/components/internship/__tests__/*`, `src/components/wizards/__tests__/*`, `src/components/terms/__tests__/*`, `src/components/motion/__tests__/*`, `src/shaders/__tests__/*`, `src/components/views/__tests__/*`, `src/components/views/home/__tests__/*`, `src/components/views/perfil/__tests__/*`, `src/components/__tests__/*`, `src/components/sync/__tests__/*`, `src/components/tcc/__tests__/*`, `src/components/capture/__tests__/*`, `src/components/quizzes/__tests__/*`, `src/components/library/temple/__tests__/*`.
- Dependências: nenhuma.
- Resultado esperado: lista confirmada de arquivos RENDER_ONLY.
- Critérios de conclusão: lista escrita e revisada; cada item tem justificativa de render-only.
- Testes/validações: nenhum (tarefa de levantamento).

## T02 — Remover cada teste RENDER_ONLY
- Objetivo: excluir os arquivos de teste de apresentação pura de `src/`.
- Descrição: excluir arquivo por arquivo (ferramenta `edit`/`write`, nunca shell). Após cada exclusão, rodar `npm run test:ui` para garantir que a suíte fica verde.
- Arquivos envolvidos: os arquivos confirmados em T01 (estimativa ~21 arquivos).
- Dependências: T01.
- Resultado esperado: nenhum arquivo RENDER_ONLY permanece em `src/`.
- Critérios de conclusão: `npm run test:ui` verde após todas as remoções.
- Testes/validações: `npm run test:ui` verde.

## T03 — Revisar duplicatas entre COMPORTAMENTO
- Objetivo: identificar testes COMPORTAMENTO que são duplicata de outro gate (ex.: `ToggleRow` ≡ `Toggle`, `CatalogMultiSelect` ≡ `PillGroupMulti` em modo busca).
- Descrição: comparar os testes COMPORTAMENTO mantidos entre si e com testes de `packages/*`; remover ou mesclar duplicatas.
- Arquivos envolvidos: testes COMPORTAMENTO de `src/` (~100 arquivos).
- Dependências: T02.
- Resultado esperado: não há duplicata de comportamento entre testes de `src/` e `packages/*`.
- Critérios de conclusão: duplicatas identificadas e removidas/mescladas.
- Testes/validações: `npm run test:ui` verde.

## T04 — Garantir variação de dado em `it.each`
- Objetivo: substituir N testes iguais com dados diferentes por um `it.each`.
- Descrição: varrer os testes COMPORTAMENTO mantidos em busca de repetição de mesma asserção com dados variados.
- Arquivos envolvidos: testes COMPORTAMENTO de `src/`.
- Dependências: T03.
- Resultado esperado: nenhuma variação de dado fora de `it.each`.
- Critérios de conclusão: nenhum teste duplicado por dados.
- Testes/validações: `npm run test:ui` verde.

## T05 — Confirmar DOMINIO_PURO permanece em `src/` (sem migração de código-fonte)
- Objetivo: registrar que os testes DOMINIO_PURO de `src/lib/__tests__/` continuam testando código em `src/` (decisão D3: não migrar código-fonte neste ciclo).
- Descrição: não move código; apenas confirma a decisão e deixa T3.10 (migração de `collections`, `dataClient`, `exportImport`) como pendente em `tasks/todo-test-reduction.md`.
- Arquivos envolvidos: `src/lib/__tests__/*`, `tasks/todo-test-reduction.md`.
- Dependências: T04.
- Resultado esperado: decisão D3 documentada; nenhuma migração de código-fonte executada.
- Critérios de conclusão: registro feito; `npm run test:ui` ainda roda os DOMINIO_PURO de `src/`.
- Testes/validações: `npm run test:ui` verde.

## T06 — Definir e validar tempo alvo `[A]` de `test:ui`
- Objetivo: escolher o tempo alvo de `test:ui` após a redução e validar que a suíte o cumpre.
- Descrição: rodar `npm run test:ui` com a suíte enxuta, medir duração, e definir `[A]` (ex.: < 60s, < 90s). Atualizar SPEC-038 com o valor.
- Arquivos envolvidos: `npm run test:ui`, `cecistudy/docs/specs/SPEC-038-revisao-enxugamento-testes-ui.md`.
- Dependências: T05.
- Resultado esperado: `[A]` definido e `test:ui` abaixo dele.
- Critérios de conclusão: `test:ui` verde e abaixo de `[A]`.
- Testes/validações: `npm run test:ui` com medição de tempo.

## T07 — Validar gate completo `verify:fast`
- Objetivo: garantir que o CI do mobile fecha no job `gate-testes`.
- Descrição: rodar `npm run verify:fast` (typecheck + test:ci + boundaries + voz + contrato) localmente.
- Arquivos envolvidos: `package.json` (script `verify:fast`), `.github/workflows/ci.yml`.
- Dependências: T06.
- Resultado esperado: `verify:fast` verde.
- Critérios de conclusão: `npm run verify:fast` sai com código 0.
- Testes/validações: `npm run verify:fast`.
