# Plano — Correção de navegação da Clínica / Estágio (pós-SPEC-M-032)

**App:** mobile (`cecistudy/`)
**Origem:** problemas detectados após a entrega da SPEC-M-032 (Clínica workspace).
**Status:** implementado (2026-11-12)
**Convenção:** caminhos relativos à raiz de `cecistudy/`.

---

## 1. Contexto e problema

Após trocar a aba `estudos` por `clinica` (SPEC-M-032), três pontos ficaram inconsistentes:

1. **Home tem um card "clínica" redundante.** A Home já exibe a aba `clinica` no BottomNav (ícone `HeartHandshake`), mas ainda tem um card em "sua formação" que chama `handleNavigate('clinica')`. Não faz sentido ter um ponto de entrada dentro da Home que duplica uma aba principal.
2. **FaculdadeView mantém o "diário de estágio" e a sub-tab `estagio`.** O estágio saiu do módulo Faculdade e agora vive na Clínica (D1/D7 da SPEC-M-032), mas a FaculdadeView ainda tem:
   - o hero card "diário de estágio" (`openInternshipDiary()`),
   - a sub-tab `estagio` ao lado de `disciplinas`,
   - o `InternshipSection` renderizado nessa sub-tab.
3. **Trocar de sub-tab dentro da Clínica empilha uma tela fora da navegação principal.** As sub-tabs `diario / casos / supervisão` da Clínica acionam `openInternshipDiary(t)` (ação global de navegação) em vez de trocar localmente. Como o topo da pilha dentro da Clínica é `{ kind: 'tab', tab: 'clinica' }` (não `internshipDiary`), cada clique empurra `{ kind: 'tab', tab: 'clinica' }, { kind: 'internshipDiary', tab }` — uma nova entrada de pilha, fora do fluxo da aba. O usuário sai da Clínica principal ao trocar sub-tab.

---

## 2. Causa raiz (caminho:linha)

| # | Problema | Causa raiz | Caminho:linha |
|---|----------|------------|---------------|
| 1 | Card "clínica" redundante na Home | Botão `onClick={() => handleNavigate('clinica')}` dentro de "sua formação", duplicando a aba principal do BottomNav. | `src/components/views/HomeView.tsx:209-220` |
| 2 | Hero "diário de estágio" na Faculdade | Card grande que chama `openInternshipDiary()`, expondo estágio dentro da Faculdade quando o domínio já mudou para a Clínica. | `src/components/views/FaculdadeView.tsx:171-211` |
| 2 | Sub-tab `estagio` na Faculdade | `SUBTAB_ORDER` inclui `'estagio'` e o `SwipeableTabPanel` renderiza `InternshipSection` para ela. | `src/components/views/FaculdadeView.tsx:31,36,41,257-263` |
| 3 | Sub-tabs da Clínica empilham tela | `setTab = (t) => openInternshipDiary(t)` chama ação global de navegação; `openInternshipDiary` empilha `{ kind: 'tab' } + { kind: 'internshipDiary' }` quando o topo não é `internshipDiary`. | `src/components/views/InternshipDiaryView.tsx:97` · `src/context/navigationEngine.ts:1133-1150` |
| 3 | `internshipTab` lida da pilha global | `derive.ts` deriva `internshipTab` de `currentScreen.kind === 'internshipDiary'`, acoplando a aba ao estado global em vez de mantê-la local na Clínica. | `packages/navigation/src/derive.ts:544-545` |

---

## 3. Escopo do que muda

### 3.1 HomeView — remover card "clínica" de "sua formação"
- Remover o botão `clínica` do grid de "sua formação" (redundante com a aba principal).
- Manter o card TCC (`openTccScreen`) — ele continua sendo um ponto de entrada válido da Home (SPEC-M-032 D8).
- A seção "sua formação" pode ficar só com o card TCC, ou ser revista; decidir no plano de implementação qual o tamanho mínimo. O essencial: **não deixar um botão que navega para uma aba que já existe no BottomNav**.

### 3.2 FaculdadeView — remover estágio da Faculdade
- Remover o hero card "diário de estágio" (bloco `section` com `bg-surface-rose`, lines 171-211) e o botão "anotar ou agendar um estágio" (`openWizard('internship')`, lines 215-222).
- Remover a sub-tab `estagio` de `SUBTAB_ORDER`, `SUBTAB_LABEL`, `SUBTABS`.
- Remover o render `{ subTab === 'estagio' && <InternshipSection ... /> }`.
- Manter `disciplinas` como única sub-tab (ou ajustar `UnderlineTabBar` para uma sub-tab só).
- `FaculdadeView` deixa de importar `InternshipSection`, `computePendencies`, `computeStats`, `buildCalendarEntries` (se não usado em outro lugar), `DICA/frase` se não usado.

