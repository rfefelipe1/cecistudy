# Plano de implementação — Cecinho Agent

Espec: `docs/specs/SPEC-037-cecinho-agent.md`  
App afetado: mobile (`cecistudy`)  
Nível: 3 (nova estrutura que atravessa domínio, UI, persistência, navegação)

Cada tarefa tem identificador único (T001..), arquivos envolvidos, dependências, resultado esperado, critérios de conclusão e testes/validações. O `TODO.md` espelha exatamente esta lista.

---

## T001 — Modelos de domínio do agente

**Objetivo:** Definir as entidades puras de domínio do Cecinho Agent sem depender de UI, Capacitor ou backend.

**Descrição:** Criar tipos e funções puras para `AssistedTask`, `AgentConversation`, `AgentMessage`, `AgentPlan`, `AgentPlanStep`, `AgentActivity`, `AgentArtifact` e os enums `AssistanceState` (`none` \| `suggested` \| `accepted` \| `ignored` \| `active` \| `completed`) e `AgentJobStatus`. Incluir validadores básicos (ex.: `taskId` não vazio, `conversationId` único por tarefa).

**Arquivos envolvidos:**
- `src/agent/domain/assistedTask.ts` (novo)
- `src/agent/domain/conversation.ts` (novo)
- `src/agent/domain/plan.ts` (novo)
- `src/agent/domain/artifact.ts` (novo)
- `src/agent/domain/index.ts` (novo, barrel)

**Dependências:** nenhuma.

**Resultado esperado:** Módulo `src/agent/domain/` exportando tipos e validadores puros, sem jsdom, sem Capacitor.

**Critérios de conclusão:**
- Tipos compõem com `tsc --noEmit`
- Validadores rejeitam `taskId` vazio e `conversationId` duplicado por tarefa
- Nenhuma importação de `react`, `@capacitor/*` ou `__TAURI__`

**Testes/validações:** `src/agent/domain/__tests__/assistedTask.test.ts`, `conversation.test.ts`, `plan.test.ts` — testes de domínio (sem jsdom).

---

## T002 — Workspace de arquivos por tarefa

**Objetivo:** Criar o workspace isolado por tarefa em `Directory.Data/cecinho/tasks/<task-id>/`.

**Descrição:** Implementar `taskWorkspace.ts` com operações de inicialização de workspace, listagem de arquivos, leitura, criação, edição estruturada (substituição de ranges e inserção após heading), append, renomeação, cópia, exclusão, obtenção de info, exportação e compartilhamento. Incluir versionamento: `versions/original/` preservado, edições do usuário em `versions/user-edits/`, `manifest.json` com versão do formato, taskId, conversationId, arquivos incluídos e integridade.

**Arquivos envolvidos:**
- `src/agent/storage/taskWorkspace.ts` (novo)
- `src/agent/storage/agentMigrations.ts` (novo, se houver versão futura do workspace)
- `src/agent/storage/index.ts` (novo, barrel)

**Dependências:** T001 (tipos de `AgentArtifact`).

**Resultado esperado:** Workspace funcional em `Directory.Data`, com versionamento e manifest.

**Critérios de conclusão:**
- Criação de workspace gera `index.json`, `agente.md`, `prompt.json`, `conversation.json`, `execution.json`, `context-snapshot.json`, `plan.json`, `manifest.json`, pastas `artifacts/`, `versions/`, `exports/`
- `expectedVersion` desatualizada rejeita edição sem sobrescrever
- `manifest.json` inclui versão do formato, taskId, conversationId, data, arquivos, integridade

**Testes/validações:** `src/agent/storage/__tests__/taskWorkspace.test.ts` — criação, listagem, leitura, edição, versionamento, manifest.

---

## T003 — Runtime de ferramentas de arquivo (fileToolRuntime)

**Objetivo:** Implementar o `TaskWorkspaceToolRuntime` com as 10 operações de arquivo e validação de segurança de caminhos.

