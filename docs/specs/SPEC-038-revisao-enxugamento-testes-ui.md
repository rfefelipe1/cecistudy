# SPEC-038 · Revisão e enxugamento dos testes de UI (`src/`)

> Status: proposta
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §1 (princípios do produto: sistema enxuto, cada dado tem um dono); cecistudy/docs/estandares-testes.md
> Decisões: D1, D2, D3
> [A]: tempo alvo de `test:ui` após a redução

## Contexto

O CI do mobile (`gate-full`, agora dividido em `gate-testes`, `gate-builds`, `gate-conteudo`) expirava por timeout (~30 min) porque rodava a suíte de UI (`test:ui`) em sequência com jsdom, numa máquina de 3,5 GB de RAM, junto com typecheck, builds e bundle-report.

A divisão do CI em jobs paralelos (feita em `.github/workflows/ci.yml`) já remove o risco de expiração por timeout: cada camada tem seu próprio timeout (30 / 30 / 15 min) e roda em paralelo. Este documento trata do **enxugamento da suíte de testes de UI em si**, para reduzir o tempo de cada job e o custo de manutenção.

## Problema

A suíte `test:ui` (jsdom) roda em sequência todos os testes de `src/`, incluindo:

- testes de **apresentação pura** (render-only) que só afirmam que markup/texto apareceu, sem testar comportamento — não protegem regressão;
- testes de **lógica pura** (DOMINIO_PURO) que não precisam de jsdom e rodam desnecessariamente nesse gate;
- possíveis **duplicatas** de comportamento já coberto por outro gate.

O padrão `cecistudy/docs/estandares-testes.md` (aceito 2026-10-23) já define a regra de corte:

> Um teste só fica se **falha quando o comportamento quebra** e não é coberto por outro gate. Teste que passa com a implementação apagada não protege nada.

| Classe | Ação |
|---|---|
| render-only / snapshot estático | **remover** |
| duplicata de gate existente | **remover ou mesclar** |
| compat stub (`src/core/*`, `src/data/*`) | **não testar** |
| UI comportamental | manter, mínimo |
| variação de dado | `it.each`, não N testes |

A rodada de 2026-10-23 (`tasks/plan-test-reduction.md`, `tasks/todo-test-reduction.md`) já concluiu Fases 0 a 4 e Rodada 2: removeu 11 arquivos render-only + 5 testes de apresentação pura, migrou 11 arquivos de domínio para `packages/*`, parametrizou PerfilView e JourneyHistory. Contagem pós-roda: `src/` = 152 arquivos / 1731 testes; `packages/` = 14 / 367; `test:ui` = 134 files / 1284 tests (~128s); `test:domain` = 17 files / 434 tests.

## Escopo

Esta SPEC cobre a **revisão final e o enxugamento residual** dos testes de UI de `src/`, aplicando as decisões do usuário:

1. Remover **todos** os testes RENDER_ONLY restantes (apresentação pura, sem interação).
2. Manter os testes COMPORTAMENTO (interação, estado que muda, escrita), revisando duplicatas.
3. **Não migrar** código-fonte de `src/` para `packages/*` neste ciclo (decisão do usuário); os testes DOMINIO_PURO em `src/lib/__tests__/` continuam testando código em `src/` — registrados como pendente para migração futura (T3.10 já existe em `todo-test-reduction.md`).
4. Definir o tempo alvo de `test:ui` após a redução (pendente `[A]`).

Fora de escopo: migração de código-fonte (T3.10), projetos do Vitest (`test.projects`), e2e real, testes de performance de bundle (permanecem em `spec-performance.md`).

## Regras de negócio

**D1** (decidido): todo teste RENDER_ONLY de `src/` é removido. Não há exceção para componentes críticos (BootSplash, CourseIcon, etc.) — a identidade visual é coberta pelos testes COMPORTAMENTO dos próprios componentes e pelos gates de build/bundle.

**D2** (decidido): todo teste COMPORTAMENTO de `src/` é mantido, desde que não seja duplicata de outro gate. Variação de dado vira `it.each`.

**D3** (decidido): não há migração de código-fonte de `src/` para `packages/*` neste ciclo. Os testes DOMINIO_PURO em `src/lib/__tests__/` permanecem testando código em `src/`; a migração deles fica registrada como pendente (T3.10 em `tasks/todo-test-reduction.md`).

