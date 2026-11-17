# SPEC-028 · Semestres antigos com memórias + correção de tema ao voltar

> Prefixo: `SPEC-` (local do mobile) · Onde vive: `cecistudy/docs/specs/`
> Status: **proposta**
> App afetado: mobile — **só este repositório** (`cecistudy/`). O desktop é outro app e não é tocado (`ADR-002`, `ADR-009`).
> Origem: `spec-referencial-workspace-academico.md` §3.2 (recorte do mobile) + pedido da usuária em 2026-10-28 (duas necessidades em uma spec: memória de semestres antigos + correção de tema ao navegar de volta)
> Decisões: D1..D15
> Supersede: —
> Depende de: SPEC-005 (período letivo), SPEC-007 (navegação por pilha de slide), SPEC-022 (barra contextual), SPEC-M-027 (motion design)
> Espelha: —
> Data: 2026-10-28
> Plano de execução: [`../../tasks/todo-semestres-antigos.md`](../../tasks/todo-semestres-antigos.md)

> Uma spec sem alternativa rejeitada nas decisões, ou sem critério de aceite verificável por comando, está incompleta. Isso é `ADR-004`.

---

## 1. Contexto

### 1.1 Problema A — Semestres antigos sem memória

A usuária já cursou vários semestres que não estão mais no histórico ativo do app, e quer **registrar memórias** deles: coisas marcantes, felizes, engraçadas, assustadoras. Não quer "registros brutos" (planilhas, dados de frequência, notas) — quer **experiências com significado afetivo**, como quem conta uma história.

Hoje o `TermHistoryScreen` lista períodos encerrados, mas clicar num deles não oferece nada além de estatísticas frias. Não existe lugar para guardar "no 4º semestre eu ri muito na aula de X" ou "no 2º semestre passei medo na prova de Y".

### 1.2 Problema B — Flash do tema ao voltar

Quando a usuária toca no botão **"voltar"** do `ContextualBottomBar` (SPEC-022) para sair de uma tela auxiliar e retornar à tela de origem, a tela é remontada com o tema original **"cantinho"** (`rosa-claro`, o default) e **só depois** muda para o tema escolhido pela usuária. O piscar acontece tanto na web quanto no nativo.

A causa: `applyTheme(themePref)` roda num `useEffect` do `DataClientProvider` (linha 727-733), que dispara **depois** do primeiro paint da tela remontada. Entre o desmontar e o efeito aplicar o tema, as CSS vars de `:root` estão nos valores default do boot (`initTheme` em `main.tsx:22`).

---

## 2. Decisões

### D1 · Onde vive a memória de semestre

- **Decisão.** A memória vive **dentro do `TermHistoryScreen`**. Clicar num período encerrado abre as memórias daquele semestre. Se não houver memória nenhuma, a tela oferece o registro da primeira. Se já houver, abre uma lista de memórias daquele semestre com opção de adicionar mais.
- **Justificativa.** A memória só faz sentido ligada a um semestre concreto. O `TermHistoryScreen` já é o lugar onde a usuária olha para trás; é natural que as memórias nasçam ali.
- **Alternativa rejeitada.** Uma tela independente na aba Perfil — rejeitada porque a memória é sobre um período letivo específico, e o Perfil não é o contexto de "semestre X".
- **Consequência aceita.** A navegação é: `perfil → histórico de períodos → semestre → memórias desse semestre`.

### D2 · Uma memória está sempre vinculada a um `AcademicTerm` existente

- **Decisão.** Toda `SemesterMemory` tem `termId` obrigatório, apontando para um `AcademicTerm` já cadastrado (ativo ou encerrado). Não existe memória avulsa.
- **Justificativa.** A usuária pediu explicitamente: "sempre vinculada a um semestre existente". Sem vínculo, a memória fica órfã e não tem onde ser exibida.
- **Alternativa rejeitada.** Memória avulsa sem `termId` — rejeitada porque não teria tela de exibição nem contexto de semestre.
- **Consequência aceita.** Não é possível criar memória para um semestre que não existe no app. Primeiro se cria o semestre (virada de semestre ou 1º período), depois se registra memória.

### D3 · Campos de uma memória

