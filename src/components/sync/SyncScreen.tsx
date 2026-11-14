// Sincronização — tela de escolha (hero + 2 caminhos).
//
// Hero card no topo, depois duas opções grandes:
//  - local: backup local (exportar/importar JSON ou ZIP)
//  - remoto: GitHub PAT (repositório privado cecistudy-sync)
//
// Clicar em cada uma leva à sua tela de ação. Sem ações bloqueantes,
// sem modais aqui — só navegação fluida entre telas.
import React from 'react';
import { Cloud, Download, Upload } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { HeroCard } from '../ui/HeroCard';

interface SyncOptionProps {
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const SyncOption: React.FC<SyncOptionProps> = ({
  label,
  subtitle,
  icon,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm hover:border-ceci-border-brand transition-colors cursor-pointer active:scale-[0.99] transition-transform"
  >
    <div className="flex items-start gap-3">
      <span
        className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center shrink-0"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-display font-bold text-sm text-ceci-primary">
          {label}
        </span>
        <span className="block text-xs text-ceci-secondary leading-relaxed mt-0.5">
          {subtitle}
        </span>
      </span>
    </div>
  </button>
);

export const SyncScreen: React.FC = () => {
  const { openSyncLocalScreen, openSyncRemoteScreen } = useMobileApp();

  return (
    <div className="min-h-full pb-10">
      <div className="px-5 space-y-4">
        {/* Hero card — apresenta o serviço de sincronização. */}
        <HeroCard
          eyebrow="sincronizar"
          title="seus dados, em todos os lugares"
          summary="escolha como quer levar o cantinho para outro dispositivo: com um arquivo local que você mesma exporta e importa, ou com o GitHub, que mantém os dois aparelhos iguais automaticamente."
          accent="rose"
          testId="sync-hero"
        />

        <SyncOption
          icon={<Download className="w-5 h-5 text-ceci-brand-strong" aria-hidden="true" />}
          label="backup local"
          subtitle="exporta um arquivo do seu cantinho e importa em outro aparelho"
          onClick={openSyncLocalScreen}
        />

        <SyncOption
          icon={<Upload className="w-5 h-5 text-ceci-academic-strong" aria-hidden="true" />}
          label="sync remoto (GitHub)"
          subtitle="conecta seu repositório privado com um token de acesso pessoal"
          onClick={openSyncRemoteScreen}
        />

        <p className="text-[11px] text-ceci-muted text-center leading-relaxed px-4">
          seus dados continuam só seus. nada é enviado para servidores alheios ♡
        </p>
      </div>
    </div>
  );
};

export default SyncScreen;
