# SPEC-035 · Agenda: atenção primeiro, hoje e inbox

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **entregue** (implementação e testes próprios verdes; o `verify`
> completo segue vermelho por dívida pré-existente de outra frente — ver §8)
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §3.2 (recorte do mobile) e §4.2 (Calendário) — **[D]**
> Decisões: D1..D10
> Supersede: **SPEC-024 (D3), na composição da tela**: a lista cronológica de
> 14 dias passa a ser hierarquia de atenção (atrasadas → hoje → inbox →
> próximos prazos), e o mês vira camada secundária colapsada. As demais
> decisões da SPEC-024 (D1, D2, D4..D20) continuam em vigor
> Depende de: SPEC-024 (rota `#/calendario` e agregador `buildCalendarEntries`), SPEC-029 (`TaskSheet`), SPEC-M-018/SPEC-C-014 (voz), ADR-004, ADR-009
> Espelha: — (spec local do mobile; a cópia de grupo é `SPEC-M-031`)
> Data: 2026-11-11
> Handoff de origem: `SPEC-AGENDA-CECIGROUP.md`, recebido em 2026-11-11 fora do repositório

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite
> verificável por comando, está incompleta. Isso é `ADR-004`.

---

## 1. Contexto

- **Situação.** A tela de calendário entrega tudo o que existe, em ordem de
  data, num horizonte de 14 dias. Ela responde "o que vem por aí" e não responde
  "o que merece atenção agora".
- **O que a usuária faz hoje.** Abre a tela, rola a lista de 14 dias procurando
  o que está atrasado, e volta para a Home para ver a tarefa que capturou sem
  prazo. A tarefa sem data não aparece em lugar nenhum desta tela.
- **O que acontece de errado.** (a) Atraso é um dado derivado que existe no
  agregador e não é usado como critério de ordem; (b) tarefa sem prazo é
  invisível — o agregador só projeta o que tem data; (c) o mês ocupa o topo e
  empurra a lista para baixo da dobra.
- **Como se sabe.** `buildCalendarEntries` (`src/lib/schedule.ts`) devolve uma
  lista plana ordenada por `date`; a tela anterior a iterava dia a dia. Nenhuma
  função lia `dueDate < today` para ordenar, e `tasks` sem `dueDate` não geravam
  entrada.

## 2. Decisões

### D1 · A rota continua `calendar`; o produto se chama agenda

- **Decisão.** Mantêm-se `NavScreen { kind: 'calendar' }`, o hash
  `#/calendario`, `openCalendar`/`closeCalendar` e o nome do arquivo
  `CalendarScreen.tsx`. O texto da tela é **agenda**.
- **Justificativa.** O handoff pede que a navegação global não mude, e o hash é
  contrato de deep link (`packages/navigation/src/hash.ts`). Renomear rota não
  muda nada para quem usa o app.
- **Alternativa rejeitada.** Renomear tipo, rota e hash para `agenda`: quebra
  link salvo, `closeCalendar`, a barra contextual e os testes de rota, e não
  entrega nenhum ganho visível.
- **Consequência aceita.** Código e produto divergem no nome. A divergência está
  declarada no topo de `src/components/views/CalendarScreen.tsx` e aqui.

### D2 · Um view model derivado: `buildAgenda`

- **Decisão.** `buildAgenda` (`src/lib/agenda.ts:137`) recebe as coleções, o
  `today` e a data selecionada, e devolve atenção, dia, inbox, próximos prazos,
  contadores e tom. Eventos vêm de `buildCalendarEntries` chamado com
  `tasks: []`; tarefas vêm de `tasks`.
- **Justificativa.** Tarefa e evento são coisas diferentes: tarefa tem estado,
  evento não. Se a tarefa entra no agregador, ela vira "evento de dia inteiro" e
  a tarefa sem data — que é o caso a resolver — desaparece.
- **Alternativa rejeitada.** Alimentar a lista com `buildCalendarEntries`
  completo e derivar a inbox de uma segunda passada: duplica o pipeline e
  reintroduz a tarefa como pseudo-evento.
- **Consequência aceita.** A tela chama `buildCalendarEntries` duas vezes com
  outro fim (mês e indicador da faixa de dias), com `tasks: []` nas duas. Um
  pipeline para a lista, outro para a grade — os dois puros.

### D3 · A ordem é de atenção, não de data

