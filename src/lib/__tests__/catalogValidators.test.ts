import { describe, expect, it } from 'vitest';
import {
  CatalogBookSchema,
  InterdisciplinaryBookSchema,
  ArticleSchema,
  validarLinhas,
} from '../catalogValidators';

describe('CatalogBookSchema', () => {
  it('aceita um livro válido', () => {
    const livro = {
      id: 'cat-1',
      familia: '01_psicanalitica_psicodinamica',
      nome: 'A Interpretação dos Sonhos',
      autor: 'Sigmund Freud',
      resumo: 'Fundamentação da psicanálise.',
      trecho: 'O sonho é a via régia.',
      tipoTrecho: 'cita',
      coverColor: '#BFDDED',
      accentColor: '#396D82',
    };
    expect(CatalogBookSchema.parse(livro)).toEqual(livro);
  });

  it('rejeita livro com id ausente', () => {
    expect(() =>
      CatalogBookSchema.parse({ ...{ id: '' }, familia: 'x', nome: 'n', autor: 'a', resumo: 'r', trecho: 't', tipoTrecho: 'c', coverColor: '#000', accentColor: '#111' }),
    ).toThrow();
  });

  it('rejeita livro com familia ausente', () => {
    expect(() =>
      CatalogBookSchema.parse({ id: 'x', familia: '', nome: 'n', autor: 'a', resumo: 'r', trecho: 't', tipoTrecho: 'c', coverColor: '#000', accentColor: '#111' }),
    ).toThrow();
  });
});

describe('InterdisciplinaryBookSchema', () => {
  it('aceita um livro interdisciplinar válido', () => {
    const livro = {
      id: 'inter-1',
      area: '01_filosofia_e_existencia',
      nome: 'O Mundo como Vontade e Representação',
      autor: 'Arthur Schopenhauer',
      resumo: 'Filosofia da vontade.',
      trecho: 'O mundo é minha representação.',
      tipoTrecho: 'trecho',
      coverColor: '#DCCBB8',
      accentColor: '#756354',
    };
    expect(InterdisciplinaryBookSchema.parse(livro)).toEqual(livro);
  });

  it('rejeita livro com area ausente', () => {
    expect(() =>
      InterdisciplinaryBookSchema.parse({ id: 'x', area: '', nome: 'n', autor: 'a', resumo: 'r', trecho: 't', tipoTrecho: 'c', coverColor: '#000', accentColor: '#111' }),
    ).toThrow();
  });
});

describe('ArticleSchema', () => {
  it('aceita um artigo válido', () => {
    const artigo = {
      id: 'art-1',
      familia: '04_cognitiva_tcc',
      titulo: 'Efficacy of CBT',
      autores: 'Beck, J. S.',
      ano: 2011,
      periodico: 'Journal of CBT',
      resumo: 'Resumo do artigo.',
      doi: '10.1000/xyz',
      linkDireto: 'https://doi.org/10.1000/xyz',
      classificacao: 'estudo clínico',
      observacao: 'Relevante para TCC.',
    };
    expect(ArticleSchema.parse(artigo)).toEqual(artigo);
  });

  it('rejeita artigo com ano não inteiro', () => {
    expect(() =>
      ArticleSchema.parse({ id: 'x', familia: 'f', titulo: 't', autores: 'a', ano: 2011.5, periodico: 'p', resumo: 'r', doi: '10.1/x', linkDireto: 'http://x', classificacao: 'c', observacao: 'o' }),
    ).toThrow();
  });

  it('rejeita artigo com doi ausente', () => {
    expect(() =>
      ArticleSchema.parse({ id: 'x', familia: 'f', titulo: 't', autores: 'a', ano: 2011, periodico: 'p', resumo: 'r', doi: '', linkDireto: 'http://x', classificacao: 'c', observacao: 'o' }),
    ).toThrow();
  });
});

describe('validarLinhas', () => {
  const livroValido = {
    id: 'cat-1',
    familia: '01_psicanalitica_psicodinamica',
    nome: 'Livro',
    autor: 'Autor',
    resumo: 'r',
    trecho: 't',
    tipoTrecho: 'c',
    coverColor: '#000',
    accentColor: '#111',
  };

  it('valida um array de linhas válidas', () => {
    const resultado = validarLinhas([livroValido, livroValido], CatalogBookSchema, 'catalog');
    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toEqual(livroValido);
  });

  it('lança quando uma linha está malformada', () => {
    expect(() =>
      validarLinhas(
        [livroValido, { ...livroValido, id: '' }],
        CatalogBookSchema,
        'catalog',
      ),
    ).toThrow(/campo.*id/);
  });

  it('retorna array vazio para input vazio', () => {
    expect(validarLinhas([], CatalogBookSchema, 'catalog')).toEqual([]);
  });
});
