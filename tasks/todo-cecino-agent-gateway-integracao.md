# TODO — Integração do mobile com o Cecinho Agent Gateway (SPEC-M-039)

Espelha `tasks/plan-cecino-agent-gateway-integracao.md`. Sem extras, sem omissões.

- [x] T001 — Adaptar `agentJobClient.ts` para o contrato do gateway (`/v1`, `operationId`, `Idempotency-Key`, renovação em 401)
- [x] T002 — Adaptar `applyRemoteJob.ts` para a resposta estruturada do gateway
- [x] T003 — Sessão do aparelho: `session.ts` troca `X-App-Key` + `installationId` por JWT (D3 — o gateway assina, não o app)
- [x] T004 — Manter `context.ts` em 4 KB com bloqueio de `estagio` (o limite do gateway é o parser de saída, não a entrada)
- [x] T005 — Tipos de resposta do gateway em `RemoteJob` (`agentJobClient.ts`)
- [x] T006 — Repositório separado `cecistudy-agent-gateway` (https://github.com/rfefelipe1/cecistudy-agent-gateway)
- [x] T007 — Banco persistente: libSQL/Turso (`src/db.js`), duas tabelas
- [x] T008 — Prefixos `/v1/...`, `/agent/...` e `/jobs/...` em `canonical()` (`src/app.js`)
- [x] T009 — Variáveis: `.env.example` + `render.yaml` no gateway; `VITE_AGENT_GATEWAY_URL`/`VITE_AGENT_GATEWAY_APP_KEY` no mobile (`src/lib/agentGateway.ts`)
- [x] T010 — Painel administrativo em HTML único (`src/admin.html`) sobre `/v1/admin/*` (D7)
- [x] T011 — `render.yaml` pronto; **deploy pendente** (depende de criar o serviço e preencher os segredos no Render)
- [x] T012 — Testes de integração HTTP no gateway (`test/app.test.js`: sessão, idempotência, isolamento por aparelho, 422 clínico, admin)
- [x] T013 — `useCecinho.ask()`: enfileira → flush → polling 24 × 1,5 s → `applyRemoteJob`
- [x] T014 — Gates: `test -- src/agent/` (24 testes), `check-boundaries`, `test:voz`, `verify:contract`
- [x] T015 — Conversa fluida (D9): `buildHistory` em `sync/context.ts`, `payload.history` no `ask`, `history` no prompt do gateway e `kind` escalando para `plan`
- [x] T016 — `CecinhoTaskChat`: responder pergunta devolve a resposta ao gateway (`answer` + `ask`)

## Pendências fora deste repositório

- Criar o serviço no Render a partir do `render.yaml` e preencher `NIM_API_KEYS`, `GATEWAY_SESSION_SECRET`, `AGENT_APP_KEY`, `ADMIN_PASSWORD`, `DATABASE_URL` e `DATABASE_AUTH_TOKEN` (Turso).
- Rodar o playground do `/admin` contra a NIM real — nada foi testado contra o provedor até agora (só com pool fake).
- Rotacionar a chave NIM que foi colada em conversa.

Todas as decisões `[D]` estão registradas em `docs/specs/SPEC-M-039-integracao-cecino-agent-gateway.md`.
