// Guardião de formulário — padrão extraído do sistema de estágio (SPEC-009).
//
// Combina:
//  - rascunho persistente em localStorage (`wizard_draft_<chave>`), igual ao
//    `useWizardDraft`;
//  - detecção de "sujo" (`isDirty`), derivada pelos valores;
//  - confirmação ao sair quando há alterações não salvas;
//  - pergunta ao reabrir, se há rascunho: "continuar o registro de X ou começar um novo?".
//
// Uso típico em um formulário/wizard:
//
//   const { values, patch, dirty, requestClose, restaurarOuNovo, clear, carregou } =
//     useFormGuard({
//       chave: 'meu-formulario',
//       inicial: { nome: '', email: '' },
//       estaSujo: (v) => !!v.nome.trim() || !!v.email.trim(),
//     });
//
//   // na entrada do formulário, antes de renderizar nada:
//   if (carregou && restaurarOuNovo()) { /* já decidiu: continua ou novo */ }
//   // ...render formulário com values/patch
//   // botão de fechar chama requestClose(() => onFechar())

import { useCallback, useEffect, useState } from 'react';
import { storage, STORAGE_PREFIX } from './storage';
import { useWizardDraft } from './useWizardDraft';

interface UseFormGuardOptions<T extends object> {
  /** Chave do rascunho (`wizard_draft_<chave>`). */
  chave: string;
  /** Valores iniciais do formulário. */
  inicial: T;
  /** Quando verdadeiro, o formulário está "sujo" e pede confirmação ao sair. */
  estaSujo: (valores: T) => boolean;
  /** Quando o usuário escolhe continuar o registro existente. */
  aoContinuarRegistro: (valoresSalvos: T) => void;
  /** Quando o usuário escolhe começar um novo registro. */
  aoComecarNovo: () => void;
  /** Título do registro exibido na pergunta de restauração (ex.: "registro de 26/10 às 14:30"). */
  labelRegistro?: (valores: T) => string;
}

/** Resultado do guardião. */
export interface UseFormGuardResult<T extends object> {
  /** Valores atuais do formulário (iniciados com o rascunho, se houver). */
  valores: T;
  /** Atualiza parcialmente os valores. */
  patch: (parcial: Partial<T>) => void;
  /** Verdadeiro quando há alterações não salvas. */
  sujo: boolean;
  /** Verdadeiro quando a confirmação de descarte está aberta. */
  confirmando: boolean;
  /** Abertura/fechamento da confirmação de descarte. */
  setConfirmando: (v: boolean) => void;
  /** Chama para tentar fechar; pede confirmação se sujo. */
  requestClose: (aoConfirmar: () => void) => void;
  /** Mostra "continuar registro ou começar novo?" se houver rascunho salvo.
   *  Retorna verdadeiro quando já decidiu (ou não há rascunho). */
  restaurarOuNovo: () => boolean;
  /** Limpa o rascunho (chamado após salvar ou descartar de propósito). */
  limpar: () => void;
  /** Marca que o usuário escolheu continuar o registro existente. */
  continuarRegistro: () => void;
  /** Marca que o usuário escolheu começar um registro novo. */
  comecarNovo: () => void;
  /** Descarte imediato (limpa rascunho e reseta valores). */
  descartar: () => void;
  /** Verdadeiro quando a leitura do rascunho já terminou. */
  carregou: boolean;
}

export function useFormGuard<T extends object>({
  chave,
  inicial,
  estaSujo,
  aoContinuarRegistro,
  aoComecarNovo,
  labelRegistro,
}: UseFormGuardOptions<T>): UseFormGuardResult<T> {
  const draft = useWizardDraft<T>(chave);

  const [valores, setValores] = useState<T>(inicial);
  const [sujo, setSujo] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [restaurando, setRestaurando] = useState<'continuar' | 'novo' | null>(null);
  const [carregou, setCarregou] = useState(false);
  useEffect(() => {
    const salvo = storage.getSync(`wizard_draft_${chave}`);
    if (salvo) {
      const parsed = JSON.parse(salvo) as T;
      setValores({ ...inicial, ...parsed });
      setRestaurando(null); // há rascunho: vai perguntar continuar ou novo
    } else {
      setValores(inicial);
      setRestaurando('novo'); // sem rascunho: decisão já está tomada
    }
    setCarregou(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  // Persiste a cada mudança e atualiza o estado de sujeira.
  useEffect(() => {
    draft.save(valores);
    setSujo(estaSujo(valores));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valores, chave]);

  const patch = useCallback((parcial: Partial<T>) => {
    setValores((prev) => ({ ...prev, ...parcial }));
  }, []);

  const requestClose = useCallback(
    (aoConfirmar: () => void) => {
      if (sujo && !confirmando) {
        setConfirmando(true);
        return;
      }
      aoConfirmar();
    },
    [sujo, confirmando],
  );

  const continuarRegistro = useCallback(() => {
    setRestaurando('continuar');
    aoContinuarRegistro(valores);
  }, [valores, aoContinuarRegistro]);

  const comecarNovo = useCallback(() => {
    setRestaurando('novo');
    draft.clear();
    setSujo(false);
    setValores(inicial);
    aoComecarNovo();
  }, [draft, inicial, aoComecarNovo]);

  const descartar = useCallback(() => {
    setConfirmando(false);
    draft.clear();
    setSujo(false);
    setValores(inicial);
  }, [draft, inicial]);

  const limpar = useCallback(() => {
    draft.clear();
    setSujo(false);
    setValores(inicial);
  }, [draft, inicial]);

  /** Decide se já passou pela pergunta de restauração. */
  const restaurarOuNovo = useCallback((): boolean => {
    return restaurando !== null;
  }, [restaurando]);

  return {
    valores,
    patch,
    sujo,
    confirmando,
    setConfirmando,
    requestClose,
    restaurarOuNovo,
    limpar,
    continuarRegistro,
    comecarNovo,
    descartar,
    carregou,
  };
}