**Descrição:** Implementar `list_files`, `read_file`, `create_file`, `edit_file`, `append_file`, `rename_file`, `copy_file`, `delete_file`, `get_file_info`, `export_file`, `share_file`. Cada operação valida: caminho válido, extensão permitida, tamanho máximo, versão esperada (`expectedVersion` para escrita/exclusão), permissão, existência do diretório pai, integridade do conteúdo. Rejeitar `../`, caminhos absolutos não autorizados, URI externa, symlinks que escapem do workspace, acesso a outro `taskId`, arquivos técnicos protegidos (`agente.md`, `prompt.json`, `execution.json`, `context-snapshot.json` para edição pelo agente como escalada) e arquivos clínicos.

**Arquivos envolvidos:**
- `src/agent/tools/fileToolRuntime.ts` (novo)
- `src/agent/tools/fileToolRuntimePermissions.ts` (novo, política de permissões)
- `src/agent/tools/index.ts` (novo, barrel)

**Dependências:** T002 (taskWorkspace), T004 (policy de permissões — pode ser ajustada depois).

**Resultado esperado:** Runtime de arquivo seguro e testável, sem Capacitor em domínio (o glue de Capacitor fica em `src/lib`).

**Critérios de conclusão:**
- Cada operação retorna resultado tipado (sucesso ou erro estruturado)
- `../` e caminhos absolutos são rejeitados
- `expectedVersion` mismatch rejeita a operação
- Arquivos técnicos protegidos não são editáveis pelo agente

**Testes/validações:** `src/agent/tools/__tests__/fileToolRuntime.test.ts` — todas as 10 operações, path traversal, controle otimista, arquivos protegidos.

---

## T004 — Policy de permissões do agente

**Objetivo:** Definir e aplicar a política de permissões (ação, recurso, efeito) antes de cada operação do agente.

**Descrição:** Implementar `AgentPermissionRule` com `action`, `resource`, `effect` (`allow` \| `ask` \| `deny`). Política padrão: leitura/listagem/criação/edição de artefatos permitida; exclusão e conclusão de tarefa pedem confirmação (`ask`); `read_context` de `clinical/*` é `deny`; `external_directory` é `deny`; `create_native_event` é `ask`. O runtime aplica a política antes da operação; o agente não pode alterar as regras.

**Arquivos envolvidos:**
- `src/agent/tools/permissionPolicy.ts` (novo)
- `src/agent/tools/agentPermissions.ts` (novo, middleware de aplicação)

**Dependências:** T003 (fileToolRuntime consome a policy).

**Resultado esperado:** Política aplicável em tempo de execução, sem brechas de escalada via `agente.md`.

**Critérios de conclusão:**
- `clinical/*` é `deny` para `read_context`
- `create_native_event` e `complete_task` são `ask`
- O agente não pode modificar a policy por meio de `agente.md` ou qualquer arquivo do workspace

**Testes/validações:** `src/agent/tools/__tests__/permissionPolicy.test.ts` — cada efeito, tentativa de escalada, recurso clínico bloqueado.

---

## T005 — Repositório de agente e integração com DataClient (estado leve)

**Objetivo:** Conectar as entidades do agente ao estado persistido do mobile (coleções + `SCHEMA_VERSION` 23).

**Descrição:** Criar `agentRepository.ts` com operações de persistência de `AssistedTask`, `AgentConversation`, `AgentPlan`, `AgentArtifact` via `DataClientProvider` (`useStampedState`). Bump de `SCHEMA_VERSION` de 22 para 23 em `packages/data/src/schema.ts`, nova migração `MIGRATIONS[23]` que cria as coleções `assistedTasks`, `agentConversations`, `agentPlans`, `agentArtifacts`, e seed em `src/data/empty.ts`. Os arquivos de conversa completa, artefatos, versões, snapshots e manifest continuam no workspace de arquivos (T002).

**Arquivos envolvidos:**
- `src/agent/storage/agentRepository.ts` (novo)
- `packages/data/src/schema.ts` (editar: `SCHEMA_VERSION` + `MIGRATIONS[23]`)
- `src/data/empty.ts` (editar: seed das novas coleções)

**Dependências:** T001, T002.

**Resultado esperado:** Entidades do agente persistidas e recuperáveis entre sessões; `SCHEMA_VERSION = 23`.

