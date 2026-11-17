// Lista de artefatos (SPEC-037 T009).
//
// O índice leve vem das coleções; o conteúdo vem do workspace. Abrir lê o
// arquivo, exportar copia para `exports/` e excluir pede confirmação — nunca
// apaga em silêncio.
import React, { useState } from 'react';
import { Download, Eye, FileText, Trash2 } from 'lucide-react';
import type { AgentArtifact } from '@/types';
import { createAgentFs } from '../storage/capacitorFs';
import {
  deleteWorkspaceFile,
  exportWorkspaceFile,
  getWorkspaceFileInfo,
  readWorkspaceFile,
  type WorkspaceContext,
} from '../storage/taskWorkspace';
import { Modal } from '@/components/ui/Modal';
import { useMobileApp } from '@/context/mobileApp';
import { CELEBRACAO, CONFIRMACAO, VAZIO, erro, frase } from '@/lib/voice';

interface CecinhoArtifactListProps {
  taskId: string;
  conversationId: string;
  artifacts: AgentArtifact[];
  onDeleted: (artifactId: string) => void;
}

function formatSize(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

export const CecinhoArtifactList: React.FC<CecinhoArtifactListProps> = ({
  taskId,
  conversationId,
  artifacts,
  onDeleted,
}) => {
  const { showToast } = useMobileApp();
  const [preview, setPreview] = useState<{ name: string; content: string } | null>(null);
  const ctx: WorkspaceContext = {
    fs: createAgentFs(),
    taskId,
    conversationId,
    now: new Date().toISOString(),
  };

  const open = async (artifact: AgentArtifact) => {
    const result = await readWorkspaceFile(ctx, artifact.path);
    if (!('value' in result)) {
      showToast(erro('cecinhoArquivo'));
      return;
    }
    setPreview({ name: artifact.name, content: result.value.content });
  };

  const exportFile = async (artifact: AgentArtifact) => {
    const result = await exportWorkspaceFile(ctx, artifact.path);
    showToast(
      'value' in result ? frase(CELEBRACAO, 'cecinhoArtefatoGuardado') : erro('cecinhoArquivo'),
    );
  };

  const remove = async (artifact: AgentArtifact) => {
    const question = `${frase(CONFIRMACAO, 'cecinhoRemoverTitulo')} ${frase(
      CONFIRMACAO,
      'cecinhoRemoverDescricao',
    )}`;
    if (!window.confirm(question)) return;
    const info = await getWorkspaceFileInfo(ctx, artifact.path);
    if (!('value' in info)) {
      showToast(erro('cecinhoArquivo'));
      return;
    }
    const result = await deleteWorkspaceFile(ctx, artifact.path, info.value.version);
    if (!('value' in result)) {
      showToast(erro('cecinhoArquivo'));
      return;
    }
    onDeleted(artifact.id);
  };

  if (artifacts.length === 0) {
    return <p className="text-[11px] text-ceci-secondary">{frase(VAZIO, 'cecinhoSemArtefatos')}</p>;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
        arquivos da tarefa
      </h3>
      <ul className="space-y-1.5">
        {artifacts.map((artifact) => (
          <li
            key={artifact.id}
            className="rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2.5"
          >
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 shrink-0 text-ceci-secondary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ceci-primary line-clamp-1">
                  {artifact.name}
                </p>
                <p className="text-[10px] text-ceci-tertiary">
                  {artifact.mimeType}
                  {artifact.sizeBytes ? ` · ${formatSize(artifact.sizeBytes)}` : ''} ·{' '}
                  {artifact.source === 'agent'
                    ? 'criado pelo cecinho'
                    : artifact.source === 'user'
                      ? 'editado por você'
                      : 'derivado'}
                  {artifact.synced ? ' · sincronizado' : ''}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-ceci-tertiary">
                {artifact.currentVersionId}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => void open(artifact)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-ceci-border-default bg-surface-default text-ceci-secondary cursor-pointer"
              >
                <Eye className="w-3 h-3" aria-hidden="true" /> abrir
              </button>
              <button
                type="button"
                onClick={() => void exportFile(artifact)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-ceci-border-default bg-surface-default text-ceci-secondary cursor-pointer"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> exportar
              </button>
              <button
                type="button"
                onClick={() => void remove(artifact)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-status-danger-border bg-status-danger-surface text-status-danger-strong cursor-pointer"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={preview !== null} onClose={() => setPreview(null)} position="center">
        <div className="p-5 space-y-3 max-w-lg">
          <h2 className="font-display font-bold text-sm text-ceci-primary">
            {preview?.name ?? ''}
          </h2>
          <pre className="max-h-[60dvh] overflow-auto whitespace-pre-wrap text-[12px] text-ceci-primary bg-surface-muted rounded-xl p-3">
            {preview?.content ?? ''}
          </pre>
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="w-full px-3 py-2.5 rounded-xl border border-ceci-border-default bg-surface-default text-[11px] font-semibold text-ceci-secondary cursor-pointer"
          >
            fechar
          </button>
        </div>
      </Modal>
    </section>
  );
};

