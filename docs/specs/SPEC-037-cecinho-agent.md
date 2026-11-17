# SPEC-037 · Cecinho Agent — Central do Cecinho e assistência a tarefas

> Status: proposta
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §4.2 (Calendário) e §5 (assistência ao usuário) — [D]
> Decisões: D1..D14
> Espelha: — (spec local do mobile; não há equivalente no desktop)
> Supersede: —
> Depende de: SPEC-024 (Calendário e controle do TCC), SPEC-029 (TaskSheet), SPEC-035 (Agenda: atenção primeiro, hoje e inbox), SPEC-M-018/SPEC-C-014 (voz do cecinho), ADR-004, ADR-009
> Data: 2026-11-12
> Última atualização: 2026-11-12 (decisões [A] fechadas com o usuário)

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite
> verificável por comando, está incompleta. Isso é `ADR-004`.

---

## 1. Contexto

O modelo atual do cecistudy responde "o que precisa ser feito e quando?" por meio da entidade `Task` (título, categoria, prioridade, disciplina, prazo), persistida pelo `DataClientProvider` e exibida na Agenda.

O Cecinho Agent acrescenta uma camada de processo sobre a tarefa: compreensão da intenção, perguntas adaptativas, plano com etapas, artefatos de apoio (roteiros, checklists, modelos) e acompanhamento pela Central do Cecinho. A usuária continua dona de suas ideias, escrita, decisões e arquivos.

A assistência é opcional e progressiva: uma tarefa simples continua funcionando sem agente, sem internet e sem backend.

---

## 2. Decisões

### D1 · A tarefa existente não é substituída

- **Decisão.** O Cecinho Agent não altera a entidade `Task` (`src/types/entity.ts:7`). Cada tarefa assistida é vinculada a uma `Task` existente por `taskId`, e a tarefa simples continua sendo criada pelo `TaskExamWizard` e pelo `TaskSheet` sem qualquer agente.
- **Justificativa.** A regra fundamental do produto: toda tarefa comum deve continuar funcionando sem agente, internet ou backend.
- **Alternativa rejeitada.** Transformar `Task` em `AssistedTask` ou adicionar campos de agente à `Task`: faria a tarefa simples depender da camada de assistência e exigiria bump de `SCHEMA_VERSION`.
- **Consequência aceita.** O modelo de dados do Cecinho vive ao lado de `Task`, não dentro dela.

### D2 · Duas formas de ativação (individual + global)

- **Decisão.** A assistência pode ser ativada (a) individualmente, durante a criação ou edição de uma tarefa, por opção explícita da usuária; ou (b) globalmente, por configuração no Perfil que sugere assistência para tarefas adequadas. A ativação individual aparece tanto no `TaskExamWizard` (fluxo completo) quanto no `TaskSheet` (captura rápida da Home). Nenhuma das duas é obrigatória nem aumenta os campos mínimos de cadastro.
- **Justificativa.** A ativação individual dá controle por tarefa; a global reduz atrito para quem quer acompanhamento sistemático. Ambas respeitam "ativar o Cecinho não pode transformar o cadastro de uma tarefa simples em um fluxo obrigatório de entrevista". Oferecer a opção nos dois pontos de criação cobre os caminhos mais usados pela usuária.
- **Alternativa rejeitada.** Ativação automática para toda tarefa acima de certo tamanho: remove a escolha da usuária e viola o princípio de que ela continua no controle.
- **Consequência aceita.** Precisa de UI de opção no `TaskExamWizard` e no `TaskSheet`, além de toggle de ajuda global no Perfil; a ajuda global precisa de regras locais de elegibilidade.

### D3 · Estado de assistência persistido

