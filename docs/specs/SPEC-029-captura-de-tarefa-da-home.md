# SPEC-029 · Captura de tarefa da Home que fecha, e uma chave de voz que não quebra a tela

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **em andamento** (2026-10-30)
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §4.1 (Home) e §4.2 (Calendário) — **[D]**
> Decisões: D1..D4
> Supersede: —
> Depende de: SPEC-024 (Calendário e controle do TCC), SPEC-M-018 / SPEC-C-014 (voz do cecinho)
> Espelha: — (spec local do mobile)
> Data: 2026-10-30

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite
> verificável por comando, está incompleta. Isso é `ADR-004`.

---

## 1. Contexto

- **Situação.** A Home tem um botão "adicionar tarefa"
  (`src/components/views/home/AttentionSection.tsx:103-111`) que abre a folha
  `TaskSheet` (`src/components/views/home/TaskSheet.tsx`), em quatro passos:
  título, categoria, prioridade, disciplina e prazo.
- **O que a usuária faz hoje.** Abre a Home, toca em "adicionar tarefa",
  escreve o que tem que fazer, atravessa os passos e toca em "guardar tarefa".
- **O que acontece.** A tarefa **é gravada**, mas a folha **não fecha**: a
  confirmação chama `frase(CELEBRACAO, 'tarefaSalva')`
  (`src/components/views/home/TaskSheet.tsx:87`) e essa chave **não existe** no
  catálogo. `frase()` lança `Error` em chave ausente
  (`src/lib/voice.ts:1117-1125`), o que aborta o handler **antes** de
  `onClose()` (linha 88). O resultado na tela: a folha continua aberta, o
  erro vai para o console e, se a usuária toca em "guardar" de novo, uma
  **segunda** tarefa é gravada.
- **Como se sabe que isso é um problema.** (a) Relato da usuária: o botão
  "buga muito" (2026-10-30). (b) `frase()` lança em chave ausente
  (`src/lib/voice.ts:1122`) e a chave pedida não está no catálogo
  (`src/lib/voice.ts:651-802`): o caminho `tarefaSalva` não existe; o caminho
  equivalente existe (`tarefaGuardadaPlano`, `src/lib/voice.ts:768`) e é o que
  o wizard completo usa (`src/components/wizards/TaskExamWizard.tsx:417`).
  (c) Nenhum gate do app acusava isso: o gate de voz
  (`.github/scripts/voz-gate.mjs`) reprova frase **escrita inline**, e o teste
  D12 (`src/lib/__tests__/voice.test.ts:476-525`) reprova chave **sem
  consumidor** — não chave **pedida e inexistente**.
- **A mesma classe de bug em outro lugar.** O recado do cecinho no Calendário
  pede `DICA.diaCalmo` (`src/components/calendar/CecinhoCalendarNote.tsx:14`),
  chave que também não existe. `toneOf` devolve `'calm'` quando a semana tem
  1 ou 2 aulas e nada marcado hoje ou amanhã
  (`src/lib/personalCalendar.ts:258`) — um caso comum, e aí a tela do Calendário
  quebra. O catálogo tem a chave do mesmo tom: `DICA.diaTranquilo`
  (`src/lib/voice.ts:349`).

## 2. Decisões

### D1 · O fechamento da folha não depende da voz

- **Decisão.** A confirmação da tarefa gravada usa a chave que existe
  (`tarefaGuardadaPlano`), e a folha fecha **antes** do toast: a ordem passa a
  ser gravar → vibrar → fechar → avisar.
- **Justificativa.** `frase()` lança em chave ausente
  (`src/lib/voice.ts:1117-1125`) e o `showToast` ficava **antes** do `onClose()`
  (`src/components/views/home/TaskSheet.tsx:87-88`): uma frase quebrada
  derrubava a gravação visível do fluxo. Inverter a ordem tira a dependência:
  mesmo que uma frase quebre no futuro, a tarefa fica gravada e a folha
  fecha.
- **Alternativa rejeitada.** Envolver o `showToast` em `try/catch`: esconde o
  defeito e mantém a tela dependente de uma exceção. O defeito tem que ser
  visível no gate, não engolido no `catch`.
- **Consequência aceita.** O toast aparece depois do fechamento — a ordem dos
  dois eventos no mesmo quadro muda, e o aviso chega com a folha já fechada.
  A folha não é mais uma barreira para a confirmação.

### D2 · Um toque em "guardar" grava uma tarefa

