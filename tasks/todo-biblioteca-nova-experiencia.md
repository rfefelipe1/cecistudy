# Tarefas: Biblioteca — nova experiência (SPEC-034)

> Tracking do plano `tasks/todo-biblioteca-nova-experiencia.md` (não sobrescreve a spec principal).
> Fonte da verdade: `docs/specs/SPEC-034-biblioteca-tela-principal-componentes-animacoes.md`.
> App afetado: mobile (`cecistudy/`). O desktop não é tocado (`ADR-002`, `ADR-009`).

---

## Fase 0 — Fundação de dados (SCHEMA_VERSION 24 + novas coleções)

- [ ] **TASK-1** `SCHEMA_VERSION` 23 → 24 + `MIGRATIONS[24]` em `packages/data/src/schema.ts`
  - Acceptance: `MIGRATIONS[24]` pura, idempotente, sem `Date`; semeia novas coleções vazias (`bibliotecas`, `autoresBiblioteca`, `eixosTematicos`, `subtemas`, `colecoesEditoriais`, `prateleiras`, `recomendacoes`, `estadoPessoal`, `arquivos`); cadeia 1..24 contígua.
  - Verify: `npm run lint` + `npm run test` (teste de migração/round-trip)
  - Files: `packages/data/src/schema.ts`
- [ ] **TASK-2** Novos `CollectionSpec` de biblioteca em `packages/data/src/collections.ts`
  - Acceptance: 9 novas coleções no final da lista; `USER_COLLECTION_KEYS` / `SYNCABLE_COLLECTION_KEYS` derivam automaticamente; syncable: true.
  - Verify: `npm run lint` + `npm run test`
  - Files: `packages/data/src/collections.ts`
- [ ] **TASK-3** Interfaces de entidade em `src/types/entity.ts`
  - Acceptance: `Material`, `AutorBiblioteca`, `EixoTematico`, `Subtema`, `ColecaoEditorial`, `Prateleira`, `Recomendacao`, `EstadoPessoal`, `Arquivo` com campos da SPEC-034 §5.1; `Material.disponibilidade ∈ {disponivel, indisponivel}`.
  - Verify: `npm run lint`
  - Files: `src/types/entity.ts`
- [ ] **TASK-4** Contrato de dados: `contracts/schema.sql` + header + golden files
  - Acceptance: `CREATE TABLE IF NOT EXISTS` para cada nova tabela; header `SCHEMA_VERSION = 24`; `node contracts/verify-schema.mjs` passa; golden files regenerados (`full_backup.empty.json`, `full_backup.sample.json`, `collections/empty/*.json`).
  - Verify: `npm run verify:contract`
  - Files: `contracts/schema.sql`, `contracts/golden/*.json`, `contracts/golden/collections/empty/*.json`, `contracts/backup-v2-spec.md`