- **Decisão.** Cada tarefa assistida carrega um `assistanceState` com os valores `none`, `suggested`, `accepted`, `ignored`, `active`, `completed`. A sugestão ignorada não reaparece repetidamente perto do prazo.
- **Justificativa.** Espelha o modelo proposto no cecinho-agent.md (§5) e permite que a Central e a Agenda reajam ao estado sem consultar o agente.
- **Alternativa rejeitada.** Apenas booleano `assisted`: não distingue "sugerido e ignorado" de "nunca sugerido", e não permite o comportamento de "não insistir".
- **Consequência aceita.** Novo campo persistido na entidade de assistência (não na `Task`).

### D4 · No máximo três perguntas por rodada

- **Decisão.** O agente faz no máximo três perguntas por rodada de conversa. A usuária pode responder em texto, marcar "não sei", deixar para depois ou responder parcialmente. As perguntas são adaptativas, não um formulário fixo.
- **Justificativa.** É um contrato de produto do cecinho-agent.md (§8, CP-005) que protege a usuária de interrogatórios longos.
- **Alternativa rejeitada.** Questionário fixo com N perguntas: não é adaptativo e pode pedir informações desnecessárias.
- **Consequência aceita.** O plano pode ficar incompleto se a usuária deixar perguntas para depois; o agente propõe um plano com o que tem.

### D5 · Plano só vira realidade após confirmação

- **Decisão.** Nenhuma subtarefa interna, evento de calendário interno ou alteração na tarefa principal é criada antes da revisão e confirmação da usuária sobre o plano. Uma única confirmação ("[confirmar plano]").
- **Justificativa.** CP-008: "nenhuma subtarefa real deve ser criada antes da revisão e confirmação da usuária."
- **Alternativa rejeitada.** Criar subtarefas assim que o agente monta o rascunho: a usuária não teria chance de rejeitar ou editar.
- **Consequência aceita.** O plano existe como rascunho (`status: 'draft'`) até a confirmação; só então passa para `confirmed` e gera efeitos.

### D6 · Calendário nativo exige confirmação específica

- **Decisão.** Eventos no calendário do aparelho (@capacitor/calendar) exigem confirmação explícita da usuária, separada da confirmação do plano. O calendário interno do Cecistudy não exige essa confirmação extra.
- **Justificativa.** É uma ação externa ao banco do Cecistudy (CP-010). O calendário interno é domínio do app.
- **Alternativa rejeitada.** Criar eventos nativos junto com a confirmação do plano: mistura ação externa com decisão interna e pede permissão duas vezes num mesmo fluxo.
- **Consequência aceita.** Dois momentos de confirmação: plano (interno) e calendario nativo (externo).

### D7 · O agente nunca conclui a tarefa principal sozinho

- **Decisão.** O agente pode sugerir conclusão, mas a usuária confirma: "[marcar como concluída] [ainda não]".
- **Justificativa.** CP-011 e o princípio de que a usuária é dona de suas decisões.
- **Alternativa rejeitada.** Conclusão automática quando todas as etapas do plano estão `done`: remove a palavra final da usuária.
- **Consequência aceita.** A tarefa pode ter plano `completed` enquanto a `Task` continua `completed: false`.

### D8 · Contexto mínimo enviado ao agente

- **Decisão.** O agente recebe apenas o contexto mínimo autorizado: título, categoria, prioridade, prazo, disciplina, tarefas relacionadas, subtarefas, eventos relevantes, tarefas anteriores, projeto do TCC, capítulos, referências e notas relacionadas — conteúdo textual selecionado, nunca o banco inteiro. Dados clínicos de estágio são bloqueados por runtime.
- **Justificativa.** CP-006 e CP-007. Limita exposição de dados e torna o contexto auditável.
- **Alternativa rejeitada.** Enviar o banco inteiro: vazia dados desnecessários e quebra o princípio de contexto mínimo.
- **Consequência aceita.** Precisa de um assembler de contexto no backend (ou no mobile, se local) que selecione apenas o necessário.

### D9 · Workspace de arquivos por tarefa