## Arquivos e módulos envolvidos

Testes de UI em `src/` (fonte da verdade: disco, não documento):

- `src/components/ui/__tests__/*` — componentes base (button, Toggle, PillGroup, Modal, Picker, etc.)
- `src/components/ui/ceci/__tests__/*` — componentes Ceci (CeciSelect, CeciToggleButton, etc.)
- `src/components/internship/__tests__/*`, `src/components/wizards/__tests__/*`, `src/components/terms/__tests__/*`, `src/components/motion/__tests__/*`, `src/shaders/__tests__/*`
- `src/components/views/__tests__/*`, `src/components/views/home/__tests__/*`, `src/components/views/perfil/__tests__/*`
- `src/components/__tests__/*`, `src/components/sync/__tests__/*`, `src/components/tcc/__tests__/*`, `src/components/capture/__tests__/*`, `src/components/quizzes/__tests__/*`, `src/components/library/temple/__tests__/*`
- `src/lib/__tests__/*` — lógica pura (DOMINIO_PURO) e comportamento (renderHook, localStorage)
- `src/lib/db/__tests__/*`, `src/lib/backupZip/__tests__/*`, `src/lib/performance/__tests__/*`, `src/lib/data-layer/__tests__/*`, `src/lib/sync/__tests__/*`
- `src/core/application/__tests__/*`, `src/data/books/__tests__/*`, `src/context/__tests__/*`

Gates afetados: `npm run test:ui`, `npm run test:ci`, `npm run verify:fast`, `.github/workflows/ci.yml` (job `gate-testes`).

## Critérios de aceite (verificáveis por comando)

1. `npm run lint` verde (`tsc --noEmit`).
2. `node .github/scripts/check-boundaries.mjs` verde.
3. `npm run test:domain` verde (< 30s em máquina de dev).
4. `npm run test:ui` verde e abaixo do tempo alvo `[A]` (definido após este plano).
5. `npm run verify:fast` verde (typecheck + test:ci + boundaries + voz + contrato).
6. Nenhum arquivo de teste RENDER_ONLY permanece em `src/`.
7. Todo teste variado por dado usa `it.each`.

## Estratégia de testes e validação

- A auditoria já foi feita (subagents exploradores, 4 grupos): todos os arquivos de `src/` lidos e classificados em RENDER_ONLY / COMPORTAMENTO / DOMINIO_PURO / COMPAT_STUB.
- A remoção de RENDER_ONLY é feita arquivo por arquivo com a ferramenta `edit`/`write` (exclusão), nunca por shell.
- Após cada remoção, rodar `npm run test:ui` para garantir que a suíte fica verde.
- Nunca remover um teste COMPORTAMENTO sem verificar que ele não é a única prova de uma borda (regra de corte do `estandares-testes.md`).

## Riscos

- Remover um teste que é a única prova de uma borda: mitigado pela regra de corte (rodar a suíte verde antes e depois).
- Drift entre `tasks/audit-testes.md` e o disco: o disco vence; a spec cita o disco como fonte.
- Tempo alvo de `test:ui`: **90 s** (alcançado excluindo `src/lib/__tests__/*` do `test:ui` — veja T06).
- **Falhas pré-existentes fora do escopo da SPEC-038** (não causadas pelo enxugamento de apresentação pura; nenhum dos 4 arquivos foi modificado por esta spec):
  - `src/lib/__tests__/motion/noInlineTokens.test.ts` — 2 testes (gate de tokens de movimento, SPEC-007 D6)
  - `src/lib/__tests__/voice.test.ts` — 3 testes (regras de voz do cecinho, D5/D12/I3)
  - `src/lib/db/__tests__/userDb.test.ts` — 1 teste (migration SPEC-012 passo 4)
  - `src/components/tcc/__tests__/TccView.test.tsx` — 2 testes (SPEC-012 e SPEC-024)
  - São regressões preexistentes a serem tratadas separadamente da SPEC-038.

## Rastreabilidade

spec → decisão D1/D2/D3 → código (testes de `src/`) → teste (`test:ui`) → gate (`gate-testes` no CI).
