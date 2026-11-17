# TODO — Cecinho Agent

Espelha `tasks/plan-cecinho-agent.md`. Sem extras, sem omissões.

- [x] T001 — Modelos de domínio do agente (AssistedTask, Conversation, Message, Plan, Step, Activity, Artifact)
- [x] T002 — Workspace de arquivos por tarefa (Directory.Data/cecinho/tasks/<task-id>/)
- [x] T003 — Runtime de ferramentas de arquivo (fileToolRuntime com validação de caminho e expectedVersion)
- [x] T004 — Policy de permissões do agente (allow/ask/deny; clinical deny; native event ask; complete_task ask)
- [x] T005 — Repositório de agente e integração com DataClient (estado leve + SCHEMA_VERSION 23 + MIGRATIONS[23])
- [x] T006 — Central do Cecinho: lista de conversas (CecinhoCenterScreen, CecinhoConversationRow)
- [x] T007 — Central do Cecinho: chat por tarefa (CecinhoTaskChat, CecinhoMessage)
- [x] T008 — Central do Cecinho: revisão de plano (CecinhoPlanReview)
- [x] T009 — Central do Cecinho: lista de artefatos e badge (CecinhoArtifactList, CecinhoPendingBadge)
- [x] T010 — Integração com Agenda e ativação em ambos os pontos (cartão, badge, contador, navegação, opção no TaskSheet)
- [x] T011 — Voz do cecinho para o Cecinho (novas chaves em voice.ts)
- [x] T012 — Client do Agent Gateway (fila local idempotente por operationId, contexto mínimo, fetch injetado) + `cecistudy/agent-gateway/` (bearer token env, POST /jobs idempotente, GET /jobs/:operationId, contexto mínimo auditável, pool NVIDIA NIM retry/fallback, erros sem vazar segredo, execution.json)
- [x] T013 — Ajuda global no Perfil (toggle + regras locais de elegibilidade)
- [x] T014 — Testes de domínio do agente (contexto mínimo, fila local, aplicação de resultado remoto)
- [ ] T015 — Testes de UI da Central e do agente (CenterScreen, TaskChat, PlanReview, ArtifactList)
- [x] T016 — Verificação de fronteiras e gate de voz (check-boundaries.mjs, test:voz)
- [x] T017 — verify:contract e checagem de SCHEMA_VERSION 23 / MIGRATIONS[23]
- [x] T018 — Documentação e registro (tasks/todo-cecinho-agent.md espelhando o plano; docs/specs/README.md não existe)

Todas as pendências `[A]` foram fechadas (escopo do backend, persistência híbrida, navegação por pilha).