- **Decisão.** Cada `SemesterMemory` guarda:
  - `id` (EntityId)
  - `termId` (referência ao semestre)
  - `title` (título curto, obrigatório)
  - `category` (`feliz` | `engracada` | `assustadora` | `memoravel`)
  - `description` (descrição curta, opcional)
  - `memoryDate` (data em que aconteceu, `YYYY-MM-DD`, opcional)
  - `termDate` (data do semestre a que se refere, `YYYY-MM-DD`, derivada do `AcademicTerm.startedAt`)
  - `createdAt`, `updatedAt` (timestamps)
- **Justificativa.** São os campos que a usuária pediu: título, categoria, descrição, data da memória, data do semestre. Timestamps são infraestrutura.
- **Alternativa rejeitada.** Adicionar foto, local, pessoas — rejeitado porque o usuário pediu "sem registros brutos"; fotos e local são dados de rastreamento, não memória afetiva.
- **Consequência aceita.** Quatro categorias fixas; sem campo livre de categoria.

### D4 · Duas formas de criar memória: wizard inicial + avulsa

- **Decisão.** Existem dois caminhos de criação:
  1. **Wizard inicial ("entrevista do cecinho"):** ao abrir o histórico de períodos pela primeira vez, o cecinho convida a registrar memórias dos semestres já encerrados. São poucas perguntas, uma por categoria, sem obrigatoriedade.
  2. **Criação avulsa:** a qualquer momento, dentro de um semestre no histórico, tocar em "nova memória" abre um formulário curto (título, categoria, descrição, data) que salva uma memória só.
- **Justificativa.** O usuário pediu "ambos": uma entrevista de boas-vindas e a possibilidade de adicionar depois. O wizard não deve ser um interrogatório; deve parecer conversa.
- **Alternativa rejeitada.** Só wizard, só formulário — rejeitado porque o usuário pediu explicitamente os dois.
- **Consequência aceita.** O wizard é opcional (pode pular); a criação avulsa está sempre disponível dentro de cada semestre.

### D5 · Memórias podem ser editadas e excluídas

- **Decisão.** Uma memória salva pode ser editada (todos os campos) e excluída. A exclusão é confirmada com uma frase do cecinho ("isso some daqui e não volta").
- **Justificativa.** O usuário pediu explicitamente: editar e excluir.
- **Alternativa rejeitada.** Imutável depois de salvar — rejeitado pelo usuário.
- **Consequência aceita.** Exclusão não é desfeita; a confirmação é o único freio.

### D6 · Voz do cecinho na entrevista, nunca voz de sistema

- **Decisão.** Todo texto da entrevista e das telas de memória vem de `src/lib/voice.ts`, nas categorias `DICA`, `VAZIO`, `CONFIRMACAO`, `CELEBRACAO`. Nenhuma frase é escrita inline em componente. Erro segue `D5` do `SPEC-C-014` (duas frases).
- **Justificativa.** É a regra do app (`SPEC-C-014` D7, gate de voz regra 4 do `check-boundaries.mjs`). O cecinho conduz, não o sistema.
- **Alternativa rejeitada.** Frases inline em componentes — rejeitada pela regra de voz do app.
- **Consequência aceita.** Cada novo texto de camada 1 precisa de chave em `voice.ts` e consumidor em produção.

### D7 · Nenhuma regra nova em TypeScript no desktop

- **Decisão.** Esta spec é só do mobile. Nenhuma regra de domínio é criada em TypeScript no `cecistudy-desktop`.
- **Justificativa.** `ADR-006`: regra de domínio é em Rust no desktop. O mobile porta a disciplina, não copia código.
- **Alternativa rejeitada.** Criar regra no desktop para depois portar — rejeitado porque o desktop não tem este domínio (semestres com memória afetiva não existem lá).
- **Consequência aceita.** Se o desktop quiser este recurso no futuro, ele decide e reimplementa.

### D8 · Não há bump de `SCHEMA_VERSION` nesta spec (início)

- **Decisão.** O estado de `SemesterMemory` vive primeiro em memória (estado do `DataClientProvider`), persistido via `localStorage`/`SQLite` com `usePersistentState`-like, **sem** novo `SCHEMA_VERSION` e **sem** entrada em `MIGRATIONS`. Se a usuária quiser persistência durável entre reinstalações, um `SCHEMA_VERSION` + `MIGRATIONS` vem depois.
- **Justificativa.** `AGENTS.md`: bump só quando o formato persistido muda. Começar sem bump permite entregar o fluxo de UI e validar com a usuária antes de mexer no schema.
- **Alternativa rejeitada.** Bump de `SCHEMA_VERSION` logo na F1 — rejeitado porque adiciona complexidade de migração antes de saber se o modelo de dados agrada.
- **Consequência aceita.** As memórias somem se a usuária limpar o storage ou reinstalar. Isso é aceito como MVP; a durabilidade vem numa fase posterior (declarada como débito, não bug).

