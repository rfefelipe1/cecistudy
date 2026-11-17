import React, { useState } from 'react';
import { validarMemoria, type MemoryCategory, type SemesterMemory } from '../../lib/semesterMemory';
import { cn } from '@/lib/utils';
import { Modal } from '../ui/Modal';
import { frase, CELEBRACAO, CONFIRMACAO, VAZIO } from '../../lib/voice';

export interface CeciMemoryEditSheetProps {
  memory: SemesterMemory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: {
    title: string;
    category: MemoryCategory;
    description?: string;
    memoryDate?: string;
  }) => void;
  onDelete: (memoria: SemesterMemory) => void;
}

const CATEGORIAS: Array<{ id: MemoryCategory; label: string }> = [
  { id: 'feliz', label: 'feliz' },
  { id: 'engracada', label: 'engraçada' },
  { id: 'assustadora', label: 'assustadora' },
  { id: 'memoravel', label: 'memorável' },
];

/**
 * Sheet de edição de uma memória existente (mobile: bottom sheet).
 *
 * Nunca altera termId, termDate nem createdAt. Fecha com confirmação quando há
 * alteração não salva.
 */
export const CeciMemoryEditSheet: React.FC<CeciMemoryEditSheetProps> = ({
  memory,
  open,
  onOpenChange,
  onSave,
  onDelete,
}) => {
  const [draft, setDraft] = useState({
    title: memory.title,
    category: memory.category,
    description: memory.description ?? '',
    memoryDate: memory.memoryDate ?? '',
  });
  const [confirmandoDescartar, setConfirmandoDescartar] = useState(false);

  const dirty =
    draft.title !== memory.title ||
    draft.category !== memory.category ||
    draft.description !== (memory.description ?? '') ||
    draft.memoryDate !== (memory.memoryDate ?? '');

  const handleClose = () => {
    if (dirty && !confirmandoDescartar) {
      setConfirmandoDescartar(true);
      return;
    }
    onOpenChange(false);
  };

  const handleSave = () => {
    const erro = validarMemoria(draft);
    if (erro) return;
    onSave({
      title: draft.title.trim(),
      category: draft.category,
      description: draft.description.trim() || undefined,
      memoryDate: draft.memoryDate || undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(memory);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      position="bottom"
      showGrabber
      labelledBy="sheet-editar-memoria"
    >
      <div className="space-y-4">
        <h2 id="sheet-editar-memoria" className="font-display font-bold text-ceci-primary">
          editar memória
        </h2>

        <div>
          <label className="block text-xs font-semibold text-ceci-text-soft">categoria</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CATEGORIAS.map((c) => {
              const sel = draft.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-pressed={sel}
                  onClick={() => setDraft({ ...draft, category: c.id })}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm font-semibold cursor-pointer transition',
                    sel
                      ? 'border-ceci-brand bg-ceci-brand-soft text-ceci-brand-strong'
                      : 'border-ceci-border-default bg-surface-default text-ceci-secondary hover:bg-surface-muted',
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ceci-text-soft">título</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            autoFocus
            className="w-full rounded-xl border border-ceci-border-default bg-surface-input px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ceci-text-soft">
            descrição (opcional)
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-ceci-border-default bg-surface-input px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-ceci-text-soft">data da memória</label>
          <input
            type="date"
            value={draft.memoryDate}
            onChange={(e) => setDraft({ ...draft, memoryDate: e.target.value })}
            className="rounded-xl border border-ceci-border-default bg-surface-input px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              if (dirty) {
                setConfirmandoDescartar(true);
                return;
              }
              onOpenChange(false);
            }}
            className="rounded-full border border-ceci-border-default bg-surface-default px-4 py-2 text-sm text-ceci-secondary hover:bg-surface-muted cursor-pointer"
          >
            cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full border border-ceci-border-brand bg-ceci-brand px-4 py-2 text-sm text-ceci-on-brand hover:bg-ceci-brand-strong cursor-pointer"
          >
            {frase(CELEBRACAO, 'guardarAlteracoes')}
          </button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleDelete}
            className="w-full rounded-full border border-ceci-border-default bg-surface-default px-4 py-2 text-sm text-status-danger hover:bg-surface-rose cursor-pointer"
          >
            excluir memória
          </button>
        </div>

        {confirmandoDescartar && (
          <div className="mt-3 p-3 rounded-xl border border-ceci-border-default bg-surface-muted">
            <p className="text-sm text-ceci-secondary">
              {frase(CONFIRMACAO, 'resetarDescricao')}
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoDescartar(false)}
                className="rounded-full border border-ceci-border-default bg-surface-default px-3 py-1.5 text-xs text-ceci-secondary hover:bg-surface-muted cursor-pointer"
              >
                continuar editando
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  setConfirmandoDescartar(false);
                }}
                className="rounded-full border border-ceci-border-default bg-surface-default px-3 py-1.5 text-xs text-ceci-secondary hover:bg-surface-muted cursor-pointer"
              >
                descartar alterações
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
