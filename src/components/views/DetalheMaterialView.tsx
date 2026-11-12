// Página de detalhes do material (SPEC-034 §9).
// Ficha informativa (não o leitor) com 3 abas: Resumo / Informações / Conteúdo.
// Ações refletem o estado atual do material; botão desativado se indisponível.
//
// Props:
//   materialId — id do material (obrigatório)
//   onNavigate — callback para navegar (leitura, etc.)
export interface DetalheMaterialViewProps {
  materialId: string;
  onNavigate?: (tipo: 'ler', id: string) => void;
}

import React, { memo, useCallback, useMemo, useState } from 'react';
import { BookOpen, Bookmark, Share2, CheckCircle2 } from 'lucide-react';
import { Material, EstadoPessoal } from '@/types';
import { useDataClientKnowledge } from '@/context/DataClientProvider';
import {
  materialEstaSalvo,
  materialEstaEmLeitura,
  materialEstaConcluido,
  materialEstaFavorito,
  materialDisponivel,
  percentualLeitura,
} from '../../../packages/domain/src/core/domain';
import { salvarMaterial, desalvarMaterial, favoritarMaterial, concluirMaterial, atualizarProgresso } from '../../../packages/application/src/biblioteca';
import { SectionTitle } from '../ui/SectionTitle';
import { Mascote } from '../ui/Mascote';

type AbaDetalhe = 'resumo' | 'informacoes' | 'conteudo';

const abaLabel: Record<AbaDetalhe, string> = {
  resumo: 'resumo',
  informacoes: 'informações',
  conteudo: 'conteúdo',
};

