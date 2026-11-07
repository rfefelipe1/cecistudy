// Perfil — coluna do cuidado: preferências e dados.
//
// Ordem narrativa (SPEC-013 D1): **eu cuido do meu cantinho** (preferências,
// dados). Apenas composição: recebe o view model e handlers prontos, sem lógica
// de domínio.
import React from 'react';
import type { ProfileViewModel } from '../../../lib/profileViewModel';
import type { ReminderSettings } from '../../../context/DataClientProvider';
import type { ThemeId } from '../../../lib/themes';
import type { MotionPref } from '../../../lib/motion';
import ProfilePreferences from './ProfilePreferences';
import ProfileDataMaintenance from './ProfileDataMaintenance';

export interface ProfileCareColumnProps {
  vm: ProfileViewModel;
  themePref: ThemeId;
  motionPref: MotionPref;
  onUpdateReminder: (settings: ReminderSettings) => void;
  onSetGcalEnabled: (enabled: boolean) => void;
  onThemeSelect: (id: ThemeId) => void;
  onMotionPrefSelect: (pref: MotionPref) => void;
  onOpenSync: () => void;
  onExport: () => void;
<<<<<<< HEAD
  onImport: (json: string) => void;
  onReset: () => void;
=======
  onImport: (json: string) => Promise<void>;
  onReset: () => Promise<void>;
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
}

export const ProfileCareColumn: React.FC<ProfileCareColumnProps> = ({
  vm,
  themePref,
  motionPref,
  onUpdateReminder,
  onSetGcalEnabled,
  onThemeSelect,
  onMotionPrefSelect,
  onOpenSync,
  onExport,
  onImport,
  onReset,
}) => (
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
);

export default ProfileCareColumn;
