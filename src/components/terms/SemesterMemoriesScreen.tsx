import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { CELEBRACAO, CONFIRMACAO, VAZIO, frase } from '../../lib/voice';
import { memoriesByTerm, type SemesterMemory } from '../../lib/semesterMemory';
import { formatDateBR, type AcademicTerm } from '@/core/domain';
import { cn } from '@/lib/utils';
import { MemoryWizard } from './MemoryWizard';
import { EmptyState } from '../ui/EmptyState';
import { CeciMemoryCard } from './CeciMemoryCard';
import { CeciMemoryCategorySummary } from './CeciMemoryCategorySummary';
import { CeciMemoryEditSheet } from './CeciMemoryEditSheet';
import { CeciMemoryCapture } from './CeciMemoryCapture';
import { Modal } from '../ui/Modal';

export interface SemesterMemoriesScreenProps {
  termId: string;
}

/**
 * Memórias de um semestre (SPEC-SEMESTRES-PASSADOS-MEMORIAS-REDESIGN).
 *
 * Aberta a partir do histórico. Contextualiza claramente o semestre (header com
 * label, data e contador), une o resumo congelado ao preview de memórias e
 * oferece registro opcional — nunca forçado.
 */
export const SemesterMemoriesScreen: React.FC<SemesterMemoriesScreenProps> = ({ termId }) => {
  const {
    academicTerms,
    semesterMemories,
    addSemesterMemory,
    updateSemesterMemory,
    deleteSemesterMemory,
    showToast,
    closeSemesterMemories,
  } = useMobileApp();

  const termo = academicTerms.find((t) => t.id === termId);
  const todas = memoriesByTerm(semesterMemories, termId);
  const [activeCategory, setActiveCategory] = useState<'todas' | 'feliz' | 'engracada' | 'assustadora' | 'memoravel'>('todas');
  const memorias = activeCategory === 'todas' ? todas : todas.filter((m) => m.category === activeCategory);

  const [showWizard, setShowWizard] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const memoria = termo && todas.length > 0 ? todas[0] : undefined;
  const editingMemory = todas.find((m) => m.id === editingId);

  const handleOpenWizard = () => setShowWizard(true);
  const handleWizardFinish = () => setShowWizard(false);

  const handleOpenCapture = () => setShowCapture(true);
  const handleCaptureFinish = () => setShowCapture(false);

  const handleCaptureSaved = (input: {
    title: string;
    category: 'feliz' | 'engracada' | 'assustadora' | 'memoravel';
    description?: string;
    memoryDate?: string;
    now: string;
  }) => {
    const termDate = termo?.startedAt ?? '';
    addSemesterMemory({ termId, termDate, ...input });
    showToast(frase(CELEBRACAO, 'memoriaGuardada'));
  };

  const handleEdit = (mem: SemesterMemory) => setEditingId(mem.id);

  const handleSave = (input: {
    title: string;
    category: 'feliz' | 'engracada' | 'assustadora' | 'memoravel';
    description?: string;
    memoryDate?: string;
  }) => {
    const agora = new Date().toISOString();
    const termDate = termo?.startedAt ?? '';
    addSemesterMemory({ termId, termDate, ...input, now: agora });
    showToast(frase(CELEBRACAO, 'memoriaGuardada'));
  };

  const handleUpdate = (mem: SemesterMemory, patch: {
    title?: string;
    category?: 'feliz' | 'engracada' | 'assustadora' | 'memoravel';
    description?: string;
    memoryDate?: string;
  }) => {
    const agora = new Date().toISOString();
    updateSemesterMemory(mem.id, patch, agora);
    setEditingId(null);
    showToast(frase(CELEBRACAO, 'memoriaGuardada'));
  };

  const handleRequestDelete = (mem: SemesterMemory) => {
    setDeletingId(mem.id);
  };

  const handleConfirmDelete = () => {
    if (!deletingId) return;
    deleteSemesterMemory(deletingId);
    setDeletingId(null);
    setEditingId(null);
    showToast(frase(CELEBRACAO, 'memoriaRemovida'));
  };

  const handleCancelDelete = () => setDeletingId(null);

  const termoLabel = termo?.label ?? 'este semestre';
  const termoData = termo ? formatDateBR(termo.startedAt) : '';
  const totalMemorias = todas.length;

  if (totalMemorias === 0) {
    return (
      <div className="px-4 pt-6 pb-10 space-y-4">
        <section className="space-y-2">
          <span className="text-[11px] font-semibold text-ceci-tertiary uppercase tracking-wider">
            arquivo acadêmico
          </span>
          <h1 className="font-display font-bold text-[24px] sm:text-[30px] tracking-tight text-ceci-primary">
            memórias de {termoLabel}
          </h1>
          <p className="text-sm text-ceci-secondary leading-relaxed">
            {frase(VAZIO, 'memoriasSubtitulo')}
          </p>
          {termoData && (
            <span className="text-xs font-semibold text-ceci-secondary">
              {frase(VAZIO, 'memoriasContexto', { data: termoData, n: 0 })}
            </span>
          )}
        </section>

        <EmptyState
          title={frase(VAZIO, 'vazioMemoriasTitulo')}
          description={frase(VAZIO, 'vazioMemoriasDescricao')}
          actionLabel="registrar primeira memória"
          onAction={handleOpenCapture}
          secondaryActionLabel="deixar para depois"
          onSecondaryAction={() => closeSemesterMemories()}
        />

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCapture}
            className="rounded-full border border-ceci-border-brand bg-surface-rose px-6 py-2.5 text-sm font-semibold text-ceci-brand-strong hover:bg-surface-rose cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden /> nova memória
          </button>
          <button
            type="button"
            onClick={handleOpenWizard}
            className="rounded-full border border-ceci-border-default bg-surface-default px-4 py-2 text-xs text-ceci-secondary hover:bg-surface-muted cursor-pointer"
          >
            responder por categorias
          </button>
        </div>
      </div>
    );
  }

  const memoriaParaEditar = editingMemory;

  return (
    <div className="px-4 pt-6 pb-10 space-y-5">
      <section className="space-y-2">
        <button
          type="button"
          onClick={() => closeSemesterMemories()}
          aria-label="voltar aos semestres passados"
          className="inline-flex items-center gap-1.5 rounded-full border border-ceci-border-default bg-surface-default px-3.5 py-1.5 text-xs font-semibold text-ceci-secondary hover:bg-surface-muted cursor-pointer"
        >
          <span className="text-[12px]">←</span> semestres passados
        </button>
        <span className="text-[11px] font-semibold text-ceci-tertiary uppercase tracking-wider">
          arquivo acadêmico
        </span>
        <h1 className="font-display font-bold text-[24px] sm:text-[30px] tracking-tight text-ceci-primary">
          memórias de {termoLabel}
        </h1>
        <p className="text-sm text-ceci-secondary leading-relaxed">{frase(VAZIO, 'memoriasSubtitulo')}</p>
        <span className="text-xs font-semibold text-ceci-secondary">
          {frase(VAZIO, 'memoriasContexto', { data: termoData, n: totalMemorias })}
        </span>

        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCapture}
            className="rounded-full border border-ceci-border-brand bg-surface-rose px-6 py-2.5 text-sm font-semibold text-ceci-brand-strong hover:bg-surface-rose cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden /> nova memória
          </button>
          <button
            type="button"
            onClick={handleOpenWizard}
            className="rounded-full border border-ceci-border-default bg-surface-default px-4 py-2 text-xs text-ceci-secondary hover:bg-surface-muted cursor-pointer"
          >
            responder por categorias
          </button>
        </div>
      </section>

      {/* Resumo do semestre: métricas congeladas (quando existirem). */}
      {termo?.summary && (
        <dl className="grid grid-cols-3 gap-2 text-center rounded-[20px] border border-ceci-border-default bg-surface-default p-3">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-ceci-tertiary">aulas</dt>
            <dd className="text-sm font-semibold text-ceci-primary">{termo.summary.classNotes}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-ceci-tertiary">foco</dt>
            <dd className="text-sm font-semibold text-ceci-primary">
              {Math.round(termo.summary.focusMinutes / 60)}h
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-ceci-tertiary">leitura</dt>
            <dd className="text-sm font-semibold text-ceci-primary">{termo.summary.pagesRead}</dd>
          </div>
        </dl>
      )}

      <CeciMemoryCategorySummary
        memories={todas}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <ol className="space-y-3">
        {memorias.map((mem) => (
          <li key={mem.id}>
            <CeciMemoryCard
              memory={mem}
              onEdit={handleEdit}
              onDelete={handleRequestDelete}
            />
          </li>
        ))}
      </ol>

      {memoriaParaEditar && (
        <CeciMemoryEditSheet
          memory={memoriaParaEditar}
          open={!!editingId}
          onOpenChange={(v) => {
            if (!v) setEditingId(null);
          }}
          onSave={(patch) => handleUpdate(memoriaParaEditar, patch)}
          onDelete={handleRequestDelete}
        />
      )}

      {deletingId && (
        <Modal
          open={!!deletingId}
          onClose={handleCancelDelete}
          labelledBy="dialog-excluir-memoria"
        >
          <div className="p-6 space-y-3">
            <h2 id="dialog-excluir-memoria" className="font-display font-bold text-ceci-primary">
              excluir esta memória?
            </h2>
            <p className="text-sm text-ceci-secondary">
              apenas a memória “{todas.find((m) => m.id === deletingId)?.title}” será removida. isso não desfaz.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="rounded-full border border-ceci-border-default bg-surface-default px-4 py-2 text-sm text-ceci-secondary hover:bg-surface-muted cursor-pointer"
              >
                cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-full border border-ceci-border-brand bg-ceci-brand px-4 py-2 text-sm text-ceci-on-brand hover:bg-ceci-brand-strong cursor-pointer"
              >
                excluir
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCapture && (
        <CeciMemoryCapture
          termId={termId}
          onSaved={handleCaptureSaved}
          onClose={handleCaptureFinish}
          onGuided={handleOpenWizard}
        />
      )}

      {showWizard && (
        <MemoryWizard termId={termId} onFinish={handleWizardFinish} />
      )}
    </div>
  );
};
