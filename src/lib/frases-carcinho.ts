import frases1 from './frases-carcinho.json';
import frases2 from './frases-carcinho-2.json';
import frases3 from './frases-carcinho-3.json';

export type FraseCarcinho = {
  id: string;
  texto: string;
  categoria: string;
};

/** Todas as 300 frases de carinho da tela de home. */
export const FRASES_CARCINHO: FraseCarcinho[] = [
  ...frases1,
  ...frases2,
  ...frases3,
];