### D9 · Correção do tema: aplicar antes da remontagem da tela

- **Decisão.** O tema do usuário é aplicado **sincronicamente** antes de `setNavigationStack(next)` em `goBack()` (e em qualquer `setStack` que resulte em pop), não num `useEffect` pós-mount. A `SlideScreen` remonta já com as CSS vars do tema escolhido.
- **Justificativa.** O flash acontece porque `applyTheme` roda num efeito após o render. Mover para antes de `setStack` faz as CSS vars estarem corretas no primeiro paint da nova camada.
- **Alternativa rejeitada.** Manter o efeito no `DataClientProvider` e apenas remover a transição — rejeitado porque o efeito ainda roda depois do mount; o flash persiste.
- **Consequência aceita.** `navigationEngine` precisa de acesso ao `themePref` (ou a `applyTheme` é chamada na casca antes de `goBack`). A escolha de onde exatamente fica é de implementação (ver §4).

### D10 · A correção abrange todos os caminhos de "voltar", não só a barra contextual

- **Decisão.** O tema é aplicado antes de qualquer pop de pilha: botão "voltar" do `ContextualBottomBar`, gesto de borda (iOS), back button do Android, e `handleSystemBack`.
- **Justificativa.** O usuário relatou o `ContextualBottomBar`, mas a causa raiz é a mesma para todo pop: a tela remonta e o efeito de tema roda depois. Corrigir só um caminho deixa o bug nos outros.
- **Alternativa rejeitada.** Corrigir só o `onClick` do botão de voltar — rejeitado porque o gesto de borda e o back do Android têm o mesmo problema.
- **Consequência aceita.** A correção é no núcleo de navegação (`navigationEngine.ts`), não no componente da barra.

### D11 · A tela remonta mais rápido: sem re-aplicar tema no efeito

- **Decisão.** Como o tema já está aplicado antes de `setStack`, o `useEffect` do `DataClientProvider` não precisa re-aplicar o tema quando `themePref` não mudou. O efeito se torna um no-op quando o tema já está ativo (guarda por `activeThemeId === theme.id`).
- **Justificativa.** Remover o trabalho redundante do efeito acelera a remontagem. O efeito só aplica quando o tema realmente mudou (picker de tema).
- **Alternativa rejeitada.** Manter o efeito aplicando sempre — rejeitado porque é trabalho desnecessário a cada navegação.
- **Consequência aceita.** O primeiro apply no boot continua via `initTheme`; trocas de tema via picker continuam pelo efeito (com transição).

### D12 · Categorias de memória fixas e traduzidas

- **Decisão.** As quatro categorias são fixas: `feliz`, `engracada`, `assustadora`, `memoravel`. Cada uma tem cor, ícone e rótulo em pt-BR, definidos em um arquivo de config (`src/lib/semesterMemory.ts` ou similar).
- **Justificativa.** Categorias fixas evitam o usuário criar categorias sem sentido e mantêm a interface simples. Cores e ícones dão identidade visual à memória.
- **Alternativa rejeitada.** Categorias criadas pelo usuário — rejeitado porque vira "registro bruto" e complica a interface.
- **Consequência aceita.** Para adicionar uma categoria, é preciso mudar código e, possivelmente, fazer migração de dados.

### D13 · O wizard inicial não é obrigatório nem bloqueante

- **Decisão.** O wizard de entrevista aparece como convite ("que tal guardar uma memória desse semestre?"), não como passo obrigatório. Pular fecha o convite; a criação avulsa continua disponível.
- **Justificativa.** O usuário pediu "nada forçado, pra não ficar chato". Um wizard obrigatório é exatamente o oposto.
- **Alternativa rejeitada.** Wizard obrigatório antes de ver o histórico — rejeitado porque trava o fluxo principal.
- **Consequência aceita.** O convite aparece uma vez (ou até a usuária criar a primeira memória); depois some.

### D14 · Dados de memória não saem do backup/merge por enquanto

