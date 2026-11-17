import { useCallback, useEffect, useRef, useState } from 'react';
import { usePersistentState } from './usePersistentState';
import { FRASES_CARCINHO, type FraseCarcinho } from './frases-carcinho';

/**
 * Rota a frase de carinho a cada `intervalMs`, nunca repetindo a mesma duas
 * vezes seguidas. Pausa quando a aba deixa de estar visível (economia de
 * bateria no mobile) e retoma ao voltar.
 *
 * A frase inicial é sorteada uma vez por dispositivo (persistida em
 * `device`) e a rotação começa a partir dela.
 */
export function useFraseRotativa(intervalMs = 10_000): FraseCarcinho | null {
  const [frase, setFrase] = useState<FraseCarcinho | null>(null);
  const ultimaIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sorteia a primeira frase (ou reusa a já persistida no device).
  const [ultimaPersistida, setUltimaPersistida] = usePersistentState<string | null>(
    'ultimaFraseCarcinho',
    null,
    'device',
  );

  const proximaFrase = useCallback((): FraseCarcinho => {
    const candidatas = FRASES_CARCINHO.filter(
      (f) => f.id !== ultimaIdRef.current,
    );
    const escolhida =
      candidatas[Math.floor(Math.random() * candidatas.length)];
    ultimaIdRef.current = escolhida.id;
    return escolhida;
  }, []);

  // Primeira montagem: define a frase inicial e inicia o timer.
  useEffect(() => {
    const inicial =
      ultimaPersistida &&
      FRASES_CARCINHO.find((f) => f.id === ultimaPersistida);

    if (inicial) {
      ultimaIdRef.current = inicial.id;
      setFrase(inicial);
    } else {
      const sorteada = proximaFrase();
      setUltimaPersistida(sorteada.id);
      setFrase(sorteada);
    }

    // Timer de rotação.
    timerRef.current = setInterval(() => {
      setFrase(proximaFrase());
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, proximaFrase, ultimaPersistida, setUltimaPersistida]);

  // Pausa/retoma conforme visibilidade da aba.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      } else if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setFrase(proximaFrase());
        }, intervalMs);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, proximaFrase]);

  return frase;
}
