// Perfil — informações de identidade abaixo do banner (fluxo vertical, à esquerda).
//
// Nome, subtítulo (curso · universidade), nível/título, conquistas em linha
// (4 elementos) e ações (editar / mais opções). Sem card envolvente, sem
// aninhamento de cards.
import React from 'react';
import { MoreHorizontal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Sticker } from '../../../types';
import ProfileAchievementsRow from './ProfileAchievementsRow';

interface ProfileIdentityInfoProps {
  displayName: string;
  subtitle: string;
  quote: string;
  level: number;
  title: string;
  achievements: Sticker[];
  onEdit: () => void;
  onMoreOptions: () => void;
  onOpenStickers: () => void;
}

export const ProfileIdentityInfo: React.FC<ProfileIdentityInfoProps> = ({
  displayName,
  subtitle,
  quote,
  level,
  title,
  achievements,
  onEdit,
  onMoreOptions,
  onOpenStickers,
}) => {
  const hasName = displayName.trim().length > 0;
  const hasMeta = subtitle.trim().length > 0;

  // 4 conquistas em linha logo abaixo do nível.
  const featured = achievements.slice(0, 4);

  return (
    <div className="mt-3 px-4 pb-4 space-y-2">
      {/* Nome (único h1 da seção) + ações, na mesma linha. */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="space-y-1">
          <h1
            id="perfil-nome"
            className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-ceci-primary truncate"
          >
            {hasName ? displayName : 'como quer ser chamada?'}
          </h1>
          {hasMeta ? (
            <p className="text-xs text-ceci-secondary">{subtitle}</p>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-medium text-ceci-brand-strong underline underline-offset-2 cursor-pointer"
            >
              adicione sua abordagem e universidade
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            aria-label="editar perfil"
            className="touch-target p-1.5 rounded-full border border-ceci-border-default bg-surface-default/90 text-ceci-primary hover:bg-surface-default transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onMoreOptions}
            aria-label="opções de perfil"
            className="touch-target p-1.5 rounded-full border border-ceci-border-default bg-surface-default/90 text-ceci-primary hover:bg-surface-default transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Nível e título (cápsula ao lado do nome). */}
      <p className="inline-flex items-center gap-1.5 rounded-full border border-ceci-border-brand px-2.5 py-1 text-[11px] font-semibold text-ceci-brand-strong">
        <Sparkles className="w-3 h-3" aria-hidden="true" />
        nível {level} · {title}
      </p>

      {/* Conquistas — 4 em linha, abaixo do nível. */}
      <ProfileAchievementsRow
        stickers={featured}
        onOpenStickers={onOpenStickers}
      />
    </div>
  );
};

export default ProfileIdentityInfo;
