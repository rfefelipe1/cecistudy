import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { WizardScaffold, type WizardStep } from '../wizards/WizardScaffold';
import { DICA, CELEBRACAO, frase } from '../../lib/voice';

/**
 * Wizard de entrevista de memórias (SPEC-028 D4).
 *
 * Conduzido pelo cecinho, opcional e nunca forçado (D13). Faz uma pergunta por
 * categoria (feliz, engraçada, assustadora, memorável) e guarda cada resposta
 * como uma `SemesterMemory` vinculada ao `termId`. O usuário pode pular qualquer
 * passo ou sair do wizard a qualquer momento — sem bloquear nada.
 *
 * A memória é salva ao sair de cada passo (quando o usuário avança), não apenas
 * no fim, porque o `WizardScaffold` só chama `onSave` no último passo.
 */
export const MemoryWizard: React.FC<{
  termId: string;
  onFinish: () => void;
}> = ({ termId, onFinish }) => {
  const { academicTerms, addSemesterMemory, showToast } = useMobileApp();

  const termo = useMemo(() => academicTerms.find((t) => t.id === termId), [
    academicTerms,
    termId,
  ]);
  const agora = useMemo(() => new Date().toISOString(), []);

  const [memoriaIndex, setMemoriaIndex] = useState(0);
  const [draftTitle, setDraftTitle] = useState('');
  const prevIndexRef = useRef(0);

  const CATEGORIAS: Array<{
    id: 'feliz' | 'engracada' | 'assustadora' | 'memoravel';
    label: string;
  }> = [
    { id: 'feliz', label: 'feliz' },
    { id: 'engracada', label: 'engraçada' },
    { id: 'assustadora', label: 'assustadora' },
    { id: 'memoravel', label: 'memorável' },
  ];

  const isLast = memoriaIndex === CATEGORIAS.length - 1;

  const steps: WizardStep[] = useMemo(
    () =>
      CATEGORIAS.map((cat) => ({
        id: cat.id,
        title: cat.label,
        headline: {
          feliz: frase(CELEBRACAO, 'memoriaFelizPergunta'),
          engracada: frase(CELEBRACAO, 'memoriaEngracadaPergunta'),
          assustadora: frase(CELEBRACAO, 'memoriaAssustadoraPergunta'),
          memoravel: frase(CELEBRACAO, 'memoriaMemoravelPergunta'),
        }[cat.id],
        subtitle:
          'respondo só o que quiser — pode pular este passo se não tiver uma memória dessa ♡',
        content: (
          <div className="space-y-4">
            <div className="rounded-xl border border-ceci-border-default bg-surface-default p-3">
              <label className="block text-xs font-semibold text-ceci-text-soft">
                sua memória
              </label>
              <textarea
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-ceci-border-transparent bg-transparent px-3 py-2 text-sm text-ceci-primary focus:ring-2 focus:ring-ceci-brand outline-none"
                placeholder="conte brevemente o que aconteceu…"
              />
            </div>
            <p className="text-[11px] text-ceci-tertiary">
              {frase(DICA, 'semTituloAinda')}
            </p>
          </div>
        ),
      })),
    [],
  );

  const canNext = true;

  /**
   * Salva a memória do passo que está sendo deixado. Chamado quando o usuário
   * avança de um passo para o próximo (ou finaliza o wizard).
   */
  const salvarPassoAtual = useCallback(() => {
    const cat = CATEGORIAS[prevIndexRef.current];
    const title = draftTitle.trim();
    if (!title) return;

    addSemesterMemory({
      termId,
      termDate: termo?.startedAt ?? '',
      title,
      category: cat.id,
      now: agora,
    });
    prevIndexRef.current = memoriaIndex;
  }, [draftTitle, memoriaIndex, prevIndexRef, termId, termo, agora, addSemesterMemory]);

  const handleSave = useCallback(() => {
    // Último passo: salva e finaliza.
    salvarPassoAtual();
    showToast(frase(CELEBRACAO, 'memoriaGuardada'));
    onFinish();
  }, [salvarPassoAtual, showToast, onFinish]);

  const handleStepChange = useCallback(
    (next: number) => {
      // Sai de um passo para outro: salva o passo que está sendo deixado.
      if (next > prevIndexRef.current) {
        salvarPassoAtual();
      }
      prevIndexRef.current = next;
      setMemoriaIndex(next);
    },
    [salvarPassoAtual],
  );

  const handleClose = useCallback(() => {
    // Ao fechar sem finalizar, salva o passo atual se houver título.
    salvarPassoAtual();
    onFinish();
  }, [salvarPassoAtual, onFinish]);

  return (
    <WizardScaffold
      title="entrevista de memórias"
      subtitle={frase(CELEBRACAO, 'memoriaPrimeira', { label: 'este semestre' })}
      icon={<Sparkles className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      steps={steps}
      step={memoriaIndex}
      onStepChange={handleStepChange}
      canNext={canNext}
      saveLabel={isLast ? 'finalizar ♡' : 'continuar ♡'}
      onSave={handleSave}
      onClose={handleClose}
      showStepCount={true}
    />
  );
};