- **Decisão.** O botão de gravar fica desabilitado enquanto a gravação está em
  curso, e o bloqueio só é solto na abertura seguinte da folha.
- **Justificativa.** O estado `busy` existia mas não era lido por ninguém
  (`src/components/views/home/TaskSheet.tsx:42`, `75`, `89`): era setado e
  limpo no mesmo tick, então nunca chegava ao botão. Com a folha fechada pelo
  defeito de D1, o toque repetido virava **duplicata** silenciosa.
- **Alternativa rejeitada.** Confiar no fechamento da folha para impedir o
  segundo toque: enquanto a folha estiver aberta (o defeito de D1), o segundo
  toque passa.
- **Consequência aceita.** O botão fica inerte durante a animação de saída da
  folha. O estado volta a `false` na abertura seguinte, não no mesmo toque.

### D3 · O recado do Calendário no tom calmo usa a chave que existe

- **Decisão.** O tom `'calm'` do recado do cecinho aponta para
  `DICA.diaTranquilo` (`src/lib/voice.ts:349`), que é a chave do mesmo tom no
  catálogo.
- **Justificativa.** O mapa de tom para chave já previa o caso
  (`src/components/calendar/CecinhoCalendarNote.tsx:13-19`); o que não batia era
  o **nome** da chave. `diaTranquilo` é a frase do próprio catálogo para "dia
  leve" — não há copy nova.
- **Alternativa rejeitada.** Criar a chave `diaCalmo`: copy nova para um tom que
  o catálogo já cobre, e a frase nova precisaria de revisão da dona do
  produto.
- **Consequência aceita.** O recado do tom calmo passa a ser "hoje está leve
  ♡" em vez de uma frase própria do Calendário.

### D4 · O gate de voz reprova chave pedida e inexistente

- **Decisão.** Um teste varre o código de produção e reprova qualquer
  `frase(CATÁLOGO, 'chave')` literal cuja chave não esteja no catálogo.
- **Justificativa.** Os dois gates que já existiam cobriam outras duas falhas:
  o gate de voz accuse frase **inline** (`.github/scripts/voz-gate.mjs`) e o
  teste D12 acuse chave **sem consumidor** (`src/lib/__tests__/voice.test.ts`).
  Nenhum dos dois via a falha que quebrou a Home: chave pedida, com
  consumidor, e ausente do catálogo.
- **Alternativa rejeitada.** Confiar na revisão manual do catálogo a cada
  frase nova: já falhou duas vezes, em dois arquivos diferentes, no mesmo mês.
- **Consequência aceita.** O gate só enxerga chave **literal**. O mapa de tom
  do recado (`src/components/calendar/CecinhoCalendarNote.tsx:13-19`) resolve a
  chave por variável e fica fora do alcance do gate — a limitação fica
  escrita no próprio teste, para não parecer cobertura maior do que é.

## 3. Escopo

| Item | Tipo |
|---|---|
| `src/components/views/home/TaskSheet.tsx` — chave da confirmação, ordem das operações, bloqueio de toque repetido | código |
| `src/components/calendar/CecinhoCalendarNote.tsx` — chave do tom `'calm'` | código |
| `src/components/views/home/AttentionSection.tsx` — `hover:` do botão "adicionar tarefa" | código |
| `src/lib/__tests__/voice.test.ts` — gate de chave pedida e inexistente | gate |
| `src/components/views/home/__tests__/TaskSheet.test.tsx` — regressão do fluxo de gravar | teste |
| `docs/specs/SPEC-029-captura-de-tarefa-da-home.md` | doc |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Id da tarefa gerado por `Date.now()` (`src/components/views/home/TaskSheet.tsx:78`) | O defeito que produzia duplicata era o toque repetido (D2). O padrão `Date.now()` é do app inteiro (`src/components/wizards/TaskExamWizard.tsx:374`); trocar só aqui cria dois padrões sem ganho observável. Registrado como dívida. |
| `defaultDate` reativo no `TaskSheet` | Quem usa `defaultDate` é o Calendário (`src/components/views/CalendarScreen.tsx:208`), e o overlay impede trocar o dia com a folha aberta. O caso é teórico. |
| Obrigatoriedade de categoria, prioridade, disciplina e prazo | Decisão de produto sobre o quanto a folha exige. Hoje só o título é obrigatório. |
| Confirmação ao fechar a folha com dados digitados | Decisão de produto sobre perder o que foi digitado ao tocar fora. |
| Copy nova no catálogo de voz | As duas correções reaproveitam chaves que já existem (D1, D3). |
| `TaskExamWizard.tsx` e o resto do app | A correção é local ao fluxo da Home; o gate novo (D4) cobre o resto sem exigir mudança. |

