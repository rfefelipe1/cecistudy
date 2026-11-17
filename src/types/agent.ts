// Domínio: Cecinho Agent (SPEC-037).
//
// A assistência vive **ao lado** da `Task` (D1), nunca dentro dela. Estes tipos
// são o contrato persistido leve (`useStampedState`) e a forma que a UI da
// Central consome; a conversa completa, os artefatos e as versões moram no
// workspace de arquivos (`src/agent/storage/taskWorkspace.ts`).

/** Estado de assistência de uma tarefa (D3). */
export type AssistanceState =
  | 'none'
  | 'suggested'
  | 'accepted'
  | 'ignored'
  | 'active'
  | 'completed';

/** Estado do job no mobile → gateway (D11). */
export type AgentJobStatus =
  | 'queued_local'
  | 'queued_remote'
  | 'processing'
  | 'done'
  | 'failed';

/** Papel de quem escreveu a mensagem. */
export type AgentMessageRole = 'user' | 'assistant' | 'system' | 'tool';

/** Tipo de mensagem — cada um tem render próprio na Central. */
export type AgentMessageKind = 'text' | 'question' | 'plan' | 'artifact' | 'activity' | 'error';

/** Pergunta adaptativa da rodada (D4). */
export interface AgentQuestion {
  id: string;
  text: string;
  /** Resposta em texto livre, quando houver. */
  answer?: string;
  /**
   * Forma da resposta. `nao_sei` e `depois` são respostas válidas e **não**
   * bloqueiam o plano (caso de borda da §7).
   */
  answerKind?: 'texto' | 'nao_sei' | 'depois';
}

/** Atividade do agente — o que ele está fazendo, sem raciocínio interno bruto. */
export interface AgentActivity {
  id: string;
  label: string;
  at: string;
}

export interface AgentMessage {
  id: string;
  role: AgentMessageRole;
  kind: AgentMessageKind;
  content: string;
  createdAt: string;
  question?: AgentQuestion;
  artifactId?: string;
  planId?: string;
  activity?: AgentActivity;
}

export interface AgentConversation {
  id: string;
  /** Uma conversa por tarefa no MVP (I10). */
  taskId: string;
  messages: AgentMessage[];
  /** Última leitura — o que veio depois conta como não lido. */
  lastReadAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AgentPlanStatus = 'draft' | 'reviewing' | 'confirmed' | 'rejected' | 'completed';

export type AgentPlanStepStatus = 'pendente' | 'em_andamento' | 'concluida' | 'dispensada';

export interface AgentPlanStep {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: AgentPlanStepStatus;
  source: 'agent' | 'user';
  /** Evento interno criado **depois** da confirmação (D5). */
  calendarEventId?: string;
}

export interface AgentPlan {
  id: string;
  taskId: string;
  objective: string;
  expectedOutput?: string;
  steps: AgentPlanStep[];
  status: AgentPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export type AgentArtifactSource = 'agent' | 'user' | 'derived';

export interface AgentArtifact {
  id: string;
  taskId: string;
  /** Caminho relativo dentro do workspace da tarefa (ex.: `artifacts/roteiro.md`). */
  path: string;
  name: string;
  mimeType: string;
  source: AgentArtifactSource;
  currentVersionId: string;
  sizeBytes?: number;
  /** Já foi enviado ao gateway? */
  synced?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Tarefa assistida: projeção complementar da `Task` (D1/D3). */
export interface AssistedTask {
  /** Id próprio — hoje igual a `taskId`, mas separado para não acoplar. */
  id: string;
  taskId: string;
  conversationId: string;
  assistanceState: AssistanceState;
  status: AgentJobStatus;
  planId?: string;
  currentStepId?: string;
  /** Outputs novos desde a última leitura. */
  unreadOutput: number;
  /** Existe pergunta esperando resposta? */
  pendingQuestion: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Job da fila local (D11), idempotente por `operationId`. */
export interface AgentJob {
  operationId: string;
  taskId: string;
  kind: 'analyze' | 'plan' | 'artifact';
  status: AgentJobStatus;
  payload?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}
