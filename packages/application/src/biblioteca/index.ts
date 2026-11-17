// Biblioteca — use-cases puros (SPEC-034).
//
// Nenhuma função escreve no estado: recebem o snapshot e devolvem o novo
// snapshot. Quem persiste é o contexto (`DataClientProvider`) via `setRaw`.
// Isso mantém a camada de aplicação testável sem React/jsdom e sem boundary
// check (`packages/*` nunca importa `react`).
import type {
  ColecaoEditorial,
  EstadoPessoal,
  Material,
  Prateleira,
  Recomendacao,
} from '../../../../src/types';
import {
  alternarFavorito,
  alternarSalvo,
  concluir,
  desconcluir,
  materialEstaConcluido,
  materialEstaEmLeitura,
  materialEstaFavorito,
  materialEstaSalvo,
  materiaisDaColecao,
  materiaisDaPrateleira,
  materiaisDoEixo,
  percentualLeitura,
} from '../../../../packages/domain/src/core/domain';

/* -------------------------------------------------------------------------- */
// Estado pessoal (spec principal §8.5: salvo / em leitura / concluído / favorito
// são independentes — booleanos separados)
/* -------------------------------------------------------------------------- */

/** Adiciona ou remove o material dos salvos. */
export function salvarMaterial(
  estadoPessoal: EstadoPessoal[],
  materialId: string,
): EstadoPessoal[] {
  const existente = estadoPessoal.find((e) => e.materialId === materialId);
  const next = alternarSalvo(existente);
  if (next === null) {
    return estadoPessoal.filter((e) => e.materialId !== materialId);
  }
  const jaExiste = estadoPessoal.some((e) => e.materialId === materialId);
  if (jaExiste) {
    return estadoPessoal.map((e) =>
      e.materialId === materialId ? { ...next, dataAtualizacao: new Date().toISOString() } : e,
    );
  }
  return [...estadoPessoal, { ...next, materialId }];
}

/** Remove o material dos salvos. */
export function desalvarMaterial(
  estadoPessoal: EstadoPessoal[],
  materialId: string,
): EstadoPessoal[] {
  const existente = estadoPessoal.find((e) => e.materialId === materialId);
  if (!existente) return estadoPessoal;
  const next = alternarSalvo(existente);
  if (next === null) return estadoPessoal.filter((e) => e.materialId !== materialId);
  return estadoPessoal.map((e) =>
    e.materialId === materialId ? { ...next, dataAtualizacao: new Date().toISOString() } : e,
  );
}

/** Adiciona ou remove o material dos favoritos (independente de salvo/leitura). */
export function favoritarMaterial(
  estadoPessoal: EstadoPessoal[],
  materialId: string,
): EstadoPessoal[] {
  const existente = estadoPessoal.find((e) => e.materialId === materialId);
  const next = alternarFavorito(existente);
  if (next === null) {
    return estadoPessoal.filter((e) => e.materialId !== materialId);
  }
  const jaExiste = estadoPessoal.some((e) => e.materialId === materialId);
  if (jaExiste) {
    return estadoPessoal.map((e) =>
      e.materialId === materialId ? { ...next, dataAtualizacao: new Date().toISOString() } : e,
    );
  }
  return [...estadoPessoal, { ...next, materialId }];
}

/** Marca o material como em leitura. */
export function atualizarProgresso(
  estadoPessoal: EstadoPessoal[],
  materialId: string,
): EstadoPessoal[] {
  const existente = estadoPessoal.find((e) => e.materialId === materialId);
  const base = existente ?? {
    materialId,
    salvo: false,
    emLeitura: false,
    concluido: false,
    favorito: false,
    dataAtualizacao: new Date().toISOString(),
  };
  const jaExiste = estadoPessoal.some((e) => e.materialId === materialId);
  const next: EstadoPessoal = {
    ...base,
    emLeitura: true,
    dataAtualizacao: new Date().toISOString(),
  };
  if (jaExiste) {
    return estadoPessoal.map((e) =>
      e.materialId === materialId ? next : e,
    );
  }
  return [...estadoPessoal, next];
}

