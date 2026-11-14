import { describe, expect, it } from 'vitest';
import type { Task } from '@/types';
import { activateAssistance, emptyAgentCollections, planForTask } from '../../storage/agentRepository';
import { conversationForTask } from '../../storage/agentRepository';
import { planEffects } from '../../domain/plan';
import { applyRemoteJob } from '../applyRemoteJob';
import type { RemoteJob } from '../agentJobClient';

const at = '2026-11-14T12:00:00.000Z';
const task: Task = {
  id: 'task-1',
  title: 'Ler o capítulo 3 de Skinner',
  category: 'leitura',
  priority: 'alta',
  completed: false,
};

const activated = () =>
  activateAssistance(emptyAgentCollections, { taskId: task.id, at });

const remote: RemoteJob = {
  operationId: 'analyze:task-1:v1',
  status: 'done',
  messages: [{ role: 'assistant', kind: 'text', content: 'comecei pelo capítulo 2' }],
  plan: {
    objective: 'resumir o capítulo 3',
    steps: [{ title: 'ler o capítulo' }, { title: 'escrever o resumo' }],
  },
  artifacts: [
    { name: 'roteiro.md', path: 'artifacts/roteiro.md', mimeType: 'text/markdown', content: '# oi' },
  ],
};

describe('resultado remoto → coleções', () => {
  it('anexa mensagem e conta como não lida', () => {
    const outcome = applyRemoteJob(activated(), task.id, remote, at);
    expect(outcome.appended).toBe(1);
    const assisted = outcome.collections.assistedTasks[0]!;
    expect(assisted.unreadOutput).toBe(1);
    expect(conversationForTask(outcome.collections, task.id)?.messages).toHaveLength(1);
  });

  it('repetir o mesmo resultado não duplica nada', () => {
    const first = applyRemoteJob(activated(), task.id, remote, at);
    const second = applyRemoteJob(first.collections, task.id, remote, at);
    expect(second.appended).toBe(0);
    expect(second.planCreated).toBe(false);
    expect(second.artifactsAdded).toBe(0);
    expect(conversationForTask(second.collections, task.id)?.messages).toHaveLength(1);
  });

  it('o plano chega como draft: nada é criado antes da confirmação (D5)', () => {
    const outcome = applyRemoteJob(activated(), task.id, remote, at);
    const plan = planForTask(outcome.collections, task.id);
    expect(plan?.status).toBe('draft');
    expect(plan?.steps).toHaveLength(2);
    expect(planEffects(plan!, task)).toEqual([]);
  });

  it('artefato entra no índice com caminho e tamanho', () => {
    const outcome = applyRemoteJob(activated(), task.id, remote, at);
    const artifact = outcome.collections.agentArtifacts[0]!;
    expect(artifact.path).toBe('artifacts/roteiro.md');
    expect(artifact.sizeBytes).toBe(4);
  });

  it('ignora tarefa sem assistência ativa', () => {
    const outcome = applyRemoteJob(emptyAgentCollections, task.id, remote, at);
    expect(outcome.collections).toBe(emptyAgentCollections);
  });
});
