# SPEC-M-039 · Integração do mobile com o Cecinho Agent Gateway

> Status: em andamento (mobile implementado; deploy do gateway pendente)
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §20 (princípio 4: o mobile é local-first, mas o processamento longo acontece no backend)
> Decisões: D1, D2, D3, D4, D5, D6, D7, D8
> Supersede: SPEC-M-037 (partes sobre o gateway e sync)
> Depende de: SPEC-M-037

## Contexto

O mobile `cecistudy` já implementa o Cecinho Agent (SPEC-M-037) com domínio, workspace de arquivos, UI da Central, voz, ajuda global e cliente de sync (`src/agent/sync/agentJobClient.ts`). Entretanto, o cliente de sync foi escrito contra um contrato próprio e simplificado, enquanto o arquivo `ceciagent.zip` contém um Agent Gateway completo (Node + Fastify + NVIDIA NIM) com contrato diferente de rotas, autenticação JWT, payload de resposta e persistência.

Este documento especifica como o mobile se adapta ao gateway do `ceciagent.zip` e quais mudanças são necessárias em ambos os projetos para que a funcionalidade de agent passe a funcionar de ponta a ponta.

## Problema que será resolvido

O app mobile não consegue usar o Agent Gateway do `ceciagent.zip` porque:

1. **Rotas incompatíveis**: o mobile chama `POST /jobs` e `GET /jobs/:operationId`; o gateway expõe `POST /v1/agent/jobs` e `GET /v1/agent/jobs/:jobId` (mais rotas administrativas sob `/v1/admin`).
2. **Identificador do job**: o mobile usa `operationId`; o gateway usa `jobId` com cabeçalho `Idempotency-Key`.
3. **Formato da resposta do job**: o mobile espera `RemoteJob` com `messages`, `plan`, `artifacts`; o gateway retorna `output` estruturado com `kind`, `message`, `questions`, `plan`, `nextState`.
4. **Autenticação**: o mobile envia bearer token; o gateway valida JWT assinado com `jose` (`GATEWAY_SESSION_SECRET`), mas não há quem emita esse token no mobile.
5. **Persistência**: o gateway usa `MemoryPersistence` (memória, efêmera); a decisão é usar banco persistente (SQLite/PostgreSQL).
6. **Modelo principal**: o mobile não tem seletor de modelo; o gateway resolve por alias (`cecinho_agent_fast` → `nvidia/nemotron-3.5-bolt-e4b`).

## Escopo

### Dentro do escopo

- Adaptar `src/agent/sync/agentJobClient.ts` do mobile para consumir o contrato do gateway do `ceciagent.zip` (rotas `/v1/agent/jobs`, `jobId`, `Idempotency-Key`, resposta estruturada).
- Adaptar o gateway do `ceciagent.zip` para aceitar ambos os prefixos (`/v1` e sem prefixo) e retornar no formato que o mobile já consome (`messages`, `plan`, `artifacts`), mantendo compatibilidade com o formato nativo.
- O gateway emite o JWT de sessão; o mobile envia `X-App-Key` + `installationId` e guarda o token só em memória (D3).
- Substituir `MemoryPersistence` do gateway por banco persistente (libSQL/Turso, D4).
- Painel administrativo mínimo (login, estado, aparelhos, jobs, playground) servido pelo próprio gateway (D7).
- Configurar deploy no Render Web Service Free.

### Fora do escopo

- Tool runtime completo do agente (execução de ferramentas no mobile).
- SSE / streaming de resposta.
- Dados clínicos (continuam bloqueados, `readClinicalData: false`).
- cecistudy-desktop (não é tocado).

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF1 | O mobile cria um job via `POST` ao gateway com bearer token e `Idempotency-Key`. |
| RF2 | O gateway valida o JWT, recusa dados clínicos, aplica rate limit por usuário/IP e cria o job com idempotência. |
| RF3 | O gateway chama a NVIDIA NIM com o modelo resolvido por alias (`cecinho_agent_fast` → `nvidia/nemotron-3.5-bolt-e4b`), com retry/fallback entre chaves da pool. |
| RF4 | O gateway normaliza a resposta da NVIDIA no formato que o mobile consome: `messages`, `plan`, `artifacts`, `status`. |
| RF5 | O mobile faz `GET` ao gateway para consultar o status do job e aplica o resultado remoto nas coleções leves (`applyRemoteJob`). |
| RF6 | O plano chega como `draft`; nada vira realidade antes da confirmação da usuária (D5 do SPEC-M-037). |
| RF7 | O Admin Panel permite login, testar chamada à NVIDIA, escolher modelo permitido, ver jobs e audit. |
| RF8 | O gateway não expõe chaves NVIDIA nem contexto integral em logs ou respostas. |

## Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF1 | Nenhuma chave NVIDIA no bundle do mobile. |
| RNF2 | O gateway responde em HTTPS no Render. |
| RNF3 | `/healthz` funciona independentemente da NVIDIA. |
| RNF4 | Logs não contêm chaves nem contexto integral. |
| RNF5 | Persistência de jobs e conversas não se perde no restart do Render (banco persistente). |
| RNF6 | O gateway aceita ambos os prefixos de rota (`/v1` e sem prefixo). |

## Regras de negócio (D1..D8)

**D1** (Decidido) — O mobile mantém o formato `RemoteJob` com `messages`, `plan`, `artifacts`. O gateway se adapta para retornar esse formato.  
**Alternativa rejeitada:** refazer o mobile para consumir o formato `output` estruturado do gateway.  
**Consequência:** menos trabalho no mobile, mais trabalho de adaptação no gateway.

**D2** (Decidido) — O gateway aceita ambos os prefixos: `/v1/agent/jobs` e `/jobs`.  
**Alternativa rejeitada:** forçar apenas `/v1`.  
**Consequência:** compatibilidade com clientes atuais e futuros sem quebrar contratos.

**D3** (Decidido) — A sessão do aparelho é emitida **pelo gateway**: `POST /v1/auth/session` recebe `X-App-Key` + `installationId` e devolve um JWT HS256 de vida curta. O segredo de assinatura existe só no servidor; o app guarda o token apenas em memória.  
**Alternativa rejeitada:** o cecistudy assinar o próprio JWT — não há onde esconder o segredo de assinatura no bundle, então qualquer pessoa forjaria sessão de admin.  
**Alternativa rejeitada:** pareamento por código de 8 dígitos — mais seguro, mas exige tela nova em Perfil; fica como evolução se a cota virar problema.  
**Consequência:** a `X-App-Key` viaja no bundle e é extraível do APK: serve de barreira de uso casual, não de segredo. Quem protege a cota é o rate limit por IP/aparelho e a revogação por aparelho no painel.

**D4** (Decidido) — O gateway usa **libSQL/Turso** (`@libsql/client`): `file:./data/gateway.db` em desenvolvimento e teste, URL `libsql://` em produção.  
**Alternativa rejeitada:** SQLite no disco do Render — o Web Service Free tem disco efêmero e perderia jobs e aparelhos a cada deploy.  
**Alternativa rejeitada:** Postgres free do Render — expira em 30 dias; Neon exigiria um Postgres rodando também nos testes locais.  
**Consequência:** duas tabelas (`devices`, `jobs`), mesmo dialeto SQLite do app, um caminho só entre teste e produção. Sem tabela de sessão: o JWT é stateless e a revogação é feita no aparelho.

**D5** (Decidido) — O modelo principal é `nvidia/nemotron-3.5-bolt-e4b` (alias `cecinho_agent_fast`).  
**Alternativa rejeitada:** `nvidia/nemotron-3-super-120b-a12b`.  
**Consequência:** modelo mais leve e barato para a camada de chat/planejamento do MVP.

**D6** (Decidido) — O código do gateway vive em repositório separado `cecistudy-agent-gateway`.  
**Alternativa rejeitada:** dentro de `cecistudy/`.  
**Consequência:** ciclo de release independente; o mobile consome via URL pública.

**D7** (Decidido) — O painel administrativo é **uma página HTML servida pelo próprio gateway** (`/admin`) sobre a API `/v1/admin/*`: login por senha, estado, aparelhos (com revogação), últimos jobs e playground.  
**Alternativa rejeitada:** painel React/Vite completo do `ceciagent.zip` (modelos, chaves, auditoria) — segundo build e segundo deploy para operar um serviço de um processo só.  
**Consequência:** operação viável sem acessar o banco; troca de modelo e de chaves é por variável de ambiente, não por tela.

**D8** (Decidido) — Dados clínicos continuam bloqueados no MVP (`readClinicalData: false`).  
**Alternativa rejeitada:** permitir envio de contexto clínico.  
**Consequência:** tarefas de estágio não são encaminhadas ao agente (já aplicado em `src/agent/sync/context.ts`).