- **Decisão.** A seção "atenção primeiro" ordena por baldes, e cada balde
  ordena por si (`src/lib/agenda.ts:242-249`): atrasadas → eventos de hoje →
  tarefas de hoje → amanhã → provas nos próximos 7 dias → prioridade alta nos
  próximos 7 dias → eventos nos próximos 7 dias → resto datado até 14 dias. A
  seção mostra no máximo 5 itens e conta o resto.
- **Justificativa.** A pergunta da tela é "o que merece atenção agora"; uma
  atrasada de ontem importa mais que uma aula daqui a dez dias.
- **Alternativa rejeitada.** Lista cronológica de 14 dias (SPEC-024 D3):
  responde "o que vem", não "o que fazer primeiro", e é o que a tela já fazia.
- **Consequência aceita.** Um item distante e importante pode não caber nos 5
  primeiros. O contador `+N itens esperando` existe para isso, e as seções "dia"
  e "próximos prazos" mostram o resto sem corte.

### D4 · Dois conceitos, dois controles

- **Decisão.** Tarefa tem checkbox de conclusão (`AgendaTaskRow`,
  `src/components/agenda/AgendaTaskRow.tsx:38`); evento não tem nenhum e usa
  `CalendarEntryRow`, que já existe.
- **Justificativa.** O domínio do mobile não tem estado de execução de evento:
  evento acontece, não se conclui.
- **Alternativa rejeitada.** Checkbox único para os dois: cria estado que o
  domínio não tem e faz o evento parecer pendência.
- **Consequência aceita.** O atraso só pode ser dito de tarefa. Evento nunca
  aparece com o selo "atrasada".

### D5 · Tarefa sem data é válida e mora na inbox

- **Decisão.** A criação mínima é título + guardar: o `TaskSheet` ganhou o
  botão "guardar só com o título" (`src/components/views/home/TaskSheet.tsx:212`).
  Tarefa sem `dueDate` entra na inbox, que é uma seção com contador e CTA. A
  data contextual selecionada continua sendo o padrão do formulário (handoff
  §11.4) — por isso a captura rápida a partir da Agenda nasce datada; para
  criar sem data, o campo é limpo no passo do prazo.
- **Justificativa.** Capturar é o momento frágil: exigir prazo faz a ideia
  desaparecer.
- **Alternativa rejeitada.** Exigir data para salvar, ou salvar sempre na
  inbox ignorando a data selecionada: a primeira perde a captura, a segunda
  contradiz o default contextual e o `+` do dia (SPEC-024 D20).
- **Consequência aceita.** A inbox é um lugar permanente da tela, não um estado
  de erro.

### D6 · O mês é camada secundária

- **Decisão.** O mês começa colapsado, atrás do botão "mês" com
  `aria-expanded`, e reusa `CalendarMonth`
  (`src/components/views/faculdade/CalendarMonth.tsx`).
- **Justificativa.** O mês serve para navegar para longe, não para responder a
  pergunta de hoje; fixo no topo, ele empurra a atenção para baixo da dobra.
- **Alternativa rejeitada.** Mês sempre visível acima da lista: duas leituras
  competindo pelo mesmo espaço em 390px.
- **Consequência aceita.** Quem quer o mês toca uma vez. A faixa de sete dias
  continua sempre visível, com indicador textual de dia com item.

### D7 · Cinco recortes automáticos, nenhum filtro manual

- **Decisão.** Chips `tudo` · `atrasadas` · `hoje` · `próximos prazos` · `sem
  data`, com contador e `aria-pressed` (`src/components/agenda/AgendaQuickFilters.tsx`).
  Filtro sem resultado oferece "limpar filtros" e "adicionar". `itemsForFilter`
  (`src/lib/agenda.ts:285`) serve só os quatro recortes; `tudo` é a hierarquia.
- **Justificativa.** Os cinco recortes são derivados do dado que já existe; não
  há estado de filtro a manter nem combinação a testar.
- **Alternativa rejeitada.** Filtro por disciplina, prioridade ou intervalo de
  datas: volume que não existe, estado a persistir e matriz de combinações.
- **Consequência aceita.** Não dá para ver "só as tarefas de psicopatologia"
  nesta tela.

### D8 · A voz mora no `voice.ts`

- **Decisão.** As frases novas são chaves de `VAZIO`, `DICA` e `CELEBRACAO` em
  `src/lib/voice.ts:224-229` e `:547-550`; nenhum componente escreve frase.
