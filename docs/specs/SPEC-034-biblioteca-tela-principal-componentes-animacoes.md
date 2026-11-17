# SPEC-034 · Biblioteca: tela principal, componentes e animacoes

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **proposta**
> App afetado: mobile — **só este repositório** (`cecistudy/`). O desktop é outro
> app e não é tocado (`ADR-002`, `ADR-009`).
> Origem: `library/spec principal.txt` + `library/spec livro.txt` (anexos de
> conversa) e relatorios de analise spec-codigo / UI-UX / backend-dados.
> Decisões: D1..D9 (abaixo)
> Supersede: SPEC-033-biblioteca-familias-abordagens-psicoterapia.md (sobre
> familias/abordagens de psicoterapia; esta spec amplia para a biblioteca geral).
> Depende de: SPEC-033-biblioteca-familias-abordagens-psicoterapia.md
> (dados de livros/artigos ja existem), SPEC-002-motion-navegacao-e-espacamento.md
> (MorphSource/MorphTarget ja existem).
> Espelha: — (engenharia de um app so; nao ha espelho SPEC-D).
> Data: 2026-11-09
> Plano de execução: [`../../tasks/todo-biblioteca-nova-experiencia.md`](../../tasks/todo-biblioteca-nova-experiencia.md)

---

## 1. Contexto

### 1.1 O problema da usuária

A Biblioteca do Cecistudy existe hoje como "minhas coleções + explorar o
acervo" (`src/components/views/BibliotecaView.tsx`), mas a nova experiencia
pedida pelas duas specs vai além: eixos tematicos como dados independentes,
pagina individual de eixo, "ver tudo" com contexto preservado, busca global com
tela propria, biblioteca pessoal com quatro estados (salvos/em
leitura/concluidos/favoritos) tratados como independentes, pagina de detalhes
do material com tres abas (Resumo/Informacoes/Conteudo), pagina de autor,
disponibilidade do material (arquivo presente ou nao), estados de
download/offline e um componente de livro tridimensional com animacao de
abertura/fechamento (elemento compartilhado) que sai da prateleira, ganha
destaque e origina a pagina de detalhes, revertendo ao fechar.

### 1.2 O que ja existe (conferido em 2026-11-09)

- `BibliotecaView.tsx` com cabecaço discreto, zona "meus materiais" (notas,
  continuar lendo com progresso, salvos pra depois) e zona "explorar o acervo"
  (busca, filtros, secoes colapsaveis, cards de livro/artigo, modais de detalhe).
- `ExploreSections.tsx`, `ExploreShelves.tsx`, `MyMaterialsSection.tsx`,
  `useLibraryFilters.ts` — filtros, secoes, cards, modais.
- `libraryData.ts` + `src/data/books/` — catalogo estatico de livros, artigos,
  familias de psicoterapia, conteudo multidisciplinar.
- `src/lib/motion/` — `MorphSource`, `MorphTarget`, `MorphLayer`,
  `sharedBookId(id)`, `beginMorph`, `prefersReducedMotion`, `REDUCED_PROFILE`.
- `Modal.tsx` com `morphId`, `drag="y"`, `onDragEnd`, `restoreFocusRef`.
- `HeroCard` (SPEC-010), `EmptyState`, `Mascote`, `SectionTitle`,
  `CeciTag`, `BookmarkToggle`, `Reveal`, `ManageSurface`.
- `voice.ts` com chaves `VAZIO.*`, `DICA.*`, `ERRO.*` — copy de camada 1 nunca
  inline em componente (gate de voz do `check-boundaries.mjs`).
- `packages/*` (domain/application/data) com `savedBookIds`, `readingProgress`,
  `reading_progress`, `saved_catalog_item` — ja persistem salvo e progresso.

### 1.3 O que falta (lacunas levantadas na analise)

