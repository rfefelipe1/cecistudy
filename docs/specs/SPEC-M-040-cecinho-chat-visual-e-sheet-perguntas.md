# SPEC-M-040 · Cecinho: chat visual, sheet de perguntas e resposta streamada

> Status: em andamento (implementada; validação visual no app pendente)
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §Cecinho Agent (SPEC-M-037)
> Decisões: D1, D2, D3, D4, D5, D6, D7, D8, D9
> Supersede: nada
> Depende de: SPEC-M-037 (domínio do Cecinho Agent), SPEC-M-039 (integração com o gateway)

## Contexto

A tela de conversa do Cecinho Agent funciona, mas é visualmente fria e não dá feedback de estado durante a sincronização com o gateway. Quando o agente faz perguntas, a usuária responde direto no input da bolha da pergunta; não há um fluxo guiado de pergunta → resposta → confirmação. A resposta do agente chega inteira via polling, sem efeito de digitação, e não há indicação de que o Cecinho está "pensando" enquanto processa. O usuário quer uma conversa mais fluida, com o visual do personagem (voice do Cecinho) refletido na tela.

## Problema que será resolvido

- O header da tela de chat ocupa espaço visual que deveria ser da conversa.
- Perguntas do agente aparecem como bolhas comuns, sem um fluxo de resposta guiado.
- Não há feedback visual de "pensando/enviando" durante a sincronização com o gateway.
- A resposta do agente surge de uma vez, sem efeito de digitação (streaming).
- O envio da resposta da usuária não fica bloqueado enquanto o agente está streamando, o que pode criar sobreposição de mensagens.

## Escopo

Dentro do escopo:

- Ocultar o header da app dentro da tela de conversa do Cecinho (mantém título da tarefa e pílula de estado).
- Bottom sheet (`Modal position="bottom"`) que abre assim que o agente tem perguntas pendentes.
- Uma pergunta por etapa, com botão "Próxima" para avançar.
- Quarta e última etapa: mostra a resposta digitada pela usuária para confirmação de envio.
- Ao confirmar, a resposta é jogada direto no chat como mensagem da usuária (`role: 'user', kind: 'text'`).
- Thinking loader (pílula "pensando…") dentro da bolha do agente, com fases em português e voice do Cecinho, tudo minúsculo.
- Streaming da resposta do agente: híbrido — exibe o que chega da cadeia com passo mínimo para não piscar.
- Desabilitar o campo de envio enquanto há streaming ativo.
- Voice do Cecinho nas respostas e frases do loader.

Fora do escopo:

- Alterar o domínio do agente (regras de atraso, sobreposição, plano) — continua em `src/agent/domain/*`.
- Alterar o contrato do gateway (`payload.history`, `kind`, CORS) — já definido em SPEC-M-039.
- Persistência nova (nenhuma tabela ou chave de storage nova).
- Desktop `cecistudy-desktop` — não toca.

## Requisitos funcionais

**RF1 — Header oculto.** Quando a tela de conversa do Cecinho está aberta, o header da app some; só permanecem o título da tarefa, a pílula de estado e o rodapé de envio.

**RF2 — Sheet de perguntas.** Ao receber uma resposta do gateway com `questions` pendentes, abre um bottom sheet com a primeira pergunta. Cada etapa exibe uma pergunta e um botão "Próxima".

**RF3 — Etapa de confirmação.** A última etapa do sheet mostra o texto digitado pela usuária para ela confirmar o envio. Sem edição; ao confirmar, fecha o sheet e insere a resposta no chat como mensagem de `role: 'user', kind: 'text'`.

**RF4 — Sem atalhos de resposta.** Dentro do sheet, só há input de texto livre. Não há botões "não sei" nem "depois" como atalho; se ela quiser, digita o texto.

**RF5 — Thinking loader.** Durante o envio da mensagem e a sincronização com o gateway, aparece uma pílula dentro da bolha do agente com fases em português, tudo minúsculo, seguindo o voice do Cecinho (ex.: "analisando a tarefa", "montando o plano", "escrevendo a resposta").

**RF6 — Streaming da resposta.** A resposta do agente aparece aos poucos (efeito de digitação). Controle híbrido: exibe o que chega da cadeia, com passo mínimo de UI para não piscar.

