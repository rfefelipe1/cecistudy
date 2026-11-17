# TASKS — Integração do mobile com o Cecinho Agent Gateway (SPEC-M-039)

Plano de implementação da integração entre o mobile `cecistudy` e o Agent Gateway do `ceciagent.zip`. Cada tarefa é executável de forma independente, com dependências declaradas.

## T001 — Adaptar `agentJobClient.ts` para o contrato do gateway (`/v1`, `jobId`, `Idempotency-Key`)

**Objetivo:** Ajustar o cliente de sync do mobile para usar as rotas `/v1/agent/jobs`, `GET /v1/agent/jobs/:jobId`, cabeçalho `Idempotency-Key` e resposta no formato `RemoteJob` que o mobile já consome.

**Arquivos envolvidos:**
- `src/agent/sync/agentJobClient.ts`
- `src/agent/sync/__tests__/agentJobClient.test.ts`

**Dependências:** T005 (tipos de resposta), T009 (JWT no mobile)

**Resultado esperado:** `submitJob` envia `POST /v1/agent/jobs` com `Idempotency-Key` e bearer token; `fetchJob` consulta `GET /v1/agent/jobs/:jobId`; ambos aceitam o prefixo `/v1` e sem prefixo.

**Critérios de conclusão:**
- `submitJob` e `fetchJob` usam `/v1/agent/jobs` por padrão.
- Cabeçalho `Idempotency-Key` enviado com o `operationId`.
- Resposta do gateway mapeada para `RemoteJob` (`messages`, `plan`, `artifacts`, `status`).
- Testes de unidade para idempotência, retry em rede e erro 401 passando.

**Testes/validações:** `npm run test -- src/agent/sync/__tests__/agentJobClient.test.ts`

---

## T002 — Adaptar `applyRemoteJob.ts` para a resposta estruturada do gateway

**Objetivo:** Garantir que `applyRemoteJob` consuma o formato de resposta do gateway (com `output` estruturado ou `messages`/`plan`/`artifacts` direto) e grave nas coleções leves sem duplicar.

**Arquivos envolvidos:**
- `src/agent/sync/applyRemoteJob.ts`
- `src/agent/sync/__tests__/applyRemoteJob.test.ts`

**Dependências:** T001

**Resultado esperado:** Mensagens anexadas sem duplicar, plano criado como `draft`, artefatos indexados, `unreadOutput` atualizado corretamente.

**Critérios de conclusão:**
- Repetir o mesmo resultado não duplica mensagens nem plano.
- Plano chega com `status = 'draft'`.
- `unreadOutput` corresponde ao número de mensagens novas.

**Testes/validações:** `npm run test -- src/agent/sync/__tests__/applyRemoteJob.test.ts`

---

## T003 — Implementar emissão de JWT no cecistudy para autenticação no gateway

**Objetivo:** Criar um backend/endpoint no cecistudy que emita JWT assinado com `GATEWAY_SESSION_SECRET` para o mobile se autenticar no Agent Gateway.

**Arquivos envolvidos:**
- `src/lib/auth/gatewayToken.ts` (novo)
- Endpoint de emissão de token (a definir conforme arquitetura do cecistudy)
- `src/lib/__tests__/gatewayToken.test.ts` (novo)

**Dependências:** T009 (config de segredo)

**Resultado esperado:** O mobile consegue obter um JWT válido e usá-lo como `Authorization: Bearer <jwt>` nas chamadas ao gateway.

**Critérios de conclusão:**
- JWT assinado com HS256 usando `GATEWAY_SESSION_SECRET`.
- Payload contém `userId` e `sessionId`.
- Token expira após TTL configurável.
- Teste de unidade valida assinatura e payload.

**Testes/validações:** `npm run test -- src/lib/__tests__/gatewayToken.test.ts`

---

## T004 — Adaptar `context.ts` do mobile para o limite de contexto do gateway

**Objetivo:** Alinhar `MAX_CONTEXT_BYTES` do mobile (4 KB) com o gateway (80 KB) e garantir que o contexto seja rejeitado localmente se exceder o limite do gateway.

**Arquivos envolvidos:**
- `src/agent/sync/context.ts`
- `src/agent/sync/__tests__/context.test.ts`

**Dependências:** Nenhuma

**Resultado esperado:** `MAX_CONTEXT_BYTES` definido de acordo com o gateway; erro `context_too_large` lançado antes do envio.

**Critérios de conclusão:**
- Teste de contexto grande demais falha com `context_too_large`.
- Tarefa de estágio retorna `clinical_blocked`.

**Testes/validações:** `npm run test -- src/agent/sync/__tests__/context.test.ts`

---