- **Decisão.** Cada tarefa assistida tem seu próprio workspace em `Directory.Data/cecinho/tasks/<task-id>/` com `agente.md`, `prompt.json`, `conversation.json`, `execution.json`, `context-snapshot.json`, `plan.json`, `manifest.json`, `artifacts/`, `versions/` e `exports/`. Arquivos técnicos (`agente.md`, `prompt.json`, `execution.json`, `context-snapshot.json`) são invisíveis na UI.
- **Justificativa.** cecinho-agent.md §12. Arquivos técnicos não são editáveis pela usuária nem pelo agente como forma de escalada (critério de segurança 7).
- **Alternativa rejeitada.** Um workspace compartilhado por várias tarefas: quebra o isolamento e a exclusão por tarefa.
- **Consequência aceita.** Mais arquivos no dispositivo; o ZIP de exportação (§31 do cecinho) empacota um workspace inteiro.

### D10 · Versionamento com controle otimista

- **Decisão.** A versão original criada pelo agente é preservada em `versions/original/`. Edições da usuária geram novas versões em `versions/user-edits/`. Edições do agente usam `expectedVersion`; se o arquivo mudou desde a leitura, a operação é rejeitada.
- **Justificativa.** cecinho-agent.md §12.4 e CP-013: uma edição com versão antiga não sobrescreve conteúdo da usuária.
- **Alternativa rejeitada.** Substituir arquivo inteiro sem controle de versão: risco de perda de edição da usuária.
- **Consequência aceita.** Mais complexidade no runtime de arquivos; necessário para segurança.

### D11 · Processamento longo no backend, mobile local-first com Agent Gateway

- **Decisão.** O mobile salva localmente, cria um job, tenta enviar quando há internet, mostra fila e recebe notificação. O processamento do agente (escolha de prompt, chamada ao modelo, ferramentas autorizadas) acontece no backend. O Agent Gateway em Node, com pool de chaves NVIDIA NIM, autenticação, fila remota, montagem de contexto, sincronização e despacho de notificações, está incluído no escopo desta implementação. O app não depende de permanecer aberto.
- **Justificativa.** cecinho-agent.md §20 e princípio 4 ("o mobile é local-first, mas o processamento longo acontece no backend"). Incluir o gateway evita especificar um contrato com um backend que não existe ainda.
- **Alternativa rejeitada.** Rodar o agente no JavaScript do Capacitor: bateria, travamento de UI e impossibilidade de app fechado.
- **Consequência aceita.** O repositório mobile passa a incluir (ou referenciar) o Agent Gateway; precisam de autenticação dispositivo/sessão, idempotência por `operationId`, retry com limite e registro de consumo por usuária/tarefa.

### D12 · Notificação sem conteúdo sensível

- **Decisão.** Notificações push trazem resumo curto do tipo de output e próxima pergunta/ação, nunca o texto integral do contexto ou do artefato. Se push estiver desativado, mostra indicador de pendência na Home e na Central.
- **Justificativa.** CP-015 e critério de segurança 15.
- **Alternativa rejeitada.** Incluir trecho do TCC ou do artefato na notificação: exposição de dados sensíveis.
- **Consequência aceita.** A usuária precisa abrir o app para ver o conteúdo.

### D13 · Persistência híbrida: estado leve global + arquivos para artefatos

- **Decisão.** As entidades do agente (`AssistedTask`, `AgentConversation`, `AgentPlan`, `AgentArtifact`) são persistidas em nova coleção no SQLite/localStorage via `DataClientProvider` (estado leve, com `useStampedState`), enquanto a conversa completa, artefatos, versões, snapshots e manifest ficam em arquivos no workspace `Directory.Data/cecinho/tasks/<task-id>/`. Isso exige bump de `SCHEMA_VERSION` e nova migração.
- **Justificativa.** O estado leve permite consultas rápidas (lista de conversas, badges, não lidos) sem ler arquivos; os arquivos guardam o conteúdo completo e dão isolamento por tarefa para exclusão e exportação.
- **Alternativa rejeitada.** Apenas arquivos: exigiria ler o disco para montar a lista da Central, mais lento e sem reatividade no estado global. Apenas estado global: perderia o isolamento de arquivos e dificultaria exportação ZIP e exclusão por tarefa.
- **Consequência aceita.** `SCHEMA_VERSION` sobe de 22 para 23; nova migração `MIGRATIONS[23]` cria as coleções `assistedTasks`, `agentConversations`, `agentPlans`, `agentArtifacts` e a chave de storage correspondente; seed em `src/data/empty.ts`.