**Critérios de conclusão:**
- `AssistedTask` pode ser criada, lida, atualizada e excluída pelo repositório
- `SCHEMA_VERSION` é 23 e `MIGRATIONS[23]` existe e é determinística
- Sessão fechada e reaberta recupera o estado da conversa e do plano

**Testes/validações:** `src/agent/storage/__tests__/agentRepository.test.ts` — CRUD, persistência entre sessões, seed; `packages/data/src/__tests__/schema.test.ts` — migração 23.

---

## T006 — Central do Cecinho: lista de conversas

**Objetivo:** Criar a tela principal da Central com a lista de conversas por tarefa.

**Descrição:** Implementar `CecinhoCenterScreen` e `CecinhoConversationRow`. Cada item mostra: título da tarefa, disciplina/contexto, estado do agente (traduzido para mensagem compreensível: "analisando a tarefa", "pergunta pendente", "plano pronto", "arquivo pronto", etc.), última mensagem resumida, data da última atualização, indicador de não lido, tipo de pendência, progresso do plano. Estados visíveis seguem o catálogo de §6.3 do cecinho-agent.md.

**Arquivos envolvidos:**
- `src/agent/ui/CecinhoCenterScreen.tsx` (novo)
- `src/agent/ui/CecinhoConversationRow.tsx` (novo)
- `src/agent/ui/index.ts` (editar, adicionar exports)

**Dependências:** T001, T005.

**Resultado esperado:** Tela de lista de conversas funcional, com estados traduzidos e indicador de não lido.

**Critérios de conclusão:**
- Lista renderiza conversas existentes
- Cada row mostra título, estado, última mensagem, data, não lido
- Estado traduzido nunca exibe raciocínio interno bruto ("thinking")

**Testes/validações:** `src/agent/ui/__tests__/CecinhoCenterScreen.test.tsx` — renderização, estados, indicador de não lido.

---

## T007 — Central do Cecinho: chat por tarefa

**Objetivo:** Criar a conversa individual de cada tarefa assistida.

**Descrição:** Implementar `CecinhoTaskChat`. Exibe mensagens (`text`, `question`, `plan`, `artifact`, `activity`, `error`) com papel de usuário/assistente/sistema/tool. Permite responder em texto, marcar "não sei", deixar para depois ou responder parcialmente. Máximo de três perguntas por rodada. Não exibe raciocínio interno bruto.

**Arquivos envolvidos:**
- `src/agent/ui/CecinhoTaskChat.tsx` (novo)
- `src/agent/ui/CecinhoMessage.tsx` (novo, componente de mensagem por kind)

**Dependências:** T001, T005, T006.

**Resultado esperado:** Chat funcional por tarefa, com mensagens por kind e resposta da usuária.

**Critérios de conclusão:**
- Mensagens renderizadas por kind com papel correto
- Usuária pode enviar resposta de texto
- Máximo três perguntas por rodada (validação na camada de conversa)

**Testes/validações:** `src/agent/ui/__tests__/CecinhoTaskChat.test.tsx` — renderização, envio de resposta, tipos de mensagem.

---

## T008 — Central do Cecinho: revisão de plano

**Objetivo:** Criar a tela de revisão do plano antes da confirmação.

**Descrição:** Implementar `CecinhoPlanReview`. Mostra objetivo, resultado esperado, etapas com datas sugeridas, dependências, materiais, pontos de revisão, riscos. Usuária pode aceitar, editar etapa, remover etapa, mudar data, marcar etapa como já feita, pedir plano menor ou recusar. Após revisão, confirmação única ("[confirmar plano]") cria subtarefas internas e eventos no calendário interno.

**Arquivos envolvidos:**
- `src/agent/ui/CecinhoPlanReview.tsx` (novo)

**Dependências:** T001, T005.

**Resultado esperado:** Plano revisável e confirmável; nada é criado antes da confirmação.

**Critérios de conclusão:**
- Plano em `draft` não cria subtarefas nem eventos
- Confirmação única transição para `confirmed` e gera efeitos
- Usuária pode editar/remover/marcar etapas antes de confirmar

**Testes/validações:** `src/agent/ui/__tests__/CecinhoPlanReview.test.tsx` — edição, remoção, confirmação, não-criação antes do confirm.

---

## T009 — Central do Cecinho: lista de artefatos e badge

