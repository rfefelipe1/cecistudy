/**
 * Schemas de validação Zod para obras lidas do catálogo SQLite nativo.
 *
 * Os casts `as CatalogBook[]` etc. em `catalogLibrary.ts` não validam a forma
 * dos dados vindos do disco: um campo ausente ou com tipo errado passaria
 * silenciosamente para `curateLibrary` e poderia chegar à UI com `undefined`.
 * Estes schemas rejeitam linhas malformadas antes de qualquer transformação,
 * fazendo o `try/catch` de `loadNativeLibraryDataset` cair no facade estático
 * (fallback seguro, dado não é perdido).
 */
import { z } from 'zod';
import type { CatalogBook, InterdisciplinaryBook, Article } from '../data/books/types.ts';

/** Livro do catálogo de psicoterapias (SQLite nativo). */
export const CatalogBookSchema = z.object({
  id: z.string().min(1),
  familia: z.string().min(1),
  nome: z.string().min(1),
  autor: z.string().min(1),
  resumo: z.string(),
  trecho: z.string(),
  tipoTrecho: z.string(),
  coverColor: z.string().min(1),
  accentColor: z.string().min(1),
});

/** Livro da coleção complementar interdisciplinar (SQLite nativo). */
export const InterdisciplinaryBookSchema = z.object({
  id: z.string().min(1),
  area: z.string().min(1),
  nome: z.string().min(1),
  autor: z.string().min(1),
  resumo: z.string(),
  trecho: z.string(),
  tipoTrecho: z.string(),
  coverColor: z.string().min(1),
  accentColor: z.string().min(1),
});

/** Artigo científico (SQLite nativo). */
export const ArticleSchema = z.object({
  id: z.string().min(1),
  familia: z.string().min(1),
  titulo: z.string().min(1),
  autores: z.string().min(1),
  ano: z.number().int().positive(),
  periodico: z.string().min(1),
  resumo: z.string(),
  doi: z.string().min(1),
  linkDireto: z.string().min(1),
  classificacao: z.string().min(1),
  observacao: z.string(),
});

type ValidatedCatalogBook = z.infer<typeof CatalogBookSchema>;
type ValidatedInterdisciplinaryBook = z.infer<typeof InterdisciplinaryBookSchema>;
type ValidatedArticle = z.infer<typeof ArticleSchema>;

/**
 * Valida um array de linhas brutas do SQLite contra um schema Zod.
 * Lança se qualquer linha for inválida — capturado pelo try/catch do caller.
 */
function validateRows<T>(
  rows: unknown[],
  schema: z.ZodTypeAny,
  origem: string,
): T[] {
  const validados: T[] = [];
  for (const row of rows) {
    const resultado = schema.safeParse(row);
    if (!resultado.success) {
      const camposInvalidos = Object.keys(resultado.error.flatten().fieldErrors);
      throw new Error(
        `[catalogValidators] linha inválida em "${origem}": campos ${camposInvalidos.join(', ')}`,
      );
    }
    validados.push(resultado.data as T);
  }
  return validados;
}

export { type ValidatedCatalogBook, type ValidatedInterdisciplinaryBook, type ValidatedArticle };

export { validateRows as validarLinhas };
