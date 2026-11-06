// Perfil — banner de capa (cover) edge-to-edge, aspect-ratio 3:1.
//
// Sem card envolvente, sem altura absoluta na seção inteira. Funciona com ou
// sem imagem (fallback surface-muted). Clique abre a prévia do banner.
import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileBannerProps {
  coverPhotoUrl?: string;
  onClick?: () => void;
}

export const ProfileBanner: React.FC<ProfileBannerProps> = ({
  coverPhotoUrl,
  onClick,
}) => {
  const hasCover = coverPhotoUrl?.trim().length > 0;

  return (
    <div
      data-testid="perfil-banner"
      onClick={onClick}
      role="button"
      aria-label={hasCover ? 'visualizar foto de capa' : 'escolher foto de capa'}
      className={cn(
        'w-full relative overflow-hidden aspect-[3/1] min-h-[120px] max-h-[240px]',
        hasCover ? 'bg-cover bg-center' : 'bg-surface-muted',
      )}
      style={{
        ...(coverPhotoUrl ? { backgroundImage: `url("${coverPhotoUrl}")` } : {}),
      }}
    />
  );
};

export default ProfileBanner;
