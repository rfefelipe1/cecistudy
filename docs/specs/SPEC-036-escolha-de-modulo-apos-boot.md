# SPEC-036 · Escolha de módulo após o boot

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: proposta
> App afetado: mobile
> Origem: decisão de produto (usuária) — tela de escolha de módulo após o boot; ainda sem seção no `spec-referencial-workspace-academico.md` — **[D]**
> Decisões: D1..D6
> Supersede: —
> Depende de: SPEC-026 (onboarding), SPEC-M-018/SPEC-C-014 (voz), ADR-004, ADR-009
> Espelha: — (spec local do mobile; a cópia de grupo é `SPEC-M-033`)
> Data: 2026-11-12

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite
> verificável por comando, está incompleta. Isso é `ADR-004`.

---

## 1. Contexto

- **Situação.** Depois que o `BootSplash` some, o app joga a usuária direto no
  `MobileAppShell` (onboarding se ainda não completou, senão o shell principal).
  Com o mobile evoluindo para dois grandes módulos dentro do mesmo app
  ("Acadêmico" e "Profissional"), precisa existir uma tela especial, exibida
  logo após o boot, que peça à usuária em qual módulo ela quer entrar.
- **O que a usuária faz hoje.** Não existe escolha: entra direto no app, que é
  hoje só o módulo Acadêmico disfarçado de app único.
- **O que acontece de errado.** Quando o módulo Profissional existir, não haverá
  porta de entrada para ele; e não haverá porta de saída dele de volta para o
  Acadêmico enquanto ele estiver em construção.
- **Como se sabe.** `src/App.tsx:25` renderiza `<BootSplash />` seguido de
  `<MobileAppShell />`, e `MobileAppShell.tsx:258` decide entre
  `<OnboardingScreen />` e o shell com base em `app.onboarding.completed`.
  Não há ponto de decisão de módulo entre a splash e o shell.

## 2. Decisões

### D1 · A escolha de módulo vem antes do onboarding

- **Decisão.** Entre o `BootSplash` e o `MobileAppShell`: após a splash sumir e
  antes de qualquer tela do app (onboarding ou shell). A `MobileAppShell`
  mostra `<ModuleSelectionScreen />` quando `!moduloSelecionado`, antes de
  checar `onboarding.completed`.
- **Justificativa.** O wireframe pede a escolha "após o boot", antes de entrar
  no app. E o Profissional está em construção: fazer a usuária cadastrar antes
  de saber que o módulo desejado não está disponível é fricção desperdiçada.
- **Alternativa rejeitada.** Colocar após o onboarding (boot → onboarding →
  escolha de módulo).
- **Consequência aceita.** Uma usuária nova escolhe o módulo antes de cadastrar;
  se escolher Acadêmico, segue para o onboarding; se escolher Profissional, vê
  a tela de construção.

### D2 · Ordem dos módulos: Acadêmico à esquerda, Profissional à direita

- **Decisão.** Exatamente conforme pedido e wireframe.
- **Justificativa.** A usuária definiu "nesta mesma ordem, da esquerda para a
  direita" e o wireframe `module_selection` lista `academic_option` antes de
  `professional_option`.
- **Alternativa rejeitada.** Profissional à esquerda.
- **Consequência aceita.** Nenhuma; contraria o pedido explícito e o wireframe.

### D3 · Profissional abre tela de "em construção" (sem CTA)

- **Decisão.** Escolher Profissional abre uma tela cheia com aviso de que o
  espaço ainda está em construção e será inaugurado em breve, com uma única ação
  de voltar para escolher outro módulo. Não há botão de "ser avisada quando
  inaugurar".
- **Justificativa.** A usuária pediu especificamente "uma tela que avisa que
  esse espaço do cantinho ainda está em construção e em breve vai ser
  inaugurada", com wireframe próprio de seleção. Sem CTA extra por enquanto,
  conforme o mockup.
- **Alternativa rejeitada.** Desabilitar/bloquear o card Profissional.
- **Consequência aceita.** O usuário não entenderia por que não pode tocar; o
  aviso é mais honesto e dá uma saída clara (voltar e escolher Acadêmico).

### D4 · A escolha é persistida e vence depois de 10 minutos

- **Decisão.** Persistir o módulo escolhido em
  `usePersistentState('moduloSelecionado', null, 'user')`, com valores
  `'academico'` | `'profissional'` | `null`. A escolha vence depois de
  10 minutos: após esse tempo sem interação, `moduloSelecionado` volta a ser
  `null` e a tela de escolha reaparece no próximo boot.
- **Justificativa.** Não perguntar a cada boot (fricção), mas também não travar
  a usuária para sempre numa escolha feita no primeiro acesso. A expiração de
  10 minutos foi solicitada pela usuária.
- **Alternativa rejeitada.** Persistir sem expiração (para sempre).
- **Consequência aceita.** Após 10 minutos, a tela de escolha reaparece; a
  usuária escolhe de novo. Lógica de expiração por timestamp gravado junto com
  o valor.

