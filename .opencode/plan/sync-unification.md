# Plan: Unify Sync Options in Profile & Create New Sync Screen

## 🎯 Primary Goal
Unify the scattered sync/backup options in the Profile "seus dados" section into a single cohesive flow: one "exportar backup" row + one "sincronização" row that opens a new screen with a HeroCard and two clear sync methods (local import / remote GitHub), each leading to its own instruction screen — all fluid, non-blocking, and noise-free.

## 🧨 Current State
- **ProfileDataMaintenance** has three separate sync-related rows: "sincronizar entre dispositivos" (opens legacy `SyncScreen` for P2P pairing), "exportar backup", "importar backup" — plus a separate `CloudBackupToggle` section below for GitHub PAT sync.
- The legacy `SyncScreen` (P2P QR pairing) is incomplete (transport not implemented, shows "unavailable" phase) and lives at `src/components/sync/SyncScreen.tsx`.
- `CloudBackupToggle` handles GitHub PAT setup inline in the profile.
- `BackupView` is a standalone screen for export/import but isn't linked from profile.
- `GithubSyncCard` is another standalone sync UI used elsewhere.
- HeroCard pattern exists at `src/components/ui/HeroCard.tsx` (SPEC-010).

## 🧠 Design Idea
1. **Profile "seus dados"**: Keep only "exportar backup" row + add one "sincronização" row (navigates to new screen). Remove "sincronizar entre dispositivos" row and `CloudBackupToggle`.
2. **New SyncScreen** (replaces legacy): HeroCard at top ("sincronização", "seus dados nos seus dispositivos") → two cards: "local (backup importado)" and "remoto (GitHub PAT)". Each is a PreferenceRow-style card that navigates to its own instruction screen.
3. **Local Sync Instruction Screen**: Explains ZIP/JSON backup import, shows "importar backup" button (reuses existing file picker logic).
4. **Remote Sync Instruction Screen**: Explains GitHub PAT, shows "configurar GitHub" button (reuses `CloudBackupToggle` logic).
5. All navigation uses existing `openSyncScreen` → new screens pushed on stack.

## 🛠️ Steps

### 1️⃣ **Simplify ProfileDataMaintenance** → Remove P2P sync row & CloudBackupToggle; keep export + add sync navigation row
- Edit `src/components/views/perfil/ProfileDataMaintenance.tsx`
- Remove: `RefreshCw` import, "sincronizar entre dispositivos" PreferenceRow (lines 116-122), `CloudBackupToggle` import & usage (lines 18, 174)
- Keep: "exportar backup" row, "importar backup" row
- Add: new "sincronização" PreferenceRow with `onClick={onOpenSync}` (icon: `GitBranch` or `RefreshCw`, label: "sincronização", description: "local (backup) ou remoto (GitHub)")
- Update `ProfileMaintenance` type in `profileViewModel.ts` if needed (adds `canSync: true`)

### 2️⃣ **Create new SyncScreen with HeroCard** → Replaces legacy `src/components/sync/SyncScreen.tsx`
- New file or rewrite: `src/components/sync/SyncScreen.tsx`
- Use `HeroCard` (eyebrow: "sincronização", title: "seus dados nos seus dispositivos", accent: "blue", summary: "escolha como manter o cantinho igual nos seus aparelhos")
- Two clickable cards (PreferenceRow style or custom): 
  - Local: icon `Database` / `Upload`, label "local (backup importado)", description "importe um arquivo ZIP/JSON do seu backup"
  - Remote: icon `Cloud` / `GitBranch`, label "remoto (GitHub PAT)", description "use seu repositório privado no GitHub"
- Each card `onClick` pushes instruction screen via navigation (new `openSyncLocal` / `openSyncRemote` in `NavValueContext`)

### 3️⃣ **Add navigation actions for instruction screens** → `navigationEngine.ts` + `shellNavContexts.ts`
- Add `openSyncLocalScreen`, `closeSyncLocalScreen`, `openSyncRemoteScreen`, `closeSyncRemoteScreen` to `NavigationValue` and `NavigationValueContext`
- Implement in `navigationEngine.ts` (push `{ kind: 'sync-local' }` / `{ kind: 'sync-remote' }` screens)
- Update `SharedScreenLayers.tsx` lazy loads for new screens
- Export hooks in `shellNavContexts.ts` (or use existing `useNavValue`)

### 4️⃣ **Create SyncLocalInstructionScreen** → `src/components/sync/SyncLocalInstructionScreen.tsx`
- Simple screen with HeroCard (eyebrow: "sincronização", title: "local (backup importado)", accent: "rose")
- Content: explains ZIP/JSON backup, "seus dados ficam no dispositivo — importe quando quiser"
- Primary action: "importar backup" button → triggers file picker (reuse `ProfileDataMaintenance` logic: `onImport` from context)
- Back button in top bar (standard)

### 5️⃣ **Create SyncRemoteInstructionScreen** → `src/components/sync/SyncRemoteInstructionScreen.tsx`
- HeroCard (eyebrow: "sincronização", title: "remoto (GitHub PAT)", accent: "blue")
- Content: explains PAT with `repo` scope, private repo `cecistudy-sync`, data stays yours
- Primary action: "configurar GitHub" → reuses `CloudBackupToggle` setup modal logic (or inline form)
- Shows current config if already connected (repo owner/name, sync status)
- Back button in top bar

### 6️⃣ **Wire up ProfilePage / PerfilView** → Pass new handlers
- `PerfilView` already has `onOpenSync={openSyncScreen}` — ensure it points to new SyncScreen
- Add `onOpenSyncLocal`, `onOpenSyncRemote` to `ProfilePageProps` and `PerfilView` (from `useNavValue`)
- `ProfileDataMaintenance` receives `onOpenSync` (already exists) — no change needed there

### 7️⃣ **Clean up legacy code** → Remove unused files/imports
- Delete legacy `SyncScreen` phases (P2P QR pairing) — replace entirely
- `CloudBackupToggle` can be deleted (logic moves to `SyncRemoteInstructionScreen`)
- `GithubSyncCard` — keep if used elsewhere, otherwise deprecate
- Remove `pairing.ts`, `scanQr.ts`, `transport-bridge.ts` if no longer used (check imports)

### 8️⃣ **Verify & Test** → Typecheck, unit tests, manual flow
- `npm run lint` (typecheck)
- `npm run test` — profile tests, sync screen tests
- Manual: Profile → "seus dados" → "sincronização" → new SyncScreen → Local/Remote → instruction screens → actions work

## 🚫 Not Now
- P2P QR pairing (legacy SyncScreen) — fully replaced; can be revived later if transport lands
- Background sync triggers / auto-sync — out of scope
- Encryption password UI changes — reuse existing modal
- OTA section in ProfileDataMaintenance — untouched
- DangerZone (reset) — untouched