Nao existem: eixos tematicos como entidade de dados, pagina de eixo, "ver tudo"
com contexto, busca global em tela propria, biblioteca pessoal com 4 estados
independentes, pagina de detalhes com 3 abas, pagina de autor, campo
`disponibilidade` no material, estados de download/offline, componente livro 3D
(capa/lombada/contracapa), animacao de abertura/fechamento por elemento
compartilhado, gesto de arrastar para fechar, reducao de movimento na transicao
do livro, estados vazios em todas as areas.

---

## 2. Decisoes `D1..D9`

Cada decisão inclui alternativa rejeitada e consequencia, sem o que nao e
decisao, e sim preferencia.

**D1** — A nova experiencia de biblioteca e entregue em duas fases. Fase 1 (MVP):
eixos tematicos como dados, pagina de eixo, "ver tudo", busca global, biblioteca
pessoal com 4 estados, pagina de detalhes com 3 abas, disponibilidade,
navegacao por pilha `NavScreen` e copy em `voice.ts`. Fase 2 (especificacao do
livro): componente livro 3D, animacao de abertura/fechamento, gesto de arrastar,
leitura offline/download, pagina de autor.
  - Alternativa rejeitada: entregar 3D + animacao na mesma fase que o restante.
  - Consequencia: o MVP entra em producao mais cedo; o "uau" visual fica para
    depois, sem bloquear o core de navegacao e dados.

**D2** — Nao existe `package.json` na raiz do grupo (`ADR-002`); todo comando
roda dentro de `cecistudy/`. Nao se cria build compartilhado entre apps.
  - Alternativa rejeitada: monorepo na raiz com comando unico.
  - Consequencia: a implementacao fica toda em `cecistudy/`, sem tocar
    `cecistudy-desktop/`.

**D3** — Regra de dominio da biblioteca (se houver logica pura: atraso,
sobreposicao, estado de leitura) nasce em `packages/domain` e `packages/application`;
o TypeScript de `src/` e `src/components/` e so tipagem, IPC (nao ha no mobile)
e renderizacao. Nunca adicionar regra de negocio nova a `AppContext` nem a
`src/core/*` / `src/data/*` (stubs de compat com re-export relativo).
  - Alternativa rejeitada: colocar logica de biblioteca direto em `src/components/views/biblioteca/`.
  - Consequencia: a camada de dominio fica testavel sem jsdom e reusavel; a view
    so consome use-cases.

**D4** — `SCHEMA_VERSION` sobe de 23 para 24 apenas porque o formato persistido
muda (novas colecoes de biblioteca). Mudanças apenas de navegacao/UI
(`NavScreen`, telas, componentes) nunca dão bump.
  - Alternativa rejeitada: dar bump em `SCHEMA_VERSION` por cada nova tela.
  - Consequencia: o contrato de dados e o gate `verify:contract` so disparam
    quando o dado persistido realmente muda; `MIGRATIONS[24]` semeia as novas
    colecoes vazias.

**D5** — Os novos componentes de UI puros (`Livro3D` na Fase 2; `BibliotecaHeader`,
`DescobertaEditorial`, `BuscaBiblioteca` na Fase 1) ficam em
`src/components/ui/`; blocos que combinam UI + dominio da biblioteca
(`PainelDetalhesLivro`, `EixoTematicoCard`, `LivroPrateleira`) ficam em
`src/components/library/`. Reuso antes de criar (`EmptyState`, `Modal`,
`MorphSource`/`MorphTarget`, `HeroCard`, `SectionTitle`, `CeciTag`,
`BookmarkToggle`, `Reveal`).
  - Alternativa rejeitada: criar tudo em `src/components/views/biblioteca/`.
  - Consequencia: componentes reusaveis e gate de limite (`check-boundaries.mjs`)
    nao e violado por `ui/` importando `src/`.

**D6** — Copy de camada 1 (erro, vazio, dica, confirmacao, celebracao,
notificacao) vem de `src/lib/voice.ts` com chave + consumidor em producao;
nunca texto inline em componente. Tom: primeira pessoa do cecinho, minusculas,
`ceço` so em afeto proximo, erro em duas frases.
  - Alternativa rejeitada: escrever frases inline nos JSX da biblioteca.
  - Consequencia: o gate de voz (regra 4 do `check-boundaries.mjs`) passa e o
    inventario de copy nao gera divida D12.

