import { useMemo, useEffect } from 'react';
import { usePersistentState } from './usePersistentState';
import { FRASES_CARCINHO, type FraseCarcinho } from './frases-carcinho';

/**
 * Escolhe uma frase de carinho **uma vez por dispositivo** e mantém para
 * sempre. Não varia a cada montagem nem a cada volta à tela.
 *
 * A última escolhida fica persistida no dispositivo (namespace `device` =
 * não entra no backup da usuária).
 */
export function useFraseCarcinho(): FraseCarcinho | null {
  const [ultima, setUltima] = usePersistentState<string | null>(
    'ultimaFraseCarcinho',
    null,
    'device',
  );

  const escolhida = useMemo(() => {
    if (FRASES_CARCINHO.length === 0) return null;
    if (FRASES_CARCINHO.length === 1) return FRASES_CARCINHO[0];

    // Só sorteia na primeira vez do dispositivo (ultima === null).
    // Depois, devolve sempre a mesma frase salva.
    if (ultima) {
      return FRASES_CARCINHO.find((f) => f.id === ultima) ?? null;
    }

    return FRASES_CARCINHO[Math.floor(Math.random() * FRASES_CARCINHO.length)];
  }, [ultima]);

  useEffect(() => {
    if (escolhida && !ultima) {
      setUltima(escolhida.id);
    }
  }, [escolhida, ultima, setUltima]);

  return escolhida;
}
