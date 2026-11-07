// Perfil — foto de fundo (capa) do header de identidade (SPEC-013).
//
// Ocupa a parte superior do header com object-fit: cover, cantos superiores
// arredondados e uma camada de gradiente suave para não competir com o avatar
// sobreposto. Quando não há foto, mostra um fallback visual baseado no tema
// (gradiente + formas abstratas), nunca um bloco vazio.
import React from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCoverProps {
  coverPhotoUrl?: string;
  onPickCover: () => void;
  onRemoveCover: () => void;
}

const ProfileCover: React.FC<ProfileCoverProps> = ({
  coverPhotoUrl,
  onPickCover,
  onRemoveCover,
}) => {
  const hasCover = coverPhotoUrl?.trim().length > 0;

  return (
    <div className="relative shrink-0">
      {/* Camada da imagem de fundo / fallback */}
      <div
        data-testid="perfil-capa"
        className={cn(
          'w-full rounded-t-3xl overflow-hidden border-b border-ceci-border-default',
          hasCover
            ? 'bg-cover bg-center [object-fit:cover] aspect-video'
            : 'bg-gradient-to-br from-surface-rose via-surface-muted to-surface-default',
        )}
        style={{
          // mobile: ~160px (h-40); desktop: ~224px (h-56)
          height: 'var(--profile-cover-height, 160px)',
          ...(coverPhotoUrl ? { backgroundImage: `url("${coverPhotoUrl}")` } : {}),
        }}
      />

      {/* Gradiente suave sobre a imagem (evita conflito com o avatar) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

      {/* Botão de editar sobre a imagem (canto superior direito) */}
      <button
        type="button"
        onClick={onPickCover}
        aria-label={hasCover ? 'editar foto de capa' : 'escolher foto de capa'}
        className="absolute top-3 right-3 touch-target p-1.5 rounded-full bg-surface-default/90 border border-ceci-border-default text-ceci-primary hover:bg-surface-default transition-colors cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {/* Botão de remover capa (só quando há foto) */}
      {hasCover && (
        <button
          type="button"
          onClick={onRemoveCover}
          aria-label="remover foto de capa"
          className="absolute top-3 left-3 touch-target p-1.5 rounded-full bg-surface-default/90 border border-ceci-border-default text-ceci-secondary hover:bg-surface-default transition-colors cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5 rotate-90 text-status-danger-strong" aria-hidden="true" />
        </button>
      )}

      {/* Formas abstratas suaves no fallback (sem foto) */}
      {!hasCover && (
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-1/4 left-1/10 w-24 h-24 rounded-full bg-surface-rose/40 blur-xl" />
          <div className="absolute bottom-1/3 right-1/10 w-32 h-32 rounded-full bg-surface-muted/40 blur-xl" />
          <div className="absolute top-1/2 right-1/5 w-16 h-16 rounded-full bg-surface-rose/30 blur-lg" />
        </div>
      )}
    </div>
  );
};

export default ProfileCover;
