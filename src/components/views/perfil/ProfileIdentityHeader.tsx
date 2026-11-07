// Perfil — header de identidade (SPEC-013).
//
// Substitui o `ProfileHero` na página de Perfil. Apresenta, em uma única
// narrativa visual: quem é essa pessoa (foto de capa + avatar + nome), o
// caminho que ela quer seguir na psicologia (abordagem · universidade), o
// nível atual e as conquistas que representam sua jornada.
//
// O `h1` é o nome (único `h1` da tela). Nome vazio vira o convite de onboarding,
// nunca um título em branco.
import React from 'react';
import { MoreHorizontal, Sparkles } from 'lucide-react';
import type { ProfileAchievements, ProfileIdentity } from '../../../lib/profileViewModel';
import type { Sticker } from '../../../types';
import ProfileIdentityCover from './ProfileIdentityCover';
import { cn } from '@/lib/utils';
import { frase, DICA } from '../../../lib/voice';

export interface ProfileIdentityHeaderProps {
  identity: ProfileIdentity;
  achievements: ProfileAchievements;
  onEdit: () => void;
  onPickPhoto: () => void;
  onPickCover: () => void;
  onRemoveCover: () => void;
  onOpenStickers: () => void;
}

/** Quantos stickers aparecem na faixa do header. */
const VISIBLE = 4;

/** Frase editorial para quando a usuária ainda não escreveu a dela (§7). */
const QUOTE_PLACEHOLDER = frase(DICA, 'umCantinho');

const ProfileIdentityHeader: React.FC<ProfileIdentityHeaderProps> = ({
  identity,
  achievements,
  onEdit,
  onPickPhoto,
  onPickCover,
  onRemoveCover,
  onOpenStickers,
}) => {
  const { displayName, approach, university, subtitle, level, title, photoUrl, coverPhotoUrl } =
    identity;
  const hasName = displayName.trim().length > 0;
  const hasMeta = approach.trim().length > 0 || university.trim().length > 0;
  const featured = achievements.visible.slice(0, VISIBLE);

  return (
    <section
      aria-labelledby="perfil-nome"
      className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-surface-default via-surface-muted to-surface-rose/70 border border-ceci-border-default shadow-sm space-y-4"
    >
      {/* Capa de identidade integrada à tela (inline, sem card): imagem de
          fundo em largura total + avatar sobreposto na borda inferior. */}
      <ProfileIdentityCover
        coverPhotoUrl={coverPhotoUrl}
        photoUrl={photoUrl}
        name={displayName || 'usuária'}
        initials={identity.initials}
        onPickCover={onPickCover}
        onRemoveCover={onRemoveCover}
        onPickPhoto={onPickPhoto}
      />

      <div className="space-y-2">
        {/* 3. Nome (único h1) + botão de editar */}
        <div className="flex items-baseline justify-between gap-2">
          <h1
            id="perfil-nome"
            className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-ceci-primary truncate"
          >
            {hasName ? displayName : 'como quer ser chamada?'}
          </h1>
          <button
            type="button"
            onClick={onEdit}
            aria-label="opções de perfil"
            className="touch-target p-1.5 rounded-full border border-ceci-border-default bg-surface-default/90 text-ceci-primary hover:bg-surface-default transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* 4. Linha de abordagem e universidade */}
        {hasMeta ? (
          <p className="profile-identity-meta text-xs text-ceci-secondary">
            <span>{approach}</span>
            {approach.trim().length > 0 && university.trim().length > 0 ? (
              <span aria-hidden="true" className="mx-1">
                ·
              </span>
            ) : null}
            <span>{university}</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-medium text-ceci-brand-strong underline underline-offset-2 cursor-pointer"
          >
            adicione sua abordagem e universidade
          </button>
        )}

        {/* Nível e título (próximos ao nome, não dentro das conquistas) */}
        <p className="inline-flex items-center gap-1.5 rounded-full bg-surface-default border border-ceci-border-brand px-2.5 py-1 text-[11px] font-semibold text-ceci-brand-strong">
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          nível {level} · {title}
        </p>
      </div>

      {/* 5. Quatro conquistas (faixa compacta) */}
      <section className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {featured.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              onClick={onOpenStickers}
              aria-label={
                sticker.unlocked
                  ? `${sticker.name}, desbloqueado`
                  : `${sticker.name}, bloqueado`
              }
              className={cn(
                'shrink-0 rounded-xl border flex flex-col items-center justify-center gap-1 p-2 w-12 h-12 min-w-[48px]',
                sticker.unlocked
                  ? 'bg-surface-default border-ceci-border-brand text-ceci-primary'
                  : 'bg-surface-muted border-ceci-border-subtle text-ceci-muted',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'text-xl shrink-0',
                  !sticker.unlocked ? 'text-ceci-muted' : '',
                )}
              >
                {sticker.unlocked ? sticker.emoji : <span className="w-4 h-4" />}
              </span>
              <span className="text-[9px] font-semibold leading-none text-center break-words">
                {sticker.unlocked ? sticker.name : 'bloqueado'}
              </span>
            </button>
          ))}
          {featured.length === 0 && (
            <span className="text-[10px] text-ceci-muted">sem conquistas ainda</span>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenStickers}
          aria-label="ver todas as conquistas"
          className="touch-target text-xs font-medium text-ceci-secondary hover:text-ceci-brand-strong cursor-pointer"
        >
          ver todas
        </button>
      </section>

      {/* Ação principal */}
      <button
        type="button"
        onClick={onEdit}
        className="touch-target inline-flex items-center justify-center gap-1.5 rounded-full border border-ceci-border-default bg-surface-default px-4 py-2.5 text-xs font-semibold text-ceci-primary hover:border-ceci-border-brand hover:bg-surface-rose transition-colors cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
        editar perfil
      </button>
    </section>
  );
};

export default ProfileIdentityHeader;
