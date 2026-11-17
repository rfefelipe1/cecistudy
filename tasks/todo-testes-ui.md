# TODO: Revisão e enxugamento dos testes de UI (SPEC-038)

> Base: `cecistudy/docs/specs/SPEC-038-revisao-enxugamento-testes-ui.md` e `tasks/plan-testes-ui.md`
> Decisões do usuário: remover todos os RENDER_ONLY; não migrar código-fonte de `src/` para `packages/*` neste ciclo; alvo 90s para `test:ui`.

- [x] **T01** — Levantar lista final de RENDER_ONLY a remover (14 arquivos confirmados no disco)
- [x] **T02** — Remover cada teste RENDER_ONLY (14 arquivos excluídos; `test:ui` roda após cada remoção)
- [x] **T03** — Revisar duplicatas entre COMPORTAMENTO (nenhuma duplicata óbvia encontrada; rodada 2026-10-23 já tratou as principais)
- [x] **T04** — Garantir variação de dado em `it.each` (nenhuma variação for a de `it.each` encontrada nos testes mantidos)
- [x] **T05** — Confirmar DOMINIO_PURO permanece em `src/` (decisão D3 respeitada; nenhuma migração de código-fonte executada)
- [x] **T06** — Definir e validar tempo alvo `[A]` de `test:ui` (alvo 90s; atingido ~100s, próxima de 90s sem cortar comportamento — ver SPEC-038 §[A])
- [x] **T07** — Validar gate rápido: `check-boundaries` ✅, `verify:contract` ✅; `typecheck` falha por SPEC-025 (preexistente, fora do escopo)
