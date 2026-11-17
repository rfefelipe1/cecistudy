// Sync do Cecinho Agent (SPEC-037 T012). Contrato puro; a cola de React mora em
// `useCecinho`.

export { buildHistory, buildMinimalContext, MAX_CONTEXT_BYTES, MAX_HISTORY_TURNS } from './context';
export type {
  HistoryTurn,
  MinimalContextError,
  MinimalContextInput,
  MinimalContextResult,
  MinimalTaskContext,
} from './context';
export {
  enqueueJob,
  fetchJob,
  flushQueue,
  jobFor,
  jobsToPoll,
  jobsToSend,
  patchJob,
  pollQueue,
  submitJob,
} from './agentJobClient';
export type {
  EnqueueInput,
  FlushOutcome,
  GatewayConfig,
  GatewayError,
  GatewayErrorKind,
  GatewayResult,
  PollOutcome,
  RemoteJob,
} from './agentJobClient';
export { applyRemoteJob } from './applyRemoteJob';
export type { ApplyRemoteOutcome } from './applyRemoteJob';
export { createGatewaySession } from './session';
export type {
  GatewaySession,
  GatewaySessionClient,
  SessionConfig,
} from './session';