### 3.3 InternshipDiaryView (Clínica) — sub-tabs locais, não nav global
- Trocar `setTab = (t) => openInternshipDiary(t)` por estado local (`useState<InternshipTab>`), de forma que trocar `diario/casos/supervisão` não empurre tela na pilha global.
- A `internshipTab` lida via `useMobileApp()` vem da pilha global (`derive.ts`). Dentro da Clínica, a aba deve viver em `useState` local; a derivação global só serve para entry points externos (Faculdade, calendar, deep-link).
- Manter `openInternshipDiary(t)` como ação de navegação para chamadores externos (Faculdade, `calendarDestination.ts`, `MobileAppShell`, deep-links) — não remover a função, só não usá-la para trocar sub-tab dentro da própria tela.

### 3.4 Callers externos de `openInternshipDiary` (manter, direcionar à Clínica)
Esses continuam válidos como **pontos de entrada** para o diário/clínica:
- `src/components/views/faculdade/InternshipSection.tsx:46` (`onClick={onOpenDiary}`) — após remover `estagio` da Faculdade, este componente deixa de existir; se houver preview de estágio noutro lugar, deve abrir a Clínica.
- `src/lib/calendarDestination.ts:38` (`case 'internship': return () => nav.openInternshipDiary();`) — entrada do calendário; abre o diário. Pode manter (vai para a Clínica se a base for clínica, ou faculdade se vier de lá — comportamento já ajustado na sessão anterior).
- `src/shells/MobileAppShell.tsx:189` (hash `internship` → `openInternshipDiary()`).

---

## 4. Escopo do que NÃO muda (fora deste plano)

- `SCHEMA_VERSION` continua 22 (não há mudança de persistência).
- `BottomNav` mantém a aba `clinica` (é o ponto de entrada principal — não remove).
- `InternshipDiaryView` continua sendo renderizado para `activeTab === 'clinica'` (não remove a tela).
- `openInternshipDiary`/`openInternshipCase` continuam existindo como ações de navegação para entry points externos.
- Dados (`internmentLogs`, `QuizSession`, `Flashcard`, etc.) preservados — nenhuma exclusão.

---

## 5. Riscos e callers a validar

| Caller | Uso | Risco |
|--------|-----|-------|
| `FaculdadeView.tsx` | `openInternshipDiary`, `openWizard('internship')`, `InternshipSection` | Serão removidos com a sub-tab `estagio`. Verificar se nada mais importa `InternshipSection` de `./faculdade/InternshipSection`. |
| `calendarDestination.ts` | `openInternshipDiary()` para entrada `internship` | Mantido. Deve abrir o diário; verificar que não quebra round-trip de hash. |
| `MobileAppShell.tsx:189` | hash `internship` → `openInternshipDiary()` | Mantido. |
| `InternshipDiaryView` | `openInternshipCase`, `openInternshipWizard` | Não afetados pela mudança de sub-tab local. |
| `derive.ts:544-545` | `internshipTab` da pilha | Só muda se dependermos de `internshipTab` global dentro da Clínica; com estado local, não depende mais. |

---

## 6. Critérios de aceite (verificável por comando)

- `npx tsc --noEmit` → 0 erros.
- `node .github/scripts/check-boundaries.mjs` → OK.
- `npm run test` → não introduzir novas falhas além das 18 pré-existentes conhecidas.
- `packages/navigation/src/__tests__` (routing + quizStack) → verde.
- Teste novo: trocar de sub-tab dentro da Clínica (`diario → casos → supervisão`) **não** adiciona entrada à pilha (`navigationStack.length` não cresce) e o hash permanece `#/clinica`.
- Teste novo: `parseRoute('#/clinica/estagio/diario')` ainda resolve `tab: 'clinica'` (mantido da sessão anterior).
- Home não renderiza botão que chama `handleNavigate('clinica')`.
- FaculdadeView não renderiza sub-tab `estagio` nem card "diário de estágio".

---

## 7. Ordem sugerida de implementação

1. **FaculdadeView**: remover sub-tab `estagio`, hero "diário de estágio", botão "anotar estágio" e imports órfãos.
2. **InternshipDiaryView**: trocar `setTab` por `useState` local (sub-tabs `diario/casos/supervisão` sem empilhar pilha).
3. **HomeView**: remover card `clínica` de "sua formação".
4. Testes: ajustar/acrescentar testes de navegação (sub-tab local) e rodar suite + `tsc` + `check-boundaries`.
5. Atualizar `tasks/todo-clinica.md` e SPEC-M-032 §13 se houver novo desvio.

---

## 8. Perguntas abertas (resolver antes de implementar)

- A seção "sua formação" da Home fica só com o card TCC, ou precisa de substituto para o espaço do card clínica? (decidir tamanho mínimo)
- O `InternshipSection` é importado em algum outro lugar além de `FaculdadeView`? (garantir remoção segura)
- O `calendarDestination.ts` entrada `internship` deve abrir a Clínica ou manter comportamento atual? (já vai para clínica se a base for clínica — confirmar)

---

> Regras do grupo: pt-BR, `caminho:linha` obrigatório, escrever com `write`/`edit`, nunca PowerShell. O plano não implementa nada — só registra causa raiz e escopo. A implementação só começa após confirmação.
