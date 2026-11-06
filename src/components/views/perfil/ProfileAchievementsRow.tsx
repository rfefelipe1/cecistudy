// Perfil — linha de 4 conquistas logo abaixo do nível, no cabeçalho.
//
// Sempre em uma única linha (flex-nowrap), independente da tela. Em telas
// pequenas espreme mostrando só o emoji; acima do breakpoint sm mostra
// emoji + nome. Sem card envolvente, sem quebrar linha.
import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Sticker } from '../../../types';

interface ProfileAchievementsRowProps {
  stickers: Sticker[];
  onOpenStickers: () => void;
}

export const ProfileAchievementsRow: React.FC<ProfileAchievementsRowProps> = ({
  stickers,
  onOpenStickers,
}) => {
  const featured = stickers.slice(0, 4);

  if (featured.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-nowrap gap-2 items-center overflow-x-hidden">
      {featured.map((sticker) => {
        const unlocked = sticker.unlocked;
        return (
          <button
            key={sticker.id}
            type="button"
            onClick={onOpenStickers}
            aria-label={
              unlocked
                ? `${sticker.name}, desbloqueado`
                : `${sticker.name}, bloqueado`
            }
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 shrink-0 min-w-[44px]',
              'rounded-xl border p-1.5',
              unlocked
                ? 'bg-surface-default border-ceci-border-brand'
                : 'bg-surface-muted border-ceci-border-subtle text-ceci-muted',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'text-xl md:text-2xl shrink-0',
                !unlocked ? 'text-ceci-muted' : '',
              )}
            >
              {unlocked ? sticker.emoji : <Lock className="w-5 h-5" />}
            </span>
            {/* Título só aparece quando há espaço (sm+). Em telas menores, só o emoji. */}
            <span
              className={cn(
                'hidden sm:flex text-[9px] font-semibold leading-none text-center break-words shrink-0 max-w-[64px] overflow-hidden',
                unlocked ? 'text-ceci-primary' : 'text-ceci-muted',
              )}
              title={unlocked ? sticker.name : 'ainda bloqueado'}
            >
              {unlocked ? sticker.name : 'bloqueado'}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenStickers}
        aria-label="ver todas as conquistas"
        className={cn(
          'relative flex flex-col items-center justify-center gap-1 shrink-0 min-w-[44px]',
          'rounded-xl border p-1.5',
          'bg-surface-muted border-ceci-border-subtle text-ceci-muted',
        )}
      >
        <span className="text-xl md:text-2xl text-ceci-muted">···</span>
        <span className="hidden sm:flex text-[9px] font-semibold leading-none text-center text-ceci-muted">
          ver todas
        </span>
      </button>
    </div>
  );
};

export default ProfileAchievementsRow;
