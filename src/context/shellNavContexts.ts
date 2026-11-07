/**
 * Contextos de casca (PERF-001 A.3): expõem "bundles" por domínio — o grupo de
 * ações (`DataActionGroups`) + helpers compartilhados ESTÁVEIS daquele domínio
 * (ex.: toggleSaveBook/updateReadingProgress na biblioteca) + `showToast`.
 * Assim as views pesadas re-renderizam SÓ quando o domínio que importa muda,
 * sem depender do valor agregado do app (que muda a cada alteração de qualquer
 * domínio) nem do `SharedAppValue` agregado.
 *
 * Os providers são montados pela casca (`MobileAppProvider`),
 * que têm acesso a `shared.dataActions.<grupo>` e aos helpers estáveis.
 */
import { createContext, useContext } from 'react';
import type { DataActionGroups } from './dataActions';
import type { NavigationValue } from './navigationEngine';
import type { StreakStats, WeekDayCell } from '../lib/streak';
import type { ReminderSettings } from './DataClientProvider';
<<<<<<< HEAD
=======
import type { ManagedItemKind } from '../types';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

export type CoursesBundle = DataActionGroups['courses'] & {
  toggleBookmarkCourse: (courseId: string) => void;
};

export type StudyBundle = DataActionGroups['study'] & {
  streakStats: StreakStats;
  currentWeekProgress: WeekDayCell[];
  registerActivity: () => void;
};

export type KnowledgeBundle = DataActionGroups['knowledge'] & {
  toggleSaveBook: (bookId: string) => void;
  updateReadingProgress: (bookId: string, readPages: number) => void;
  showToast: (message: string) => void;
};

export type AppBundle = DataActionGroups['app'] & {
  showToast: (message: string) => void;
  updateReminder: (settings: ReminderSettings) => void;
  setGcalEnabled: (on: boolean) => Promise<boolean>;
};

/**
 * Período letivo isolado (SPEC-006). Fica fora do `AppBundle` de propósito:
 * corrigir o semestre reescreve `profile.semester` e `academicTerms`, e
 * `AppActionsContext` é consumido pelo Perfil inteiro — incluir o termo ali
 * re-renderizaria tela de lembrete, tema e foto a cada correção.
 */
export type TermBundle = DataActionGroups['term'] & {
  showToast: (message: string) => void;
};

export const CoursesActionsContext = createContext<CoursesBundle | undefined>(undefined);
export const StudyActionsContext = createContext<StudyBundle | undefined>(undefined);
export const KnowledgeActionsContext = createContext<KnowledgeBundle | undefined>(undefined);
export const AppActionsContext = createContext<AppBundle | undefined>(undefined);
export const TermActionsContext = createContext<TermBundle | undefined>(undefined);
export const NavValueContext = createContext<NavigationValue | undefined>(undefined);

<<<<<<< HEAD
=======
/** Contexto dedicado e estável apenas para o menu de gerenciamento (long-press).
 * Assim `ManageSurface` não precisa assinar o `AppContextValue` inteiro (~200 campos)
 * e não re-renderiza quando `activeTab` ou qualquer outro dado do app muda. */
export const ManageItemContext = createContext<{
  openManageItem: (kind: ManagedItemKind, id: string) => void;
  closeManageItem: () => void;
} | undefined>(undefined);

export function useManageItem() {
  const ctx = useContext(ManageItemContext);
  if (!ctx) {
    throw new Error('useManageItem must be used within a ManageItemContext provider');
  }
  return ctx;
}

>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
export function useCoursesActions(): CoursesBundle {
  const ctx = useContext(CoursesActionsContext);
  if (!ctx)
    throw new Error(
      'useCoursesActions must be used within a shell provider (CoursesActionsContext)',
    );
  return ctx;
}

export function useStudyActions(): StudyBundle {
  const ctx = useContext(StudyActionsContext);
  if (!ctx)
    throw new Error('useStudyActions must be used within a shell provider (StudyActionsContext)');
  return ctx;
}

export function useKnowledgeActions(): KnowledgeBundle {
  const ctx = useContext(KnowledgeActionsContext);
  if (!ctx)
    throw new Error(
      'useKnowledgeActions must be used within a shell provider (KnowledgeActionsContext)',
    );
  return ctx;
}

export function useAppActions(): AppBundle {
  const ctx = useContext(AppActionsContext);
  if (!ctx)
    throw new Error('useAppActions must be used within a shell provider (AppActionsContext)');
  return ctx;
}

export function useTermActions(): TermBundle {
  const ctx = useContext(TermActionsContext);
  if (!ctx)
    throw new Error('useTermActions must be used within a shell provider (TermActionsContext)');
  return ctx;
}

export function useNavValue(): NavigationValue {
  const ctx = useContext(NavValueContext);
  if (!ctx) throw new Error('useNavValue must be used within a shell provider (NavValueContext)');
  return ctx;
}
