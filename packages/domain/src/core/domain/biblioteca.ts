// Biblioteca — domínio puro (SPEC-034).
//
// Todas as funções são puras: recebem dados e devolvem novos dados, sem efeito
// colateral, sem `Date` (datas civis como strings ISO), sem `react`.
// Usada por `packages/application/src/biblioteca/` (use-cases) e pelas views
// de `src/components/views/` via `useDataClient*`.

import type {
  Arquivo,
  AutorBiblioteca,
  ColecaoEditorial,
  EixoTematico,
  EstadoPessoal,
  Material,
  Prateleira,
  Recomendacao,
  Subtema,
} from '../../../../../src/types';

/** Id determinístico para nova entidade da biblioteca. */
export function makeBibliotecaId(): string {
  return `bib-${crypto.randomUUID?.() ?? String(Date.now())}`;
}

/* ----------------------------------------------------------------------- */
// Factories
/* ----------------------------------------------------------------------- */

export function material(props: {
  id?: string;
  titulo: string;
  autorId?: string;
  eixoId?: string;
  tipo: Material['tipo'];
  totalPaginas?: number;
  disponibilidade?: 'disponivel' | 'indisponivel';
  caminhoArquivo?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}): Material {
  const agora = props.criadoEm ?? new Date().toISOString();
  return {
    id: props.id ?? makeBibliotecaId(),
    titulo: props.titulo.trim(),
    autorId: props.autorId ?? undefined,
    eixoId: props.eixoId ?? undefined,
    tipo: props.tipo,
    totalPaginas: props.totalPaginas ?? undefined,
    paginasLidas: 0,
    disponibilidade: props.disponibilidade ?? 'disponivel',
    caminhoArquivo: props.caminhoArquivo ?? undefined,
    ultimaLeituraEm: undefined,
    criadoEm: agora,
    atualizadoEm: agora,
  };
}

export function eixoTematico(props: {
  id?: string;
  nome: string;
  descricao: string;
  cor?: string;
  ordem: number;
}): EixoTematico {
  return {
    id: props.id ?? makeBibliotecaId(),
    nome: props.nome.trim(),
    descricao: props.descricao.trim(),
    cor: props.cor ?? undefined,
    ordem: props.ordem,
  };
}

export function subtema(props: {
  id?: string;
  eixoId: string;
  nome: string;
  descricao: string;
  ordem: number;
}): Subtema {
  return {
    id: props.id ?? makeBibliotecaId(),
    eixoId: props.eixoId,
    nome: props.nome.trim(),
    descricao: props.descricao.trim(),
    ordem: props.ordem,
  };
}

export function colecaoEditorial(props: {
  id?: string;
  nome: string;
  descricao?: string;
  materialIds?: string[];
}): ColecaoEditorial {
  return {
    id: props.id ?? makeBibliotecaId(),
    nome: props.nome.trim(),
    descricao: props.descricao ?? undefined,
    materialIds: props.materialIds ?? [],
  };
}

export function prateleira(props: {
  id?: string;
  nome: string;
  descricao?: string;
  materialIds?: string[];
  ordem: number;
}): Prateleira {
  return {
    id: props.id ?? makeBibliotecaId(),
    nome: props.nome.trim(),
    descricao: props.descricao ?? undefined,
    materialIds: props.materialIds ?? [],
    ordem: props.ordem,
  };
}

export function recomendacao(props: {
  id?: string;
  materialId: string;
  motivo?: string;
  tipo: Recomendacao['tipo'];
  ativo?: boolean;
}): Recomendacao {
  return {
    id: props.id ?? makeBibliotecaId(),
    materialId: props.materialId,
    motivo: props.motivo ?? undefined,
    tipo: props.tipo,
    ativo: props.ativo ?? true,
  };
}

export function estadoPessoal(props: {
  materialId: string;
  salvo?: boolean;
  emLeitura?: boolean;
  concluido?: boolean;
  favorito?: boolean;
  nota?: number;
  dataAtualizacao?: string;
}): EstadoPessoal {
  return {
    materialId: props.materialId,
    salvo: props.salvo ?? false,
    emLeitura: props.emLeitura ?? false,
    concluido: props.concluido ?? false,
    favorito: props.favorito ?? false,
    nota: props.nota ?? undefined,
    dataAtualizacao: props.dataAtualizacao ?? new Date().toISOString(),
  };
}

export function arquivo(props: {
  id?: string;
  materialId: string;
  nomeArquivo: string;
  caminho: string;
  tamanho: number;
  tipoMime: string;
  disponibilidade: Arquivo['disponibilidade'];
  atualizadoEm?: string;
}): Arquivo {
  return {
    id: props.id ?? makeBibliotecaId(),
    materialId: props.materialId,
    nomeArquivo: props.nomeArquivo,
    caminho: props.caminho,
    tamanho: props.tamanho,
    tipoMime: props.tipoMime,
    disponibilidade: props.disponibilidade,
    atualizadoEm: props.atualizadoEm ?? new Date().toISOString(),
  };
}