**RF7 — Envio bloqueado durante streaming.** Enquanto a resposta do agente está streamando, o campo de envio fica desabilitado.

**RF8 — Voice do Cecinho.** Frases do loader, estados da pílula e cópia da tela usam `src/lib/voice.ts` (família `cecinho*`), nunca texto inline no componente.

## Requisitos não funcionais

**RNF1 — Sem novas dependências.** Reutiliza `lucide-react` (já instalado), Tailwind 4 e o `Modal` existente (`src/components/ui/Modal.tsx` com `position="bottom"`).

**RNF2 — Nenhuma regra de negócio nova na UI.** A UI só cola domínio e sync; não cria invariantes.

**RNF3 — Acessibilidade.** O sheet tem label de diálogo, foco no input ao abrir e navegação por teclado entre etapas.

## Comportamentos esperados

| Gatilho | Comportamento |
|---------|---------------|
| Abrir conversa do Cecinho | Header da app some; mostra título da tarefa + pílula de estado |
| Agente faz 1–3 perguntas | Abre bottom sheet, uma pergunta por etapa, com "Próxima" |
| Última etapa do sheet | Mostra resposta digitada; botão de confirmação |
| Confirmar resposta | Fecha o sheet; insende `role: 'user', kind: 'text'` no chat |
| Envio de mensagem / sincronização | Thinking loader na bolha do agente, fases em português minúsculo |
| Resposta do agente chegando | Streaming híbrido (cadeia dita o ritmo, passo mínimo de UI) |
| Streaming ativo | Campo de envio desabilitado |

## Fluxo de funcionamento

1. Usuária envia mensagem no chat → `useCecinho.ask()` enfileira job → thinking loader aparece na bolha do agente.
2. Gateway responde com `messages` (texto + `questions`) → `applyRemoteJob` apende as mensagens e abre o sheet se houver `questions` pendentes.
3. Sheet mostra a primeira pergunta → usuária digita → "Próxima" avança para a próxima pergunta.
4. Última etapa → mostra a resposta para confirmação → confirma fecha o sheet e insere a resposta como mensagem de usuária no chat.
5. Enquanto o agente processa/responde, thinking loader com fases em português minúsculo; campo de envio desabilitado durante o streaming.

## Regras de negócio (D1..D9)

**D1** (Decidido) — Header da app oculto dentro da tela de conversa do Cecinho.  
**Alternativa rejeitada:** manter o header da app (ocupa espaço que é da conversa).  
**Consequência:** navegação só pelo botão de voltar interno da tela.

**D2** (Decidido) — Bottom sheet de perguntas com `Modal position="bottom"`, uma pergunta por etapa.  
**Alternativa rejeitada:** perguntas como bolhas de chat com input inline.  
**Consequência:** fluxo guiado, mais claro, mas requer novo componente de sheet.

**D3** (Decidido) — Última etapa é confirmação de envio, sem edição.  
**Alternativa rejeitada:** permitir editar antes de enviar.  
**Consequência:** menos atrito, resposta vai direto para o chat.

**D4** (Decidido) — Sem atalhos "não sei"/"depois" no sheet; só input de texto.  
**Alternativa rejeitada:** botões rápidos de resposta.  
**Consequência:** a usuária digita se quiser; o domínio já aceita "não sei"/"depois" como texto livre.

**D5** (Decidido) — Thinking loader dentro da bolha do agente, fases em português minúsculo, voice do Cecinho.  
**Alternativa rejeitada:** loader apenas no rodapé da tela.  
**Consequência:** feedback contextual, ligado à bolha do agente.

**D6** (Decidido) — Streaming híbrido: exibe o que chega da cadeia com passo mínimo de UI.  
**Alternativa rejeitada:** timer fixo da UI independente da rede.  
**Consequência:** respeita a latência real do gateway, sem piscar.

**D7** (Decidido) — Campo de envio desabilitado durante o streaming.  
**Alternativa rejeitada:** permitir envio concorrente.  
**Consequência:** evita sobreposição de mensagens enquanto o agente responde.

**D8** (Decidido) — Todas as frases usam `src/lib/voice.ts` (família `cecinho*`); nenhum texto inline em componente.  
**Alternativa rejeitada:** cópia escrita no componente.  
**Consequência:** copy centralizada, fácil de ajustar.

