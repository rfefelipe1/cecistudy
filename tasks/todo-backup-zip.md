# To-Do SPEC-M-030 — Backup ZIP com manifest e carregamento on-demand

Spec: `../../docs/specs/mobile/SPEC-M-030-novo-formato-de-backup-zip-com-manifest-e-carregamento-ondemand.md`
Plano: `plan-backup-zip.md`

Estado: **Todas as fases entregues (1–7).** O núcleo (export ZIP com todos os
domínios, import ZIP com mínimo + on-demand, import JSON v2 antigo, tema no
backup e toasts por domínio) + preview do manifest no onboarding + teste de UI
comportamental (`OnboardingImport.test.tsx`) estão implementados e com testes
verdes (144 testes da feature + regressão).

## Regra de teste desta rodada

Base: `docs/estandares-testes.md`.

| O que testar | Classe | Onde |
|---|---|---|
| writer/reader ZIP (round-trip, manifest inválido, domínio corrompido) | unidade pura | `src/lib/backupZip/__tests__/zip.test.ts` |
| manifesto, caminhos de pasta e rótulos | unidade pura | `src/lib/backupZip/__tests__/manifest.test.ts` |
| import ZIP: mínimo + on-demand + fallback + round-trip export→import | integração com mock | `src/lib/backupZip/__tests__/importBackupZip.test.ts` |
| regressão JSON v2 antigo | integração existente | `src/lib/__tests__/exportImport.test.ts` |
| tema viaja no backup | integração | coberto em `importBackupZip.test.ts` (`applyTheme`) |
| botão no onboarding e toasts | UI comportamental | `src/components/views/__tests__/OnboardingImport.test.tsx` |

Sem render-only, sem `setTimeout` real (usar `vi.useFakeTimers`), variação de dado com `it.each`.

## Fase 0 — Preparação

- [x] **T0.1** Revisar a SPEC-M-030 e este plano; confirmar a estrutura de pastas/arquivos e o ponto de integração em `DataClientProvider.tsx`.

## Fase 1 — Módulo ZIP puro (`src/lib/backupZip/`)

- [x] **T1.1** Tipos e mapeamento domínio→caminho. Entregue em `manifest.ts` (`BackupManifest`, `DOMAIN_FOLDERS`, `domainPath`, `domainKey`) em vez de um `types.ts` separado.
- [x] **T1.2** `validateManifest(raw)`. O manifest é montado inline no `exportData` (não há `buildManifest` genérico).
- [x] **T1.3** `zipWriter.ts` sobre `jszip` (salva via função injetada).
- [x] **T1.4** `zipReader.ts`: `readManifest`, `readDomain` com `try/catch`, `listFiles`.
- [x] **T1.5** Testes de writer/reader: round-trip, ZIP inválido, manifest ausente/corrompido, domínio ausente, `ArrayBuffer`.

## Checkpoint 1 — Módulo ZIP
- [x] Typecheck sem erro da feature.
- [x] Testes do módulo ZIP verdes.

## Fase 2 — Tema como dado do usuário

- [x] **T2.1** `themePref` com namespace `user` (`DataClientProvider.tsx`).
- [x] **T2.2** `themePref` vai no `manifest.temaId` e em `themes.json`.
- [x] **T2.3** Tema aplicado no import (coberto em `importBackupZip.test.ts`).

## Fase 3 — Export ZIP

- [x] **T3.1** O payload inteiro (`payload.payload`) é entregue ao writer; cada chave vira `<chave>/<chave>.json` (mais `notes/looseNotes.json` e `internship/internshipLogs.json`). Não houve `buildBackupZip.ts` separado.
- [x] **T3.2** `exportData` gera `cecistudy-backup-<yyyy-mm-dd>.zip`.
- [x] **T3.3** `exportBackupZip` em `src/lib/exportFile.ts` (web = download; nativo = Filesystem + Share).
- [x] **T3.4** Estrutura interna conferida no teste de round-trip do writer.

> Correção sobre o plano: o export anterior mapeava só 12 domínios e **perdia**
> coleções (autores, conceitos, baralhos, materiais, figurinhas, sessões, TCC
> detalhado, leitura). Agora sai o payload inteiro.

## Checkpoint 2 — Export ZIP
- [x] Export gera ZIP válido com a estrutura da spec.
- [x] Export não gera mais JSON (D1).

## Fase 4 — Import ZIP com mínimo + on-demand

