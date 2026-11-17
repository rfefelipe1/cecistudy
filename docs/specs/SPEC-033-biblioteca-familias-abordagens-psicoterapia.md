# SPEC-033 · Biblioteca: famílias e abordagens de psicoterapia

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/cecistudy/docs/specs/`
> Status: proposta
> App afetado: mobile
> Origem: `cecistudy/library/cecistudy_base_psicoterapias/notas/modelo_campos.txt` + `taxonomia_normalizada.md` + `auditoria_97/auditoria_97_canonica.md`
> Decisões: D1..D7
> Supersede: —
> Depende de: SPEC-010 (molde HeroCard), SPEC-001 (repertório já entregue)
> Data: 2026-11-09

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite verificável por comando, está incompleta. Isso é `ADR-004`.

---

## 1. Contexto

- **Situação.** A tela de biblioteca (`src/components/views/BibliotecaView.tsx`) já tem modos `families`, `family` e `approach`, que montam `FamiliesView`, `FamilyDetailView` e `ApproachDetailView` (lazy, `BibliotecaView.tsx:90-103`). O conteúdo editorial das 97 abordagens e 10 famílias já está gerado em `src/data/psicoterapiaFamilies.ts` e `src/data/psicoterapia/fam-XX-*.ts`, com os 22 campos de `abordagem` do `modelo_campos.txt` já mapeados em `PsychologyApproach.detail` (`PsicoterapiaFieldKey`, `src/types/entity.ts:409-430`). O `version.json` já reporta `approachFamilies: 10`, `approaches: 97`.
- **O que a usuária vê hoje.** A grade principal da biblioteca (modo `library`) expõe psicoterapias apenas como coleções de livros (`ExploreShelves.tsx:141-172`) e como coleções de contexto (`approachCollections`, `ExploreShelves.tsx:290-321`). A entrada para as 10 famílias e 97 abordagens só existe via `openFamily`, sem link direto da grade principal. Dentro das subtelas:
  - `ApproachDetailView` já agrupa os 22 campos em 5 blocos, mas **todos expostos de uma vez** (parede de texto, sem progressive disclosure) e o campo `periodo_historico` existe no dado (`PsicoterapiaFieldKey`, linha 414) mas **não é renderizado em nenhum bloco** (`ApproachDetailView.tsx`).
  - `FamiliesView` e `FamilyDetailView` abrem com cabeçalho genérico `rounded-2xl p-4 bg-surface-default` — não seguem o molde `HeroCard` (SPEC-010) das telas de referência (Home, Faculdade).
  - Textos de camada 1 (títulos de seção, erros, empty states) estão escritos inline nos componentes, violando a regra da voz (`src/lib/voice.ts`, gate regra 4 do `check-boundaries.mjs`).
  - Não há comunicação de classificação cruzada: a `taxonomia_normalizada.md` prevê 6 abordagens em múltiplas famílias, mas cada `PsychologyApproach` tem um único `familyId` e a tela não comunica quando uma abordagem aparece em mais de uma família.
- **Como se sabe que é problema.** Relatório dos três agentes (specs + UI/UX + backend) lido em 2026-11-09. Os dados existem e estão mapeados; o que falta é exibi-los com qualidade, consistência de apresentação com o resto do app e completude dos 22 campos.

---

## 2. Decisões

### D1 · `ApproachDetailView` deve renderizar os 22 campos do `modelo_campos.txt`, incluindo `periodo_historico` `[D]`

- **Decisão.** A tela de leitura da abordagem deve garantir que todos os 22 campos de `abordagem` do `modelo_campos.txt` (linhas 27-68) estejam visíveis ao usuário, incluindo `periodo_historico`, que hoje existe no dado mas não é renderizado.
- **Justificativa.** O `modelo_campos.txt` define a abordagem como "rica": todos os 22 campos. O dado já existe em `detail[PsicoterapiaFieldKey]`; o app só não exibe um deles (`periodo_historico`) e duplica parcialmente a informação via `historicalPeriod` (top-level, badge). Renderizar todos é o mínimo de completude.
- **Alternativa rejeitada.** Deixar `periodo_historico` apenas como `historicalPeriod` no badge — rejeitado porque cria duas fontes de verdade para a mesma informação e o campo `detail.periodo_historico` fica inutilizado, violando o contrato do modelo.
- **Consequência aceita.** A página de leitura fica mais longa; mitigado por D2 (progressive disclosure).

### D2 · Os 22 campos são organizados em seções colapsáveis (progressive disclosure) `[D]`

- **Decisão.** `ApproachDetailView` reorganiza o conteúdo em seções colapsáveis: nível 1 sempre visível (`descricao_curta` + `ideia_central` destacada); seções colapsáveis fechadas por padrão: "o que é" (`definicao`), "como entende a pessoa" (`visao_ser_humano`, `visao_psique`, `visao_desenvolvimento`, `visao_sofrimento`), "como acontece a mudança" (`teoria_da_mudanca`), "na prática" (`apresentacao_pratica`, `papel_terapeuta`, `papel_paciente`, `relacao_terapeutica`, `foco_clinico`), "história e contexto" (`origem`, `periodo_historico`, `contexto_historico`), "academia e pesquisa" (`perspectiva_academica`, `evidencias`, `debates`, `criticas_limitacoes`), "leituras fundamentais" (`leituras_fundamentais`), "autores e conexões" (`foundingAuthors`, `relationsWithOtherApproaches`). A seção "o que é" pode abrir por padrão.
- **Justificativa.** 22 campos podem passar de 3000 palavras. Progressive disclosure evita sobrecarga cognitiva e respeita o tom acolhedor do app (sem joga tudo de uma vez). Cada seção com `aria-expanded`/`aria-controls` para leitor de tela.
- **Alternativa rejeitada.** Exibir todos os campos expandidos de uma vez (estado atual) — rejeitado: parede de texto, sem hierarquia, a usuária não acha o que interessa sem rolar muito.
- **Consequência aceita.** Mais cliques para ver conteúdo denso; aceito porque o essencial (ideia central + definição curta) fica visível no nível 1.

### D3 · `FamiliesView`, `FamilyDetailView` e `ApproachDetailView` abrem com `HeroCard` no molde SPEC-010 `[D]`

- **Decisão.** As três subtelas da biblioteca (famílias, família, abordagem) passam a abrir com um `HeroCard` (`src/components/ui/HeroCard.tsx`, SPEC-010 D2): `rounded-[26px]`, `bg-gradient-to-br`, eyebrow em minúsculas, título `font-serif-academic text-3xl sm:text-4xl`, frase de resumo `text-xs sm:text-[13px] text-ceci-secondary`, mascote no canto inferior direito, ação primária no canto superior direito. Acento `rose` para famílias, `blue` para abordagens.
- **Justificativa.** É o molde das telas de referência do app (Home, Faculdade). Repetir o molde faz a tela parecer parte do mesmo produto. SPEC-010 D1 determina que toda superfície relevante abra com hero.
- **Alternativa rejeitada.** Manter cabeçalho genérico `rounded-2xl p-4 bg-surface-default` — rejeitado: é um terceiro idioma de abertura de tela, quebra a identidade visual e esconde o resumo atrás de rolagem.
- **Consequência aceita.** O hero ocupa mais linha; mitigado porque absorve a ação primária e o resumo que hoje seriam cards separados.

### D4 · Classificação cruzada comunicada com chip discreto em `FamilyDetailView` `[D]`

- **Decisão.** Quando uma abordagem de uma família também aparece em outra família (conforme `taxonomia_normalizada.md`, seção "Itens com classificação cruzada identificadas"), `FamilyDetailView` renderiza um chip discreto `também em: <nome da outra família>` ao lado da abordagem.
- **Justificativa.** A taxonomia é de navegação editorial: "muitas abordagens são híbridas, atravessam tradições e podem constar, de modo legítimo, em mais de uma família" (`taxonomia_normalizada.md:5`). Cada `PsychologyApproach` tem um único `familyId` nos dados gerados, mas a tela deve comunicar a fluidez sem duplicar conteúdo.
- **Alternativa rejeitada.** Permitir que uma abordagem tenha múltiplos `familyId` no dado — rejeitado: exigiria mudar os arquivos gerados `src/data/psicoterapia/fam-XX-*.ts`, o schema do catálogo DB e a navegação família→abordagem; fora do escopo desta spec (dados já existem com um `familyId` cada).
- **Consequência aceita.** O chip é uma indicação visual, não um vínculo estrutural; se a usuária quiser navegar para a outra família, ela volta à lista de famílias e escolhe a outra.

### D5 · Todo texto de camada 1 das subtelas da biblioteca vive em `src/lib/voice.ts` `[D]`

- **Decisão.** Títulos de seção da `ApproachDetailView`, textos de erro (`família não encontrada`, `abordagem não encontrada`), empty states e dicas de contexto são chaves de `src/lib/voice.ts` (`frase(VAZIO, 'chave')`, `erro('codigo')`), nunca inline em componente.
- **Justificativa.** O gate de voz (regra 4 do `check-boundaries.mjs`) reprova texto de camada 1 escrito inline. Regra 8 do AGENTS.md: toda chave precisa de consumidor em produção.
- **Alternativa rejeitada.** Escrever texto inline com desculpa de "só nesta tela" — rejeitado: é exatamente a fonte do débito que o gate existe para impedir.
- **Consequência aceita.** Mais um arquivo (`voice.ts`) a editar para cada texto novo; aceito porque é a regra do app e o gate a executa.

### D6 · Empty states e loading diferenciados por situação na biblioteca de abordagens `[D]`

- **Decisão.** Cada situação de ausência ou carregamento tem expressão de mascete e copy próprias: busca de famílias sem resultado (`no-results`), família sem abordagens (`no-results`), abordagem não encontrada (`erro` com duas frases), carregamento de família/abordagem (`loading-patient` ou `reading-curious`).
- **Justificativa.** Empty state genérico dá sensação de "tela quebrada". A mascote e a ação clara (limpar busca, voltar às famílias) dão afeto e direção.
- **Alternativa rejeitada.** Um único empty state genérico para tudo — rejeitado: a usuária não sabe se errou no nome, se a família está vazia ou se o dado não carregou.
- **Consequência aceita.** Mais chaves de `voice.ts` e mais variantes de mascote; aceito porque melhora a percepção de qualidade.

### D7 · A grade principal da biblioteca (modo `library`) ganha link direto para o catálogo de psicoterapias `[D]`

- **Decisão.** A seção "explorar o acervo" da `BibliotecaView` (modo `library`) inclui uma entrada visível para "10 famílias, 97 abordagens" que navega para `mode='families'` (`FamiliesView`).
- **Justificativa.** Hoje a entrada para famílias/abordagens só existe via `openFamily`, sem link direto da grade principal. A usuária que entra na biblioteca para explorar psicoterapias não encontra o catálogo rico sem saber o caminho.
- **Alternativa rejeitada.** Substituir a seção "psicoterapias" existente (livros do catálogo) — rejeitado: são domínios diferentes (livros vs. abordagens). A entrada é adicional, não substitutiva.
- **Consequência aceita.** A grade principal fica um pouco mais longa; aceito porque é um ponto de entrada importante para o conteúdo de psicoterapia.

---

## 3. Escopo

| Item | Tipo |
|---|---|
| `src/components/views/ApproachDetailView.tsx` — 22 campos, `periodo_historico`, seções colapsáveis | código · UI |
| `src/components/views/FamiliesView.tsx` — `HeroCard` no topo | UI |
| `src/components/views/FamilyDetailView.tsx` — `HeroCard`, chip de classificação cruzada | UI |
| `src/components/views/BibliotecaView.tsx` — link direto para famílias no modo `library` | UI |
| `src/lib/voice.ts` — chaves novas (VAZIO, ERRO, títulos de seção) | código · dados |
| Testes de render: 1 hero por superfície, campos renderizados, `aria-expanded` | gate |
| Gate: `npm run lint` + `npm run test` + `npm run build` + `check-boundaries` | gate |

---

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Migrar `home/HeroSection` e `faculdade/HeroSection` para `HeroCard` | são a referência; migrá-las anula o parâmetro de comparação (SPEC-010 §4) |
| `SCHEMA_VERSION` / migrações de `packages/data` | catálogo estático em `public/` não afeta `packages/data`; nenhuma mudança de formato gravado |
| Novo schema no catálogo DB (`approach_family`, `approach`) | os 3 campos de `familia` e 22 de `abordagem` já estão mapeados (backend: colunas individuais + `data_json`) |
| `content:build` + `db:verify` + `content:check` | só obrigatório se a fonte de conteúdo mudar; esta spec reusa dados existentes |
| Múltiplos `familyId` por abordagem | exigiria mudança nos arquivos gerados `src/data/psicoterapia/fam-XX-*.ts`; fora do escopo |
| Campos de autores/conceitos/técnicas/fontes no modelo de abordagem | `modelo_campos.txt:157-179`: primeiro famílias → abordagens → conteúdo textual; depois relações estruturadas |
| "Curtir", "salvar abordagem" ou progresso de leitura na abordagem | não existe no domínio; escapa do escopo de UI da tela |
| Dark mode novo para a biblioteca | usa o `theme` existente, sem token novo |

---

## 5. Contrato

- **Assinatura** — `HeroCard` já existe (`src/components/ui/HeroCard.tsx`, SPEC-010 §5): recebe `eyebrow`, `title`, `summary`, `action`, `expression`, `accent` (`rose` | `blue`), `testId`. Apresentação pura, não lê contexto, não navega.
- **Assinatura** — seções colapsáveis de `ApproachDetailView`: componente puro recebe `title`, `children`, `open`, `onToggle`, `testId`; renderiza cabeçalho clicável com `aria-expanded`/`aria-controls` e corpo animado.
- **Invariante do contrato.** `HeroCard` não importa `useMobileApp`, `useNavValue`, nem calcula dado. Seções colapsáveis não importam domínio; recebem conteúdo por props.
- **Quem consome.** `FamiliesView`, `FamilyDetailView`, `ApproachDetailView` (duas superfícies + página de leitura).

---

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | `FamiliesView`, `FamilyDetailView`, `ApproachDetailView` renderizam exatamente um `HeroCard` (`testId="hero-card"`) | cada view | teste de render: `getAllByTestId('hero-card').length === 1` |
| I2 | `ApproachDetailView` renderiza `periodo_historico` (do `detail.periodo_historico`) | `ApproachDetailView.tsx` | teste: `getByText` com conteúdo de `periodo_historico` de uma abordagem real |
| I3 | Cada seção colapsável de `ApproachDetailView` tem `aria-expanded` e `aria-controls` | `ApproachDetailView.tsx` | teste: atributos presentes em cada cabeçalho de seção |
| I4 | Nenhum texto de camada 1 inline nas views da biblioteca (zero em `voice.ts` fora) | `FamiliesView.tsx`, `FamilyDetailView.tsx`, `ApproachDetailView.tsx` | gate `check-boundaries.mjs` regra 4 |
| I5 | `FamilyDetailView` renderiza chip `também em: <família>` quando a abordagem tem classificação cruzada | `FamilyDetailView.tsx` | teste: chip presente para abordagem com múltiplas famílias na taxonomia |
| I6 | Nenhum hex raw em `className` dos arquivos da biblioteca | views da biblioteca | gate `rg "#[0-9A-Fa-f]{6}"` → 0 ocorrências |

---

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Busca de famílias sem resultado | `EmptyState` com mascote `no-results`, copy `VAZIO.semFamiliasEncontradas`, ação `limpar busca` |
| Família sem abordagens mapeadas | `EmptyState` com mascote `no-results`, copy `VAZIO.semAbordagensNestaFamilia`, ação `voltar às famílias` |
| Abordagem não encontrada (id inválido) | `ERRO.abordagemNaoEncontrada` (duas frases: o que aconteceu + o que pode fazer), ação `voltar às famílias` |
| Carregando família / abordagem | skeleton com mascote `loading-patient`, `aria-busy="true"` |
| Abordagem com classificação cruzada (ex.: Terapia Centrada em Soluções em famílias 5/6/10) | chip `também em: <outra família>` ao lado da abordagem na `FamilyDetailView` de cada família |
| Abordagem sem `detail` (dado incompleto) | nível 1 mostra `descricao_curta` se houver, senão `name`; seções colapsáveis vazias não renderizam |
| Viewport de 320px | título `text-3xl` com `truncate`; chip de classificação cruzada não quebra linha |
| Teclado aberto | hero não é sticky; rolagem normal |

---

## 8. Critérios de aceite

- [ ] `npm run lint` → sai com 0
- [ ] `npm run test` → sai com 0 (suíte atual + testes novos da §6)
- [ ] `node .github/scripts/check-boundaries.mjs` → sai com 0
- [ ] `npm run build` → sai com 0
- [ ] `rg -c "HeroCard" src/components/views/FamiliesView.tsx src/components/views/FamilyDetailView.tsx src/components/views/ApproachDetailView.tsx` → 3 arquivos com ocorrência
- [ ] `rg -c "periodo_historico" src/components/views/ApproachDetailView.tsx` → ≥ 1 ocorrência
- [ ] `rg -c "aria-expanded" src/components/views/ApproachDetailView.tsx` → ≥ 1 ocorrência
- [ ] `rg -n "#[0-9A-Fa-f]{6}" src/components/views/FamiliesView.tsx src/components/views/FamilyDetailView.tsx src/components/views/ApproachDetailView.tsx` → 0 ocorrências
- [ ] `rg -c "também em" src/components/views/FamilyDetailView.tsx` → ≥ 1 ocorrência (chip de classificação cruzada)

---

## 9. Medição

| Métrica | Comando | Antes | Depois |
|---|---|---|---|
| subtelas com hero | `rg -c "HeroCard" src/components/views/FamiliesView.tsx src/components/views/FamilyDetailView.tsx src/components/views/ApproachDetailView.tsx` | 0 | 3 |
| campos dos 22 renderizados | `rg -c "detail\." src/components/views/ApproachDetailView.tsx` | 21 | 22 |
| seções colapsáveis com a11y | `rg -c "aria-expanded" src/components/views/ApproachDetailView.tsx` | 0 | ≥ 8 |
| texto inline de camada 1 | inspeção manual das 3 views | vários | 0 |
| chip de classificação cruzada | `rg -c "também em" src/components/views/FamilyDetailView.tsx` | 0 | ≥ 1 |
| hex raw nas views | `rg -n "#[0-9A-Fa-f]{6}" <3 views>` | vários | 0 |

---

## 10. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| Hero grande demais em tela pequena com teclado aberto | média | médio | variante compact (`p-4`, `text-2xl`) por breakpoint — só se aparecer reclamação real |
| Progressive disclosure esconde informação importante | média | médio | seção "o que é" abre por padrão; ideia central sempre visível |
| Chip de classificação cruzada confunde (não é link) | baixa | baixo | chip é só indicação; navegação volta à lista de famílias |
| Regressão de teste existente da biblioteca | baixa | alto | rodar `npm run test` antes de cada commit da implementação |
| Especificação visual ajustada pela dona depois | média | baixo | decisões `[D]`; ajuste é edição na §2, não código surpresa |

---

## 11. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `src/components/views/ApproachDetailView.tsx` | teste I2 (`periodo_historico`) | `npm run test` |
| D2 | `src/components/views/ApproachDetailView.tsx` | teste I3 (`aria-expanded`) | `npm run test` |
| D3 | `FamiliesView.tsx`, `FamilyDetailView.tsx`, `ApproachDetailView.tsx` | teste I1 (1 hero por superfície) | `npm run test` |
| D4 | `src/components/views/FamilyDetailView.tsx` | teste I5 (chip) | `npm run test` |
| D5 | `src/lib/voice.ts` + 3 views | gate regra 4 | `check-boundaries.mjs` |
| D6 | `src/lib/voice.ts`, `ViewSkeleton`, `EmptyState` | teste de empty/loading | `npm run test` |
| D7 | `src/components/views/BibliotecaView.tsx` | teste de navegação para `families` | `npm run test` |

Tasks de implementação: `tasks/todo-biblioteca-abordagens.md`.

---

## 12. Reconciliação com o que já está em código

Esta spec regulariza trabalho já existente no disco, sem número de decisão:

| Item | Estado | Onde |
|---|---|---|
| 10 famílias, 97 abordagens, 22 campos | implementado | `src/data/psicoterapiaFamilies.ts`, `src/data/psicoterapia/fam-XX-*.ts` |
| `PsicoterapiaFieldKey` (21 chaves + `nome` top-level) | implementado | `src/types/entity.ts:409-430` |
| `FamiliesView`, `FamilyDetailView`, `ApproachDetailView` | implementado | `src/components/views/FamiliesView.tsx`, `FamilyDetailView.tsx`, `ApproachDetailView.tsx` |
| `HeroCard` (molde SPEC-010) | implementado | `src/components/ui/HeroCard.tsx` |
| `periodo_historico` nos dados, não renderizado | **gap** | `detail.periodo_historico` existe, não aparece em `ApproachDetailView` |
| Classificação cruzada na taxonomia, não na tela | **gap** | `taxonomia_normalizada.md:36-44` vs. `FamilyDetailView` sem chip |
| Texto inline de camada 1 | **gap** | `ApproachDetailView.tsx:193-195, 219-221, 234-237, 262-267, 280-286` |
| Cabeçalho genérico (não hero) nas 3 subtelas | **gap** | `FamiliesView.tsx:19`, `FamilyDetailView.tsx:25`, `ApproachDetailView.tsx:159` |
| Sem link direto da grade principal para famílias | **gap** | `BibliotecaView.tsx` modo `library` não expõe `mode='families'` |

---

> Regras de escrita em [`AGENTS.md`](../AGENTS.md): pt-BR, zero emoji em `#` e `##`, `caminho:linha` obrigatório, escrito com `write`/`edit`.