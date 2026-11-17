# TASKS — Cecinho: chat visual, sheet de perguntas e resposta streamada

Espelha `SPEC-M-040-cecinho-chat-visual-e-sheet-perguntas.md`. Cada tarefa é executável sozinha; não pule dependências.

**Estado (2026-11-17):** T001–T008 concluídas. Gates em
`tasks/todo-cecinho-chat-visual.md`. Ajustes feitos durante a execução estão
marcados em **Descoberta** nas tarefas afetadas.

## T001 — Frases de voz do Cecinho para loader e sheet

**Objetivo:** Adicionar à camada de voz (`src/lib/voice.ts`) as frases usadas pelo thinking loader, pelo sheet de perguntas e pelos estados da tela, seguindo o voice do Cecinho (tudo minúsculo, tom direto).

**Arquivos:** `src/lib/voice.ts`

**Dependências:** nenhuma

**Resultado esperado:** Frases como `cecinhoStatusPensando`, `cecinhoSheetPergunta`, `cecinhoSheetConfirmar`, etc., disponíveis para importar.

**Critério de conclusão:** As frases existem em `voice.ts` e podem ser importadas sem erro de typecheck.

**Testes:** nenhum (cópia de voz; coberta por `test:voz`).

---

## T002 — Componente ThinkingLoader

**Objetivo:** Criar `src/agent/ui/ThinkingLoader.tsx`: pílula de "pensando…" com fases em português minúsculo, spinner de 8 raios, label que rola entre fases, estado done (check). Sem dependências novas (usa `lucide-react` já instalado e Tailwind 4).

**Arquivos:** `src/agent/ui/ThinkingLoader.tsx` (novo)

**Dependências:** T001 (frases de voz)

**Resultado esperado:** Componente aceita `phases`, `interval`, `done`, `variant` ("pill" | "plain") e renderiza a pílula dentro de uma bolha de chat.

**Critério de conclusão:** Loader renderiza, troca de fase e vira check quando `done={true}`.

**Testes:** `src/agent/ui/__tests__/ThinkingLoader.test.tsx` — renderiza fase inicial, troca de rótulo, estado done.

---

## T003 — Componente StreamingMessage

**Objetivo:** Criar `src/agent/ui/StreamingMessage.tsx`: mensagem de chat que renderiza texto aos poucos (efeito de digitação), com caret piscando enquanto `streaming={true}`. Controle híbrido: recebe o texto parcial da cadeia e aplica passo mínimo de UI para não piscar.

**Arquivos:** `src/agent/ui/StreamingMessage.tsx` (novo)

**Dependências:** nenhuma

**Resultado esperado:** Componente aceita `content`, `streaming`, `role` e renderiza o texto com efeito de máquina de escrever.

**Critério de conclusão:** Componente renderiza texto completo quando `streaming={false}` e exibe caret enquanto `streaming={true}`.

**Testes:** `src/agent/ui/__tests__/StreamingMessage.test.tsx` — exibe texto completo sem streaming; exibe caret com streaming.

---

## T004 — Componente CecinhoQuestionSheet (bottom sheet)

**Objetivo:** Criar `src/agent/ui/CecinhoQuestionSheet.tsx`: bottom sheet (`Modal position="bottom"`) com uma pergunta por etapa, botão "Próxima", última etapa mostra resposta para confirmação e callback `onConfirm(resposta)`.

**Arquivos:** `src/agent/ui/CecinhoQuestionSheet.tsx` (novo)

**Dependências:** T001 (frases de voz), Modal existente (`src/components/ui/Modal.tsx`)

**Resultado esperado:** Sheet abre com a pergunta 1, avança com "Próxima", etapa final mostra o texto e chama `onConfirm`.

**Critério de conclusão:** Sheet navega entre etapas e emite `onConfirm` com o texto da resposta.

**Testes:** `src/agent/ui/__tests__/CecinhoQuestionSheet.test.tsx` — avança etapas e emite confirmação.

---

## T005 — Integrar sheet no CecinhoTaskChat

**Objetivo:** Ligar o sheet ao fluxo do chat: quando `applyRemoteJob` apende mensagens com `questions` pendentes, abre o sheet; ao confirmar, insere a resposta como mensagem de usuária no chat.

**Arquivos:** `src/agent/ui/CecinhoTaskChat.tsx`, `src/agent/useCecinho.ts` (rodada entra em **uma** escrita: `answerRound`), `src/agent/ui/CecinhoMessage.tsx` (bolha da pergunta perde o input inline e ganha "responder")

**Dependências:** T004

**Resultado esperado:** Agente faz pergunta → sheet abre; usuária confirma → resposta aparece no chat como `role: 'user', kind: 'text'`.

**Critério de conclusão:** Sheet abre quando há pergunta pendente e fecha na confirmação, inserindo a mensagem.

**Descoberta:** responder três perguntas chamando `answer` três vezes perderia as
duas primeiras (cada chamada parte do `collections` do render). `answerRound`
reduz a rodada numa atualização só, e `append` passou a ler `collectionsRef`.
Fechar o sheet sem responder também não podia deixar a pergunta sem saída: a
bolha mostra "responder" e reabre o sheet.

**Testes:** `src/agent/ui/__tests__/CecinhoTaskChat.test.tsx` (sheet abre, confirma, reabre).

---

## T006 — Thinking loader na bolha do agente + envio bloqueado durante streaming

**Objetivo:** Em `CecinhoTaskChat`, mostrar o `ThinkingLoader` dentro da bolha do agente durante envio/sincronização e desabilitar o campo de envio enquanto há streaming ativo.

**Arquivos:** `src/agent/ui/CecinhoTaskChat.tsx`, `src/agent/useCecinho.ts`

**Dependências:** T002, T005

**Resultado esperado:** Loader na bolha do agente com fases em português minúsculo; input desabilitado durante streaming.

**Critério de conclusão:** Input fica desabilitado enquanto `asking` ou streaming; loader aparece na bolha.

**Testes:** `src/agent/ui/__tests__/CecinhoTaskChat.test.tsx` — loader visível e envio bloqueado enquanto `asking`; envio bloqueado durante o streaming e liberado ao fim.

---

## T007 — Ocultar header da app na tela de conversa

**Objetivo:** Quando a tela de conversa do Cecinho está aberta, o header da app some; só permanecem o título da tarefa, a pílula de estado e o rodapé de envio.

**Arquivos:** `src/shells/MobileAppShell.tsx` — `isAuxFlow` passou a incluir `isCecinhoTaskOpen`

**Dependências:** T005

**Resultado esperado:** Header oculto; título da tarefa e pílula visíveis na área da conversa.

**Critério de conclusão:** Header da app não renderiza dentro da tela do Cecinho.

**Descoberta:** o header da app mora no shell, não no chat — a condição que já
esconde o header nos fluxos auxiliares ganhou a tela do Cecinho. O `<header>`
interno da conversa (voltar + título + pílula) continua, como a D1 pede.

**Testes:** inspeção no app; o JSX do header da conversa é coberto pelos testes do chat.

---

## T008 — Testes, gates e revisão final

**Objetivo:** Rodar os gates do mobile e garantir que nada quebrou.

**Arquivos:** nenhum novo (execução de comandos)

**Dependências:** T001–T007

**Resultado esperado:** `npm run lint`, `npx vitest run src/agent/`, `check-boundaries` e `test:voz` verdes.

**Critério de conclusão:** Todos os gates passam.

**Testes:** `npm run lint`, `npx vitest run src/agent/`, `node .github/scripts/check-boundaries.mjs`, `npm run test:voz`.
