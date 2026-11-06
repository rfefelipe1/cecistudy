// Perfil — avatar sobreposto à borda inferior do banner (à esquerda).
//
// Círculo com borda de 4 px na cor da superfície, tamanho hero (112 px desktop,
// 88 px mobile). Clique troca a foto; com foto, permite remover.
import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileAvatarOverlayProps {
  photoUrl?: string;
  name: string;
  initials: string;
  onPickPhoto: () => void;
  onRemovePhoto?: () => void;
}

export const ProfileAvatarOverlay: React.FC<ProfileAvatarOverlayProps> = ({
  photoUrl,
  name,
  initials,
  onPickPhoto,
  onRemovePhoto,
}) => {
  const hasPhoto = photoUrl?.trim().length > 0;

  return (
    <div className="relative -top-12 left-0 pl-4 pointer-events-auto">
      <div className="relative shrink-0">
        <div
          className={cn(
            'bg-surface-rose flex items-center justify-center font-display font-bold text-ceci-primary shadow-2xs overflow-hidden',
            'border-4 border-[var(--color-surface-default)] rounded-full',
            'w-22 h-22 md:w-28 md:h-28',
            'text-2xl md:text-4xl',
          )}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Foto de perfil do usuário"
              className="w-full h-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>

        {/* Alvo de toque de 44 px: câmera cresce ao redor do círculo. */}
        <button
          type="button"
          onClick={onPickPhoto}
          aria-label="trocar foto de perfil"
          title="trocar foto"
          className="touch-target absolute -bottom-1 -right-1 cursor-pointer active:scale-95"
        >
          <span className="w-8 h-8 rounded-full bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary flex items-center justify-center shadow-xs border-2 border-surface-default">
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </button>

        {hasPhoto && onRemovePhoto ? (
          <button
            type="button"
            onClick={onRemovePhoto}
            aria-label="remover foto de perfil"
            title="remover foto"
            className="touch-target absolute -top-1 -right-1 cursor-pointer active:scale-95"
          >
            <span className="w-7 h-7 rounded-full bg-surface-default border border-ceci-border-default text-ceci-secondary hover:text-status-danger-strong hover:border-status-danger flex items-center justify-center shadow-xs">
              <Trash2 className="w-3 h-3" aria-hidden="true" />
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ProfileAvatarOverlay;
