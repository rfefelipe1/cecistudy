// Página individual de um eixo temático (SPEC-034 §3.1, §5.3).
// Dados vindos de `eixosTematicos`/`bibliotecas` (useDataClientKnowledge).
// Apresentação visual editorial + prateleiras de materiais.
//
// Props:
//   eixoId  — id do eixo temático (obrigatório)
//   onNavigate — callback para navegar (detalhe do material, etc.)
export interface EixoViewProps {
  eixoId: string;
  onNavigate?: (tipo: 'detalheMaterial', id: string) => void;
}

import React, { memo, useCallback } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import {
  EixoTematico,
  Material,
  EstadoPessoal,
} from '@/types';
import { useDataClientKnowledge } from '@/context/DataClientProvider';
import {
  materialEstaSalvo,
  materialEstaEmLeitura,
  materialEstaConcluido,
  materialEstaFavorito,
  percentualLeitura,
} from '../../../packages/domain/src/core/domain';
import { salvarMaterial, favoritarMaterial, concluirMaterial } from '../../../packages/application/src/biblioteca';
import { SectionTitle } from '../ui/SectionTitle';
import { Mascote } from '../ui/Mascote';
import { Reveal } from '@/lib/motion';
import { frase } from '@/lib/voice';

/** Card de livro simples para prateleira do eixo (reutiliza padrão dos cards existentes). */
const EixoBookCard: React.FC<{
  book: Material;
  estado: EstadoPessoal | undefined;
  onSelect: (id: string) => void;
}> = ({ book, estado, onSelect }) => {
  const isSaved = materialEstaSalvo(estado);
  const isReading = materialEstaEmLeitura(estado);
  const isDone = materialEstaConcluido(estado);
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
          style={{ backgroundColor: '#E8C98C' }}
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

export const EixoView = memo<EixoViewProps>(({
  eixoId,
  onNavigate,
}) => {
  const { eixosTematicos, bibliotecas, estadoPessoal } = useDataClientKnowledge();

  const eixo = eixosTematicos.find((e) => e.id === eixoId);
  const materiaisDoEixo = bibliotecas.filter((m) => m.eixoId === eixoId);

  if (!eixo) {
    return (
      <div className="max-w-md mx-auto py-12 text-center px-1">
        <Mascote expression="no-results" className="w-16 h-16 mx-auto" decorative />
        <h3 className="font-display font-bold text-base text-ceci-primary">
          eixo não encontrado
        </h3>
        <p className="text-xs text-ceci-secondary mt-1">
          esse eixo ainda não está disponível.
        </p>
      </div>
    );
  }

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
      {/* Cabeçalho editorial do eixo */}
      <SectionTitle
        icon={<Sparkles className="w-4 h-4 text-ceci-brand-strong" />}
      >
        {eixo.nome}
      </SectionTitle>
      <p className="text-xs text-ceci-secondary leading-relaxed">
        {eixo.descricao}
      </p>

      {materiaisDoEixo.length === 0 ? (
        <div className="py-10 text-center px-1 border border-ceci-border-default rounded-2xl bg-surface-default">
          <Mascote expression="no-results" className="w-12 h-12 mx-auto" decorative />
          <h3 className="font-display font-bold text-sm text-ceci-primary mt-2">
            nenhum material neste eixo ainda
          </h3>
          <p className="text-xs text-ceci-secondary mt-1 max-w-xs mx-auto">
            volte mais tarde — a curadoria está sempre adicionando novidades ♡
          </p>
        </div>
      ) : (
        <div className="space-y-3 px-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-xs text-ceci-tertiary uppercase tracking-wider">
              materiais deste eixo
            </h3>
            <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2 py-0.5 rounded-full border border-ceci-border-brand">
              {materiaisDoEixo.length}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {materiaisDoEixo.map((book, i) => {
              const estado = estadoDe(book.id);
              return (
                <EixoBookCard
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

EixoView.displayName = 'EixoView';