- **Justificativa.** É a regra do grupo (SPEC-M-018 D16 / SPEC-C-014 D7), e o
  gate de voz reprova frase inline.
- **Alternativa rejeitada.** Frase inline no componente: reprovada pelo gate.
- **Consequência aceita.** As frases da Agenda entram na contagem de chaves com
  consumidor do teste D12.

### D9 · Nada é persistido; o schema não sobe

- **Decisão.** `SCHEMA_VERSION` continua `22`
  (`packages/data/src/schema.ts:13`). O card do Cecinho ser dispensado é estado
  de sessão; o recorte de filtro é estado de componente.
- **Justificativa.** Nada de novo é gravado. Mudança de UI não dá bump.
- **Alternativa rejeitada.** Persistir "card dispensado" e planejamento
  (data/hora de execução da tarefa): exige chave nova, seed em
  `src/data/empty.ts` e migração versionada.
- **Consequência aceita.** O card volta a cada montagem da tela. Planejamento
  por tarefa fica fora desta spec (§4).

### D10 · O código morto do calendário antigo sai

- **Decisão.** Saem `src/components/calendar/*` (9 componentes) e
  `src/lib/personalCalendar.ts` com o teste dele.
- **Justificativa.** Eram o caminho antigo, sem chamador em produção depois de
  `buildAgenda`; manter código morto ao lado do novo é a origem de duas fontes
  de verdade.
- **Alternativa rejeitada.** Manter "por segurança": o histórico do git guarda
  melhor que uma pasta morta.
- **Consequência aceita.** O teste `personalCalendar.test.ts` foi removido junto
  com o módulo; ele provava um caminho que nenhuma tela usava.

## 3. Escopo

| Item | Tipo |
|---|---|
| `buildAgenda` + `itemsForFilter` + tipos do view model | código |
| Composição nova de `CalendarScreen` (cabeçalho, faixa, mês, card, chips, seções) | código |
| `src/components/agenda/` — faixa de datas, chips, linha de tarefa, card do Cecinho, ação de criação | código |
| Captura mínima no `TaskSheet` + toast por contexto | código |
| Chaves de voz da Agenda | código |
| Deleção de `src/components/calendar/*` e `src/lib/personalCalendar.ts` (+ teste) | código |
| Testes de view model e de tela | gate |

**Nenhuma mudança de schema.** Nada novo é persistido, nada é migrado.

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Planejamento (reservar horário para uma tarefa) | exige campo persistido novo e migração (D9); é o próximo passo, não este |
| Adiar / remarcar em um toque | precisa decidir se reescreve `dueDate` ou cria histórico — decisão de domínio, não de tela |
| Filtro manual combinado | D7 |
| Skeleton de carregamento e erro parcial | o dado é síncrono e local; não existe latência a representar |
| Notificação/lembrete a partir da Agenda | já existe caminho em `planExamReminders`/TCC; esta spec não cria plano novo |
| Recorrência, camada `google`, agenda do celular | herdado da SPEC-024 §4 |
| Grade de horários | SPEC-024 D3 continua valendo |

## 5. Contrato

Nada cruza para o outro app. É agregação e apresentação sobre dado que o mobile
já possui (`ADR-009`).

| Artefato | O que é | Onde |
|---|---|---|
| `AgendaViewModel` | atenção, `attentionRest`, dia selecionado, inbox, próximos prazos, contadores, tom, `empty` | `src/lib/agenda.ts:54-69` |
| `AgendaItem` | `AgendaTaskItem` (tarefa, com `overdue`) ou `AgendaEventItem` (evento, sem estado) | `src/lib/agenda.ts:33-49` |
| `AgendaFilter` | `tudo` · `atrasadas` · `hoje` · `proximos` · `sem-data` | `src/lib/agenda.ts:30` |
| `buildAgenda` | função pura; relógio por parâmetro | `src/lib/agenda.ts:137` |
| `itemsForFilter` | conjunto que um recorte mostra | `src/lib/agenda.ts:285` |