**D7** — Navegacao por pilha de estados `NavScreen[]` (sem router). As novas
telas (eixo, ver tudo, busca, detalhe do material) registram `NavScreen` em
`navigationEngine.ts` dentro da tab `biblioteca`. `location.hash` e so espelho.
  - Alternativa rejeitada: react-router ou navegacao por hash direta.
  - Consequencia: mantem o padrao existente do app; pilha e fonte da verdade;
    retorno preserva scroll da pagina e scroll horizontal de prateleiras.

**D8** — Estados pessoais salvos/em leitura/concluidos/favoritos sao
informacoes independentes (`INV-7` do glossario do grupo): `recomendado` e
`opcional` nunca viram obrigacao; so `obrigatorio` e `importante` geram atraso.
No mobile, mapeia-se para `savedBookIds`, `readingProgress` e novo
`EstadoPessoal` (`salvo`/`em_leitura`/`concluido`/`favorito`).
  - Alternativa rejeitada: fundir salvo e favorito num unico booleano.
  - Consequencia: um livro pode estar concluido e continuar favoritado, ou salvo
    sem estar em leitura; a conclusao nao apaga o favorito.

**D9** — O componente livro 3D (Fase 2) nao e responsavel por gerenciar sozinho
a navegacao da biblioteca; a animacao e coordenada pela camada de navegacao e
apresentacao da pagina de detalhes (`MorphLayer` + `Modal` existentes).
  - Alternativa rejeitada: o componente `Livro3D` gerencia push/pop da pilha.
  - Consequencia: separacao clara; o componente recebe props e dispara callbacks;
    a navegacao fica no `Modal`/`MorphLayer`.

---

## 3. Escopo

### 3.1 Dentro do escopo (Fase 1 — MVP)

- Eixos tematicos como entidade de dados independente da interface (adicionar,
  remover, ocultar, reordenar, alterar titulos/descricoes, adicionar/remover
  materiais, criar subtemas) sem mudar codigo da interface.
- Pagina individual de eixo tematico (apresentacao visual, titulo, descricao
  editorial, materiais em destaque, subtemas, leituras introdutorias,
  leituras aprofundadas, autores importantes, materiais relacionados).
- Pagina "ver tudo" preservando titulo e descricao da secao de origem; ate 15
  materiais inicialmente + acao "Ver tudo".
- Busca global em tela propria: sugestões de descoberta (assuntos populares,
  autores relevantes, livros populares, temas em destaque), resultados
  atualizados durante a digitação (titulo, autor, assunto, palavras-chave,
  descricao, eixo tematico, colecao editorial), filtros (tipo de material,
  autor, assunto, eixo tematico, disponibilidade para leitura), estado sem
  resultados.
- Biblioteca pessoal com quatro estados independentes: Salvos, Em leitura,
  Concluidos, Favoritos. Alternancia entre os quatro; concluido sai de em
  leitura e entra em concluidos; favorito independente do estado de leitura.
- Pagina de detalhes do material (nao o leitor) com tres abas: Resumo,
  Informacoes, Conteudo. Acoes: comecar/continuar leitura, salvar para depois,
  favoritar, adicionar a lista de leitura, baixar para offline, compartilhar.
- Disponibilidade do material como propriedade (disponivel / sem arquivo):
  botao de leitura desativado (cinza) quando nao houver arquivo; metadados
  continuam acessiveis.
- Navegacao por pilha `NavScreen` para as novas telas dentro da tab biblioteca;
  preservacao de scroll vertical e scroll horizontal de prateleiras ao voltar.
- Estados vazios em todas as areas (sem andamento, sem salvos, sem favoritos,
  sem concluidos, busca sem resultados, eixo sem materiais, colecao sem
  conteudo, material sem arquivo).