**D9** (Decidido) — O job é **stateless**, então cada envio leva o histórico da conversa em `payload.history` (últimas 8 rodadas, 400 caracteres cada, só `user`/`assistant`), e o prompt do gateway instrui o modelo a não repetir pergunta já respondida nem reformular a resposta anterior. Sem plano e com 2+ falas da usuária, o `kind` do job sobe de `analyze` para `plan`.  
**Alternativa rejeitada:** guardar a conversa no gateway (tabela de mensagens por aparelho) — transformaria o serviço em dono do histórico, com cota de retenção, exclusão e sincronização a resolver antes do MVP.  
**Alternativa rejeitada:** sessão com estado no provedor (memória do processo) — o Render Free dorme e recicla; a conversa morreria em silêncio.  
**Consequência:** o mobile é o dono único do histórico; o custo por job cresce com a conversa, limitado pelo teto de 8 × 400 caracteres (abaixo do `MAX_CONTEXT_BYTES` e do `maxBodyBytes` do gateway). O histórico é allowlist de papel: `system` e `tool` não atravessam.

## Contrato

### Mobile → Gateway

**Sessão** (uma vez por instalação, renovada em 401):

`POST /v1/auth/session`

```json
{ "installationId": "uuid-do-aparelho", "appVersion": "1.3.1" }
```

Headers: `X-App-Key: <chave do app>`

Resposta `200`:

```json
{ "token": "<jwt>", "expiresAt": "2026-11-17T13:00:00.000Z", "deviceId": "uuid-do-aparelho" }
```

**Job:**

`POST /v1/agent/jobs` (ou `/agent/jobs`, `/jobs`):

```json
{
  "taskId": "task-123",
  "kind": "analyze",
  "payload": {
    "message": "quero ajuda para organizar isso",
    "context": { "task": {}, "relatedTasks": [], "notes": [], "at": "2026-11-17T01:00:00.000Z" },
    "history": [
      { "role": "user", "content": "preciso entregar o recorte" },
      { "role": "assistant", "content": "qual o prazo? (ela respondeu: sexta)" }
    ]
  }
}
```

`history` é opcional (primeira mensagem vai vazio) e leva no máximo 8 rodadas de 400
caracteres. O `operationId` carrega o `kind` efetivo (`plan:task-123:...`), então trocar de
modo nunca colide com o job anterior.

Headers: `Authorization: Bearer <jwt>`, `Idempotency-Key: <operationId>`

### CORS (obrigatório)

O app chama o gateway de **outra origem** — navegador em dev (`http://localhost:3000`) e
WebView do Capacitor (`capacitor://localhost`, `http://localhost`). O gateway responde
`OPTIONS` com `204` e manda `access-control-allow-origin` em **toda** resposta, liberando
`content-type`, `authorization`, `x-app-key` e `idempotency-key`.

Sem isso o preflight morre, o `fetch` nunca sai e o job fica em `queued_local` — a pílula
mostra "sincronizando…" para sempre. A origem não é a barreira de segurança: o token vai
em `Authorization` (sem cookie) e a cota é protegida por JWT por aparelho + rate limit.

Resposta `202 Accepted`:

```json
{ "operationId": "analyze:task-123:2026-11-17T01:00:00.000Z", "status": "queued_remote" }
```

### Gateway → Mobile

`GET /v1/agent/jobs/:operationId`:

```json
{
  "operationId": "analyze:task-123:2026-11-17T01:00:00.000Z",
  "status": "done",
  "messages": [
    { "id": "analyze:...-m1", "role": "assistant", "kind": "text", "content": "..." },
    { "id": "analyze:...-q1", "role": "assistant", "kind": "question", "content": "...",
      "question": { "id": "q1", "text": "..." } }
  ],
  "plan": { "objective": "...", "expectedOutput": "...", "steps": [{ "title": "...", "dueDate": "YYYY-MM-DD" }] },
  "artifacts": [{ "name": "...", "path": "artifacts/roteiro.md", "mimeType": "text/markdown", "content": "..." }],
  "error": null
}
```

Quatro limites que o gateway aplica antes de responder: 3 perguntas, 12 passos, 3 artefatos e 1000 caracteres por artefato.

### Mobile aplica resultado remoto

`applyRemoteJob(collections, taskId, remote, at)` — já implementado em `src/agent/sync/applyRemoteJob.ts`. O plano chega como `draft`; mensagens são anexadas sem duplicar; artefatos entram no índice.

## Invariantes (testáveis)

- **I1** — Nenhuma chave NVIDIA aparece no bundle do mobile, em logs ou em resposta de erro.
- **I2** — O mesmo `operationId` / `Idempotency-Key` não cria dois jobs no gateway.
- **I3** — O plano retornado pelo gateway nasce com `status = 'draft'`; nada é confirmado automaticamente.
- **I4** — Tarefa de estágio (`category === 'estagio'`) é rejeitada antes de sair do aparelho (`clinical_blocked`).
- **I5** — Contexto acima de `MAX_CONTEXT_BYTES` (4 KB no mobile) é rejeitado localmente, não enviado ao provedor.
- **I6** — Aparelho revogado no painel recebe `403` na requisição seguinte.
- **I7** — O JWT de sessão vive só em memória: não entra em `localStorage`, backup nem migração. Só o `installationId` é persistido.
- **I8** — Um job só é visível para o aparelho que o criou (`404` para os demais).
- **I9** — O histórico vai no máximo em 8 rodadas de 400 caracteres, e só papéis `user`/`assistant` atravessam; a mensagem atual não aparece duas vezes.

