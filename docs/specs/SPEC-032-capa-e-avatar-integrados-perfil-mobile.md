# SPEC-032 · Capa e avatar integrados à tela de perfil (mobile)

> Status: proposta
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §5.4 (Configurações e Perfil)
> Decisões: D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D13, D14, D15, D16, D17, D18
> Espelha: —
> Supersede: SPEC-013 (apenas no que diz respeito à apresentação da capa/avatar; o restante continua válido)
> Depende de: SPEC-013

## Contexto

A tela de perfil do cecistudy mobile mostra hoje a foto de perfil e a imagem de fundo como um "card" flutuante, com a imagem de fundo visualmente distante do restante da tela, avatar com borda desnecessária, botão de remover foto que o usuário não quer, e cards de conquista fora da ordem narrativa. O usuário pediu que **somente** o conjunto capa (imagem de fundo) + avatar (foto de perfil) seja refeito: não como card separado, mas integrado à tela, inline. O componente deve ser construído fora da tela e depois importado para ela. Nenhuma outra seção da tela de perfil é alterada.

## Decisões D1..Dn

**D1 — Componente em arquivo separado, importado na tela.**
- Alternativa rejeitada: manter o código dentro de `ProfileIdentityHeader.tsx`.
- Consequência: maior isolamento e reusabilidade; todos os dados e handlers vêm por props (D17).

**D2 — Imagem de fundo ocupa a largura total da tela (edge-to-edge).**
- Alternativa rejeitada: margem/padding laterais.
- Consequência: a capa encosta nas bordas esquerda e direita; exige cuidado com safe areas em dispositivos nativos.

**D3 — Altura da imagem de fundo: 160 px no mobile.**
- Alternativa rejeitada: 200 px ou 240 px.
- Consequência: mantém a proporção atual da capa.

**D4 — Sem cantos arredondados na imagem de fundo.**
- Alternativa rejeitada: cantos superiores arredondados ou todos os 4 cantos arredondados.
- Consequência: visual reto, sem a "bolha" arredondada que afasta a imagem do restante da tela.

**D5 — Quando não há foto de capa, mostrar gradiente + formas abstratas (fallback visual).**
- Alternativa rejeitada: cor sólida única, espaço vazio.
- Consequência: nunca aparece bloco vazio.

**D6 — Avatar sobreposto na borda inferior da imagem de fundo.**
- Alternativa rejeitada: avatar abaixo da imagem separado, ou dentro da imagem.
- Consequência: integração visual entre foto de perfil e imagem de fundo sem card flutuante.

**D7 — Tamanho do avatar: hero (96 px) no mobile.**
- Alternativa rejeitada: 80 px ou 64 px.
- Consequência: destaque à foto de perfil; tamanho mantido do atual.

**D8 — Avatar sem borda.**
- Alternativa rejeitada: borda colorida da marca ou borda neutra/sutil.
- Consequência: visual limpo, sem anéis ao redor da foto.

**D9 — Clicar na foto de perfil abre o seletor de trocar foto; não existe opção de remover foto.**
- Alternativa rejeitada: incluir botão de remover foto (lixeira) sobre o avatar.
- Consequência: fluxo simplificado; o usuário só troca, não remove diretamente da tela.

**D10 — Botão de editar/escolher foto de capa (lápis) fica no canto superior direito da imagem de fundo.**
- Alternativa rejeitada: canto superior esquerdo, abaixo da imagem, ou não existir.
- Consequência: posição consistente com o padrão já existente no app.

**D11 — Linha de áreas da psicologia mostra abordagem primeiro, depois universidade.**
- Alternativa rejeitada: universidade primeiro, somente uma das duas, ou nenhuma.
- Consequência: ordem de leitura fixa e previsível.

**D12 — Quando não há abordagem nem universidade, mostrar botão "adicione sua abordagem e universidade".**
- Alternativa rejeitada: texto vazio, nada, ou apenas o nome.
- Consequência: convite claro à ação de completar o perfil.

**D13 — "Nível 6 · ..." fica logo abaixo do nome.**
- Alternativa rejeitada: ao lado do nome, ou mais perto das conquistas.
- Consequência: proximidade com o nome, narrativa de identidade agrupada.

**D14 — Conquistas aparecem inline com a capa, somente 4 delas.**
- Alternativa rejeitada: 6 conquistas como hoje, ou conquistas numa seção separada abaixo do header.
- Consequência: faixa de conquistas mais compacta, alinhada à narrativa da capa.

**D15 — Ordem narrativa de cima para baixo: Capa → avatar → nome → meta (abordagem·universidade) → nível/título → conquistas.**
- Alternativa rejeitada: qualquer outra ordem.
- Consequência: leitura linear da identidade, do mais visual para o mais textual.

**D16 — Clicar na imagem de fundo não faz nada.**
- Alternativa rejeitada: abrir seletor de foto de capa, ou abrir a foto em tela cheia.
- Consequência: a imagem de fundo é decorativa; a troca de capa só pelo botão do canto superior direito (D10).

**D17 — Componente puro: recebe todos os dados e handlers via props.**
- Alternativa rejeitada: usar hooks/context internamente.
- Consequência: fácil de testar isoladamente, sem dependência de contexto da tela.

**D18 — Caminho do arquivo: `src/components/views/perfil/ProfileIdentityCover.tsx`.**
- Alternativa rejeitada: novo arquivo com nome diferente.
- Consequência: reusa o componente já criado; é importado por `ProfileIdentityHeader.tsx`.

## Escopo