**Fonte dos eventos:** `buildCalendarEntries` (SPEC-024 D4), sem alteração.
**Fonte das tarefas:** `tasks` do slice de cursos. Nenhuma cópia, nenhum
duplicado.

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | `buildAgenda` é puro: nenhum `Date.now()`, `today` e `selectedDate` chegam por parâmetro | `src/lib/agenda.ts` | `src/lib/__tests__/agenda.test.ts` |
| I2 | Montar a tela não escreve: nenhuma chamada de escrita no render | `src/components/views/CalendarScreen.tsx` | `CalendarScreen.test.tsx` ("montar a tela não altera o dado semeado") |
| I3 | Tarefa sem `dueDate` nunca ganha data inventada e nunca aparece em seção de dia | `src/lib/agenda.ts` | `agenda.test.ts` ("sem data vai para a inbox") |
| I4 | Toda tarefa listada tem checkbox de conclusão; nenhum evento tem | `AgendaTaskRow.tsx` | `CalendarScreen.test.tsx` ("evento não tem checkbox de tarefa; tarefa tem") |
| I5 | Atraso é derivado (`dueDate < today`), nunca persistido, e só tarefa pode estar atrasada | `src/lib/agenda.ts` | `agenda.test.ts` ("atrasada não vira evento") |
| I6 | Um item aparece uma vez só na atenção, mesmo quando cabe em dois baldes | `src/lib/agenda.ts` (`Set` em `push`) | `agenda.test.ts` ("atenção não repete item") |
| I7 | A data do mês é `DateKey`; dezembro e janeiro não colidem | `CalendarMonth` (SPEC-024 I10) | `CalendarScreen.test.tsx` ("o dia 5 de dezembro não marca o dia 5 de janeiro") |
| I8 | Filtro sem resultado sempre oferece "limpar filtros" | `CalendarScreen.tsx` | `CalendarScreen.test.tsx` ("oferece limpar os filtros") |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Tarefa concluída com prazo hoje | aparece na seção "dia" (riscada), não na atenção |
| Tarefa atrasada | aparece na atenção **e** na seção do dia dela; os dois lugares são seções diferentes, não duplicata |
| Dia selecionado fora da janela de 14 dias | a janela estica até ele (`from`/`to` em `buildAgenda`) e o dia aparece inteiro |
| Evento sem horário | ordena depois dos que têm hora no mesmo dia (`99:99`) |
| 7 itens de atenção | mostra 5 e `+ 2 itens esperando por você ♡` |
| Inbox com 4 tarefas | card mostra `4 sem data` e abre o recorte `sem data` |
| Nada marcado em lugar nenhum | seção de vazio com "adicionar tarefa" e "adicionar evento" |
| TCC não iniciado | a porta "reunião do tcc" não aparece no `+` |
| Tarefa sem data e sem disciplina | linha sem meta; selo "sem data" |
| Dois itens com o mesmo título no mesmo dia | dois itens, `id` distintos |
| Recorte ativo sem item | vazio do filtro + "limpar filtros" + "adicionar" |

## 8. Critérios de aceite

Medidos em 2026-11-11 nesta árvore de trabalho:

- [x] `npx vitest run src/lib/__tests__/agenda.test.ts` → 17 testes verdes
- [x] `npx vitest run src/components/views/__tests__/CalendarScreen.test.tsx` → 14 testes verdes
- [x] `npx tsc --noEmit` → zero erro nos arquivos desta spec. A árvore tem erro
      pré-existente em `src/components/wizards/__tests__/*`,
      `src/lib/contextBarConfig.ts` e `src/lib/profileViewModel.ts` — dívida de
      outra frente, fora desta spec
- [ ] `node .github/scripts/check-boundaries.mjs` → **vermelho** por
      `src/components/views/perfil/ProfileEditSheet.tsx:143` (frase inline da
      frente de biblioteca), fora desta spec
- [ ] `npm run test` → **vermelho** por 16 arquivos pré-existentes
      (wizards/a11y, terms, motion, notifications, `TaskSheet.test.tsx`,
      `voice.test.ts`); nenhum deles é desta spec
- [x] `rg "personalCalendar|components/calendar" src` → vazio
- [x] `rg "SCHEMA_VERSION = " packages/data/src/schema.ts` → continua `22`

> O gate completo só fica verde quando as duas dívidas acima fecharem. Elas
> estão registradas, não escondidas: esta spec não se declara verificada pelo
> `verify` enquanto ele estiver vermelho por outro motivo.

## 9. Medição