- Copy toda em `voice.ts`; design tokens `ceci-*`/`surface-*`; nunca hex raw em
  classes.

### 3.2 Fora do escopo desta spec (Fase 2 — especiacao do livro)

- Componente livro tridimensional (capa/lombada/contracapa, perspectiva 3D,
  iluminacao, sombras, 3 tamanhos 150/196/300 px, proporcao 49:60, estado sem
  capa).
- Animacao de abertura/fechamento por elemento compartilhado (5 etapas: selecao,
  elevação, deslocamento para destaque, expansao do painel, apresentacao;
  fechamento inverso; gesto de arrastar para baixo; botao voltar com mesma
  sequencia).
- Leitura offline e downloads (sob demanda; estados online/baixando/disponível
  offline/pausado/falha/removido; evitar download automatico do catalogo).
- Pagina de autor (nome, biografia, trajetoria, principais publicacoes,
  materiais relacionados, outros autores relacionados).
- Leitor como experiencia separada da ficha de detalhes.

---

## 4. Fora de escopo (spec principal §18)

- Implementacao tecnica do leitor.
- Arquitetura definitiva de armazenamento dos arquivos.
- Estrategia de distribuicao e atualizacao do catalogo.
- Sincronizacao entre dispositivos.
- Estrutura tecnica definitiva do banco de dados (alvo: `packages/data` ja define
  o contrato; novas colecoes entram por migracao 24).
- Sistema administrativo de curadoria (curadoria e por dados, sem painel admin
  nesta espec).
- Funcionamento interno do modulo de listas de leitura (integracao por callback
  apenas).
- Especificacao visual final de cada componente (tokens e direcao estao aqui;
  pixel-fino fica para a implementacao).

---

## 5. Contrato

### 5.1 Entidades de dados (novas, `packages/domain` + `src/types/entity.ts`)

| Entidade | Campos-chave | Nota |
|---|---|---|
| `Material` | id, titulo, autorId, tipo, totalPaginas, paginasLidas, disponibilidade, caminhoArquivo, ultimaLeituraEm, criadoEm | Agregado da obra; `autor` deixa de ser apenas string |
| `AutorBiblioteca` | id, nome, bio, nascimento, obrasPrincipais[], fotoUrl | Pagina propria de autor (Fase 2) |
| `EixoTematico` | id, nome, descricao, cor, ordem | Dados independentes da interface |
| `Subtema` | id, eixoId, nome, descricao, ordem | Subdivisao de eixo |
| `ColecaoEditorial` | id, nome, descricao, materialIds[] | Selecao curada de materiais |
| `Prateleira` | id, nome, descricao, materialIds[], ordem | Agrupamento apresentado em secao |
| `Recomendacao` | id, materialId, motivo, tipo, ativo | Relacao entre materiais |
| `EstadoPessoal` | materialId, estado (salvo/em_leitura/concluido/favorito), nota, dataAtualizacao | Estado independente por material |
| `Arquivo` | id, materialId, nomeArquivo, caminho, tamanho, tipoMime, disponibilidade | Controle de arquivo/offline |

### 5.2 Contrato de navegacao

Novas `NavScreen` dentro da tab `biblioteca`:
- `biblioteca → eixo:{id}` (pagina de eixo tematico)
- `biblioteca → verTudo:{secaoId}` (listagem completa com contexto preservado)
- `biblioteca → busca` (busca global com sugestões, resultados, filtros)
- `biblioteca → detalheMaterial:{id}` (pagina de detalhes com 3 abas)

O retorno (`pop`) restaura scroll vertical da biblioteca e scroll horizontal da
prateleira de origem (D7).

### 5.3 Contrato de disponibilidade

`disponibilidade ∈ {disponivel, indisponivel}`. Quando `indisponivel`:
- botao principal de leitura desativado, aparencia cinza (spec principal §11.2);
- metadados e informacoes continuam acessiveis;
- nao direciona para experiencia de leitura inexistente.

---

## 6. Invariantes (testaveis)