## T005 — Definir tipos compartilhados de resposta do gateway no mobile

**Objetivo:** Criar ou ajustar tipos TypeScript para a resposta do gateway (`RemoteJob`, `GatewayError`, `JobStatus`) que atendam tanto ao formato atual do mobile quanto às rotas `/v1`.

**Arquivos envolvidos:**
- `src/types/agent.ts`
- `src/agent/sync/index.ts`

**Dependências:** Nenhuma

**Resultado esperado:** Tipos compatíveis com `messages`, `plan`, `artifacts`, `status`, `jobId`, `operationId`.

**Critérios de conclusão:**
- `tsc --noEmit` passa sem erros de tipo nos arquivos de sync.
- Tipos exportados de `src/agent/sync/index.ts`.

**Testes/validações:** `npx tsc --noEmit`

---

## T006 — Criar repositório separado `cecistudy-agent-gateway` baseado no `ceciagent.zip`

**Objetivo:** Criar o repositório do Agent Gateway no GitHub com o conteúdo do `ceciagent.zip`, adaptado conforme as decisões (banco persistente, ambos os prefixos, modelo principal `nvidia/nemotron-3.5-bolt-e4b`).

**Arquivos envolvidos:**
- Novo repositório `cecistudy-agent-gateway` (baseado em `ceciagent.zip`)
- `gateway/src/config.ts` (ajustar modelos)
- `gateway/src/routes/agentJobs.ts` (suporte a ambos os prefixos)
- `gateway/src/infrastructure/persistence/` (substituir `MemoryPersistence` por banco)
- `gateway/.env.example`
- `gateway/render.yaml`
- `gateway/package.json`

**Dependências:** T005 (tipos), T009 (config)

**Resultado esperado:** Repositório criado, build passa, testes passam, gateway roda localmente.

**Critérios de conclusão:**
- Repositório público no GitHub.
- `npm run typecheck` e `npm test` passam.
- `npm run build` gera `dist/`.
- `.env.example` sem segredos reais.
- `render.yaml` com secrets `sync: false`.

**Testes/validações:** `npm test` e `npm run typecheck` no repositório do gateway.

---

## T007 — Substituir `MemoryPersistence` por banco persistente no gateway

**Objetivo:** Implementar persistência de jobs, conversas, idempotência e uso em SQLite ou PostgreSQL, substituindo o `MemoryPersistence` efêmero.

**Arquivos envolvidos:**
- `gateway/src/infrastructure/persistence/sqliteRepository.ts` (novo) ou `postgresRepository.ts`
- `gateway/src/infrastructure/persistence/index.ts`
- `gateway/src/tests/` (testes de persistência)

**Dependências:** T006

**Resultado esperado:** Jobs e conversas sobrevivem a restart do servidor; idempotência funciona entre reinicializações.

**Critérios de conclusão:**
- Teste de persistência: job criado, servidor reiniciado, job ainda consultável.
- Idempotência persiste entre reinicializações.
- Nenhuma perda de dados em `SIGTERM`/`SIGINT`.

**Testes/validações:** Testes de persistência no repositório do gateway.

---

## T008 — Configurar suporte a ambos os prefixos de rota no gateway

**Objetivo:** Fazer o gateway aceitar `/v1/agent/jobs` e `/jobs` (e `/v1/agent/jobs/:jobId` e `/jobs/:operationId`) sem quebrar contratos existentes.

**Arquivos envolvidos:**
- `gateway/src/app.ts` (registro de rotas com ambos os prefixos)
- `gateway/src/routes/agentJobs.ts`
- `gateway/src/tests/` (testes de rotas com ambos os prefixos)

**Dependências:** T006

**Resultado esperado:** `POST /v1/agent/jobs` e `POST /jobs` funcionam; `GET /v1/agent/jobs/:id` e `/jobs/:id` funcionam.

**Critérios de conclusão:**
- Teste de rota com prefixo `/v1` passa.
- Teste de rota sem prefixo passa.
- Nenhuma rota duplicada causa conflito no Fastify.

**Testes/validações:** Testes de integração HTTP no repositório do gateway.

---

## T009 — Definir e configurar variáveis de ambiente do gateway e do mobile

**Objetivo:** Criar `.env.example` para o gateway e para o mobile com todas as variáveis necessárias (`NVIDIA_NIM_KEY_*`, `GATEWAY_SESSION_SECRET`, `GATEWAY_URL`, etc.).

**Arquivos envolvidos:**
- `gateway/.env.example` (já existe no ceciagent.zip, ajustar)
- `cecistudy/.env.example` (adicionar `VITE_AGENT_GATEWAY_URL`, `VITE_GATEWAY_SESSION_SECRET` ou similar)
- `gateway/render.yaml` (atualizar com secrets `sync: false`)

