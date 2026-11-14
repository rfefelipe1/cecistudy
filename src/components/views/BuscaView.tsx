// Tela de busca global da Biblioteca (SPEC-034 §7).
//
// Props:
//   onNavigate — callback para navegar (detalhe do material)
export interface BuscaViewProps {
  onNavigate?: (tipo: 'detalheMaterial', id: string) => void;
}

import React, { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { SectionTitle } from '../ui/SectionTitle';
import { BuscaBiblioteca } from '../ui/BuscaBiblioteca';

export const BuscaView = memo<BuscaViewProps>(({
  onNavigate,
}) => {
  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-6 pb-1 relative">
      <SectionTitle
        icon={<Sparkles className="w-4 h-4 text-ceci-brand-strong" />}
      >
        busca
      </SectionTitle>
      <BuscaBiblioteca
        onSelect={(id) => onNavigate?.('detalheMaterial', id)}
      />
    </div>
  );
});

BuscaView.displayName = 'BuscaView';