### D14 · Navegação: novos NavScreen kinds na pilha

- **Decisão.** A Central do Cecinho entra na pilha de navegação como novos tipos de tela (`cecinhoCenter` e `cecinhoTask`), seguindo o padrão de `calendar`/`tcc` em `navigationEngine.ts`, com deep link por `taskId` e entrada no hash (`#/cecinho` e `#/cecinho/:taskId`).
- **Justificativa.** Deep link de notificação precisa abrir a conversa correta após cold start; a pilha é a fonte de verdade de navegação no app (`src/context/navigationEngine.ts`).
- **Alternativa rejeitada.** Overlays/modais sobre a tela atual: não sobrevive a cold start via notificação e complica o histórico de voltar do Android.
- **Consequência aceita.** `navigationEngine.ts` ganha `openCecinhoCenter(taskId?)`, `openCecinhoTask(taskId)` e os novos `NavScreen` kinds; o hash mirror em `src/lib/routing.ts` precisa mapeá-los.

---

## 3. Escopo

| Item | Tipo |
|---|---|
| Modelo `AssistedTask`, `AgentConversation`, `AgentMessage`, `AgentPlan`, `AgentPlanStep`, `AgentActivity`, `AgentArtifact` | código (domínio mobile) |
| Nova coleção no SQLite/localStorage via `DataClientProvider` (`assistedTasks`, `agentConversations`, `agentPlans`, `agentArtifacts`) + bump de `SCHEMA_VERSION` (22 → 23) e migração `MIGRATIONS[23]` | código (dados) |
| Workspace de arquivos por tarefa (`Directory.Data/cecinho/tasks/<task-id>/`) | código |
| Runtime de ferramentas de arquivo (`list_files`, `read_file`, `create_file`, `edit_file`, `append_file`, `rename_file`, `copy_file`, `delete_file`, `get_file_info`, `export_file`, `share_file`) | código |
| Policy de permissões do agente (`allow`/`ask`/`deny`; `clinical/*` = `deny`; `create_native_event` e `complete_task` = `ask`) | código |
| Agent Gateway em Node: autenticação dispositivo/sessão, fila de jobs remota, montagem de contexto mínimo, chamada ao NVIDIA NIM com pool de chaves, persistência de mensagens e artefatos, sincronização, despacho de notificações | código (backend) |
| Central do Cecinho (lista de conversas, chat por tarefa, estado de processamento, perguntas pendentes, plano pronto, artefatos) | código (UI) |
| Integração com Agenda (cartão contextual, badge nas linhas de tarefa, contador na entrada da Central, navegação `openCecinhoCenter`/`openCecinhoTask`) | código (UI + navegação) |
| Fila de jobs local e sincronização (offline/online, idempotência por `operationId`) | código |
| Chaves de voz do cecinho para Cecinho (notificações, confirmações, estados) | código (`src/lib/voice.ts`) |
| Ativação individual no `TaskExamWizard` e no `TaskSheet`; ajuda global (toggle no Perfil com regras locais de elegibilidade) | código (UI) |
| Testes de domínio (modelo, invariantes, path traversal, controle otimista) | gate |
| Testes de UI (Central, chat, revisão de plano, lista de artefatos) | gate |
| Verificação de fronteiras (`check-boundaries.mjs`) | gate |

**`SCHEMA_VERSION` sobe de 22 para 23** (nova coleção de assistência — decisão D13 fechada).

