# To-do — Biblioteca: nova experiência (SPEC-034)

Checklist de alto nível para execução posterior. O detalhamento por tarefa está em
`tasks/todo-biblioteca-nova-experiencia.md` e a spec completa em
`docs/specs/SPEC-034-biblioteca-tela-principal-componentes-animacoes.md`.

App: `cecistudy/` (mobile). O desktop (`cecistudy-desktop/`) não é tocado.

## Fase 0 — Dados e contrato

- [ ] `SCHEMA_VERSION` 23 → 24 + `MIGRATIONS[24]` (`packages/data/src/schema.ts`)
- [ ] 9 novas `CollectionSpec` de biblioteca (`packages/data/src/collections.ts`)
- [ ] Interfaces `Material`, `AutorBiblioteca`, `EixoTematico`, `Subtema`,
  `ColecaoEditorial`, `Prateleira`, `Recomendacao`, `EstadoPessoal`, `Arquivo`
  (`src/types/entity.ts`)
- [ ] `contracts/schema.sql` (novas tabelas, header `SCHEMA_VERSION = 24`) +
  golden files regenerados
- [ ] Persistência: `empty.ts`, `DataClientProvider.tsx`, `persistentData.ts`,
  `dataClient.ts`, `backupSchema.ts`

## Fase 1 — Domain + use-cases

- [ ] `packages/domain/src/core/domain/biblioteca.ts` (entidades + funções puras)
- [ ] `packages/application/src/biblioteca/` (use-cases + testes com fake)
- [ ] Exportar use-cases em `packages/application/src/index.ts`

## Fase 2 — Telas (pilha `NavScreen`, tab `biblioteca`)

- [ ] Página de eixo temático (`EixoView.tsx`)
- [ ] Página "ver tudo" (`VerTudoView.tsx`)
- [ ] Busca global (`BuscaView.tsx` + `BuscaBiblioteca.tsx`)
- [ ] Biblioteca pessoal 4 estados (expandir `MyMaterialsSection.tsx`)
- [ ] Página de detalhes do material, 3 abas (`DetalheMaterialView.tsx`)
- + Registro das `NavScreen` em `navigationEngine.ts`

## Fase 3 — Integração, copy e gate

- [ ] Cabeçalho da biblioteca (`BibliotecaHeader.tsx` / `BibliotecaView.tsx`)
- [ ] Estados vazios em todas as áreas (`EmptyState` + `Mascote` + `voice.ts`)
- [ ] Preservação de scroll vertical + horizontal ao voltar (sem salto ao topo)
- [ ] Copy de camada 1 toda em `src/lib/voice.ts`; inventário de copy limpo

## Fase 4 — Verificação final

- [ ] `npm run lint` (tsc --noEmit) verde
- [ ] `npm run test` (vitest) verde
- [ ] `node .github/scripts/check-boundaries.mjs` verde
- [ ] `npm run verify:contract` verde
- [ ] `npm run verify:fast` verde (ciclo de edição)

## Fora deste to-do (Fase 2 da especiacao do livro)

- [ ] Componente livro 3D (capa/lombada/contracapa, 3 tamanhos, 49:60)
- [ ] Animacao de abertura/fechamento por elemento compartilhado
- [ ] Gesto de arrastar para fechar + botao voltar (mesma sequencia)
- [ ] Leitura offline e downloads sob demanda
- [ ] Pagina de autor

## Convenções a respeitar (AGENTS.md do mobile)

- Branch nova antes de qualquer PR (`dev → staging → main`; nunca `main` direto)
- Copy: pt-BR, minusculas, voz do cecinho, nunca texto inline de camada 1
- Tokens: `ceci-*`/`surface-*` de `src/index.css`; nunca hex raw em classes
- `packages/*` nunca importam `react`/`@capacitor`/`__TAURI__`
- Regra nova de dominio nasce em `packages/domain` / `packages/application`, nunca
  em `src/core/*` / `src/data/*` nem em `AppContext`
- `SCHEMA_VERSION` so sobe quando o formato persistido muda; navegacao/UI nao dão bump
- Estado novo persistido: `usePersistentState` + seed em `src/data/empty.ts`
- Um gate por vez (nao orquestrar gate do mobile com do desktop)
