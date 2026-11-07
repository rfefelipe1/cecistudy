// Perfil — cabeçalho (Twitter/X Profile Header).
//
// Banner edge-to-edge + avatar sobreposto à borda inferior (à esquerda) +
// informações em fluxo vertical. Sem card envolvente, sem aninhamento de cards,
// sem abas de navegação horizontal.
import React from 'react';
import type { ProfileIdentity } from '../../../lib/profileViewModel';
import type { Sticker } from '../../../types';
import ProfileBanner from './ProfileBanner';
import ProfileAvatarOverlay from './ProfileAvatarOverlay';
import ProfileIdentityInfo from './ProfileIdentityInfo';

interface ProfileHeaderProps {
  identity: ProfileIdentity;
  achievements: Sticker[];
<<<<<<< HEAD
  onPickPhoto: () => void;
=======
  onPickCover: () => void;
  onPickPhoto: () => void;
  onRemoveCover: () => void;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  onRemovePhoto?: () => void;
  onEdit: () => void;
  onMoreOptions: () => void;
  onOpenStickers: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  identity,
  achievements,
<<<<<<< HEAD
  onPickPhoto,
=======
  onPickCover,
  onPickPhoto,
  onRemoveCover,
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
  onRemovePhoto,
  onEdit,
  onMoreOptions,
  onOpenStickers,
}) => {
<<<<<<< HEAD
  const { displayName, subtitle, photoUrl, initials, level, title } = identity;
=======
  const { displayName, approach, university, coverPhotoUrl, photoUrl, initials, level, title } =
    identity;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

  return (
    <div className="relative w-full overflow-visible">
      {/* 1. Banner de capa — largura total, edge-to-edge, 3:1. */}
<<<<<<< HEAD
      <ProfileBanner onClick={onPickPhoto} />
=======
      <ProfileBanner coverPhotoUrl={coverPhotoUrl} onClick={onPickCover} />
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

      {/* 2. Avatar sobreposto à borda inferior do banner, à esquerda. */}
      <ProfileAvatarOverlay
        photoUrl={photoUrl}
        name={displayName || 'usuária'}
        initials={initials}
        onPickPhoto={onPickPhoto}
        onRemovePhoto={onRemovePhoto}
      />

      {/* 3. Informações de identidade — fluxo vertical, abaixo do banner. */}
      <ProfileIdentityInfo
        displayName={displayName || 'usuária'}
<<<<<<< HEAD
        subtitle={subtitle}
        quote={identity.quote}
=======
        approach={approach}
        university={university}
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
        level={level}
        title={title}
        achievements={achievements}
        onEdit={onEdit}
        onMoreOptions={onMoreOptions}
        onOpenStickers={onOpenStickers}
      />
    </div>
  );
};

export default ProfileHeader;
