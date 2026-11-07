// Perfil — capa de identidade integrada à tela (inline, sem card).
//
// A imagem de fundo ocupa a largura total da tela — não é mais um
// `section` com `rounded-3xl p-5 shadow-sm` (card flutuante). O avatar fica
// sobreposto na borda inferior da capa e o botão de editar capa é pequeno, no
// canto direito extremo superior da imagem. Quando não há foto de capa, mostra
// fallback com gradiente + formas abstratas, nunca um bloco vazio.
import React from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProfileAvatar from './ProfileAvatar';

interface ProfileIdentityCoverProps {
  coverPhotoUrl?: string;
  photoUrl?: string;
  name: string;
  initials: string;
  onPickCover: () => void;
  onRemoveCover: () => void;
  onPickPhoto: () => void;
  /** Quando fornecido, renderiza botão de remover foto de perfil. Sem ele, não existe opção de remover (SPEC-032 D9). */
  onRemovePhoto?: () => void;
  /** Quando falso, esconde o botão de editar capa. */
  editable?: boolean;
}

const ProfileIdentityCover: React.FC<ProfileIdentityCoverProps> = ({
  coverPhotoUrl,
  photoUrl,
  name,
  initials,
  onPickCover,
  onRemoveCover,
  onPickPhoto,
  onRemovePhoto,
  editable = true,
}) => {
  const hasCover = coverPhotoUrl?.trim().length > 0;

  return (
    <div className="relative shrink-0 w-full">
      {/* Imagem de fundo — largura total, integrada à tela (sem card). */}
      <div
        data-testid="perfil-capa"
        className={cn(
          'w-full overflow-hidden border-b border-ceci-border-default',
          hasCover
            ? 'bg-cover bg-center aspect-video'
            : 'bg-gradient-to-br from-surface-rose via-surface-muted to-surface-default',
        )}
        style={{
          height: 'var(--profile-cover-height, 160px)',
          ...(coverPhotoUrl ? { backgroundImage: `url("${coverPhotoUrl}")` } : {}),
        }}
      />

      {/* Gradiente suave sobre a imagem (evita conflito com o avatar) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

      {/* Botão de editar capa — pequeno, canto direito extremo superior da imagem */}
      {editable && (
        <button
          type="button"
          onClick={onPickCover}
          aria-label={hasCover ? 'editar foto de capa' : 'escolher foto de capa'}
          className="absolute top-2 right-2 touch-target p-1.5 rounded-full bg-surface-default/90 border border-ceci-border-default text-ceci-primary hover:bg-surface-default transition-colors cursor-pointer"
        >
          <Pencil className="w-3 h-3" aria-hidden="true" />
        </button>
      )}

      {hasCover && (
        <button
          type="button"
          onClick={onRemoveCover}
          aria-label="remover foto de capa"
          className="absolute top-2 left-2 touch-target p-1.5 rounded-full bg-surface-default/90 border border-ceci-border-default text-ceci-secondary hover:bg-surface-default transition-colors cursor-pointer"
        >
          <Pencil className="w-3 h-3 rotate-90 text-status-danger-strong" aria-hidden="true" />
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

      {/* Avatar sobreposto na borda inferior da capa (sem distanciação excessiva). */}
      <div className="relative -top-12 mx-auto">
        <ProfileAvatar
          photoUrl={photoUrl}
          name={name || 'usuária'}
          initials={initials}
          size="hero"
          shape="circle"
          borderless
          onPickPhoto={onPickPhoto}
          onRemovePhoto={onRemovePhoto}
        />
      </div>
    </div>
  );
};

export default ProfileIdentityCover;
