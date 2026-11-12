// Página "ver tudo" (SPEC-034 §6.1/§6.2): listagem completa de uma seleção,
// preservando título e contexto da seção de origem.
//
// Props:
//   secaoId   — id da seção de origem
//   titulo    — título da seção (preservado)
//   descricao — descrição da seção (preservada)
//   materiais — lista completa de materiais da seleção
//   onNavigate — callback para detalhe do material
export interface VerTudoViewProps {
  secaoId: string;
  titulo: string;
  descricao?: string;
  materiais: Material[];
  onNavigate?: (tipo: 'detalheMaterial', id: string) => void;
}

import React, { memo, useCallback } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Material, EstadoPessoal } from '@/types';
import { useDataClientKnowledge } from '@/context/DataClientProvider';
import {
  materialEstaSalvo,
  materialEstaEmLeitura,
  materialEstaConcluido,
  percentualLeitura,
} from '../../../packages/domain/src/core/domain';
import { SectionTitle } from '../ui/SectionTitle';
import { Mascote } from '../ui/Mascote';
import { Reveal } from '@/lib/motion';

const VerTudoBookCard: React.FC<{
  book: Material;
  estado: EstadoPessoal | undefined;
  onSelect: (id: string) => void;
}> = ({ book, estado, onSelect }) => {
  const isSaved = materialEstaSalvo(estado);
  const isReading = materialEstaEmLeitura(estado);
  const pct = percentualLeitura(book);

  return (
    <Reveal>
      <button
        aria-label={`abrir ${book.titulo}`}
        onClick={() => onSelect(book.id)}
        className="w-full cursor-pointer group space-y-2 text-left"
      >
        <div
          className="w-full h-[145px] rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden shadow-xs border border-black/5 card-lift"
          style={{ backgroundColor: book.coverColor ?? '#E8C98C' }}
        >
          <div className="pl-1.5 flex items-center justify-between">
            <span className="text-[8px] font-extrabold uppercase bg-cover-base/90 text-cover-ink px-1.5 py-0.5 rounded shadow-2xs line-clamp-1">
              livro
            </span>
            {isSaved && <span className="w-3.5 h-3.5 fill-cover-ink text-cover-ink">♡</span>}
          </div>
          <div className="pl-1.5 my-auto">
            <p className="font-display font-bold text-[11px] text-cover-ink line-clamp-3 leading-tight">
              {book.titulo}
            </p>
          </div>
          <div className="pl-1.5">
            <p className="text-[9px] font-semibold text-cover-ink/80 line-clamp-1">
              {book.autorId ?? 'autor'}
            </p>
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="font-display font-bold text-xs text-ceci-primary line-clamp-1 group-hover:text-ceci-brand-strong transition-colors">
            {book.titulo}
          </p>
          {isReading && (
            <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ceci-brand to-ceci-brand-strong"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          )}
        </div>
      </button>
    </Reveal>
  );
}

export const VerTudoView = memo<VerTudoViewProps>(({
  secaoId,
  titulo,
  descricao,
  materiais,
  onNavigate,
}) => {
  const { estadoPessoal } = useDataClientKnowledge();

  const estadoDe = (materialId: string) =>
    estadoPessoal.find((e) => e.materialId === materialId);

  const onSelectBook = useCallback(
    (id: string) => {
      onNavigate?.('detalheMaterial', id);
    },
    [onNavigate],
  );

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1 relative">
      <SectionTitle
        icon={<Sparkles className="w-4 h-4 text-ceci-brand-strong" />}
      >
        {titulo}
      </SectionTitle>
      {descricao && (
        <p className="text-xs text-ceci-secondary leading-relaxed">
          {descricao}
        </p>
      )}

      {materiais.length === 0 ? (
        <div className="py-10 text-center px-1 border border-ceci-border-default rounded-2xl bg-surface-default">
          <Mascote expression="no-results" className="w-12 h-12 mx-auto" decorative />
          <h3 className="font-display font-bold text-sm text-ceci-primary mt-2">
            nenhum material nesta seleção
          </h3>
          <p className="text-xs text-ceci-secondary mt-1 max-w-xs mx-auto">
            volte mais tarde — a curadoria está sempre atualizando ♡
          </p>
        </div>
      ) : (
        <div className="space-y-3 px-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-xs text-ceci-tertiary uppercase tracking-wider">
              todos os materiais
            </h3>
            <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
              {materiais.length}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {materiais.map((book, i) => {
              const estado = estadoDe(book.id);
              return (
                <VerTudoBookCard
                  key={book.id}
                  book={book}
                  estado={estado}
                  onSelect={onSelectBook}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

VerTudoView.displayName = 'VerTudoView';