/* ----------------------------------------------------------------------- */
// Derivados
/* ----------------------------------------------------------------------- */

/** Material tem arquivo disponível para leitura? (spec principal §11.1) */
export function materialDisponivel(m: Material): boolean {
  return m.disponibilidade === 'disponivel';
}

/** Material está concluído? */
export function materialEstaConcluido(e: EstadoPessoal | undefined): boolean {
  return e?.concluido ?? false;
}

/** Material está em leitura? */
export function materialEstaEmLeitura(e: EstadoPessoal | undefined): boolean {
  return e?.emLeitura ?? false;
}

/** Material está salvo? */
export function materialEstaSalvo(e: EstadoPessoal | undefined): boolean {
  return e?.salvo ?? false;
}

/** Material está favoritado? */
export function materialEstaFavorito(e: EstadoPessoal | undefined): boolean {
  return e?.favorito ?? false;
}

/** Percentual de leitura (0-100) com base no total de páginas. */
export function percentualLeitura(m: Material): number {
  if (!m.totalPaginas || m.totalPaginas <= 0) return 0;
  return Math.min(100, Math.round(((m.paginasLidas ?? 0) / m.totalPaginas) * 100));
}

/* ----------------------------------------------------------------------- */
// Transições puras de estado pessoal (spec principal §8.5: estados independentes)
/* ----------------------------------------------------------------------- */

const NOVO_REGISTRO = (materialId: string): EstadoPessoal =>
  estadoPessoal({ materialId });

/** Adiciona ou remove o material dos salvos. Retorna null se deve remover do array. */
export function alternarSalvo(estado: EstadoPessoal | undefined): EstadoPessoal | null {
  if (!estado) {
    return { ...estadoPessoal({ materialId: '' }), salvo: true };
  }
  const next = { ...estado, salvo: !estado.salvo };
  if (!next.salvo && !next.emLeitura && !next.concluido && !next.favorito) return null;
  return next;
}

/** Adiciona ou remove o material dos favoritos (independente de salvo/leitura). */
export function alternarFavorito(estado: EstadoPessoal | undefined): EstadoPessoal | null {
  if (!estado) {
    return { ...estadoPessoal({ materialId: '' }), favorito: true };
  }
  const next = { ...estado, favorito: !estado.favorito };
  return next.salvo || next.emLeitura || next.concluido || next.favorito ? next : null;
}

/** Marca como concluído: sai de em leitura, entra em concluídos, mantém favorito e salvo. */
export function concluir(estado: EstadoPessoal | undefined): EstadoPessoal {
  const base = estado ?? NOVO_REGISTRO(estado?.materialId ?? '');
  return {
    ...base,
    concluido: true,
    emLeitura: false, // concluído sai de em leitura
    salvo: base.salvo, // mantém salvo
    favorito: base.favorito, // mantém favorito (INV-7)
  };
}

/** Retira de concluído, volta para salvo (não desfavorita). */
export function desconcluir(estado: EstadoPessoal | undefined): EstadoPessoal {
  const base = estado ?? NOVO_REGISTRO(estado?.materialId ?? '');
  return {
    ...base,
    concluido: false,
    salvo: true,
  };
}

/* ----------------------------------------------------------------------- */
// Filtros por eixo / coleção / prateleira (usados pelos use-cases de listagem)
/* ----------------------------------------------------------------------- */

export function materiaisDoEixo(materiais: Material[], eixoId: string): Material[] {
  return materiais.filter((m) => m.eixoId === eixoId);
}

export function materiaisDaColecao(
  materiais: Material[],
  colecao: ColecaoEditorial,
): Material[] {
  const ids = new Set(colecao.materialIds);
  return materiais.filter((m) => ids.has(m.id));
}

export function materiaisDaPrateleira(
  materiais: Material[],
  prateleira: Prateleira,
): Material[] {
  const ids = new Set(prateleira.materialIds);
  return materiais.filter((m) => ids.has(m.id));
}

export default {
  material,
  eixoTematico,
  subtema,
  colecaoEditorial,
  prateleira,
  recomendacao,
  estadoPessoal,
  arquivo,
  materialDisponivel,
  materialEstaConcluido,
  materialEstaEmLeitura,
  materialEstaSalvo,
  materialEstaFavorito,
  percentualLeitura,
  alternarSalvo,
  alternarFavorito,
  concluir,
  desconcluir,
  materiaisDaColecao,
  materiaisDaPrateleira,
};