## Casos de borda

- **Sem internet**: o job fica em `queued_local`; o envio é tentado de novo na próxima mensagem — não há retry automático em background.
- **Gateway em cold start (Render Free)**: a sessão tolera até 45 s; o polling do job desiste em 36 s (24 × 1,5 s) e a tela avisa.
- **Chave NVIDIA rate-limited (429) ou provedor fora (503)**: o gateway rotaciona para a próxima chave da pool; se todas esgotarem, o job fica `failed` com `error` sanitizado.
- **Saída fora do formato**: o gateway tenta reparar vírgula sobrando uma vez; se falhar, o job fica `failed` com "o agente respondeu fora do formato esperado".
- **Aparelho revogado**: `403` na próxima requisição; o app trata como `unauthorized` e a tela oferece tentar de novo.

## Critérios de aceite (verificáveis por comando)

1. `npm run lint` (root do mobile) passa.
2. `npm run test -- src/agent/` passa (incluindo `session.test.ts`, `agentJobClient.test.ts` e `applyRemoteJob.test.ts`).
3. `npm run test:voz` passa.
4. `node .github/scripts/check-boundaries.mjs` sai com 0.
5. `npm run verify:contract` passa (`SCHEMA_VERSION = 23`).
6. O gateway (`cecistudy-agent-gateway`) roda `npm test` com 0 falhas — Node ESM puro, sem etapa de build/typecheck.
7. O mobile cria um job autenticado contra instância local do gateway (coberto por `test/app.test.js` no gateway).
8. O mesmo `Idempotency-Key` repetido retorna o mesmo job (não duplica).
9. `GET /healthz` retorna `2xx` sem chamar a NVIDIA.
10. Nenhuma resposta do gateway contém chave NVIDIA ou o contexto integral.

## Medição

- Contadores por status de job e por aparelho no `/v1/admin/overview` (não há exporter Prometheus).
- Taxa de sucesso/falha observável pelo painel (`jobs ok` / `jobs falhos`).
- Latência da chamada à NVIDIA: hoje só o `NIM_TIMEOUT_MS`; medir exige instrumentar `callNim`.

## Rastreabilidade

- SPEC-M-037 → define domínio, UI, voz, sync básico do mobile.
- SPEC-M-039 (este documento) → define integração mobile ↔ gateway do ceciagent.zip.
- Código no mobile: `src/agent/useCecinho.ts` (`ask`), `src/agent/sync/session.ts`, `src/agent/sync/agentJobClient.ts`, `src/agent/sync/applyRemoteJob.ts`, `src/agent/sync/context.ts`, `src/lib/agentGateway.ts`, `src/lib/deviceId.ts`, `src/agent/ui/CecinhoTaskChat.tsx`.
- Gateway: repositório separado `cecistudy-agent-gateway` (`rfefelipe1/cecistudy-agent-gateway`), baseado em `ceciagent.zip`: `src/config.js`, `src/auth.js`, `src/db.js`, `src/prompt.js`, `src/nim.js`, `src/jobs.js`, `src/app.js`, `src/server.js`, `src/admin.html`.
- Testes: `src/agent/sync/__tests__/` (mobile) e `test/` (gateway, `npm test`).

## Riscos

| Risco | Mitigação |
|---|---|
| Render Free suspende após ~15 min sem tráfego | Ping externo no `/healthz`; o mobile tolera cold start de até 45 s na sessão. |
| Memória limitada (512 MB) no Render Free | Sem conteúdo integral no gateway; resultado do job limitado pelo parser (3 artefatos × 1000 caracteres). |
| A `X-App-Key` é extraível do APK | Rate limit por IP/aparelho + revogação por aparelho no painel; a chave é barreira, não segredo (D3). |
| Chave NVIDIA excede cota | Pool de múltiplas chaves + rotação + rate limit por aparelho. |
| Dados clínicos vazando | Bloqueio no mobile (`context.ts`, antes da rede) + bloqueio no gateway (`containsClinicalData`, `422`). |
| Job `processing` órfão se o processo morrer no meio | Limite conhecido: não há worker nem retomada; a fila do mobile desiste no timeout e a usuária reenvia. |
