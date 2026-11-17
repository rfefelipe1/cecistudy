# Plano de implementação SPEC-M-030 · Backup ZIP com manifest e carregamento on-demand

Spec: `../../docs/specs/mobile/SPEC-M-030-novo-formato-de-backup-zip-com-manifest-e-carregamento-ondemand.md`
To-do: `todo-backup-zip.md`
Dependência já instalada: `jszip` (`package.json`)
Testes: `docs/estandares-testes.md` (domínio puro, adaptador com mock, UI só comportamental)

## Objetivo

Exportar sempre em ZIP (`cecistudy-backup-<yyyy-mm-dd>.zip`), com `manifest.json` + `themes.json` na raiz e subpastas por domínio; importar ZIP novo e JSON v2 antigo; abrir a home com o mínimo (manifest + profile + courses + themes) e carregar o restante on-demand, um toast por domínio; nunca falhar tudo por um arquivo interno ruim.

## Decisões de arquitetura

- **`jszip` já está instalado** e roda em memória na web e no nativo. A escrita/leitura do arquivo físico continua isolada em `src/lib/` (Capacitor Filesystem, como o `exportFile.ts` atual).
- **Nenhuma regra de domínio nova em `packages/*`**: o ZIP é formato de transporte, mora em `src/lib/backupZip/`. O pipeline JSON existente (`packages/data/src/exportImport.ts`) fica intacto para compatibilidade.
- **Sync GitHub inalterado** (`packages/sync/`): continua JSON único. O ZIP é export/import local e pode ser baixado do GitHub como arquivo.
- **Tema vira dado do usuário**: `themePref` muda de namespace `device` para `user`; entra no mínimo e em `themes.json`.
- **Um domínio = uma pasta = um JSON**: o mapeamento segue `COLLECTIONS` (`packages/data/src/collections.ts`).
- **Erro é por arquivo, não por backup**: cada leitura de domínio tem `try/catch` e fallback vazio + toast de aviso.

## Fases

### Fase 0 — Preparação (sem código de produção)
Confirmar o contrato de nomes/estrutura da ZIP e o ponto de integração no `DataClientProvider`. Critério: spec revisada e este plano coerente com ela.

### Fase 1 — Módulo ZIP puro (`src/lib/backupZip/`)
Tipos (`BackupManifest`, `BackupDomain`, `BackupZipResult`), `manifest.ts` (build/validate), `zipWriter.ts` e `zipReader.ts` sobre `jszip`. Critério: round-trip writer→reader em teste unitário, sem `@capacitor/*`.

### Fase 2 — Tema como dado do usuário
`themePref` vira namespace `user`; entra no snapshot de export. Critério: teste de que o tema sai no backup e volta no import.

### Fase 3 — Export ZIP
`buildBackupZip.ts` quebra o snapshot em arquivos por domínio; `exportData` gera e salva o ZIP com nome datado. Critério: teste de export contém `manifest.json`, `themes.json` e as pastas mínimas.

### Fase 4 — Import ZIP com mínimo + on-demand
`importBackupZip.ts` detecta ZIP vs JSON, aplica o mínimo e dispara o restante com callback de progresso. `importData` orquestra. Critério: home abre com profile+courses+themes; restante carrega e chama o toast por domínio.

### Fase 5 — UI e toasts
Botão "importar meu backup" no onboarding, preview do manifest, toasts na voz do cecinho, navegação para a home. Critério: teste de UI do fluxo completo (cancelar, confirmar, erro).

### Fase 6 — Erros, fallbacks e compatibilidade
`try/catch` por etapa, fallback de domínio corrompido, recusa de ZIP sem manifest, pipeline JSON v2 antigo preservado. Critério: testes de erro + regressão do JSON v2.

### Fase 7 — Fechamento
Contrato em `contracts/`, status da spec, `npm run lint`, `npm run test`, `check-boundaries.mjs`, `verify:contract`.

## Dependências

- Fase 1 antes de 3 e 4 (writer/reader).
- Fase 2 antes de 3 (o tema precisa estar no snapshot).
- Fase 4 antes de 5 (a UI consome o callback de progresso).
- Fase 6 pode rodar em paralelo à 5, mas o fallback do leitor precisa existir antes do teste de UI de erro.
- `packages/*` não importa `@capacitor/*` nem `jszip` de forma direta fora de `src/lib/backupZip/`.

## Riscos

- **ZIP grande em memória** no nativo: `jszip` carrega tudo; medir no aparelho. Mitigação: no futuro, streaming por domínio.
- **Tema muda de namespace**: backup antigo não tem `themes.json`; fallback para `DEFAULT_THEME_ID` ou tema atual do aparelho.
- **Home depende de dados não-mínimos** (ex.: aulas para a grade): o mínimo pode deixar a tela vazia por um instante. Mitigação: carregar `classes` junto do mínimo se a home precisar.
- **Dois formatos conviventes** (ZIP export, JSON sync): documentar no contrato para não confundir.
- **Erro de encoding**: seguir o skill `utf8-e-encoding` ao criar os JSON internos (UTF-8 sem BOM).
