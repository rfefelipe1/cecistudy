// Perfil — retângulo de capa que ocupa a largura total da tela.
// Sem imagem: cor de fundo sólida da superfície, altura fixa.
// Com `coverPhotoUrl`: mostra a imagem de fundo (capa).
import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileCapaProps {
  /** Altura da capa em px (default 220). */
  height?: number;
  /** URL da imagem de fundo da capa (opcional). */
  coverPhotoUrl?: string;
  /** Classes de Tailwind extras (ex.: margens negativas para encostar na borda). */
  className?: string;
}

export const ProfileCapa: React.FC<ProfileCapaProps> = ({
  height = 220,
  coverPhotoUrl,
  className,
}) => {
  return (
    <div
      data-testid="perfil-capa"
      className={cn(
        'w-full overflow-hidden',
        coverPhotoUrl ? 'bg-cover bg-center' : 'bg-surface-default',
        className,
      )}
      style={{
        height: `${height}px`,
        ...(coverPhotoUrl ? { backgroundImage: `url("${coverPhotoUrl}")` } : {}),
      }}
    />
  );
};

export default ProfileCapa;
