# Tasks — SPEC-M-032: Clínica (workspace de formação clínica)

Referência: `../docs/specs/mobile/SPEC-M-032-clinica-workspace-de-formacao-clinica.md`
Origem: spec-referencial-workspace-academico.md §3.2, §4.4, §4.7, §4.8
Status: implementado em 2026-11-12 (sem commit; ver §"Desvios de implementação")

Legenda: `[x]` feito · `[~]` feito diferente do plano (desvio registrado na spec) · `[ ]` pendente.

## Fase 0 — Validação de pré-requisitos (gate verde)

- [x] t-0: Confirmar `npm run lint` (typecheck) com 0 erros após as 3 correções prévias
- [x] t-0: Confirmar `npm run test` dos arquivos de wizard com 0 falhas
- [x] t-0: Decisão da dona do produto sobre D11 (tensão com referencial §4.8 — clínica só no desktop). Confirmada na conversa de 2026-11-11.

## Fase 1 — Movimento 1: reposicionar a navegação (D1, D2, D4, D9)

- [x] t-1.1: `packages/navigation/src/types.ts:24` — `NavTab`: `'estudos'` → `'clinica'`
- [x] t-1.2: `src/lib/motion/screenAnnounce.ts` — `TAB_LABELS`: `clinica: 'clínica'`
- [x] t-1.3: `src/components/BottomNav.tsx` — TABS: id `clinica`, ícone `HeartHandshake`; "Novo flashcard" removido do FAB (D6)
- [x] t-1.4: `src/context/navigationEngine.ts` — `handleNavigate`: case especial `tab === 'estudos'` removido
- [x] t-1.5: `src/context/navigationEngine.ts` — `openStudy`: base `tab: 'clinica'`
- [x] t-1.6: `src/context/navigationEngine.ts` — `openTccScreen`: base `tab: 'home'` (D8)
- [x] t-1.7: `src/context/navigationEngine.ts` — `openQuizCategory`/`openQuizGroupDetail`: base `'clinica'`, sem ponto de entrada na UI (D6)
- [x] t-1.8: `src/shells/SharedScreenLayers.tsx` — `ClinicaView`/`ScreenKey 'clinica'` substituem `EstudosView`
- [~] t-1.9: loaders `studyFocus`/`studyRevisar`/`studyLeituras`/`studyHistorico` **permanecem** como deep-link legado (sem aba, sem botão); ver desvio D9
- [x] t-1.10: `routing.test.ts` e `quizStack.test.ts` atualizados para `'clinica'`
- [x] t-1.11: `GlobalSearchModal` (`onOpenStudy`), `PerfilView` (`openStudy`), `StreakView` (CTA de estudo removido)
- [x] t-1.12: `npm run lint` + testes de navegação verdes

## Fase 2 — Movimento 2: elevar Clínica (D3, D5, D7)

- [~] t-2.1..t-2.5: **não** foram criados `ClinicaView`/`ClinicaOverviewView`/`ClinicaCasesView`/`ClinicaCaseDetailView`/`ClinicaSupervisionView`. A aba reusa `InternshipDiaryView` (ver desvio D3/D5/D7)
- [x] t-2.6: `src/components/views/InternshipDiaryView.tsx` — eyebrow `clínica`, abas `visão geral`/`casos`/`supervisão`, hero `caso(s)`, pendências no topo
- [~] t-2.7: `src/lib/contextBarConfig.ts` — nenhuma ação nova da clínica; a barra do streak perdeu a ação primária de estudo
- [x] t-2.8: `src/lib/voice.ts` — `DICA.clinicaPrivacidade` (aviso de iniciais na aba casos, D11); sem frase inline
- [x] t-2.9: `npx tsc --noEmit` + `node .github/scripts/check-boundaries.mjs` verdes

## Fase 3 — Movimento 3: elevar TCC na Home (D8)

- [x] t-3.1: `src/components/views/HomeView.tsx` — `<QuickActions>` removido
- [x] t-3.2: `src/components/views/home/QuickActions.tsx` — **apagado**
- [x] t-3.3: `src/components/views/HomeView.tsx` — seção "sua formação" com card Clínica e card TCC (números reais); sem `framer-motion` (ratchet)
- [~] t-3.4: `AttentionSection` recebe itens já agregados; pendência de clínica não entrou no agregador (exigiria mexer em `calendarAggregator`, fora do recorte)
- [x] t-3.5: `npm run lint` + testes de Home/navegação verdes

