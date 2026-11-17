// Barra de busca global da Biblioteca (SPEC-034 §7).
// Sugestões antes de digitar; resultados durante a digitação; filtros acima dos
// resultados; estado sem resultados.
//
// Props:
//   onSelect — chamado quando o usuário seleciona um resultado
export interface BuscaBibliotecaProps {
  onSelect: (id: string) => void;
}

import React, { useCallback, useMemo, useState } from 'react';
import { Search, X, RotateCcw, ChevronRight } from 'lucide-react';
import { Material } from '@/types';
import { useDataClientKnowledge } from '@/context/DataClientProvider';
import { Mascote } from '../ui/Mascote';

const TIPOS_MATERIAL: readonly ('livro' | 'artigo' | 'apostila' | 'paper' | 'pesquisa')[] = [
  'livro',
  'artigo',
  'apostila',
  'paper',
  'pesquisa',
];

export const BuscaBiblioteca = ({
  onSelect,
}: BuscaBibliotecaProps) => {
  const { bibliotecas } = useDataClientKnowledge();

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<
    | 'todos'
    | 'livro'
    | 'artigo'
    | 'apostila'
    | 'paper'
    | 'pesquisa'
  >('todos');
  const [filtroDisponibilidade, setFiltroDisponibilidade] = useState<
    'todos' | 'disponivel' | 'indisponivel'
  >('todos');

  const sugestoes = useMemo(() => {
    // Sugestões de descoberta antes de digitar (spec principal §7.1)
    return bibliotecas.slice(0, 6);
  }, [bibliotecas]);

  const resultados = useMemo(() => {
    let lista = bibliotecas;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      lista = lista.filter(
        (m) =>
          m.titulo.toLowerCase().includes(s) ||
          (m.autorId ?? '').toLowerCase().includes(s) ||
          m.tipo.toLowerCase().includes(s),
      );
    }
    if (filtroTipo !== 'todos') {
      lista = lista.filter((m) => m.tipo === filtroTipo);
    }
    if (filtroDisponibilidade !== 'todos') {
      lista = lista.filter((m) => m.disponibilidade === filtroDisponibilidade);
    }
    return lista;
  }, [bibliotecas, searchTerm, filtroTipo, filtroDisponibilidade]);

  const temFiltrosAtivos = filtroTipo !== 'todos' || filtroDisponibilidade !== 'todos';

  const limpar = useCallback(() => {
    setSearchTerm('');
    setFiltroTipo('todos');
    setFiltroDisponibilidade('todos');
  }, []);

  const onSelectResult = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect],
  );

  const mostrarSugestoes =
    searchTerm.trim() === '' && !temFiltrosAtivos;
  const mostrarVazio = resultados.length === 0 && !mostrarSugestoes;

  const chipAtivo = 'bg-ceci-primary text-ceci-on-primary border-ceci-primary';
  const chipInativo =
    'bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted';

  const chipDisponivel =
    'bg-surface-blue text-ceci-academic-strong border-ceci-border-academic';
  const chipIndisponivel =
    'bg-surface-muted text-ceci-tertiary border-ceci-border-default';

  return (
    <div className="space-y-4 px-1">
      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-ceci-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="pesquisar obra, autor, assunto..."
          className="w-full bg-surface-default border border-ceci-border-default rounded-2xl pl-10 pr-8 py-3 text-xs text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-ceci-brand shadow-2xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ceci-tertiary hover:text-ceci-primary cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setFiltroTipo('todos')}
          className={`px-3 py-2 rounded-full text-xs border tap-interactive cursor-pointer ${
            filtroTipo === 'todos' ? chipAtivo : chipInativo
          }`}
        >
          todos
        </button>
        {TIPOS_MATERIAL.map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`px-3 py-2 rounded-full text-xs border tap-interactive cursor-pointer ${
              filtroTipo === tipo ? chipAtivo : chipInativo
            }`}
          >
            {tipo}
          </button>
        ))}
        <button
          onClick={() => setFiltroDisponibilidade('todos')}
          className={`px-3 py-2 rounded-full text-xs border tap-interactive cursor-pointer ${
            filtroDisponibilidade === 'todos'
              ? 'bg-ceci-academic-strong text-ceci-on-academic border-ceci-border-academic'
              : chipInativo
          }`}
        >
          disp: todos
        </button>
        <button
          onClick={() => setFiltroDisponibilidade('disponivel')}
          className={`px-3 py-2 rounded-full text-xs border tap-interactive cursor-pointer ${
            filtroDisponibilidade === 'disponivel' ? chipDisponivel : chipInativo
          }`}
        >
          disponível
        </button>
        {temFiltrosAtivos && (
          <button
            onClick={limpar}
            className="text-xs text-ceci-brand-strong underline hover:text-ceci-primary ml-2 cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> limpar
          </button>
        )}
      </div>

      {mostrarSugestoes && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-ceci-tertiary uppercase tracking-wider">
            descubra
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sugestoes.map((book) => (
              <button
                key={book.id}
                onClick={() => onSelectResult(book.id)}
                className="px-3 py-2 rounded-xl bg-surface-default border border-ceci-border-default text-xs text-left text-ceci-primary hover:bg-surface-muted tap-interactive cursor-pointer"
              >
                {book.titulo}
              </button>
            ))}
          </div>
        </div>
      )}

      {mostrarVazio && (
        <div className="py-12 text-center px-1 border border-ceci-border-default rounded-2xl bg-surface-default">
          <Mascote expression="no-results" className="w-14 h-14 mx-auto" decorative />
          <h3 className="font-display font-bold text-sm text-ceci-primary mt-2">
            nenhuma obra encontrada
          </h3>
          <p className="text-xs text-ceci-secondary mt-1 max-w-xs mx-auto">
            tente outro termo ou afrouxe os filtros.
          </p>
          <button
            onClick={limpar}
            className="px-4 py-2 bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong rounded-full text-xs font-bold mt-3 cursor-pointer"
          >
            limpar filtros
          </button>
        </div>
      )}

      {!mostrarSugestoes && !mostrarVazio && resultados.length > 0 && (
        <div className="space-y-3 px-1">
          <p className="text-xs font-bold text-ceci-tertiary uppercase tracking-wider">
            {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {resultados.map((book) => (
              <button
                key={book.id}
                onClick={() => onSelectResult(book.id)}
                className="w-full cursor-pointer group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-default border border-ceci-border-default hover:border-ceci-brand tap-interactive text-left"
              >
                <div
                  className="w-10 h-14 rounded-xl p-1 flex flex-col justify-between relative overflow-hidden shadow-xs border border-black/5"
                  style={{ backgroundColor: book.coverColor ?? '#E8C98C' }}
                >
                  <div className="pl-1 my-auto">
                    <p className="font-display font-bold text-[10px] text-cover-ink line-clamp-2 leading-tight">
                      {book.titulo}
                    </p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-xs text-ceci-primary line-clamp-1 group-hover:text-ceci-brand-strong transition-colors">
                    {book.titulo}
                  </p>
                  <p className="text-[9px] text-ceci-tertiary line-clamp-1">
                    {book.autorId ?? 'autor'}
                  </p>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      book.disponibilidade === 'disponivel' ? chipDisponivel : chipIndisponivel
                    }`}
                  >
                    {book.disponibilidade === 'disponivel' ? 'disponível' : 'indisponível'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-ceci-tertiary shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
