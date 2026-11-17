// Perfil — cabeçalho de identidade com capa em largura total.
//
// Layout (conforme desenho aprovado):
//   [retângulo de capa, largura total, imagem de fundo de teste]
//     ├─ topo esquerdo: botão de voltar (seta) → Home
//     ├─ topo direito: três pontos (opções de perfil → edição de identidade)
//     └─ borda inferior esquerda: foto de perfil sobreposta (círculo)
//   [abaixo da capa]: nome · abordagem/universidade · nível · conquistas
//
// Não existe mais foto de capa separada nem header de página antigo.
// O botão de voltar leva sempre à Home. Os três pontos abrem a edição de
// identidade (mesmo sheet do "editar perfil").
import React from 'react';
import type { ProfileIdentity } from '../../../lib/profileViewModel';
import type { Sticker } from '../../../types';
import ProfileCapa from './ProfileCapa';
import ProfileTopBar from './ProfileTopBar';
import ProfileAvatarOverlay from './ProfileAvatarOverlay';
import ProfileIdentityInfo from './ProfileIdentityInfo';

// URL de teste da foto de capa enquanto a usuária não define a sua.
const CAPA_TESTE = '/assets/capa-teste.jpg';

interface ProfileHeaderProps {
  identity: ProfileIdentity;
  achievements: Sticker[];
  /** Ação do botão de voltar (injetada pelo casca de rota). */
  onVoltar: () => void;
  onPickPhoto: () => void;
  /** Abre a edição de identidade (três pontos / editar perfil). */
  onEdit: () => void;
  onOpenStickers: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  identity,
  achievements,
  onVoltar,
  onPickPhoto,
  onEdit,
  onOpenStickers,
}) => {
  const { displayName, photoUrl, initials } = identity;

  return (
    // As margens negativas anulam o padding e o respiro superior do `main`;
    // assim a capa encosta nas bordas sem sair do fluxo (nada de `absolute`,
    // que deixava a seção com altura zero e sobrepunha avatar/informações).
    <section className="relative -mx-3.5 -mt-4 sm:-mx-5 lg:-mx-8">
      {/* 1. Capa em fluxo normal, na largura total da tela. */}
      <div className="relative">
        <ProfileCapa height={220} coverPhotoUrl={CAPA_TESTE} />

        {/* 2. Botões sobre a capa: voltar no canto superior esquerdo,
            três pontos no canto superior direito. */}
        <ProfileTopBar onVoltar={onVoltar} onOpenOptions={onEdit} />
      </div>

      {/* 3. Foto de perfil centrada na borda inferior da capa, à esquerda. */}
      <ProfileAvatarOverlay
        photoUrl={photoUrl}
        name={displayName || 'usuária'}
        initials={initials}
        onPickPhoto={onPickPhoto}
      />

      {/* 4. Informações de identidade — repõe o padding horizontal do `main`. */}
      <div className="px-3.5 sm:px-5 lg:px-8 pt-2">
        <ProfileIdentityInfo
          displayName={displayName || 'usuária'}
          subtitle={identity.subtitle}
          quote={identity.quote}
          level={identity.level}
          title={identity.title}
          achievements={achievements}
          onEdit={onEdit}
          onOpenStickers={onOpenStickers}
        />
      </div>
    </section>
  );
};

export default ProfileHeader;