## 5. Contrato

- **Assinatura / formato**: `frase(catalogo: Catalogo, chave: string, params?): string`
  (`src/lib/voice.ts:1117`). Chave ausente **lança**; o contrato não muda.
- **Invariante**: toda chave pedida em código de produção existe no catálogo
  correspondente.
- **Quem consome**: a Home (`TaskSheet`), o Calendário
  (`CecinhoCalendarNote`) e o gate de voz (D4).

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | Gravar uma tarefa fecha a folha, mesmo que a frase da confirmação falhe | `src/components/views/home/TaskSheet.tsx` | `src/components/views/home/__tests__/TaskSheet.test.tsx` |
| I2 | Nenhuma chave de voz pedida em código de produção está ausente do catálogo | `src/lib/__tests__/voice.test.ts` | `src/lib/__tests__/voice.test.ts` |
| I3 | Um toque em "guardar tarefa" grava exatamente uma tarefa | `src/components/views/home/TaskSheet.tsx` | `src/components/views/home/__tests__/TaskSheet.test.tsx` |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Título vazio | "continuar" não avança e mostra o aviso (comportamento atual, `src/components/views/home/TaskSheet.tsx:161-165`). |
| Sem disciplina escolhida | A tarefa é gravada sem `disciplineId` (`src/components/views/home/TaskSheet.tsx:80`). |
| Sem prazo escolhido | A tarefa é gravada sem `dueDate` (`src/components/views/home/TaskSheet.tsx:82`). |
| Toque repetido em "guardar tarefa" | Uma tarefa só (D2). |
| Frase de voz ausente no futuro | A folha fecha e a tarefa fica gravada (D1). |
| Calendário com 1 ou 2 aulas na semana e nada marcado hoje ou amanhã | O recado do cecinho renderiza no tom calmo (D3). |
| Recado do cecinho com chave resolvida por variável | Fica fora do alcance do gate (limitação declarada em D4). |

## 8. Critérios de aceite

- [ ] `npm run lint` sai com 0
- [ ] `npm run test` sai com 0
- [ ] `node .github/scripts/check-boundaries.mjs` sai com 0
- [ ] `npm run test -- src/lib/__tests__/voice.test.ts` sai com 0
- [ ] `npm run test -- src/components/views/home/__tests__/TaskSheet.test.tsx` sai com 0

## 9. Medição

| Métrica | Como medir | Antes | Depois | Gate |
|---|---|---|---|---|
| Chaves de voz pedidas e inexistentes no código de produção | `npm run test -- src/lib/__tests__/voice.test.ts` | 2 | 0 | o mesmo comando |
| Tarefas gravadas por toque em "guardar tarefa" | `npm run test -- src/components/views/home/__tests__/TaskSheet.test.tsx` | 2 | 1 | o mesmo comando |
| Folha fechada depois de gravar | `npm run test -- src/components/views/home/__tests__/TaskSheet.test.tsx` | não | sim | o mesmo comando |

## 10. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| O gate novo acusar uma chave resolvida por variável | média | gate vermelho sem defeito real | o gate só valida literal; o caso dinâmico fica escrito no teste |
| Inverter a ordem (fechar antes do toast) fazer o aviso não aparecer | baixa | a usuária não vê a confirmação | `showToast` não depende da folha; o teste cobre a chamada |
| `diaTranquilo` não ser o tom esperado para `'calm'` no Calendário | média | recado fora de contexto | é a chave do catálogo para "dia leve"; a escolha do texto é da dona do produto |
| O bloqueio de toque repetido prender a folha se o `onClose` não chegar | baixa | folha travada | o bloqueio é solto na abertura seguinte, e o `onClose` é a última chamada da gravação |

## 11. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `src/components/views/home/TaskSheet.tsx` | `src/components/views/home/__tests__/TaskSheet.test.tsx` | `npm run test` |
| D2 | `src/components/views/home/TaskSheet.tsx` | `src/components/views/home/__tests__/TaskSheet.test.tsx` | `npm run test` |
| D3 | `src/components/calendar/CecinhoCalendarNote.tsx` | `src/lib/__tests__/voice.test.ts` | `npm run test` |
| D4 | `src/lib/__tests__/voice.test.ts` | `src/lib/__tests__/voice.test.ts` | `npm run test` |