- **Decisão.** `SemesterMemory` não entra no contrato de backup/merge (`contracts/backup-v2-spec.md`) nesta fase. Se a usuária quiser sync entre dispositivos depois, entra em uma spec separada.
- **Justificativa.** O contrato de backup é complexo (LWW, tombstone, união de sets). Adicionar uma nova entidade agora aumenta o escopo além do pedido.
- **Alternativa rejeitada.** Incluir no backup desde F1 — rejeitado por escopo.
- **Consequência aceita.** Memórias são locais ao dispositivo. Declarado como débito, não bug.

### D15 · O histórico mostra apenas períodos passados em relação ao ativo

- **Decisão.** O `TermHistoryScreen` exibe apenas períodos com `status === 'encerrado'` e `ordinal` **menor** que o do período ativo (`useActiveTerm`). Semestres futuros (ordinal maior que o ativo) não aparecem — ainda não existem memórias para guardar lá. O período ativo também não aparece (não é "passado"). Se não houver período ativo, mostra todos os encerrados.
- **Justificativa.** A usuária pediu: se está no 5º semestre, deve aparecer o 1º ao 4º para editar memórias, mas não os futuros. O filtro por `ordinal < activeTerm.ordinal` garante isso sem depender de `endedAt` (que pode não estar preenchido em todos os caminhos).
- **Alternativa rejeitada.** Mostrar todos os encerrados independentemente do ordinal — rejeitado porque exibiria semestres futuros que ainda não aconteceram, sem contexto para memória.
- **Consequência aceita.** Quando não há período ativo (usuária nunca abriu um semestre), mostra todos os encerrados como fallback.

---

## 3. Escopo

| Item | Tipo |
|---|---|
| `SemesterMemory` no estado do `DataClientProvider` (memória + `localStorage` via `usePersistentState`-like) | dados |
| Tela de memórias dentro de um semestre (abrir a partir do `TermHistoryScreen`) | UI |
| Criar memória avulsa (formulário curto: título, categoria, descrição, data) | UI + código |
| Editar e excluir memória (com confirmação de voz) | UI + código |
| Wizard inicial de entrevista (opcional, conduzido pelo cecinho) | UI + código |
| Voz do cecinho: chaves em `src/lib/voice.ts` para entrevista, vazio, confirmação, celebração, erro | código |
| Correção do tema: aplicar antes de `setStack` em pop (goBack, gesto, back Android) | código |
| Efeito de tema no `DataClientProvider` vira no-op quando tema já ativo | código |
| Testes: domínio (`SemesterMemory`), UI (tela de memória, wizard), tema (sem flash) | teste |
| Gate de voz: toda chave nova de `voice.ts` tem consumidor | gate |

### Fora de escopo

| Não entra | Motivo |
|---|---|
| `SCHEMA_VERSION` bump e `MIGRATIONS` para `SemesterMemory` | Decidido em D8; vem depois se a usuária quiser durabilidade |
| Backup/merge de `SemesterMemory` | D14 |
| Categorias criadas pelo usuário | D12 |
| Wizard obrigatório | D13 |
| Regra de domínio no desktop (`cecistudy-desktop`) | D7 |
| Memória avulsa sem `termId` | D2 |
| Fotos, local, pessoas na memória | D3 |

---

## 4. Contrato

### 4.1 Forma da entidade