**D9** (Decidido) — Reutiliza `Modal` existente e `lucide-react` (já instalado); nenhuma nova dependência.  
**Alternativa rejeitada:** criar componente de sheet do zero ou adicionar dependência de sheet.  
**Consequência:** menos código novo, padrão do app.

**D10** (Decidido) — A tela é uma **coluna de altura cheia**, como chat de app nativo: cabeçalho fixo, lista com scroll próprio e composer fixo no rodapé (com `env(safe-area-inset-bottom)`). A fala do agente é texto aberto ancorado pelo selo do Cecinho; a da usuária é bolha à direita. Falas do mesmo autor a menos de 4 minutos formam grupo — selo e horário aparecem uma vez por grupo. A lista rola sozinha só quando a usuária já está no fim; fora do fim aparece "ir para o fim".  
**Alternativa rejeitada:** manter a tela no scroll da página (tudo em `space-y`, campo no fim do documento) — com o teclado aberto o campo sai da tela e a conversa longa exige rolar até o rodapé para responder, que é o defeito que esta rodada corrige.  
**Alternativa rejeitada:** bolha em toda fala, inclusive do agente — em tela de 390 px, caixa em cima de caixa come a largura de leitura e o chat vira lista de cartões.  
**Alternativa rejeitada:** anel de avatar em toda mensagem — repete o mesmo selo em cada linha sem informar nada.  
**Consequência:** a tela não rola a página; rola a lista. Altura é `calc(100dvh - 2.5rem)`, casada com o `py-4`/`pb-6` do `<main>` da casca — se esse padding mudar, o cálculo muda junto. Timestamp usa `toLocaleTimeString('pt-BR')`, o mesmo formato do resto do app; não vira frase de voz.

## Contrato

**Entrada (gateway → mobile via `applyRemoteJob`):** `RemoteJob.messages` pode incluir `kind: 'question'` com `question.id` e `question.text`. Quando há perguntas pendentes (`answerKind === undefined`), o sheet abre. A detecção é `pendingQuestions(questionsInOpenRound(messages))`, no domínio.

**Saída (usuária → chat):** ao confirmar a etapa final, `cecinho.answerRound(taskId, respostas)` fecha a rodada numa escrita só, `cecinho.append(taskId, { role: 'user', kind: 'text', content: resposta })` põe a fala no chat e `cecinho.ask(taskId, resposta)` devolve ao gateway (conforme SPEC-M-039 D9).

## Arquivos e módulos envolvidos

| Arquivo | Função |
|---------|--------|
| `src/agent/ui/CecinhoTaskChat.tsx` | Controla abertura/fechamento do sheet, loader na bolha e bloqueio do envio |
| `src/agent/ui/CecinhoMessage.tsx` | Render por `kind`; resposta do assistente passa pelo `StreamingMessage`; pergunta pendente oferece "responder" |
| `src/shells/MobileAppShell.tsx` | Esconde o header da app dentro da conversa (`isAuxFlow`) |
| `src/agent/ui/CecinhoQuestionSheet.tsx` *(novo)* | Bottom sheet com uma pergunta por etapa e etapa de confirmação |
| `src/agent/ui/StreamingMessage.tsx` *(novo)* | Componente de mensagem com efeito de digitação (adaptado ao projeto, sem shadcn) |
| `src/agent/ui/ThinkingLoader.tsx` *(novo)* | Pílula de "pensando" com fases em português minúsculo |
| `src/agent/useCecinho.ts` | Estado de `streaming` e controle de envio bloqueado |
| `src/lib/voice.ts` | Novas frases `cecinhoStatusPensando`, `cecinhoSheetPergunta`, etc. |
| `src/agent/sync/applyRemoteJob.ts` | Detecção de perguntas pendentes para abrir o sheet |

## Restrições e cuidados

- O `Modal` existente já suporta `position="bottom"` com grabber e backdrop — não criar novo primitive de sheet.
- Não usar shadcn/ui nem instalar dependências novas; o projeto é Tailwind 4 + lucide-react.
- O thinking loader não deve bloquear o polling do job; é apenas visual.
- Streaming não deve interpretar markdown bruto do agente como HTML (sem `dangerouslySetInnerHTML`).

## Critérios de aceite (verificáveis por comando)