## Fase 4 — Movimento 4: aposentar Estudos e privacidade (D6, D9, D10, D11)

- [x] t-4.1: `StudyFocusScreen`/`StudyRevisarScreen`/`StudyLeiturasScreen`/`StudyHistoricoScreen` sem ponto de entrada; dados preservados
- [x] t-4.2: aviso de privacidade na aba casos (`DICA.clinicaPrivacidade`): só iniciais
- [x] t-4.3: `SCHEMA_VERSION = 22` inalterado; `npm run verify:contract` verde
- [~] t-4.4: `grep "'estudos'"` em `src/`/`packages/navigation/src/` não zera: resta a camada `'estudos'` do calendário (`src/lib/schedule.ts:195,367`) e o hash legado (`hash.ts:181`)
- [~] t-4.5: `check-boundaries` + `test:voz` + `verify:contract` verdes; a suíte completa mantém 18 falhas **pré-existentes** fora do escopo (ver lista na spec)

## Fase 5 — Verificação final e gate de PR

- [ ] t-5.1: `npm run verify` completo (depende de a suíte pré-existente fechar e do build mobile)
- [ ] t-5.2: Criar branch `feature/clinica-workspace` a partir de `dev`
- [ ] t-5.3: Abrir PR com título conventional commit, base `dev`

## Fase 6 — Correção de navegação da Clínica / Estágio (pós-SPEC-M-032)

- [x] t-6.1: `src/components/views/FaculdadeView.tsx` — removido hero "diário de estágio", botão "anotar ou agendar um estágio", sub-tab `estagio`, `InternshipSection` e imports órfãos
- [x] t-6.2: `src/components/views/faculdade/InternshipSection.tsx` — apagado (sem chamador de produção)
- [x] t-6.3: `src/components/views/InternshipDiaryView.tsx` — `setTab` virou `useState` local sincronizado com `internshipTab` global via `useEffect`; trocar sub-tab não empurra pilha
- [x] t-6.4: `src/context/navigationEngine.ts` — `openInternshipDiary`/`openInternshipCase` sempre com base `{ tab: 'clinica' }` quando a pilha começa em clínica (mantido da sessão anterior)
- [x] t-6.5: `src/shells/SharedScreenLayers.tsx` — `activeTab === 'clinica'` renderiza caso/diário quando abertos; loaders `loadInternshipDiaryView`/`InternshipDiaryView` reintegrados
- [x] t-6.6: `packages/navigation/src/hash.ts` — `SUB_TAB_BY_TAB.faculdade = ['disciplinas']`; `#/faculdade/estagio/*` e `#/perfil/estagio` degradam para `{ tab: 'clinica', internshipTab: ... }`; serialização sempre `#/clinica/estagio/...` quando base é clínica
- [x] t-6.7: `src/components/views/HomeView.tsx` — removido card "clínica" de "sua formação"; só o card TCC permanece (sem substituto, por decisão da usuária); `clinicalCount` removido
- [x] t-6.8: `packages/navigation/src/__tests__/routing.test.ts` — casos de `#/faculdade/estagio`/`#/perfil/estagio` atualizados para clínica; round-trip ajustado
- [x] t-6.9: `npx tsc --noEmit`, `node .github/scripts/check-boundaries.mjs`, `npm run verify:contract`, testes de navegação + InternshipDiaryHero verdes

## Desvios de implementação

1. **Reuso de `InternshipDiaryView`** em vez de cinco views novas. A base já tinha os três eixos (visão geral, casos, supervisão), o hero único (SPEC-010), o filtro por tipo (SPEC-020/007) e o vínculo sessão ↔ supervisão. Criar views paralelas duplicaria a regra.
2. **`próximo atendimento` (D3) não existe**: o domínio registra sessões passadas (`InternshipLog`), não agendamento futuro. A visão geral abre com pendências e segue com resumo + meta + gráfico.
3. **Sub-telas de estudo continuam roteáveis** (`#/clinica/foco`, `#/clinica/leituras`…) porque "leituras" segue acessível como ação secundária no Perfil (D9, "compatibilidade secundária"). Fora da navegação, sem botão na aba.
4. **Camada `estudos` do calendário mantida**: o calendário agrega sessões antigas preservadas; removê-la apagaria histórico da grade. A aba, o FAB e os atalhos saíram.
5. **TCC serializa `#/clinica/tcc/...`** (herança de quando a tela empilhava sobre a aba); a rota antiga `#/estudos/...` continua aceita como alias em `parseRoute`.