- [x] **T4.1** `importBackupZip.ts`: abre o ZIP, lê o manifest e valida versão.
- [x] **T4.2** Mínimo = `profile` + `courses` + `themes`, com `onboarding.completed = true` para a home abrir no lugar do cadastro.
- [x] **T4.3** On-demand itera os arquivos do ZIP, acumula os domínios já lidos e aplica um a um; `onDomainLoaded` por domínio.
- [x] **T4.4** `importData` aceita `string | Blob | ArrayBuffer`: ZIP pelo novo pipeline, JSON v2 pelo `importAppDatabase`.
- [x] **T4.5** Testes de mínimo, on-demand, fallback e round-trip.

## Checkpoint 3 — Import funcional
- [x] ZIP abre a home com profile + courses + themes.
- [x] Restante carrega com um toast por domínio.
- [x] JSON v2 antigo ainda importa (regressão verde).

## Fase 5 — UI e toasts

- [x] **T5.1** Botão "já tenho um backup" no onboarding (step 0), com input `accept=".zip,.json"`.
- [x] **T5.2** Preview do manifest (nome, data, tela, tema) e confirmação no step 0 do onboarding.
- [x] **T5.3** Voz: `CELEBRACAO.dominioCarregado` (uma frase com rótulo do domínio) e `ERRO.dominioNaoCarregado`; rótulos em `DOMAIN_LABELS`.
- [x] **T5.4** Onboarding não reaparece após o import (mínimo marca `onboarding.completed`).
- [x] **T5.5** Teste de UI comportamental do onboarding/toasts: `src/components/views/__tests__/OnboardingImport.test.tsx` (6 testes passando).

## Fase 6 — Erros, fallbacks e compatibilidade

- [x] **T6.1** `try/catch` por leitura no `zipReader` e recusas tipadas (`arquivo`/`manifesto`/`versao`/`invalido`) no `importBackupZip`.
- [x] **T6.2** Domínio corrompido: `onDomainError`, mantém o acumulado e segue.
- [x] **T6.3** ZIP inválido/sem manifest: nada é aplicado.
- [x] **T6.4** JSON v2 antigo preservado (`exportImport.test.ts` verde).
- [x] **T6.5** Testes de erro e compatibilidade.

## Fase 7 — Fechamento

- [x] **T7.1** Contrato de backup: `contracts/backup-v2-spec.md` estendido com nota sobre ZIP.
- [x] **T7.2** Status da SPEC-M-030 → `entregue` e índice `docs/specs/README.md` atualizado com SPEC-M-029 e SPEC-M-030.
- [x] **T7.3** Typecheck sem erro da feature. (Erro alheio em `lib/contextBarConfig.ts` e `wizards/__tests__/*`, `lib/profileViewModel.ts` seguem na árvore compartilhada.)
- [x] **T7.4** Suítes da feature + regressão JSON + Perfil verdes (144 testes).
- [ ] **T7.5** `check-boundaries.mjs` — falha em `ProfileEditSheet.tsx:143`, arquivo de outra sessão.
- [x] **T7.6** `verify:contract` verde.
- [x] **T7.7** Critérios de aceite da SPEC-M-030 marcados; status `entregue`.

## Checkpoint final
- [x] Export ZIP válido.
- [x] Import ZIP com mínimo + on-demand.
- [x] JSON v2 antigo ainda importa.
- [x] Erros com fallback, sem perda de dado.
- [x] Gate completo verde (typecheck da feature, testes, verify:contract). `check-boundaries` bloqueado por arquivo de outra sessão.

## Riscos vivos

- **Aplicação progressiva reescreve o banco a cada domínio.** Se a usuária
  editar durante a restauração, a edição pode ser sobrescrita. Aceitável para
  o fluxo de restauração; se virar problema, bloquear a edição até terminar.
- **`jszip` em memória**: ZIP grande carrega inteiro. Medir no aparelho.
- **Backups JSON antigos** continuam sem `themes.json` (tema cai no atual).

## Não fazer nesta rodada

- Mudar o sync GitHub para ZIP (permanece JSON único, D7).
- Criptografia do ZIP (SPEC-M-026).
- Backup automático agendado.
- Desktop (`cecistudy-desktop`): formato próprio em Rust.
- Import de formatos anteriores ao v2 (`{"version": 7}`, etc.).
- Streaming/descompactação parcial no nativo (fica como risco medido).
