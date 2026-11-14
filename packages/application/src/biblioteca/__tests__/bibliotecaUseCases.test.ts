import { describe, it, expect } from 'vitest';
import {
  salvarMaterial,
  desalvarMaterial,
  favoritarMaterial,
  atualizarProgresso,
  concluirMaterial,
  isSalvo,
  isEmLeitura,
  isConcluido,
  isFavorito,
  listarPorEixo,
  listarPorColecaoEditorial,
  listarPrateleira,
  listarRecomendacoes,
  marcarDisponibilidade,
  progressoPercentual,
} from '../index';
import type {
  Material,
  EstadoPessoal,
  ColecaoEditorial,
  Prateleira,
  Recomendacao,
} from '../../../../../src/types';

const material = (id: string, titulo: string, eixoId?: string): Material => ({
  id,
  titulo,
  autorId: undefined,
  eixoId,
  tipo: 'livro',
  disponibilidade: 'disponivel',
  criadoEm: '2026-01-01T00:00:00.000Z',
  atualizadoEm: '2026-01-01T00:00:00.000Z',
});

const estadoPessoal = (
  materialId: string,
  { salvo = false, emLeitura = false, concluido = false, favorito = false }: Partial<
    Pick<EstadoPessoal, 'salvo' | 'emLeitura' | 'concluido' | 'favorito'>
  > = {},
): EstadoPessoal => ({
  materialId,
  salvo,
  emLeitura,
  concluido,
  favorito,
  dataAtualizacao: '2026-01-01T00:00:00.000Z',
});

describe('use-cases de Biblioteca (SPEC-034)', () => {
  describe('salvo / favorito (estados independentes, INV-7)', () => {
    it('salvarMaterial adiciona e desalvarMaterial remove', () => {
      let ep: EstadoPessoal[] = [];
      ep = salvarMaterial(ep, 'm1');
      expect(isSalvo(ep, 'm1')).toBe(true);
      ep = desalvarMaterial(ep, 'm1');
      expect(isSalvo(ep, 'm1')).toBe(false);
    });

    it('favoritarMaterial é independente de salvo e de leitura', () => {
      let ep: EstadoPessoal[] = [];
      ep = salvarMaterial(ep, 'm1'); // m1 salvo
      ep = favoritarMaterial(ep, 'm1'); // m1 salvo + favorito
      expect(isSalvo(ep, 'm1')).toBe(true);
      expect(isFavorito(ep, 'm1')).toBe(true);
      // concluir não remove favorito
      ep = concluirMaterial(ep, 'm1');
      expect(isConcluido(ep, 'm1')).toBe(true);
      expect(isFavorito(ep, 'm1')).toBe(true); // INV-7: concluído não desfavorita
      expect(isSalvo(ep, 'm1')).toBe(true); // salvo é mantido
    });

    it('concluído sai de em leitura', () => {
      let ep: EstadoPessoal[] = [];
      ep = atualizarProgresso(ep, 'm1'); // em leitura
      expect(isEmLeitura(ep, 'm1')).toBe(true);
      ep = concluirMaterial(ep, 'm1'); // concluído
      expect(isConcluido(ep, 'm1')).toBe(true);
      expect(isEmLeitura(ep, 'm1')).toBe(false); // saiu de em leitura
    });

    it('atualizarProgresso marca como em leitura', () => {
      let ep: EstadoPessoal[] = [];
      ep = atualizarProgresso(ep, 'm1');
      expect(isEmLeitura(ep, 'm1')).toBe(true);
    });
  });

  describe('listagens', () => {
    const materiais: Material[] = [
      material('m1', 'Livro A', 'eixo-1'),
      material('m2', 'Livro B', 'eixo-1'),
      material('m3', 'Livro C', 'eixo-2'),
    ];

    it('listarPorEixo filtra por eixoId', () => {
      const r = listarPorEixo(materiais, 'eixo-1');
      expect(r.map((m) => m.id)).toEqual(['m1', 'm2']);
    });

    it('listarPorColecaoEditorial resolve materialIds', () => {
      const colecao: ColecaoEditorial = {
        id: 'c1',
        nome: 'Coleção',
        materialIds: ['m1', 'm3'],
      };
      const r = listarPorColecaoEditorial(materiais, colecao);
      expect(r.map((m) => m.id)).toEqual(['m1', 'm3']);
    });

    it('listarPrateleira resolve materialIds', () => {
      const prat: Prateleira = {
        id: 'p1',
        nome: 'Prateleira',
        materialIds: ['m2'],
        ordem: 1,
      };
      const r = listarPrateleira(materiais, prat);
      expect(r.map((m) => m.id)).toEqual(['m2']);
    });

    it('listarRecomendacoes resolve ativas', () => {
      const recs: Recomendacao[] = [
        { id: 'r1', materialId: 'm1', tipo: 'similar', ativo: true },
        { id: 'r2', materialId: 'm3', tipo: 'complementar', ativo: false },
      ];
      const r = listarRecomendacoes(materiais, recs, true);
      expect(r.map((m) => m.id)).toEqual(['m1']);
    });
  });

  describe('disponibilidade', () => {
    it('marcarDisponibilidade alterna disponível/indisponível', () => {
      const m: Material[] = [material('m1', 'Livro')];
      const r = marcarDisponibilidade(m, 'm1', 'indisponivel');
      expect(r[0].disponibilidade).toBe('indisponivel');
      const r2 = marcarDisponibilidade(r, 'm1', 'disponivel');
      expect(r2[0].disponibilidade).toBe('disponivel');
    });
  });

  describe('progresso', () => {
    it('progressoPercentual calcula 0-100', () => {
      const m: Material = { ...material('m1', 'Livro'), totalPaginas: 100, paginasLidas: 30 };
      expect(progressoPercentual(m)).toBe(30);
    });

    it('progressoPercentual devolve 0 sem totalPaginas', () => {
      const m: Material = material('m1', 'Livro');
      expect(progressoPercentual(m)).toBe(0);
    });
  });
});
