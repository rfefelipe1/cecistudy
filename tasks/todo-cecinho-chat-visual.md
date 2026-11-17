# TODO — Cecinho: chat visual, sheet de perguntas e resposta streamada

Espelha `tasks/plan-cecinho-chat-visual.md` e `SPEC-M-040-cecinho-chat-visual-e-sheet-perguntas.md`.

- [x] T001 — Frases de voz do Cecinho para loader e sheet
- [x] T002 — Componente ThinkingLoader
- [x] T003 — Componente StreamingMessage
- [x] T004 — Componente CecinhoQuestionSheet (bottom sheet)
- [x] T005 — Integrar sheet no CecinhoTaskChat
- [x] T006 — Thinking loader na bolha do agente + envio bloqueado durante streaming
- [x] T007 — Ocultar header da app na tela de conversa
- [x] T008 — Testes, gates e revisão final
- [x] T009 — Layout de chat: lista com scroll próprio, composer fixo, agrupamento e horário (D10)

## Validação executada (2026-11-17)

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` | limpo |
| `npx vitest run src/agent/` | 35 testes, 7 arquivos |
| `npx vitest run src/agent/ui/__tests__/` | 11 testes, 4 arquivos |
| `npm run test:domain` | 463 testes, 19 arquivos |
| `node .github/scripts/check-boundaries.mjs` | OK |
| `node .github/scripts/voz-fixture.mjs` | ok |

**Pendente:** ver no navegador/app (`npm run dev`) — o gate cobre comportamento e
tipo, não a sensação visual do loader e do streaming.

**Fora do escopo, achado:** `src/lib/__tests__/voice.test.ts` tinha 3 falhas
pré-existentes (chaves `cecinho*` se nomeando fora de `CHAVES_ONDE_SE_NOMEIA`,
verbos de ação em `ERRO.dominioNaoCarregado/cecinhoContextoGrande` e códigos de
`ERRO` sem consumidor). Corrigidas na rodada de bug-hunt de 2026-11-17 — ver
abaixo.

## Bug-hunt (2026-11-17)

Três falhas de `voice.test.ts` e o erro de runtime do Vite, com a causa de cada
uma:

| Achado | Causa raiz | Correção |
|---|---|---|
| `does not provide an export named 'CECINHO_PENSANDO_FASES'` | grafo de módulos do browser desatualizado: a aba ficou aberta enquanto `voice.ts` ganhava o export e o servidor era reiniciado; o chunk lazy de `CecinhoTaskChat` (`SharedScreenLayers.tsx:107-108`) foi buscado no servidor novo e pediu um binding que a instância antiga de `voice.ts` não tinha | nenhuma no código — `vite build` e o módulo servido já exportam; resolve com recarga da página |
| D12: codes sem consumidor | a varredura do teste cobria só `components`/`shells`/`overlays`, e consumidor mora em `src/context` e `src/agent/ui`; além disso havia chave morta de verdade | varredura agora cobre `src` inteiro (fora o próprio catálogo); 7 chaves mortas removidas |
| D5: verbo de ação | `dominioNaoCarregado` usa "siga", que faltava na lista de verbos do gate | "siga" entrou em `VERBO_DE_ACAO` |
| D2/I3: personagem se nomeia | 12 frases novas de SPEC-037/040 falavam do "cecinho" em terceira pessoa, fora de `CHAVES_ONDE_SE_NOMEIA` | todas reescritas em 1ª pessoa ("eu monto", "terminei um arquivo", "cheguei ♡") — a regra do `D2` continua valendo, a frase é que estava fora dela |

| Gate | Resultado |
|---|---|
| `npx vitest run src/lib/__tests__/voice.test.ts` | 42 testes, verde |
| `npx vitest run src/agent/` | 39 testes, verde |
| `npx tsc --noEmit` | limpo |
| `npm run check:voz` | 0 frases inline, OK |