- [ ] **TASK-5** Persistência: `empty.ts`, `DataClientProvider.tsx`, `persistentData.ts`, `dataClient.ts`, `backupSchema.ts`
  - Acceptance: novas coleções em `EmptyDatabase` + `emptyDatabase()` como `[]`; `useStampedState`/`usePersistentState` para cada coleção (namespace `user`); slices, export/import/sync incluem as novas coleções; `readDatabaseFromState` mapeia campos; schemas Zod em `backupSchema.ts`.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/data/empty.ts`, `src/context/DataClientProvider.tsx`, `packages/data/src/persistentData.ts`, `packages/data/src/dataClient.ts`, `packages/data/src/backupSchema.ts`

## Fase 1 — Domain + use-cases de biblioteca (`packages/*`)

- [ ] **TASK-6** Módulo de domínio `packages/domain/src/core/domain/biblioteca.ts`
  - Acceptance: entidades + funções puras (factories, validadores, derivados: `disponibilidadeOffline`, `materialEstaConcluido`, estados independentes salvo/em_leitura/concluido/favorito); exportado do `domain/index.ts`; sem `react`/`@capacitor`/`__TAURI__`.
  - Verify: `npm run lint` + `npm run test:domain` + `check-boundaries`
  - Files: `packages/domain/src/core/domain/biblioteca.ts`, `packages/domain/src/core/domain/index.ts`
- [ ] **TASK-7** Use-cases `packages/application/src/biblioteca/`
  - Acceptance: `salvarMaterial`/`desalvarMaterial`, `favoritarMaterial`, `atualizarProgresso`, `concluirMaterial`, `listarPorEixo`, `listarPorColecaoEditorial`, `listarPrateleira`, `listarRecomendacoes`, `marcarDisponibilidade`; uma escrita por ação; testes com repositório fake.
  - Verify: `npm run lint` + `npm run test` (testes de caso de uso)
  - Files: `packages/application/src/biblioteca/index.ts`, `packages/application/src/biblioteca/__tests__/*.test.ts`, `packages/application/src/index.ts`

## Fase 2 — Telas de navegação (por pilha `NavScreen`, dentro da tab `biblioteca`)

- [ ] **TASK-8** Página de eixo temático `src/components/views/EixoView.tsx`
  - Acceptance: apresentação visual, título, descricao editorial, prateleiras de materiais, subtemas; dados vindos de `EixoTematico`/`Subtema`; estado vazio se eixo sem materiais; navega por `NavScreen` (`biblioteca → eixo:{id}`).
  - Verify: `npm run lint` + `npm run test` (teste de componente básico se houver)
  - Files: `src/components/views/EixoView.tsx`, `src/context/navigationEngine.ts` (registro de `NavScreen`)
- [ ] **TASK-9** Página "ver tudo" `src/components/views/VerTudoView.tsx`
  - Acceptance: recebe título + contexto da seção de origem; lista completa da seleção; até 15 itens inicialmente + ação "Ver tudo"; preserva título/descrição da seção; reutiliza `ExploreSection` existente.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/VerTudoView.tsx`, `src/context/navigationEngine.ts`
- [ ] **TASK-10** Busca global `src/components/views/BuscaView.tsx` + `src/components/ui/BuscaBiblioteca.tsx`
  - Acceptance: sugestões de descoberta antes de digitar; resultados atualizados durante a digitação (titulo, autor, assunto, palavras-chave, descricao, eixo, colecao editorial); filtros por tipo/autor/assunto/eixo/disponibilidade acima dos resultados; estado sem resultados (`VAZIO` de `voice.ts`); navega por `NavScreen` (`biblioteca → busca`).
  - Verify: `npm run lint` + `npm run test` + inventário de copy
  - Files: `src/components/views/BuscaView.tsx`, `src/components/ui/BuscaBiblioteca.tsx`, `src/lib/voice.ts` (novas chaves)
- [ ] **TASK-11** Biblioteca pessoal com 4 estados (expandir `MyMaterialsSection.tsx` ou nova seção)
  - Acceptance: abas Salvos / Em leitura / Concluídos / Favoritos; estados independentes (`EstadoPessoal`); concluído sai de em leitura e entra em concluídos; favorito independente do estado de leitura; estado vazio para cada aba.
  - Verify: `npm run lint` + `npm run test`
  - Files: `src/components/views/biblioteca/MyMaterialsSection.tsx` (ou nova `BibliotecaPessoalSection.tsx`)
- [ ] **TASK-12** Página de detalhes do material `src/components/views/DetalheMaterialView.tsx`
  - Acceptance: 3 abas (Resumo/Informacoes/Conteudo) com toque e deslize horizontal; ações (ler/continuar, salvar, favoritar, lista de leitura, baixar offline, compartilhar) refletindo estado atual; botão desativado cinza se `disponibilidade === indisponivel`; metadados bibliográficos variam por tipo de material; navega por `NavScreen` (`biblioteca → detalheMaterial:{id}`).
  - Verify: `npm run lint` + `npm run test` + inventário de copy
  - Files: `src/components/views/DetalheMaterialView.tsx`, `src/context/navigationEngine.ts`

## Fase 3 — Integração na BibliotecaView + copy + gate

- [ ] **TASK-13** Cabeçalho da biblioteca (`BibliotecaView.tsx` ou `src/components/ui/BibliotecaHeader.tsx`)
  - Acceptance: identificação da Biblioteca; acesso à busca global; acesso à biblioteca pessoal; discreto, não compete com conteúdo editorial; ícones de busca e biblioteca pessoal.
  - Verify: `npm run lint` + `npm run test` + inventário de copy
  - Files: `src/components/views/BibliotecaView.tsx`, `src/components/ui/BibliotecaHeader.tsx`, `src/lib/voice.ts`
- [ ] **TASK-14** Estados vazios em todas as áreas da biblioteca
  - Acceptance: sem salvos, sem em leitura, sem concluídos, sem favoritos, busca sem resultados, eixo sem materiais, coleção sem conteúdo, material sem arquivo — todos com `EmptyState` + `Mascote` + copy de `voice.ts`.
  - Verify: `npm run lint` + `npm run test` + inventário de copy
  - Files: telas da Fase 2 + `src/lib/voice.ts`
- [ ] **TASK-15** Preservação de scroll ao voltar (pilha `NavScreen`)
  - Acceptance: retorno à biblioteca restaura scroll vertical da página e scroll horizontal da prateleira de origem; sem salto ao topo; seção anteriormente visível mantida.
  - Verify: `npm run lint` + `npm run test` (teste de comportamento de scroll)
  - Files: `src/context/navigationEngine.ts`, telas da Fase 2

## Fase 4 — Gate final e verificação

- [ ] **TASK-16** Gate completo da especificação
  - Acceptance: `npm run lint` verde; `npm run test` verde; `node .github/scripts/check-boundaries.mjs` verde; `npm run verify:contract` verde; inventário de copy sem `precisaRevisao` novo; cópias de camada 1 todas em `voice.ts`; `SCHEMA_VERSION = 24`.
  - Verify: `npm run verify:fast` (tipocheck + testes + boundary + voz + contract)
  - Files: todos alterados nas tasks anteriores

## Checkpoint final

- [ ] Gate full verde; fluxo biblioteca → eixo / ver tudo / busca / detalhe material → voltar com scroll preservado OK; 4 estados da biblioteca pessoal independentes; material indisponível com botão cinza; estados vazios cobertos; spec marcada como implementada.

---

**Não incluído neste plano (Fase 2 — especiacao do livro):** componente `Livro3D` (capa/lombada/contracapa, 3 tamanhos, 49:60), animacao de abertura/fechamento por elemento compartilhado, gesto de arrastar para fechar, leitura offline/download, pagina de autor. Ficam para `SPEC` separada da especiacao do livro.