```ts
export type MemoryCategory = 'feliz' | 'engracada' | 'assustadora' | 'memoravel';

export interface SemesterMemory {
  id: EntityId;
  termId: EntityId;
  title: string;
  category: MemoryCategory;
  description?: string;
  memoryDate?: string;   // YYYY-MM-DD — quando aconteceu
  termDate: string;      // YYYY-MM-DD — startedAt do semestre (derivada)
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Navegação

| De | Para | Como |
|---|---|---|
| `TermHistoryScreen` | `SemesterMemoriesScreen` | Clicar num período encerrado (`openSemesterMemories(termId)`) |
| `SemesterMemoriesScreen` | `MemoryWizard` (entrevista) | Botão "registrar primeira memória" (só se não houver memória) |
| `SemesterMemoriesScreen` | `MemoryForm` (criar avulsa) | Botão "+ nova memória" |
| `SemesterMemoriesScreen` (memória item) | `MemoryForm` (editar) | Clicar na memória |
| `MemoryForm` | `SemesterMemoriesScreen` | Salvar / cancelar |
| Qualquer tela auxiliar | tela de origem | Pop de pilha com tema já aplicado (D9, D10) |

### 4.3 Ações do motor de navegação

```ts
openSemesterMemories: (termId: string) => void;
closeSemesterMemories: () => void;
```

Adicionados a `useMobileApp()` / `NavigationValue`. A pilha recebe `{ kind: 'semesterMemories', termId }`.

### 4.4 Voz do cecinho (chaves novas em `voice.ts`)

| Categoria | Chave | Uso |
|---|---|---|
| `DICA` | `memoriaPrimeira` | Convite do wizard inicial |
| `DICA` | `memoriaCategoriaPergunta` | "Qual categoria cabe nessa memória?" |
| `VAZIO` | `semMemoriasAinda` | Sem memória no semestre |
| `CONFIRMACAO` | `excluirMemoria` | "isso some daqui e não volta. tem certeza?" |
| `CELEBRACAO` | `memoriaGuardada` | Memória salva com sucesso |
| `CELEBRACAO` | `memoriaRemovida` | Memória excluída |
| `ERRO` | `memoriaNaoSalva` | Duas frases (o que houve + o que fazer) |

---

## 5. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | Toda `SemesterMemory` tem `termId` apontando para um `AcademicTerm` existente | `packages/domain` (se mover para lá) ou `src/lib/semesterMemory.ts` | `semesterMemory.test.ts` |
| I2 | `category` é uma das quatro fixas | tipo `MemoryCategory` | `semesterMemory.test.ts` |
| I3 | O tema do usuário está aplicado antes de `setNavigationStack` em qualquer pop | `navigationEngine.ts` `goBack` / `setStack` | `themeFlash.test.tsx` |
| I4 | O `useEffect` de tema no `DataClientProvider` não re-aplica quando o tema já está ativo | `DataClientProvider.tsx` | `themeFlash.test.tsx` |
| I5 | O wizard inicial é opcional: pular não bloqueia o histórico | `SemesterMemoriesScreen` | `semesterMemories.test.tsx` |
| I6 | Exclusão requer confirmação (duas frases do cecinho) | `MemoryForm` / ação de excluir | `semesterMemories.test.tsx` |
| I7 | Toda chave nova de `voice.ts` tem consumidor em produção | gate de voz (`check-boundaries.mjs` regra 4) | `npm run verify:fast` |

---

## 6. Casos de borda

| Entrada | Comportamento esperado |
|---|---|
| Clicar em semestre encerrado sem memória | Tela abre vazia com convite para criar a primeira memória |
| Clicar em semestre encerrado com memórias | Lista as memórias daquele semestre, com "+ nova memória" |
| Criar memória com título vazio | Não salva; avisa (voz: campo obrigatório) |
| Criar memória com categoria inválida | Impossível (tipo `MemoryCategory` é fechado) |
| Editar memória e salvar | Atualiza `updatedAt`; volta para a lista |
| Excluir memória com confirmação | Memória some; toast de celebração (`memoriaRemovida`) |
| Voltar do `ContextualBottomBar` | Tela de origem remonta com tema do usuário já aplicado (sem flash) |
| Voltar por gesto de borda (iOS) | Mesmo comportamento: tema já aplicado |
| Voltar por back button (Android) | Mesmo comportamento: tema já aplicado |
| Trocar de tema no picker e navegar | Novo tema aplicado imediatamente, sem flash em pop |

---

## 7. Critérios de aceite

- [ ] `npm run lint` sai com 0
- [ ] `npm run test` sai com 0
- [ ] `node .github/scripts/check-boundaries.mjs` sai com 0
- [ ] `npm run test -- src/lib/__tests__/semesterMemory.test.ts` — domínio puro, sem jsdom
- [ ] `npm run test -- src/components/__tests__/SemesterMemoriesScreen.test.tsx` — lista, criar, editar, excluir
- [ ] `npm run test -- src/components/__tests__/MemoryWizard.test.tsx` — wizard opcional, pular não bloqueia
- [ ] `npm run test -- src/lib/__tests__/themeFlash.test.tsx` — tema aplicado antes de `setStack` em pop; efeito de tema é no-op quando já ativo
- [ ] `rg -n "applyTheme" src/context/navigationEngine.ts` — pelo menos uma chamada síncrona antes de `setNavigationStack` em caminhos de pop
- [ ] `node scripts/inventario-de-copy.mjs` — nenhum texto de camada 1 sem chave em `voice.ts`
- [ ] `npm run verify:fast` — gate completo verde

---

## 8. Medição

| Métrica | Como medir | Gate |
|---|---|---|
| Memórias criadas por semestre | Contar `SemesterMemory` com mesmo `termId` | `npm run test` (domínio) |
| Tela de memória abre sem flash de tema | `themeFlash.test.tsx` | `npm run test` |
| Todas as chaves de voz têm consumidor | inventário de copy | `npm run verify:fast` |
| Nenhum `kind` de navegação sem classificação | gate de cobertura (se novo `kind` for adicionado) | `npm run test` |

---

## 9. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| O usuário não gosta do modelo sem `SCHEMA_VERSION` (memórias somem na reinstalação) | média | média | Adicionar `SCHEMA_VERSION` + `MIGRATIONS` numa fase posterior (D8 declara isso como débito aceito) |
| O wizard parece forçado apesar de opcional | média | baixa | Remover o convite após a primeira criação; deixar só o botão "+" |
| O tema ainda pisca em algum caminho de pop não coberto | baixa | média | Testar todos os 4 caminhos (barra, gesto, back Android, handleSystemBack) |
| `navigationEngine` não tem acesso a `themePref` | baixa | baixa | Passar `themePref` como parâmetro de `useNavigationEngine` ou chamar `applyTheme` na casca (`MobileAppShell`) antes de `goBack` |

---

## 10. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `src/components/views/SemesterMemoriesScreen.tsx` (ou similar) | `semesterMemories.test.tsx` | `npm run test` |
| D2 | `src/lib/semesterMemory.ts` (tipo + validação) | `semesterMemory.test.ts` | `npm run test` |
| D3 | `src/lib/semesterMemory.ts` (interface `SemesterMemory`) | `semesterMemory.test.ts` | `npm run test` |
| D4 | `src/components/wizards/MemoryWizard.tsx` + `MemoryForm.tsx` | `MemoryWizard.test.tsx` | `npm run test` |
| D5 | `MemoryForm.tsx` (editar/excluir) | `semesterMemories.test.tsx` | `npm run test` |
| D6 | `src/lib/voice.ts` (chaves novas) | inventário de copy | `check-boundaries.mjs` regra 4 |
| D7 | — (sem código no desktop) | — | — |
| D8 | `src/context/DataClientProvider.tsx` (estado sem schema) | — | `npm run verify` |
| D9 | `src/context/navigationEngine.ts` (`goBack`, `setStack`) | `themeFlash.test.tsx` | `npm run test` |
| D10 | `src/context/navigationEngine.ts` (todos os caminhos de pop) | `themeFlash.test.tsx` | `npm run test` |
| D11 | `src/context/DataClientProvider.tsx` (efeito de tema) | `themeFlash.test.tsx` | `npm run test` |
| D12 | `src/lib/semesterMemory.ts` (categorias fixas) | `semesterMemory.test.ts` | `npm run test` |
| D13 | `SemesterMemoriesScreen.tsx` (convite opcional) | `semesterMemories.test.tsx` | `npm run test` |
| D14 | — (sem contrato de backup) | — | — |

---

## 11. Fases de execução (resumo; detalhe em `../../tasks/todo-semestres-antigos.md`)

- **F0** — Preparação: criar tasks, baseline de testes, confirmar decisões com a dona.
- **F1** — Domínio: tipo `SemesterMemory`, categorias, validação pura, testes de domínio.
- **F2** — Estado e persistência: `SemesterMemory` no `DataClientProvider`, `localStorage`, ações de criar/editar/excluir.
- **F3** — UI da lista de memórias: tela dentro do semestre, abrir a partir do `TermHistoryScreen`.
- **F4** — Formulário de memória: criar, editar, excluir com confirmação de voz.
- **F5** — Wizard inicial: entrevista opcional conduzida pelo cecinho.
- **F6** — Correção do tema: aplicar antes de `setStack` em pop; efeito no-op quando já ativo.
- **F7** — Testes, gate de voz, copy inventário, `npm run verify` verde.

---

Cada fase fecha com `npm run lint` + `npm run test` + `node .github/scripts/check-boundaries.mjs` verdes. `SCHEMA_VERSION` fica inalterada em todas as fases (D8).