**Objetivo:** Criar a lista de artefatos da tarefa e o badge de pendência.

**Descrição:** Implementar `CecinhoArtifactList` (mostra nome, tipo, tamanho, data de criação, última versão, origem, se criado pelo agente ou editado pela usuária, se sincronizado, ações de abrir/editar/exportar/compartilhar/excluir) e `CecinhoPendingBadge` (indicador de output ou pergunta não lida).

**Arquivos envolvidos:**
- `src/agent/ui/CecinhoArtifactList.tsx` (novo)
- `src/agent/ui/CecinhoPendingBadge.tsx` (novo)

**Dependências:** T001, T002.

**Resultado esperado:** Lista de artefatos visível e badge de pendência.

**Critérios de conclusão:**
- Lista mostra todos os campos do `AgentArtifact`
- Ações de abrir, editar, exportar, compartilhar, excluir presentes
- Badge conta outputs/perguntas não lidos

**Testes/validações:** `src/agent/ui/__tests__/CecinhoArtifactList.test.tsx` — renderização, ações, badge.

---

## T010 — Integração com Agenda e ativação em ambos os pontos

**Objetivo:** Acoplar a Central do Cecinho à Agenda e adicionar a opção de ativação no `TaskSheet` (além do `TaskExamWizard`).

**Descrição:** (a) Cartão contextual do Cecinho na primeira viewport da Agenda, com no máximo um CTA principal ("abrir no Cecinho"). (b) Badges discretos nas linhas de tarefa (Cecinho analisando, pergunta pendente, plano pronto, arquivo pronto, sincronização pendente). (c) Entrada para a Central no header/cartão da Agenda com contador de outputs/perguntas não lidos. Navegação: `openCecinhoCenter(taskId?)`, `openCecinhoTask(taskId)`. (d) No `TaskSheet` (captura rápida da Home), adicionar a opção "quero que o Cecinho me ajude" — opcional, não aumenta campos obrigatórios. O `TaskExamWizard` já traz a opção (D2).

**Arquivos envolvidos:**
- `src/components/views/CalendarScreen.tsx` (editar, adicionar cartão e badge)
- `src/components/agenda/` (editar, adicionar badge na linha de tarefa)
- `src/components/views/home/TaskSheet.tsx` (editar, adicionar opção de ativação)
- `src/context/navigationEngine.ts` (editar, adicionar `openCecinhoCenter`/`openCecinhoTask`)

**Dependências:** T001, T005, T006, T009.

**Resultado esperado:** Agenda mostra estado do agente sem competir com Atenção primeiro, Hoje, Inbox, Próximos prazos, calendário mensal. Usuária pode ativar o Cecinho tanto na captura rápida quanto no wizard completo.

**Critérios de conclusão:**
- Cartão contextual aparece na Agenda com um CTA
- Linha de tarefa assistida mostra badge discreto
- Contador da Central mostra não lidos
- Deep link por `taskId` abre a conversa correta
- Opção de ativação presente no `TaskSheet` e no `TaskExamWizard`

**Testes/validações:** `src/components/views/__tests__/CalendarScreen.test.tsx` (regressão + novo cartão), `src/components/agenda/__tests__/*` (badge), `src/components/views/home/__tests__/TaskSheet.test.tsx` (opção de ativação não bloqueia salvamento).

---

## T011 — Voz do cecinho para o Cecinho

**Objetivo:** Adicionar chaves de voz do cecinho para o agente (notificações, confirmações, estados).

**Descrição:** Adicionar chaves em `VAZIO`, `DICA`, `CELEBRACAO`, `NOTIFICACAO` e `ERRO` em `src/lib/voice.ts`. Nenhuma frase escrita inline em componente — o gate de voz reprova. Erro tem duas frases (o que houve, o que pode fazer). Notificação sem conteúdo sensível.

**Arquivos envolvidos:**
- `src/lib/voice.ts` (editar, adicionar catálogos)

**Dependências:** T006, T007, T010.

**Resultado esperado:** Voz do cecinho disponível para estados do agente, notificações e confirmações.

**Critérios de conclusão:**
- Novas chaves existem no catálogo correspondente
- Nenhuma frase inline para Cecinho em componentes de UI
- `test:voz` passa

