// Perfil — barra superior sobre a capa: voltar (esquerda) e opções (direita).
import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileTopBarProps {
  /** Ação do botão de voltar (injetado pelo casca de rota). */
  onVoltar: () => void;
  /** Ação do menu de três pontos. Se ausente, o botão não é renderizado. */
  onOpenOptions?: () => void;
}

export const ProfileTopBar: React.FC<ProfileTopBarProps> = ({
  onVoltar,
  onOpenOptions,
}) => {
  const hasOptions = Boolean(onOpenOptions);

  return (
    <div
      data-testid="perfil-top-bar"
      className="absolute inset-0 z-10 w-full px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 flex items-start justify-between pointer-events-none"
    >
      {/* Botão de voltar — sempre leva à Home. */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="voltar para a home"
          className="touch-target p-1.5 rounded-full border border-ceci-border-default bg-surface-default/90 text-ceci-primary hover:bg-surface-default transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Menu de opções do perfil. */}
      {hasOptions && (
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={onOpenOptions}
            aria-label="opções de perfil"
            className="touch-target p-1.5 rounded-full border border-ceci-border-default bg-surface-default/90 text-ceci-primary hover:bg-surface-default transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileTopBar;
