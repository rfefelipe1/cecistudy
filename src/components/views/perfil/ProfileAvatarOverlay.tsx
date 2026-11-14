// Perfil — avatar sobreposto à borda inferior da capa (à esquerda).
//
// Clique na foto (ou no espaço dela, quando não há foto) chama onPickPhoto,
// que coloca/troca a foto de perfil. Não existe botão de câmera visível,
// não existe menu de sheet e não existe botão de remover direto na tela.
import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileAvatarOverlayProps {
  photoUrl?: string;
  name: string;
  initials: string;
  /** Clique na foto/avatar — coloca a foto quando não há, troca quando há. */
  onPickPhoto: () => void;
}

export const ProfileAvatarOverlay: React.FC<ProfileAvatarOverlayProps> = ({
  photoUrl,
  name,
  initials,
  onPickPhoto,
}) => {
  const hasPhoto = photoUrl?.trim().length > 0;

  return (
    // -mt negativo puxa o avatar para cima e mantém o fluxo correto: metade
    // do círculo fica sobre a capa, metade abaixo dela.
    <div className="relative z-10 -mt-11 md:-mt-14 pl-4 pointer-events-auto">
      {/* Foto de perfil em si: clique coloca/troca a foto (onclick direto). */}
      <div className="relative shrink-0" onClick={onPickPhoto} role="button" tabIndex={0} aria-label="foto de perfil">
        <div
          className={cn(
            'bg-surface-rose flex items-center justify-center font-display font-bold text-ceci-primary shadow-2xs overflow-hidden',
            'border-4 border-[var(--color-surface-default)] rounded-full',
            'w-22 h-22 md:w-28 md:h-28',
            'text-2xl md:text-4xl',
            hasPhoto ? '' : 'cursor-pointer',
          )}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Foto de perfil do usuário" className="w-full h-full object-cover" />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileAvatarOverlay;