**Testes/validações:** `src/lib/__tests__/voice.test.ts` — novas chaves, não há frase inline.

---

## T012 — Agent Gateway (Node): autenticação, fila de jobs e contexto mínimo

**Objetivo:** Implementar o backend do Cecinho Agent que roda o processamento longo fora do mobile.

**Descrição:** Criar o Agent Gateway em Node com: autenticação por dispositivo/sessão (sem expor tokens no app), fila de jobs remota com idempotência por `operationId`, montagem de contexto mínimo (título, categoria, prioridade, prazo, disciplina, tarefas relacionadas, TCC, capítulos, referências, notas — nunca banco inteiro, nunca clínica), chamada ao NVIDIA NIM com pool de chaves (seleção, retry com limite em caso de rate limit, registro de consumo por usuária/tarefa, limite diário/mensal), persistência de mensagens e artefatos, sincronização com o mobile e despacho de notificações. Estados de erro: sem conexão, limite da usuária, limite da chave, provedor indisponível, conteúdo rejeitado, contexto grande demais, falha ao salvar artefato, falha ao sincronizar.

**Arquivos envolvidos:**
- `cecistudy/agent-gateway/` (novo diretório, fora de `src/` — é backend Node)
- Contrato de consumo no mobile: `src/agent/sync/agentJobClient.ts` (novo)

**Dependências:** T001, T005, T011.

**Resultado esperado:** O mobile envia jobs, recebe mensagens e sincroniza com o gateway; o gateway processa com NVIDIA NIM e devolve resultados.

**Critérios de conclusão:**
- Gateway aceita jobs do mobile com `operationId` idempotente
- Pool de chaves NVIDIA NIM com retry e fallback entre chaves
- Contexto enviado ao modelo é mínimo e auditável (snapshot gravado)
- Nenhuma chave de API embutida no app mobile
- Erros não vazam tokens ou segredos; detalhes técnicos ficam em `execution.json`

**Testes/validações:** testes do gateway (Node, sem jsdom); `agentJobClient.test.ts` no mobile (fila local, idempotência, sync).

---

## T013 — Ajuda global no Perfil

**Objetivo:** Adicionar toggle de ajuda global no Perfil com regras locais de elegibilidade.

**Descrição:** Criar toggle no Perfil para ativar a ajuda do Cecinho para todas as tarefas consideradas adequadas. Quando ativado, o sistema analisa metadados da tarefa (título, categoria, prioridade, prazo, disciplina, vínculo com TCC, subtarefas, tarefas relacionadas, histórico concluído, proximidade do prazo, ausência de informações importantes) e decide se vale sugerir assistência. A sugestão aparece como card/pendência, não como interrupção obrigatória. O contexto enviado ao modelo continua mínimo.

**Arquivos envolvidos:**
- `src/components/views/perfil/` (editar, adicionar toggle de ajuda global)
- `src/agent/domain/eligibility.ts` (novo, regras locais de elegibilidade)

**Dependências:** T001, T005.

**Resultado esperado:** Usuária pode ativar ajuda global; o app sugere assistência para tarefas adequadas sem ser obrigatório.

**Critérios de conclusão:**
- Toggle de ajuda global existe no Perfil
- Regras locais de elegibilidade decidem quando sugerir
- Sugestão não é interrupção obrigatória (card ou pendência)

**Testes/validações:** `src/agent/domain/__tests__/eligibility.test.ts` — regras de elegibilidade.

---

## T014 — Testes de domínio do agente

**Objetivo:** Validar invariantes de domínio do Cecinho Agent.

**Descrição:** Testes puros (sem jsdom) para modelo, workspace, fileToolRuntime, permission policy e repositório. Cada teste declara a classe (invariante de domínio) e o que protege.

**Arquivos envolvidos:**
- `src/agent/domain/__tests__/*.test.ts`
- `src/agent/storage/__tests__/*.test.ts`
- `src/agent/tools/__tests__/*.test.ts`

**Dependências:** T001 a T005.

**Resultado esperado:** Suíte de domínio verde, rápida, sem jsdom.

