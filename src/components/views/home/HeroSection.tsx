// Home — hero: saudação + data + frase do dia (MOD-001 / B.7).
// Extraído de `HomeView.tsx`.
import React from 'react';
import { Ambient } from '../../motion/Ambient';
import { HERO_MASCOTES, type HeroMascoteExpression } from './heroMascote';

interface HeroSectionProps {
  /** Na primeira montagem da aba, o hero entra com uma coreografia curta (D27). */
  entrada?: boolean;
  formattedDate: string;
  greeting: string;
  name: string;
  dayMessage: string;
  /** Frase de motivação do dia, escolhida aleatoriamente no boot (sem repetir a última). */
  fraseMotivacao: string;
  /** Frase de carinho pequena, escolhida aleatoriamente no boot (sem repetir a última). */
  fraseCarcinho: string | null;
  /** Arte do turno do dia — escolhida por `heroMascote()` em `HomeView`. */
  mascote: HeroMascoteExpression;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  entrada = false,
  formattedDate,
  greeting,
  name,
  dayMessage,
  fraseMotivacao,
  fraseCarcinho,
  mascote,
}) => (
  <section
    className={`rounded-[26px] bg-gradient-to-br from-surface-default to-surface-rose border border-ceci-border-subtle shadow-sm p-5 relative overflow-hidden ${entrada ? 'home-hero-entrada' : ''}`}
  >
    <div className="flex items-stretch justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-ceci-brand animate-pulse" />
          <p className="text-xs font-medium text-ceci-secondary lowercase">{formattedDate}</p>
        </div>
        <h1 className="font-serif-academic text-3xl sm:text-4xl text-ceci-primary mt-1 tracking-tight">
          {greeting}, {name} ✨
        </h1>
        {fraseCarcinho && (
          <p className="text-[11px] text-ceci-secondary mt-1 leading-relaxed max-w-[92%]">
            {fraseCarcinho}
          </p>
        )}
        {fraseMotivacao && (
          <p className="text-sm text-ceci-primary mt-1.5 leading-relaxed max-w-[92%]">
            {fraseMotivacao}
          </p>
        )}
      </div>
      {/* O halo dá volume à arte pastel nos temas escuros, onde ela encostaria no fundo. */}
      <Ambient className="relative shrink-0 -mr-1 -mt-1 h-full flex items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-3 rounded-full bg-ceci-brand-soft/40 blur-xl"
        />
        <img
          src={HERO_MASCOTES[mascote]}
          alt=""
          aria-hidden
          draggable={false}
          className="relative h-full max-w-[140px] w-auto object-contain select-none"
        />
      </Ambient>
    </div>
    <p className="text-xs sm:text-[13px] text-ceci-secondary leading-relaxed mt-2.5 max-w-[92%]">
      {dayMessage}
    </p>
  </section>
);

export default HeroSection;
