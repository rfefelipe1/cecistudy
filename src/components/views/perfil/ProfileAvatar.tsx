// Perfil — avatar com foto/iniciais, câmera e remover (SPEC-013 D5).
//
// A foto continua no hero (não entra no sheet de edição): trocar a foto é um
// gesto rápido, editar nome/universidade/frase é uma decisão. Misturar os dois
// num formulário foi o que empurrou a edição para o fim da página.
import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  photoUrl?: string;
  /** Usado no `alt` da foto; o nome exibido, não o do formulário. */
  name: string;
  /** Primeira letra (ou `C`) — já derivada no view model. */
  initials: string;
  onPickPhoto: () => void;
<<<<<<< HEAD
  onRemovePhoto: () => void;
  size?: 'md' | 'lg';
}

/** Tamanho do quadro do avatar. O `lg` do hero é o único usado hoje. */
const FRAME_SIZE: Record<NonNullable<ProfileAvatarProps['size']>, string> = {
  md: 'w-14 h-14 rounded-2xl text-2xl',
  lg: 'w-16 h-16 rounded-3xl text-3xl',
=======
  onRemovePhoto?: () => void;
  /** Quando true, remove a borda ao redor do avatar (SPEC-032 D8). */
  borderless?: boolean;
  size?: 'md' | 'lg' | 'hero';
  shape?: 'rounded' | 'circle';
}

/** Tamanho do quadro do avatar. */
const FRAME_SIZE: Record<NonNullable<ProfileAvatarProps['size']>, string> = {
  md: 'w-14 h-14 text-2xl',
  lg: 'w-16 h-16 text-3xl',
  // hero: 96 px mobile / 128 px desktop (Shape aplicado via `shape` abaixo.)
  hero: 'w-24 h-24 md:w-32 md:h-32 text-4xl md:text-5xl',
};

/** Arredondamento do quadro. `circle` é usado no header de identidade. */
const FRAME_SHAPE: Record<NonNullable<ProfileAvatarProps['shape']>, string> = {
  rounded: 'rounded-2xl md:rounded-3xl',
  circle: 'rounded-full',
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
};

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  photoUrl,
  name,
  initials,
  onPickPhoto,
  onRemovePhoto,
<<<<<<< HEAD
  size = 'lg',
=======
  borderless = false,
  size = 'lg',
  shape = 'rounded',
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
}) => (
  <div className="relative shrink-0">
    <div
      className={cn(
<<<<<<< HEAD
        'bg-surface-rose border-2 border-ceci-border-brand flex items-center justify-center font-display font-bold text-ceci-primary shadow-2xs overflow-hidden',
        FRAME_SIZE[size],
=======
        'bg-surface-rose flex items-center justify-center font-display font-bold text-ceci-primary shadow-2xs overflow-hidden',
        !borderless ? 'border-2 border-ceci-border-brand' : '',
        FRAME_SIZE[size],
        FRAME_SHAPE[shape],
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
      )}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={`foto de ${name}`} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>

    {/* Alvo de toque de 44 px (SPEC-013 I7): o círculo visível tem 32 px, como
        sempre, e o `button` cresce ao redor dele — teclado e dedo grosso
        ganham área sem o avatar virar um alvo enorme. */}
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

<<<<<<< HEAD
    {photoUrl ? (
=======
    {photoUrl && onRemovePhoto ? (
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
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
);

export default ProfileAvatar;
