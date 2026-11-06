// Perfil — coluna da história: jornada → ritmo → memória → conquistas.
//
// Ordem narrativa (SPEC-013 D1): **eu estou** (jornada) → **eu construí** (ritmo,
// memória) → conquistas além das 4 já exibidas no cabeçalho de identidade.
// Apenas composição: recebe o view model e handlers prontos, sem lógica de
// domínio.
import React from 'react';
import type { ProfileViewModel } from '../../../lib/profileViewModel';
import JourneyNow from './JourneyNow';
import ProgressPulse from './ProgressPulse';
import JourneyHistory from './JourneyHistory';
import AchievementsPreview from './AchievementsPreview';

/** Quantas conquistas já ficam no cabeçalho de identidade (não repetir abaixo). */
const VISIBLE_HEADER = 4;

export interface ProfileStoryColumnProps {
  vm: ProfileViewModel;
  onCorrectOrdinal: (termId: string, ordinal: number) => void;
  onSetTotalSemesters: (total: number) => void;
  onOpenSemesterWizard: () => void;
  onShowToast: (message: string) => void;
  onOpenTermHistory: () => void;
  onOpenSessions: () => void;
  onOpenReadings: () => void;
  onOpenTasks: () => void;
  onOpenExams: () => void;
  onOpenStickers: () => void;
  onOpenStreak: () => void;
}

export const ProfileStoryColumn: React.FC<ProfileStoryColumnProps> = ({
  vm,
  onCorrectOrdinal,
  onSetTotalSemesters,
  onOpenSemesterWizard,
  onShowToast,
  onOpenTermHistory,
  onOpenSessions,
  onOpenReadings,
  onOpenTasks,
  onOpenExams,
  onOpenStickers,
  onOpenStreak,
}) => (
  <div className="min-[900px]:col-span-7 space-y-5">
    <JourneyNow
      journey={vm.journey}
      onCorrectOrdinal={onCorrectOrdinal}
      onSetTotalSemesters={onSetTotalSemesters}
      onOpenSemesterWizard={onOpenSemesterWizard}
      onShowToast={onShowToast}
    />

    <ProgressPulse
      pulse={vm.pulse}
      onOpenSessions={onOpenSessions}
      onOpenReadings={onOpenReadings}
      onOpenTasks={onOpenTasks}
      onOpenExams={onOpenExams}
    />

    <JourneyHistory journey={vm.journey} onOpenTermHistory={onOpenTermHistory} />

    {/* Conquistas além das 4 já exibidas no cabeçalho de identidade. */}
    <AchievementsPreview
      achievements={{
        ...vm.achievements,
        visible: vm.achievements.visible.slice(VISIBLE_HEADER),
      }}
      onOpenStickers={onOpenStickers}
      onOpenStreak={onOpenStreak}
    />
  </div>
);

export default ProfileStoryColumn;