| Métrica | Como medir | Antes | Depois | Gate |
|---|---|---|---|---|
| Pixels de tela antes do primeiro item de atenção | inspeção em 390px | mês + cabeçalho (~520px) | faixa + card + chips (~300px) | revisão de UI |
| Tarefas sem data visíveis na tela | `rg "inbox" src/components/views/CalendarScreen.tsx \| wc -l` | 0 | ≥ 1 | critério de aceite |
| Componentes mortos do calendário | `rg -l "components/calendar" src \| wc -l` | 9 | 0 | critério de aceite |
| Fontes do view model | `rg "export function build" src/lib/agenda.ts \| wc -l` | — | 2 (`buildAgenda`, `itemsForFilter`) | inspeção no PR |
| Testes do view model | `npx vitest run src/lib/__tests__/agenda.test.ts` | — | 17 | critério de aceite |

## 10. Riscos

| Risco | Mitigação |
|---|---|
| O `+` flutuante cobre o último item da lista | `pb-24` no contêiner e `bottom-[calc(5.5rem+env(safe-area-inset-bottom))]`; o botão fica acima da barra inferior, nunca sobre ela |
| Limite de 5 esconde algo importante | contador explícito e as seções "dia"/"próximos prazos" mostram tudo |
| Captura rápida a partir de um dia nasce datada e a usuária esperava inbox | o toast diz onde a tarefa foi parar; o campo de prazo pode ser limpo no passo 3 |
| `buildAgenda` chamar `buildCalendarEntries` duas vezes por render | ambas as chamadas estão em `useMemo` com dependências estáveis |
| A tela é o único lugar que fala "agenda" e o código fala "calendar" | declarado em D1 e no comentário do arquivo; quem procura acha pelo hash |

## 11. Rastreabilidade

| Decisão | Código | Teste | Gate |
|---|---|---|---|
| D1 | `src/components/views/CalendarScreen.tsx:52` | `CalendarScreen.test.tsx` ("o cabeçalho diz agenda") | `npm run test` |
| D2 | `src/lib/agenda.ts:137-282` | `agenda.test.ts` | `npm run test` |
| D3 | `src/lib/agenda.ts:212-252` | `agenda.test.ts` ("a atrasada aparece antes da futura") | `npm run test` |
| D4 | `src/components/agenda/AgendaTaskRow.tsx:38` | `CalendarScreen.test.tsx` (CF-003) | `npm run test` |
| D5 | `src/lib/agenda.ts:173-176`, `TaskSheet.tsx:204-213` | `CalendarScreen.test.tsx` (CF-004/CF-005) | `npm run test` |
| D6 | `CalendarScreen.tsx:226-243` | `CalendarScreen.test.tsx` (mês) | `npm run test` |
| D7 | `src/lib/agenda.ts:285-305`, `AgendaQuickFilters.tsx` | `agenda.test.ts`, `CalendarScreen.test.tsx` (CF-008) | `npm run test` |
| D8 | `src/lib/voice.ts:224-229`, `:547-550` | `voice.test.ts` (D12) | `test:voz` |
| D9 | `packages/data/src/schema.ts:13` | — | `verify:contract` |
| D10 | `src/lib/agenda.ts` substitui o caminho antigo | `rg` vazio no critério de aceite | `check-boundaries` |

## 12. Reconciliação com a SPEC-024

| SPEC-024 | Estado depois desta spec |
|---|---|
| D1 (tela empilhada, rota `#/calendario`) | **em vigor** — é o que D1 preserva |
| D2 (sub-aba `calendario` sai da Faculdade) | **em vigor** |
| D3 (agenda de 14 dias + mês) | **substituída na composição** por D3/D6: hierarquia de atenção, mês colapsado. O horizonte de 14 dias continua sendo a janela de "próximos prazos" |
| D4 (agregador único de eventos) | **em vigor** — `buildAgenda` consome `buildCalendarEntries` |
| D5 (criar pelo dia, reusando as folhas) | **em vigor** — o `+` abre as mesmas portas |
| D6 (data é `DateKey`) | **em vigor** |
| D7..D18 (TCC, palavras, ritmo, lembretes) | **em vigor** — fora do recorte desta spec |
| D19 (tarefa abre o gerenciar) | **em vigor** |
| D20 (o `+` abre o formulário datado) | **em vigor** — D5 desta spec explica por que a captura rápida herda essa data |

A reconciliação item a item mora **aqui** e não se repete em outro documento.
