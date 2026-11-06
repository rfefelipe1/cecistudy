// Perfil — rodapé afetivo da tela (§5.2).
//
// Elemento isolado para que mudar o layout da página principal não toque no
// rodapé, e vice-versa.
import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';

export const ProfileFooterNote: React.FC = () => (
  <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-ceci-tertiary">
    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
    <span>tudo aqui nasce do que você anota, com carinho ♡</span>
    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
  </div>
);

export default ProfileFooterNote;