/** Marca o material como concluído (sai de em leitura, mantém salvo e favorito). */
export function concluirMaterial(
  estadoPessoal: EstadoPessoal[],
  materialId: string,
): EstadoPessoal[] {
  const existente = estadoPessoal.find((e) => e.materialId === materialId);
  const next = concluir(existente);
  const jaExiste = estadoPessoal.some((e) => e.materialId === materialId);
  if (jaExiste) {
    return estadoPessoal.map((e) =>
      e.materialId === materialId ? { ...next, dataAtualizacao: new Date().toISOString() } : e,
    );
  }
  return [...estadoPessoal, { ...next, materialId }];
}

/* -------------------------------------------------------------------------- */
// Listagens por eixo / coleção / prateleira / recomendação (spec principal §5, §6, §13)
/* -------------------------------------------------------------------------- */

/** Materiais de um eixo temático. */
export function listarPorEixo(materiais: Material[], eixoId: string): Material[] {
  return materiaisDoEixo(materiais, eixoId);
}

/** Materiais de uma coleção editorial. */
export function listarPorColecaoEditorial(
  materiais: Material[],
  colecao: ColecaoEditorial,
): Material[] {
  return materiaisDaColecao(materiais, colecao);
}

/** Materiais de uma prateleira. */
export function listarPrateleira(materiais: Material[], prateleira: Prateleira): Material[] {
  return materiaisDaPrateleira(materiais, prateleira);
}

/** Recomendações ativas, resolvidas para os materiais. */
export function listarRecomendacoes(
  materiais: Material[],
  recomendacoes: Recomendacao[],
  ativo = true,
): Material[] {
  const ids = new Set(
    recomendacoes
      .filter((r) => r.ativo === ativo)
      .map((r) => r.materialId),
  );
  return materiais.filter((m) => ids.has(m.id));
}

/* -------------------------------------------------------------------------- */
// Disponibilidade (spec principal §11)
/* -------------------------------------------------------------------------- */

/** Marca a disponibilidade de um material para leitura. */
export function marcarDisponibilidade(
  materiais: Material[],
  materialId: string,
  disponibilidade: 'disponivel' | 'indisponivel',
): Material[] {
  return materiais.map((m) =>
    m.id === materialId ? { ...m, disponibilidade } : m,
  );
}

/* -------------------------------------------------------------------------- */
// Consultas derivadas
/* -------------------------------------------------------------------------- */

/** Percentual de leitura do material (0-100). */
export function progressoPercentual(material: Material): number {
  return percentualLeitura(material);
}

/** Material está salvo? */
export function isSalvo(estadoPessoal: EstadoPessoal[], materialId: string): boolean {
  const e = estadoPessoal.find((x) => x.materialId === materialId);
  return materialEstaSalvo(e);
}

/** Material está em leitura? */
export function isEmLeitura(estadoPessoal: EstadoPessoal[], materialId: string): boolean {
  const e = estadoPessoal.find((x) => x.materialId === materialId);
  return materialEstaEmLeitura(e);
}

/** Material está concluído? */
export function isConcluido(estadoPessoal: EstadoPessoal[], materialId: string): boolean {
  const e = estadoPessoal.find((x) => x.materialId === materialId);
  return materialEstaConcluido(e);
}

/** Material está favoritado? */
export function isFavorito(estadoPessoal: EstadoPessoal[], materialId: string): boolean {
  const e = estadoPessoal.find((x) => x.materialId === materialId);
  return materialEstaFavorito(e);
}

export default {
  salvarMaterial,
  desalvarMaterial,
  favoritarMaterial,
  atualizarProgresso,
  concluirMaterial,
  listarPorEixo,
  listarPorColecaoEditorial,
  listarPrateleira,
  listarRecomendacoes,
  marcarDisponibilidade,
  progressoPercentual,
  isSalvo,
  isEmLeitura,
  isConcluido,
  isFavorito,
};