**Critérios de conclusão:**
- `npm run test:domain` inclui os testes do agente e fica verde
- Cada teste declara classe e o que protege

**Testes/validações:** `npm run test:domain -- src/agent/`

---

## T016 — Testes de UI da Central e do agente

**Objetivo:** Validar comportamento de UI da Central, chat, plano e artefatos.

**Descrição:** Testes comportamentais mínimos com jsdom para `CecinhoCenterScreen`, `CecinhoTaskChat`, `CecinhoPlanReview`, `CecinhoArtifactList`. Não testar lógica de domínio (já coberta em T012).

**Arquivos envolvidos:**
- `src/agent/ui/__tests__/*.test.tsx`

**Dependências:** T006 a T009.

**Resultado esperado:** Suíte de UI verde.

**Critérios de conclusão:**
- `npm run test:ui -- src/agent/` passa
- Não há testes render-only ou snapshot estático

**Testes/validações:** `npm run test:ui -- src/agent/`

---

## T017 — Verificação de fronteiras e gate de voz

**Objetivo:** Garantir que o agente respeita as regras de fronteira do projeto.

**Descrição:** Rodar `node .github/scripts/check-boundaries.mjs` (reprova se `packages/*` importa `react`, `@capacitor/*` ou `__TAURI__`) e o gate de voz (reprova frase inline em componentes). Validar que `SCHEMA_VERSION` não sobe (a menos que [A] decida nova coleção).

**Arquivos envolvidos:**
- Nenhum novo; verificação sobre arquivos existentes de T001 a T011.

**Dependências:** T001 a T011.

**Resultado esperado:** Gates verde.

**Critérios de conclusão:**
- `check-boundaries.mjs` sai com 0
- Gate de voz sai com 0
- `SCHEMA_VERSION` continua `22` (ou bumpado com migração, se [A])

**Testes/validações:** `node .github/scripts/check-boundaries.mjs`, `npm run test -- src/lib/__tests__/voice.test.ts`

---

## T018 — Documentação e registro no índice de specs

**Objetivo:** Registrar a spec no índice e deixar o handoff completo.

**Descrição:** Adicionar entrada de `SPEC-037` em `docs/specs/README.md` (se existir) ou manter a espec como fonte. Atualizar `tasks/todo.md` se houver índice geral. Criar `cecistudy/tasks/todo-cecinho-agent.md` espelhando `plan-cecinho-agent.md`.

**Arquivos envolvidos:**
- `cecistudy/tasks/todo-cecinho-agent.md` (novo)
- `docs/specs/README.md` (editar, se existir)

**Dependências:** todas as anteriores.

**Resultado esperado:** Handoff completo: outro agente implementa lendo SPEC + TASKS + TODO.

**Critérios de conclusão:**
- `TODO.md` espelha exatamente as tarefas de `TASKS.md`
- Entrada no índice de specs (se aplicável)

**Testes/validações:** inspeção manual de consistência entre os três documentos.

---

## Resumo do escopo desta spec

| Incluído | Não incluído (futuro) |
|---|---|
| Modelos de domínio do agente | Push remoto (APNs/FCM) |
| Nova coleção no SQLite/localStorage + `SCHEMA_VERSION` 23 + `MIGRATIONS[23]` | Exportação ZIP |
| Workspace de arquivos por tarefa | Acesso a pastas externas |
| Runtime de ferramentas de arquivo | Geração de DOCX/PDF |
| Policy de permissões do agente | Dados clínicos de estágio |
| Agent Gateway em Node (pool de chaves NVIDIA NIM, fila, contexto, sync) | Conversa geral / chats colaborativos |
| Central do Cecinho (lista, chat, plano, artefatos) | Desktop (`cecistudy-desktop`) |
| Integração com Agenda (cartão, badge, contador) | |
| Voz do cecinho para o agente | |
| Ativação individual no `TaskExamWizard` e no `TaskSheet` | |
| Ajuda global (toggle no Perfil + regras locais de elegibilidade) | |
| Testes de domínio e UI | |
| Verificação de fronteiras e gate de voz | |

Todas as pendências `[A]` foram fechadas com o usuário em 2026-11-12 (escopo do backend, persistência, navegação). Não há pendências abertas.
