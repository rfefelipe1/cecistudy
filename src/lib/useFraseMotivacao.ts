import { useMemo, useEffect } from 'react';
import { usePersistentState } from './usePersistentState';

/** Frases de motivação pré-escritas (a usuária não escreve mais a dela). */
const FRASES: string[] = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./frases-motivacao.json');
    return Array.isArray(mod) ? mod : [];
  } catch {
    return [];
  }
})();

/**
 * Escolhe uma frase de motivação **uma vez por dispositivo** e mantém para
 * sempre. Não varia a cada montagem nem a cada volta à tela.
 *
 * A última escolhida fica persistida no dispositivo (namespace `device` =
 * não entra no backup da usuária).
 */
export function useFraseMotivacao(): string {
  const [ultima, setUltima] = usePersistentState<string | null>(
    'ultimaFraseMotivacao',
    null,
    'device',
  );

  const escolhida = useMemo(() => {
    if (FRASES.length === 0) return '';
    if (FRASES.length === 1) return FRASES[0];

    // Só sorteia na primeira vez do dispositivo (ultima === null).
    // Depois, devolve sempre a mesma frase salva.
    if (ultima) return ultima;

    return FRASES[Math.floor(Math.random() * FRASES.length)];
  }, [ultima]);

  useEffect(() => {
    if (escolhida && !ultima) {
      setUltima(escolhida);
    }
  }, [escolhida, ultima, setUltima]);

  return escolhida;
}