---

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Push remoto (APNs/FCM) | Notificações locais são suficientes para o MVP; push remoto é Fase 6 do cecinho-agent.md |
| Calendário nativo do aparelho como destino automático | Exige confirmação específica (D6); a integração com `@capacitor/calendar` já existe e é reutilizada |
| Exportação ZIP | Fase 7 do cecinho-agent.md; fora do MVP inicial |
| Acesso a pastas externas (Storage Access Framework / document picker) | Fora do primeiro MVP (§19 do cecinho-agent.md) |
| Geração de DOCX/PDF a partir do Markdown | Fase 7; Markdown é a fonte de verdade no MVP |
| Dados clínicos de estágio e atendimento | Bloqueados por runtime; fora do MVP (§14.4 do cecinho-agent.md) |
| Conversa geral, conversa ligada a várias tarefas, chats colaborativos | A Central tem exatamente uma conversa por tarefa no MVP (§6.4) |
| Desktop (`cecistudy-desktop`) | Este escopo é somente mobile (`cecistudy`) |

---

## 5. Contrato

Nada cruza para o outro app. É agregação e apresentação sobre dado que o mobile já possui (`ADR-009`).

| Artefato | O que é | Onde |
|---|---|---|
| `AssistedTask` | tarefa assistida: `taskId`, `conversationId`, `assistanceState`, `status`, `planId`, `currentStepId`, `unreadOutput`, `pendingQuestion` | `src/agent/domain/assistedTask.ts` |
| `AgentConversation` | `taskId`, `messages[]`, `lastReadAt` | `src/agent/domain/conversation.ts` |
| `AgentMessage` | `role`, `kind` (`text\|question\|plan\|artifact\|activity\|error`), `content`, `question?`, `artifactId?`, `activity?` | `src/agent/domain/conversation.ts` |
| `AgentPlan` | `objective`, `expectedOutput?`, `steps[]`, `status` (`draft\|reviewing\|confirmed\|rejected\|completed`) | `src/agent/domain/plan.ts` |
| `AgentPlanStep` | `title`, `description?`, `dueDate?`, `status`, `source` (`agent\|user`), `calendarEventId?` | `src/agent/domain/plan.ts` |
| `AgentArtifact` | `taskId`, `path`, `name`, `mimeType`, `source` (`agent\|user\|derived`), `currentVersionId` | `src/agent/domain/artifact.ts` |
| Workspace de arquivos | `Directory.Data/cecinho/tasks/<task-id>/` | `src/agent/storage/taskWorkspace.ts` |
| File tool runtime | `CecinhoFileTool` operações com `expectedVersion` e validação de caminho | `src/agent/tools/fileToolRuntime.ts` |
| Central do Cecinho | tela `CecinhoCenterScreen`, lista `CecinhoConversationRow`, chat `CecinhoTaskChat`, revisão `CecinhoPlanReview`, artefatos `CecinhoArtifactList`, badge `CecinhoPendingBadge` | `src/agent/ui/` |
| Integração navegação | `openCecinhoCenter(taskId?)`, `openCecinhoTask(taskId)` | `src/context/navigationEngine.ts` |
| Voz do cecinho | novas chaves em `VAZIO`, `DICA`, `CELEBRACAO`, `NOTIFICACAO`, `ERRO` | `src/lib/voice.ts` |

**Fonte das tarefas:** `tasks` do slice de cursos (`DataClientProvider`). Nenhuma cópia, nenhum duplicado — o estado do agente é uma projeção complementar.