| # | Invariante | Onde verificar |
|---|---|---|
| INV-1 | Bloco de planejamento nunca cria obrigação nova (nao se aplica a biblioteca direta; eixo/colecao nao criam Material so por existir). | dominio de eixo/colecao |
| INV-2 | Origem `google` (sincronizacao externa) e somente leitura; `guard_origin` recusa escrita. | nao se aplica a Fase 1 mobile (sem sinc) |
| INV-3 | Conclusao de material exige registro (`EstadoPessoal` = `concluido`). | use-case `concluirMaterial` |
| INV-4 | `recomendado` e `opcional` nunca geram atraso; so `obrigatorio` e `importante`. | dominio de atraso (nao persistido) |
| INV-5 | `scope != "serie"` não escreve `event_recurrence` (nao se aplica a biblioteca). | — |
| INV-6 | `INV-7`: salvo, favorito e estados de leitura sao independentes; conclusao nao apaga favorito. | `EstadoPessoal` |
| INV-8 | A ordenacao de secoes da tela principal e definida por dados, nao por codigo da interface. | configuracao editorial |
| INV-9 | A animação nunca e necessaria para compreender ou usar a biblioteca; sob `prefers-reduced-motion` e transicao simplificada. | `MorphLayer` / `REDUCED_PROFILE` |
| INV-10 | Intervalos sao semiabertos `[inicio, fim)`: item que termina às 10:00 e outro que começa às 10:00 nao se sobrepoem. | nao se aplica a biblioteca (sem agendamento) |
| INV-11 | Copy de camada 1 nunca escrita inline em componente; sempre chave em `voice.ts`. | gate de voz `check-boundaries.mjs` |
| INV-12 | `SCHEMA_VERSION` so muda quando o formato persistido muda; navegação/UI nunca dão bump. | `verify:contract` |

---

## 7. Casos de borda

- Eixo sem materiais disponíveis → estado vazio contextual com convite à descoberta.
- Busca sem resultados → mensagem clara (`VAZIO.semResultadoFiltro` ou nova chave) + botão limpar filtros.
- Material sem arquivo para leitura → botão desativado cinza; metadados acessíveis; nenhuma navegação para leitura inexistente.
- Imagem da capa ainda carregando na abertura animada (Fase 2) → não iniciar transição que resulte em capa vazia (especificacao do livro §10.2).
- Gestão insuficiente de arrastar (Fase 2) → painel retorna suavemente; permanece aberto.
- Interrupção de animacao / mudança de orientação / navegacao inesperada (Fase 2) → interface recupera estado consistente; nenhum painel parcialmente expandido nem livro preso.
- Sem dados de biblioteca (app começa vazio) → estados vazios em todas as areas.

---

## 8. Critérios de aceite (verificáveis por comando)

Fase 1 (MVP):

1. `npm run lint` (tsc --noEmit) passa após as mudanças.
2. `npm run test` (vitest) passa; testes de use-case de biblioteca em
   `packages/application/src/biblioteca/__tests__/` com repositório fake.
3. `node .github/scripts/check-boundaries.mjs` passa (não toca `packages/*`
   com `react`/`@capacitor`; `ui/` não importa `src/`).
4. `npm run verify:contract` passa: header de `contracts/schema.sql` =
   `SCHEMA_VERSION = 24`; `MIGRATIONS[24]` existe e é contígua; golden files
   regenerados.
5. Tela principal da biblioteca renderiza: cabeçalho, descobertas, continuar
   leitura, eixos temáticos, busca global, biblioteca pessoal (4 abas),
   detalhes do material (3 abas) — navegável por pilha `NavScreen`.
6. Eixos temáticos aparecem como dados: adicionar/remover/ocultar/reordenar
   não exige código de interface novo.
7. Biblioteca pessoal alterna entre Salvos / Em leitura / Concluídos /
   Favoritos; concluído sai de em leitura; favorito independente.
8. Material indisponível exibe botão de leitura desativado (cinza) e mantém
   metadados acessíveis.