### D5 · Todo copy vem da voz do cecinho (`src/lib/voice.ts`)

- **Decisão.** Título, subtítulo, rótulos dos cards e aviso de construção são
  chaves do catálogo `MODULO` em `src/lib/voice.ts`; nenhum texto da tela é
  inline no componente (regra 4 do `check-boundaries.mjs`).
- **Justificativa.** É a regra do grupo (SPEC-C-014 D7), e o gate de voz
  reprova frase inline.
- **Alternativa rejeitada.** Frase inline no componente.
- **Consequência aceita.** As chaves de voz entram na contagem de chaves com
  consumidor do teste de voz (`test:voz`).

### D6 · Sem regras de módulo ainda

- **Decisão.** A tela só escolhe e roteia. Nenhuma regra de negócio dos módulos
  Acadêmico ou Profissional é criada neste escopo, conforme pedido ("não entrar
  muito nessa coisa de módulo ainda").
- **Justificativa.** Escopo limitado à tela de escolha e à tela de construção;
  os domínios dos módulos vêm em specs separadas.
- **Alternativa rejeitada.** Começar a implementar domínios dos módulos agora.
- **Consequência aceita.** Nada de conteúdo, navegação interna ou dados dos
  módulos entra nesta spec.

## 3. Escopo

| Item | Tipo |
|---|---|
| Estado `moduloSelecionado` + `setModuloSelecionado` com expiração de 10 min | código |
| Tela `ModuleSelectionScreen` (herói topo 68% + bottom sheet 35% sobreposto) | código |
| Tela `ModuleUnderConstructionScreen` (Profissional, aviso + voltar) | código |
| Gate em `MobileAppShell`: escolha antes de onboarding/shell quando `!moduloSelecionado` | código |
| Chaves de voz do catálogo `MODULO` em `src/lib/voice.ts` | código |
| Teste de comportamento da seleção (ordem dos cards, rótulos de voice, construção, expiração) | gate |

**Nenhuma mudança de schema.** `SCHEMA_VERSION` continua inalterado (`packages/data/src/schema.ts`): escolha de módulo é preferência de UI, não dado de domínio.

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Regras de negócio dos módulos Acadêmico e Profissional | D6; são specs separadas |
| Persistência além de `moduloSelecionado` (tema, lembretes etc.) | já existem, não são desta spec |
| CTA de "ser avisada quando inaugurar" no Profissional | D3; a usuária pediu só aviso + voltar |
| Integração com o desktop | outro app (`cecistudy-desktop`), não entra aqui |
| Animações de transição entre módulos além do fade padrão da shell | fora do escopo da tela de escolha |

## 5. Contrato

Entrada: estado de boot concluído (`BootSplash` em `phase === 'done'`).
Saída: `moduloSelecionado` definido ('academico' | 'profissional'), persistido
com expiração de 10 minutos; roteamento para:
- `academico` → `OnboardingScreen` se `!onboarding.completed`, senão
  `MobileAppShell` principal.
- `profissional` → `ModuleUnderConstructionScreen`.

Chave de persistência: `moduloSelecionado` (Preferences, `'user'`), padrão
`null`, com timestamp de gravação para expiração de 10 minutos. Valor expirado
trata-se como `null` (reapresenta a escolha).

Nada cruza para o outro app (`ADR-009`).

| Artefato | O que é | Onde |
|---|---|---|
| `moduloSelecionado` | `'academico'` | `'profissional'` | `null`, com expiração de 10 min | `src/context/DataClientProvider.tsx` + `src/context/AppContext.tsx` |
| `setModuloSelecionado` | grava valor + timestamp | `src/context/DataClientProvider.tsx` |
| `ModuleSelectionScreen` | tela de escolha dos dois módulos | `src/components/views/ModuleSelectionScreen.tsx` |
| `ModuleUnderConstructionScreen` | tela de aviso de construção | `src/components/views/ModuleUnderConstructionScreen.tsx` |
| Catálogo `MODULO` | chaves de voz da tela | `src/lib/voice.ts` |

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | Enquanto `moduloSelecionado === null` (ou expirado), nenhuma tela do app (onboarding ou shell) é renderizada — só a escolha de módulo | `MobileAppShell.tsx` | `module-selection.test.tsx` ("não mostra app antes de escolher") |
| I2 | Os dois cards aparecem na ordem Acadêmico (esquerda) / Profissional (direita) | `ModuleSelectionScreen.tsx` | `module-selection.test.tsx` ("ordem dos cards") |
| I3 | Escolher Profissional nunca abre o shell principal; abre a tela de construção | `ModuleSelectionScreen.tsx` + `ModuleUnderConstructionScreen.tsx` | `module-selection.test.tsx` ("Profissional abre construção") |
| I4 | A escolha é persistida; em boots subsequentes, com `moduloSelecionado` válido e não expirado, a tela de escolha não reaparece | `DataClientProvider.tsx` | `module-selection.test.tsx` ("persiste a escolha") |
| I5 | Após 10 minutos, `moduloSelecionado` expira e a tela de escolha reaparece | `DataClientProvider.tsx` (timestamp) | `module-selection.test.tsx` ("expira em 10 minutos") |
| I6 | Todo copy vem de `src/lib/voice.ts` (catálogo `MODULO`); nenhum texto da tela é inline | telas novas | `check-boundaries.mjs` (gate de voz) |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Primeira abertura (`moduloSelecionado === null`, `onboarding.completed === false`) | mostra escolha; Acadêmico → onboarding; Profissional → construção |
| Usuária escolhe Profissional, volta, escolhe Acadêmico | `moduloSelecionado` passa a ser 'academico' e segue para o app |
| Reinicialização com `moduloSelecionado === 'academico'` (não expirado) | vai direto para onboarding/shell, sem mostrar escolha |
| `moduloSelecionado` persistido com valor inválido | trata-se como `null` e reapresenta a escolha (defensivo) |
| 10 minutos depois de escolher (sem interação) | a escolha expira; no próximo boot, a tela de escolha reaparece |
| Web (não nativo) | `usePersistentState` grava em `localStorage`; expiração por timestamp funciona igual |

## 8. Critérios de aceite

Medidos nesta árvore de trabalho em 2026-11-12:

- [ ] `npx tsc --noEmit` → zero erro nos arquivos desta spec (árvore pode ter erro pré-existente de outra frente, fora desta spec)
- [ ] `npx vitest run src/components/views/__tests__/module-selection.test.tsx` → todos os testes verdes, incluindo expiração de 10 min com `vi.useFakeTimers()`
- [ ] `node .github/scripts/check-boundaries.mjs` → verde (sem frase inline, sem hex bruto, `packages/*` sem react/capacitor)
- [ ] `npm run test:domain` → verde, sem regressão
- [ ] `rg` por texto inline das telas novas em `src/components/views/ModuleSelectionScreen.tsx` e `ModuleUnderConstructionScreen.tsx` → vazio (todo copy em `voice.ts`)
- [ ] `rg "moduloSelecionado" src/context/DataClientProvider.tsx src/context/AppContext.tsx` → estado e setter presentes
- [ ] `rg "10 * 60 * 1000\|600000\|expira\|expiracao\|expiração" src/context/DataClientProvider.tsx` → lógica de expiração de 10 min presente

> O gate completo só fica verde quando todos os itens acima estiverem verdes.
> Critérios marcados com `[ ]` ainda não foram executados.

## 9. Medição

| Métrica | Como medir | Antes | Depois | Gate |
|---|---|---|---|---|
| Telas mostradas antes do primeiro uso do app | inspeção do fluxo de boot | 0 (vai direto para onboarding/shell) | 1 (tela de escolha) | inspeção no PR |
| Chaves de voz da tela de escolha | `rg "MODULO" src/lib/voice.ts \| wc -l` | 0 | ≥ 5 (título, subtítulo, 2 cards, construção) | critério de aceite |
| Testes de expiração de 10 min | `npx vitest run src/components/views/__tests__/module-selection.test.tsx` | — | ≥ 1 (expiração) | critério de aceite |

## 10. Riscos

| Risco | Mitigação |
|---|---|
| `moduloSelecionado` expirado ou inválido trava o app | trata-se como `null` e reapresenta a escolha (defensivo, não quebra) |
| Usuária escolha Profissional e não entenda por que não entra | aviso claro de construção + ação de voltar para escolher outro módulo |
| Expiração de 10 min pegue a usuária de surpresa | a tela reaparece no próximo boot com as mesmas duas opções; não há perda de dado |
| Teste de tempo flaky | `vi.useFakeTimers()` com avanço explícito de 10 min + 1 ms (timeout 5 s) |

## 11. Rastreabilidade

| Decisão | Código | Teste | Gate |
|---|---|---|---|
| D1 | `src/shells/MobileAppShell.tsx` (gate antes de onboarding) | `module-selection.test.tsx` | `npm run test` |
| D2 | `src/components/views/ModuleSelectionScreen.tsx` (ordem dos cards) | `module-selection.test.tsx` ("ordem dos cards") | `npm run test` |
| D3 | `src/components/views/ModuleUnderConstructionScreen.tsx` | `module-selection.test.tsx` ("Profissional abre construção") | `npm run test` |
| D4 | `src/context/DataClientProvider.tsx` (timestamp + 10 min) | `module-selection.test.tsx` ("expira em 10 minutos") | `npm run test` + `test:domain` |
| D5 | `src/lib/voice.ts` (catálogo `MODULO`) | `voice.test.ts` | `test:voz` |
| D6 | — (nenhum domínio de módulo criado) | — | — |