**Dependências:** T006

**Resultado esperado:** Ambiente configurável sem segredos no código; deploy no Render possível.

**Critérios de conclusão:**
- `.env.example` do gateway não contém chaves reais.
- `.env.example` do mobile documenta variáveis de runtime.
- `render.yaml` referencia secrets por `sync: false`.

**Testes/validações:** Revisão manual dos arquivos `.env.example`.

---

## T010 — Implementar Admin Panel completo do gateway

**Objetivo:** Implementar o painel administrativo (`ceciño-admin`) com login, dashboard, playground NIM, modelos, chaves, jobs, prompts e auditoria.

**Arquivos envolvidos:**
- `admin/src/` (páginas, componentes, API client)
- `admin/package.json`
- `admin/vite.config.ts`
- `admin/render.yaml` (Static Site)

**Dependências:** T006, T009

**Resultado esperado:** Painel acessível via URL pública, autenticado, sem expor chaves NVIDIA.

**Critérios de conclusão:**
- Login admin funciona com senha hasheada.
- Dashboard mostra status do gateway e modelos.
- Playground permite testar chamada à NVIDIA sem expor chave.
- Página de modelos permite ativar/desativar aliases.
- Página de jobs lista jobs com status e erro redigido.
- Build do admin passa (`npm run build`).

**Testes/validações:** `npm run build` no admin; testes de unidade do API client.

---

## T011 — Configurar deploy do gateway no Render Web Service Free

**Objetivo:** Configurar o `render.yaml` e fazer o primeiro deploy do gateway no Render.

**Arquivos envolvidos:**
- `gateway/render.yaml`
- Repositório GitHub conectado ao Render

**Dependências:** T006, T007, T009

**Resultado esperado:** Gateway acessível via URL pública no Render; `/healthz` retorna `2xx`.

**Critérios de conclusão:**
- Serviço no Render está ativo.
- `GET /healthz` retorna `200`.
- `GET /v1/models` retorna os modelos habilitados.
- Variáveis secretas (`NVIDIA_NIM_KEY_01`, `GATEWAY_SESSION_SECRET`) configuradas no Render, não no repo.

**Testes/validações:** Teste manual contra a URL do Render.

---

## T012 — Implementar teste de integração mobile ↔ gateway local

**Objetivo:** Criar um teste de integração que levanta o gateway localmente e o mobile cria um job, consulta o status e aplica o resultado.

**Arquivos envolvidos:**
- `src/agent/sync/__tests__/integrationGateway.test.ts` (novo)
- Script para levantar gateway local no teste

**Dependências:** T001, T002, T003, T006

**Resultado esperado:** Fluxo ponta a ponta funcionando localmente (sem a NVIDIA real, usando mock do provider).

**Critérios de conclusão:**
- Teste cria job com idempotency key.
- Teste consulta status do job.
- Teste aplica resultado remoto nas coleções leves.
- Teste passa sem rede real (provider mockado).

**Testes/validações:** `npm run test -- src/agent/sync/__tests__/integrationGateway.test.ts`

---

## T013 — Ajustar `useCecinho.ts` para orquestrar flush/poll com o gateway real

**Objetivo:** Integrar o hook `useCecinho` com o cliente de sync para enviar jobs quando houver internet e consultar status periodicamente.

**Arquivos envolvidos:**
- `src/agent/useCecinho.ts`
- `src/agent/sync/index.ts`

**Dependências:** T001, T002

**Resultado esperado:** O hook enfileira jobs localmente, dispara `flushQueue` quando online e `pollQueue` para consultar resultados.

**Critérios de conclusão:**
- Job é enviado ao gateway quando o app recupera conexão.
- Resultado do job é aplicado nas coleções leves.
- Não há envio duplicado por idempotência.

**Testes/validações:** Testes de unidade do hook com mock do sync.

---

## T014 — Executar gates finais e corrigir regressões

**Objetivo:** Rodar todos os gates do mobile e do gateway para garantir que nada quebrou.

**Arquivos envolvidos:** Nenhum novo; verificação sobre arquivos existentes.

**Dependências:** Todas as tarefas anteriores (T001 a T013)

**Resultado esperado:** Todos os gates verdes.

**Critérios de conclusão:**
- Mobile: `npm run lint`, `npm run test -- src/agent/`, `npm run test:voz`, `node .github/scripts/check-boundaries.mjs`, `npm run verify:contract` — todos passam.
- Gateway: `npm run typecheck`, `npm test` — passam.
- Build do mobile: `npm run build` passa.

**Testes/validações:** Execução de todos os gates listados.