9. Estado vazio presente em: sem salvos, sem em leitura, sem concluídos, sem
   favoritos, busca sem resultados, eixo sem materiais.
10. Copy de camada 1 toda em `voice.ts` (inventário de copy limpo:
    `node scripts/inventario-de-copy.mjs` sem `precisaRevisao` novo).

Fase 2 (especificacao do livro — não parte deste gate):

- Componente `Livro3D` em 3 tamanhos (150/196/300 px), proporcao ~49:60,
  capa/lombada/contracapa, estado sem capa mesma estrutura/dimensoes.
- Animacao de abertura/fechamento por elemento compartilhado; biblioteca visível
  durante elevação; painel expande a partir do livro; retorno à posicao
  original com scroll preservado; sem salto ao topo.
- Gesto de arrastar para baixo fecha; gesto insuficiente restaura; botao voltar
  usa mesma sequencia; `prefers-reduced-motion` usa transicao simplificada.
- Download sob demanda com estados online/baixando/disponível offline/pausado/
  falha/removido; nunca download automático do catalogo.

---

## 9. Medição

- Numero de telas novas navegáveis por `NavScreen` (meta: 4 — eixo, ver tudo,
  busca, detalhe material).
- Numero de entidades de domínio novas (meta: 9 — Material, AutorBiblioteca,
  EixoTematico, Subtema, ColecaoEditorial, Prateleira, Recomendacao,
  EstadoPessoal, Arquivo).
- Numero de estados vazios cobertos (meta: 8 — espec principal §15).
- `SCHEMA_VERSION` = 24 apos a migracao 24.
- Gate de voz: zero textos de camada 1 inline em componentes novos da biblioteca.
- Tempo de typecheck incremental nao deve regressar além de ~15s (maquina de
  3,6 GB; um gate por vez, SPEC-C-014 D5).

---

## 10. Riscos

| Risco | Mitigacao |
|---|---|
| Duplicar `savedBookIds`/`readingProgress` com novo `EstadoPessoal` sem sincronia | Um uso por acao; `EstadoPessoal` e fonte da verdade para salvo/favorito/concluido/em leitura; `readingProgress` mantido para compatibilidade de paginas lidas |
| `SCHEMA_VERSION` duplicada/divergente (débito C2 do grupo) | Bump apenas em `packages/data/src/schema.ts` + `MIGRATIONS[24]` + header `contracts/schema.sql`; `verify:contract` confere |
| Criar regra nova em TypeScript no desktop (proibido) | Nao toca `cecistudy-desktop/`; desktop é outro app (ADR-002/006/009) |
| Animação travar em iOS / dispositivos baixos (Fase 2) | Priorizar transform (posicao/escala/rotacao); evitar layout durante movimento; imagem da capa precarregada (especificacao do livro §10.2) |
| Copy inline esquecida no componente novo | Inventario de copy após cada tela; gate de voz reprova |
| Hex raw em classe (convenção de tokens) | Revisão em code review; `ceci-*`/`surface-*` de `src/index.css` |

---

## 11. Rastreabilidade

spec → decisão → código → teste → gate:

- SPEC-034 (este documento) → D1..D9 → `src/components/views/biblioteca/*`,
  `src/components/ui/*`, `src/components/library/*`,
  `packages/domain/src/core/domain/biblioteca.ts`,
  `packages/application/src/biblioteca/*`,
  `packages/data/src/schema.ts` (SCHEMA_VERSION 24 + MIGRATIONS[24]),
  `contracts/schema.sql` → testes de use-case (`packages/application/src/biblioteca/__tests__/`),
  testes UI (`src/components/views/biblioteca/__tests__/` se houver),
  `npm run lint` + `npm run test` + `check-boundaries` + `verify:contract` +
  inventario de copy.

SPEC-033 (familias/abordagens de psicoterapia) não é substituída; esta spec
amplia para a biblioteca geral e depende dela para os dados de livros/artigos
ja existentes.

---

**Fim da spec — Biblioteca Cecistudy v1.0 (implementação)**