- Imagem de fundo (capa) integrada à tela, largura total, 160 px, sem cantos arredondados.
- Fallback da capa (gradiente + formas abstratas) quando não há foto.
- Botão editar/escolher capa no canto superior direito.
- Avatar sobreposto na borda inferior da capa, 96 px, sem borda.
- Clique no avatar abre seletor de trocar foto; não existe remoção direta de foto.
- Nome (h1), linha meta (abordagem · universidade), nível/título logo abaixo do nome.
- Até 4 conquistas inline, abaixo do nível/título.
- Componente recebe tudo via props.

## Fora de escopo

- Qualquer outra seção da tela de perfil (preferências, dados, manutenção, histórico).
- Edição de nome/universidade (pertence ao sheet de edição).
- Cards de conquista como componentes tipo "card" separados fora desta faixa.
- Qualquer alteração no desktop ou em outros módulos do mobile.

## Contrato

Props do componente `ProfileIdentityCover`:

| Prop | Tipo | Obrigatória | Descrição |
|---|---|---|---|
| `coverPhotoUrl` | `string` | Não | URL da imagem de fundo/capa |
| `photoUrl` | `string` | Não | URL da foto de perfil |
| `name` | `string` | Sim | Nome de exibição (ou "usuária" se vazio) |
| `initials` | `string` | Sim | Iniciais (ex: "C") |
| `onPickCover` | `() => void` | Sim | Handler do botão de editar/escolher capa |
| `onRemoveCover` | `() => void` | Não | Handler de remover capa (só quando há foto) |
| `onPickPhoto` | `() => void` | Sim | Handler ao clicar na foto de perfil |
| `onRemovePhoto` | `() => void` | Não | Quando fornecido, renderiza botão de remover foto. Não fornecido → não renderiza (D9) |
| `editable` | `boolean` | Não | Quando falso, esconde o botão de editar capa |
| `achievements` | `Sticker[]` | Não | Até 4 conquistas para mostrar inline |
| `onOpenStickers` | `() => void` | Não | Handler ao clicar em uma conquista ou "ver todas" |

O componente não lê contexto nem hooks internos; tudo vem por props.

## Invariantes (testáveis)

1. A imagem de fundo ocupa 100% da largura do container pai (edge-to-edge).
2. A altura da imagem de fundo é 160 px no mobile.
3. A imagem de fundo não tem `border-radius` (cantos retos, sem `rounded-*`).
4. Quando `coverPhotoUrl` está vazio, renderiza gradiente + formas abstratas, nunca bloco vazio.
5. O avatar está sobreposto na borda inferior da imagem de fundo.
6. O avatar tem 96 px (hero) no mobile e não tem borda (sem `border-*`).
7. Clicar na imagem de fundo não invoca nenhum handler (sem `onClick` na camada da imagem).
8. Clicar na foto de perfil invoca `onPickPhoto`.
9. Não existe botão/opção de remover foto de perfil quando `onRemovePhoto` não é fornecido.
10. Quando não há abordagem nem universidade, renderiza o botão "adicione sua abordagem e universidade".
11. No máximo 4 conquistas são renderizadas na faixa inline.

## Casos de borda

- Sem foto de capa: fallback gradiente + formas abstratas.
- Sem foto de perfil: mostra as iniciais (ex: "C") no avatar.
- Sem nome: mostra o convite de onboarding ("como quer ser chamada?").
- Sem abordagem e sem universidade: mostra o botão de adicionar meta.
- Sem conquistas: mostra texto "sem conquistas ainda".
- `editable = false`: não renderiza o botão de editar capa.
- `onRemovePhoto` não fornecido: não renderiza botão de remover foto.

## Critérios de aceite (verificáveis por comando)

1. `npm run lint` passa (typecheck limpo).
2. `npm run test -- src/components/views/perfil/__tests__/ProfileIdentityCover.test.tsx` passa.
3. Teste confirma que a imagem de fundo tem `width: 100%` e `height: 160px`.
4. Teste confirma que o container da capa não tem `border-radius`.
5. Teste confirma que o avatar não tem classes de borda.
6. Teste confirma que, sem `onRemovePhoto`, nenhum botão de remover foto está no DOM.
7. Teste confirma que clicar na foto de perfil chama `onPickPhoto`.
8. Teste confirma que, com 4 conquistas passadas, exatamente 4 itens são renderizados; com 7, somente 4.
9. `node .github/scripts/check-boundaries.mjs` sai com 0.
10. `npm run verify:fast` passa (typecheck + testes + fronteira + contrato + voz).

## Medição

- Componente de apresentação pura; nenhuma métrica de desempenho específica.
- Acessibilidade: `aria-label` no botão de editar capa e no avatar.

## Riscos

- Imagem de fundo edge-to-edge pode colidir com safe areas (notch/home indicator) em dispositivos nativos; validar no build mobile (Capacitor).
- Sem borda no avatar, a foto pode se confundir com a capa se as cores forem similares; o gradiente sobre a imagem (D5) atenua isso.

## Rastreabilidade

spec → decisão (D1..D18) → código (`src/components/views/perfil/ProfileIdentityCover.tsx`, `src/components/views/perfil/ProfileAvatar.tsx`, `src/components/views/perfil/ProfileIdentityHeader.tsx`) → teste (`src/components/views/perfil/__tests__/ProfileIdentityCover.test.tsx`) → gate (`npm run lint` + `npm run test` + `npm run verify:fast`).

---

Regras de escrita em [`../../AGENTS.md`](../../AGENTS.md#regras-de-escrita): pt-BR, zero emoji em `#` e `##`, `caminho:linha` obrigatório, escrita com `write`/`edit`, nunca com PowerShell.