export const DetalheMaterialView = memo<DetalheMaterialViewProps>(({
  materialId,
  onNavigate,
}) => {
  const { bibliotecas, estadoPessoal, setEstadoPessoalRaw } = useDataClientKnowledge();

  const material = bibliotecas.find((m) => m.id === materialId);
  const estado = estadoPessoal.find((e) => e.materialId === materialId);
  const [abaAtiva, setAbaAtiva] = useState<AbaDetalhe>('resumo');

  if (!material) {
    return (
      <div className="max-w-md mx-auto py-12 text-center px-1">
        <Mascote expression="no-results" className="w-16 h-16 mx-auto" decorative />
        <h3 className="font-display font-bold text-base text-ceci-primary">
          material não encontrado
        </h3>
        <p className="text-xs text-ceci-secondary mt-1">
          essa obra não está mais disponível no catálogo.
        </p>
      </div>
    );
  }

  const isSaved = materialEstaSalvo(estado);
  const isReading = materialEstaEmLeitura(estado);
  const isDone = materialEstaConcluido(estado);
  const isFavorito = materialEstaFavorito(estado);
  const disponivel = materialDisponivel(material);
  const pct = percentualLeitura(material);

  const toggleSalvo = useCallback(() => {
    const next = materialEstaSalvo(estado)
      ? desalvarMaterial(estadoPessoal, materialId)
      : salvarMaterial(estadoPessoal, materialId);
    setEstadoPessoalRaw(next);
  }, [materialId, estado, estadoPessoal, setEstadoPessoalRaw]);

  const toggleFavorito = useCallback(() => {
    const next = materialEstaFavorito(estado)
      ? desalvarMaterial(estadoPessoal, materialId)
      : favoritarMaterial(estadoPessoal, materialId);
    setEstadoPessoalRaw(next);
  }, [materialId, estado, estadoPessoal, setEstadoPessoalRaw]);

  const marcarConcluido = useCallback(() => {
    setEstadoPessoalRaw(concluirMaterial(estadoPessoal, materialId));
  }, [materialId, estadoPessoal, setEstadoPessoalRaw]);

  const continuarLeitura = useCallback(() => {
    setEstadoPessoalRaw(atualizarProgresso(estadoPessoal, materialId));
    onNavigate?.('ler', materialId);
  }, [materialId, estadoPessoal, setEstadoPessoalRaw, onNavigate]);

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1 relative">
      {/* Cabeçalho editorial */}
      <SectionTitle icon={<BookOpen className="w-4 h-4 text-ceci-brand-strong" />}>
        {material.titulo}
      </SectionTitle>
      <p className="text-xs text-ceci-tertiary">{material.autorId ?? 'autor'}</p>

      {/* Capa / identificação */}
      <div className="h-48 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden shadow-xs border border-black/5"
           style={{ backgroundColor: material.coverColor ?? '#E8C98C' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[40px]">📖</span>
        </div>
      </div>

      {/* Ações principais */}
      <div className="flex gap-2 px-1">
        <button
          onClick={continuarLeitura}
          disabled={!disponivel}
          className={`flex-1 py-3 rounded-xl text-xs font-bold tap-interactive cursor-pointer ${
            disponivel
              ? 'bg-ceci-primary text-ceci-on-primary shadow-sm hover:bg-ceci-brand-strong'
              : 'bg-surface-muted text-ceci-tertiary border border-ceci-border-default cursor-not-allowed'
          }`}
        >
          {isReading ? 'continuar leitura' : 'começar leitura'}
        </button>
        <button
          onClick={toggleSalvo}
          className={`w-10 h-10 rounded-xl border tap-interactive cursor-pointer ${
            isSaved
              ? 'bg-ceci-brand-strong text-ceci-on-brand border-ceci-brand-strong'
              : 'bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
          }`}
          title={isSaved ? 'remover dos salvos' : 'salvar para depois'}
        >
          <Bookmark className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFavorito}
          className={`w-10 h-10 rounded-xl border tap-interactive cursor-pointer ${
            isFavorito
              ? 'bg-ceci-brand-strong text-ceci-on-brand border-ceci-brand-strong'
              : 'bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
          }`}
          title={isFavorito ? 'desfavoritar' : 'favoritar'}
        >
          <span className="text-[24px]">{isFavorito ? '♡' : '♡'}</span>
        </button>
        <button
          className="w-10 h-10 rounded-xl border tap-interactive cursor-pointer bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted"
          title="compartilhar"
        >
          <Share2 className="w-5 h-5" />
        </button>
        {!disponivel && (
          <button
            onClick={marcarConcluido}
            className={`w-10 h-10 rounded-xl border tap-interactive cursor-pointer ${
              isDone ? 'bg-surface-blue text-ceci-academic-strong border-ceci-border-academic' : 'bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
            }`}
            title={isDone ? 'marcar como não concluído' : 'marcar como concluído'}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide px-1">
        {(['resumo', 'informacoes', 'conteudo'] as AbaDetalhe[]).map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`px-3 py-2 rounded-xl text-xs border tap-interactive cursor-pointer whitespace-nowrap ${
              abaAtiva === aba
                ? 'bg-ceci-primary text-ceci-on-primary border-ceci-primary'
                : 'bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
            }`}
          >
            {abaLabel[aba]}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      <div className="px-1 space-y-3">
        {abaAtiva === 'resumo' && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-ceci-tertiary uppercase tracking-wider">resumo</h4>
            <p className="text-xs text-ceci-secondary leading-relaxed">
              {material.titulo} — obra do tipo "{material.tipo}" no acervo da biblioteca.
              {material.disponibilidade === 'indisponivel' ? ' Atualmente não há arquivo disponível para leitura.' : ''}
            </p>
          </div>
        )}
        {abaAtiva === 'informacoes' && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-ceci-tertiary uppercase tracking-wider">informações</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ceci-tertiary">tipo</span>
                <span className="text-ceci-primary">{material.tipo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ceci-tertiary">disponibilidade</span>
                <span className={`text-ceci-primary ${material.disponibilidade === 'disponivel' ? 'text-ceci-academic-strong' : 'text-ceci-tertiary'}`}>
                  {material.disponibilidade === 'disponivel' ? 'disponível' : 'indisponível'}
                </span>
              </div>
              {material.totalPaginas && (
                <div className="flex justify-between text-xs">
                  <span className="text-ceci-tertiary">total de páginas</span>
                  <span className="text-ceci-primary">{material.totalPaginas}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-ceci-tertiary">progresso</span>
                <span className="text-ceci-primary">{pct}%</span>
              </div>
            </div>
          </div>
        )}
        {abaAtiva === 'conteudo' && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-ceci-tertiary uppercase tracking-wider">conteúdo</h4>
            <p className="text-xs text-ceci-secondary">
              a estrutura interna do material (sumário, partes, capítulos) aparece aqui
              quando o documento estiver disponível para leitura.
            </p>
          </div>
        )}
      </div>

      {/* Progresso */}
      {isReading && (
        <div className="px-1 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-ceci-tertiary">progresso da leitura</span>
            <span className="text-ceci-primary">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ceci-brand to-ceci-brand-strong"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

DetalheMaterialView.displayName = 'DetalheMaterialView';