---

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | Uma tarefa simples continua funcionando sem agente, sem internet e sem backend | `TaskExamWizard`, `TaskSheet` | `TaskExamWizard.test.tsx`, `TaskSheet.test.tsx` |
| I2 | `assistanceState` nunca é obrigatório para salvar uma tarefa | `TaskExamWizard` (opção), `TaskSheet` (opção) | `TaskExamWizard.test.tsx` ("opção de assistência não bloqueia o salvamento") |
| I3 | Nenhuma subtarefa, evento interno ou alteração na `Task` é criada antes da confirmação do plano | `AgentPlan.status === 'confirmed'` | `plan.test.ts` ("plano draft não cria efeitos") |
| I4 | O agente faz no máximo três perguntas por rodada | camada de conversa | `conversation.test.ts` ("máximo 3 perguntas por rodada") |
| I5 | Eventos de calendário nativo exigem confirmação específica separada do plano | `fileToolRuntime` / `create_native_event` | `permissions.test.ts` ("create_native_event é ask") |
| I6 | O agente nunca conclui a `Task` principal sem confirmação da usuária | `complete_task` é `ask` | `permissions.test.ts` ("complete_task é ask") |
| I7 | Edição de arquivo com `expectedVersion` desatualizada é rejeitada | `edit_file`, `append_file`, `delete_file` | `fileToolRuntime.test.ts` ("conflito de versão rejeita edição") |
| I8 | Caminhos `../`, absolutos não autorizados, symlinks que escapem do workspace são rejeitados | `fileToolRuntime` (segurança de caminhos) | `fileToolRuntime.test.ts` ("path traversal bloqueado") |
| I9 | Dados clínicos (`clinical/*`) são bloqueados por runtime para `read_context` | policy de permissões | `permissions.test.ts` ("clinical é deny") |
| I10 | Uma tarefa assistida tem exatamente uma conversa no MVP | `AgentConversation.taskId` único | `conversation.test.ts` ("uma conversa por tarefa") |

---

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Tarefa criada sem ativar o Cecinho | `assistanceState = none`, sem conversa, sem plano |
| Usuária ignora a sugestão | `assistanceState = ignored`, sugestão não reaparece, ajuda disponível no detalhe da tarefa |
| Usuária responde "não sei" a todas as perguntas | Agente monta plano com o que tem, marcando itens em aberto |
| Prazo muito curto para o plano completo | Agente propõe plano mínimo viável (versão reduzida) |
| App fechado durante processamento | Job fica na fila local; resultado recuperado na próxima abertura |
| Sem internet | Tarefa comum funciona; job assistido fica em fila (`queued_local`) |
| Edição de arquivo com versão antiga | Operação rejeitada; usuário precisa reler antes de editar |
| Exclusão de tarefa assistida | Conversa, plano, arquivos, versões e histórico são removidos (confirmação explícita) |
| Contexto clínico na tarefa | Bloqueado por runtime; nunca enviado ao agente |
| Duas tarefas com o mesmo título | Duas conversas distintas, `taskId` diferentes |

---

## 8. Critérios de aceite

Medidos nesta árvore de trabalho:

- [ ] `npm run lint` → zero erro nos arquivos desta spec
- [ ] `npx vitest run src/agent/` → todos os testes de domínio da Central verdes
- [ ] `npx vitest run src/lib/__tests__/voice.test.ts` → teste de voz verde (novas chaves do Cecinho)
- [ ] `node .github/scripts/check-boundaries.mjs` → zero erro (não importa `react`, `@capacitor/*` ou `__TAURI__` em `packages/*`)
- [ ] Tarefa simples é criada e salva sem qualquer opção de agente (regressão do `TaskExamWizard`)
- [ ] Ativação individual cria conversa vinculada à tarefa (`conversationId`)
- [ ] Plano em `draft` não cria subtarefas nem eventos (apenas após `confirmed`)
- [ ] Edição de arquivo com `expectedVersion` desatualizada é rejeitada sem sobrescrever
- [ ] Caminho `../` no workspace é bloqueado
- [ ] `assistanceState = ignored` não gera nova sugestão para a mesma tarefa

---

## 9. Medição

