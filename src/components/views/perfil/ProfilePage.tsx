// Perfil — página composta (SPEC-013 D1/D10).
//
// Ordem narrativa (sem tabs de navegação horizontal):
// **eu sou** (cabeçalho de identidade com banner, avatar, nível e 4 conquistas,
// SEM card envolvente) → **eu estou** (jornada) → **eu construí** (ritmo,
// memória) → conquistas restantes → **eu cuido do meu cantinho** (preferências,
// dados, em card) → rodapé. A partir de 900 px vira duas colunas 7/5 — história
// à esquerda, cuidado à direita — e o contorno fecha em 1120 px a partir de
// 1200 px (D10).
//
// Cada elemento visível da tela é um componente separado importado abaixo.
// Somente o cabeçalho de identidade fica sem card; as demais seções mantêm o
// card envolvente, como estava antes. Editar a página principal não altera
// nenhum dos componentes filhos.
//
// Esta página é apresentação pura: recebe o view model e handlers prontos. Toda
// derivação mora em `src/lib/profileViewModel.ts` (D2); toda ação mora em
// `PerfilView.tsx` (D12).
import React from 'react';
import type { ProfileViewModel } from '../../../lib/profileViewModel';
import type { ReminderSettings } from '../../../context/DataClientProvider';
import type { ThemeId } from '../../../lib/themes';
import type { MotionPref } from '../../../lib/motion';
import type { ProfileEditValues } from './ProfileEditSheet';
import type { CeciComboboxOption } from '../../ui/ceci/CeciCombobox';
import ProfileEditSheet from './ProfileEditSheet';
import ProfileHeader from './ProfileHeader';
import ProfileStoryColumn from './ProfileStoryColumn';
import ProfileCareColumn from './ProfileCareColumn';
import ProfileFooterNote from './ProfileFooterNote';
import JourneyNow from './JourneyNow';
import ProgressPulse from './ProgressPulse';
import JourneyHistory from './JourneyHistory';
import ProfilePreferences from './ProfilePreferences';
import ProfileDataMaintenance from './ProfileDataMaintenance';

export interface ProfilePageProps {
  vm: ProfileViewModel;
  /** Id do tema atual — o seletor em sheet escolhe por id. */
  themePref: ThemeId;
  /** Preferência de movimento (SPEC-M-027 D9). */
  motionPref: MotionPref;
  /** Valores atuais de identidade para o rascunho do sheet. */
  editInitial: ProfileEditValues;
  editOpen: boolean;
  onEditOpen: () => void;
  onEditClose: () => void;
  onEditSave: (values: ProfileEditValues) => void;
  /** Lista própria de abordagens para a escolha de meta do perfil. */
  approachOptions: CeciComboboxOption[];
  /** Ação do botão de voltar no cabeçalho do perfil (leva à Home). */
  onVoltar: () => void;
  onPickPhoto: () => void;
  onCorrectOrdinal: (termId: string, ordinal: number) => void;
  onSetTotalSemesters: (total: number) => void;
  onOpenSemesterWizard: () => void;
  onOpenTermHistory: () => void;
  onShowToast: (message: string) => void;
  onOpenSessions: () => void;
  onOpenReadings: () => void;
  onOpenTasks: () => void;
  onOpenExams: () => void;
  onOpenStickers: () => void;
  onOpenStreak: () => void;
  onUpdateReminder: (settings: ReminderSettings) => void;
  onSetGcalEnabled: (enabled: boolean) => void;
  onThemeSelect: (id: ThemeId) => void;
  onMotionPrefSelect: (pref: MotionPref) => void;
  onOpenSync: () => void;
  onExport: () => void;
  onImport: (source: string | File) => void;
  onReset: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  vm,
  themePref,
  motionPref,
  editInitial,
  editOpen,
  onEditOpen,
  onEditClose,
  onEditSave,
  onVoltar,
  onPickPhoto,
  onCorrectOrdinal,
  onSetTotalSemesters,
  onOpenSemesterWizard,
  onOpenTermHistory,
  onShowToast,
  onOpenSessions,
  onOpenReadings,
  onOpenTasks,
  onOpenExams,
  onOpenStickers,
  onOpenStreak,
  onUpdateReminder,
  onSetGcalEnabled,
  onThemeSelect,
  onMotionPrefSelect,
  onOpenSync,
  onExport,
  onImport,
  onReset,
  approachOptions,
}) => {
  const { identity, achievements } = vm;

  return (
    <div className="w-full min-h-screen min-[1200px]:max-w-[1120px] min-[1200px]:mx-auto pb-1">
      <div className="grid grid-cols-1 min-[900px]:grid-cols-12 min-[900px]:gap-5 space-y-5 min-[900px]:space-y-0">
        {/* A história: identidade → jornada → ritmo → memória → conquistas (coluna 7). */}
        <div className="min-[900px]:col-span-7 space-y-5">
          {/* Cabeçalho de identidade — SEM card envolvente (banner, avatar, nome, nível, 4 conquistas). */}
          <ProfileHeader
            identity={identity}
            achievements={achievements.visible}
            onVoltar={onVoltar}
            onPickPhoto={onPickPhoto}
            onEdit={onEditOpen}
            onOpenStickers={onOpenStickers}
          />

          <ProfileStoryColumn
            vm={vm}
            onCorrectOrdinal={onCorrectOrdinal}
            onSetTotalSemesters={onSetTotalSemesters}
            onOpenSemesterWizard={onOpenSemesterWizard}
            onShowToast={onShowToast}
            onOpenTermHistory={onOpenTermHistory}
            onOpenSessions={onOpenSessions}
            onOpenReadings={onOpenReadings}
            onOpenTasks={onOpenTasks}
            onOpenExams={onOpenExams}
            onOpenStickers={onOpenStickers}
            onOpenStreak={onOpenStreak}
          />

        </div>

        {/* O cuidado: preferências e dados (coluna 5). */}
        <div className="min-[900px]:col-span-5 space-y-5">
          <ProfilePreferences
            preferences={vm.preferences}
            themePref={themePref}
            motionPref={motionPref}
            onUpdateReminder={onUpdateReminder}
            onSetGcalEnabled={onSetGcalEnabled}
            onThemeSelect={onThemeSelect}
            onMotionPrefSelect={onMotionPrefSelect}
          />

          <ProfileDataMaintenance
            maintenance={vm.maintenance}
            onOpenSync={onOpenSync}
            onExport={onExport}
            onImport={onImport}
            onReset={onReset}
          />
        </div>
      </div>

      {/* Rodapé afetivo (§5.2). */}
      <ProfileFooterNote />

      {/* Sheet de edição de identidade (D5) — a página é a dona da composição. */}
      <ProfileEditSheet
        open={editOpen}
        onClose={onEditClose}
        initial={editInitial}
        onSave={onEditSave}
        approachOptions={approachOptions}
      />
    </div>
  );
};

export default ProfilePage;