1. `npm run lint` (tsc --noEmit) passa.
2. `npx vitest run src/agent/` passa (inclui testes novos do sheet e do loader).
3. `node .github/scripts/check-boundaries.mjs` sai com 0.
4. Abrir conversa do Cecinho → header da app some; título da tarefa e pílula visíveis.
5. Agente faz pergunta → bottom sheet abre com a pergunta e botão "Próxima".
6. Última etapa → mostra resposta digitada; confirmação fecha o sheet e insere mensagem de usuária no chat.
7. Durante envio/sincronização → thinking loader na bolha do agente com frases em português minúsculo.
8. Resposta do agente → aparece com efeito de digitação (streaming).
9. Enquanto streama → campo de envio desabilitado.

## Estratégia de validação e testes

- Teste de componente (vitest/jsdom) para `CecinhoQuestionSheet`: abre com uma pergunta, avança etapas, confirma e chama `onConfirm`.
- Teste de componente para `ThinkingLoader`: renderiza fases, troca de rótulo, estado done.
- Teste de componente para `StreamingMessage`: texto inteiro sem streaming; revelação com passo mínimo e `onDone` com streaming.
- Teste de comportamento para `CecinhoTaskChat` (hooks mockados): loader visível e envio bloqueado; sheet abre e confirma; sheet reabre pela bolha; streaming bloqueia e libera o envio.
- Não adicionar testes de render-only/snapshot estático (regra de corte do mobile).

## Rastreabilidade

- SPEC-M-037 → domínio do Cecinho Agent (conversa, perguntas, plano).
- SPEC-M-039 → integração com o gateway (history, kind, CORS).
- Código: `src/agent/useCecinho.ts`, `src/agent/ui/CecinhoTaskChat.tsx`, `src/agent/ui/CecinhoMessage.tsx`, `src/agent/ui/CecinhoQuestionSheet.tsx`, `src/agent/ui/StreamingMessage.tsx`, `src/agent/ui/ThinkingLoader.tsx`, `src/shells/MobileAppShell.tsx`, `src/lib/voice.ts`.
- Testes: `src/agent/sync/__tests__/` + `src/agent/ui/__tests__/` (4 arquivos).

## Estado da implementação (2026-11-17)

Entregue: D1–D9. Gates verdes em `tasks/todo-cecinho-chat-visual.md`
(`tsc --noEmit`, `src/agent/` 35, UI 11, `test:domain` 463, `check-boundaries`,
`test:voz`).

Duas correções de plano que a execução exigiu, sem mudar decisão de produto:

1. **Uma escrita por rodada.** Responder três perguntas chamando `answer` três
   vezes perderia as duas primeiras — cada chamada parte do `collections` do
   render. O sheet usa `answerRound`, que reduz a rodada numa atualização só, e
   `append` passou a ler `collectionsRef`.
2. **Pergunta dispensada tem volta.** Sem o input inline (D2), fechar o sheet
   deixaria a pergunta sem saída; a bolha mostra "responder" e reabre o sheet.

Pendente: validação visual no app — o gate prova comportamento, não a sensação do
loader nem do streaming.

### Rodada de layout (2026-11-17, D10)

A tela entregue em D1–D9 era funcional e visualmente ruim: tudo no scroll da
página, campo no fim do documento, bolha em toda fala, texto de 12 px. Foi
reescrita como chat de app nativo, sem dependência nova e sem token novo:

| Antes | Depois |
|---|---|
| página rola; campo no fim do conteúdo | coluna de altura cheia: cabeçalho + lista com scroll próprio + composer fixo |
| 12 px, bolha em tudo | 14 px; agente em texto aberto com selo, usuária em bolha |
| sem agrupamento nem horário | grupo por autor (4 min) com selo e `HH:mm` uma vez |
| sem controle de rolagem | auto-scroll só no fim da lista + "ir para o fim" |
| `input` de uma linha | `textarea` que cresce até 5 linhas; Enter envia no desktop, quebra linha no toque |

`CecinhoMessage` ganhou `first`/`last` (agrupamento) e o cartão da pergunta
pendente; `CecinhoTaskChat` ganhou o layout, o composer e a rolagem. Gates:
`tsc --noEmit` limpo, `src/agent/` 39/39, `check-boundaries` OK.