| Métrica | Como medir | Antes | Depois | Gate |
|---|---|---|---|---|
| Novas chaves de voz do Cecinho | `rg "cecinho" src/lib/voice.ts \| wc -l` | 0 | ≥ 5 | `test:voz` |
| Testes de domínio do agente | `npx vitest run src/agent/ | wc -l` | 0 | ≥ 8 | `test:domain` |
| Arquivos de UI da Central | `ls src/agent/ui/ | wc -l` | 0 | 6 | inspeção no PR |
| Entradas de navegação | `rg "openCecinho" src/context/navigationEngine.ts \| wc -l` | 0 | 2 | `lint` |
| Schema versão | `rg "SCHEMA_VERSION = " packages/data/src/schema.ts` | `22` | `23` | `verify:contract` |

---

## 10. Riscos

| Risco | Mitigação |
|---|---|
| O agente criar subtarefas antes da confirmação | Guarda de código: `AgentPlan.status === 'confirmed'` é pré-condição para qualquer escrita de efeito |
| Path traversal no workspace de arquivos | Validação de caminho no runtime (`../`, absolutos, symlinks) com teste dedicado |
| Perda de edição da usuária por edição do agente | Controle otimista com `expectedVersion`; versão original preservada |
| Notificação com conteúdo sensível | Notificação carrega apenas resumo de tipo + próxima ação; nenhum texto de contexto |
| Job perdido quando app fechado | Fila local persistida; sincronização ao abrir; `operationId` idempotente |
| Duas fontes de verdade para a tarefa | `Task` continua sendo a fonte; `AssistedTask` é projeção, nunca duplica dados da tarefa |
| Esquecer de registrar chave de voz no catálogo | Gate de voz reprova chave pedida e inexistente (mesmo padrão de SPEC-029 D4) |

---

## 11. Rastreabilidade

| Decisão | Código | Teste | Gate |
|---|---|---|---|
| D1 | `src/types/entity.ts:7` (Task inalterada) | `TaskExamWizard.test.tsx` | `lint` |
| D2 | `TaskExamWizard.tsx` (opção de agente), Perfil (toggle global) | `TaskExamWizard.test.tsx` | `lint` + `test:ui` |
| D3 | `src/agent/domain/assistedTask.ts` (`assistanceState`) | `assistedTask.test.ts` | `test:domain` |
| D4 | camada de conversa (máximo 3 perguntas) | `conversation.test.ts` | `test:domain` |
| D5 | `AgentPlan.status` (`draft` → `confirmed`) | `plan.test.ts` | `test:domain` |
| D6 | `create_native_event` é `ask` | `permissions.test.ts` | `test:domain` |
| D7 | `complete_task` é `ask` | `permissions.test.ts` | `test:domain` |
| D8 | assembler de contexto mínimo | `context.test.ts` | `test:domain` |
| D9 | `src/agent/storage/taskWorkspace.ts` | `taskWorkspace.test.ts` | `test:domain` |
| D10 | `expectedVersion` em `edit_file`/`append_file`/`delete_file` | `fileToolRuntime.test.ts` | `test:domain` |
| D11 | fila de jobs local + sync | `agentQueue.test.ts` | `test:domain` |
| D12 | chaves de notificação em `voice.ts` | `voice.test.ts` | `test:voz` |
| D13 | persistência híbrida (coleções + `SCHEMA_VERSION` 23 + `MIGRATIONS[23]`) | `agentRepository.test.ts`, `schema.test.ts` | `test:domain` + `verify:contract` |
| D14 | novos `NavScreen` kinds `cecinhoCenter`/`cecinhoTask` + hash mirror | `navigationEngine.test.tsx`, `routing.test.ts` | `lint` + `test:ui` |

---

## 12. Limitações e pendências

Todas as pendências `[A]` foram fechadas com o usuário em 2026-11-12:

- **Escopo do backend:** Agent Gateway em Node incluído (D11 revisada).
- **Persistência do `AssistedTask`:** estado leve global + arquivos para artefatos; `SCHEMA_VERSION` 23 com migração (D13).
- **Navegação:** novos `NavScreen` kinds na pilha (D14).

Não há pendências abertas nesta spec.
