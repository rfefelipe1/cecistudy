# Plano de tasks — SPEC-032 (capa e avatar integrados, perfil mobile)

## Contexto
Reescrever a apresentação da capa + avatar da tela de perfil para ficar inline (sem card), sem borda no avatar, sem opção de remover foto direta, imagem de fundo edge-to-edge sem cantos arredondados, e conquistas reduzidas para 4 inline. Código compartilhado entre web e device (mesmo arquivo React/Vite mobile-first via `PerfilView.tsx`).

## Tarefas

| # | Tarefa | Status |
|---|--------|--------|
| T1 | `ProfileAvatar.tsx`: prop `borderless?` (remove borda); `onRemovePhoto?` opcional (botão de remover só se fornecido) | concluída |
| T2 | `ProfileIdentityCover.tsx`: remove `rounded-t-3xl` (cantos retos); avatar com `borderless` | concluída |
| T3 | `ProfileIdentityHeader.tsx`: conquistas de 6 para 4 (VISIBLE = 4) | concluída |
| T4 | `ProfileIdentityCover.test.tsx`: 10 testes dos critérios de aceite | concluída (10/10) |
| T5 | `npm run lint` (typecheck) | concluída (limpo) |
| T6 | `npm run test -- src/components/views/perfil` | concluída (92/92) |
| T7 | `node .github/scripts/check-boundaries.mjs` | concluída (OK) |
| T8 | `npm run verify:fast` | concluída — apenas 3 falhas pré-existentes não relacionadas (CalendarScreen por data do sistema, notifications por fuso horário) |

## Mudanças na cadeia web+device (código compartilhado)
- `PerfilView.tsx`: removido `handleRemovePhoto` e `onRemovePhoto={handleRemovePhoto}` (não existe mais opção de remover foto nem na web nem no device)
- `ProfilePage.tsx`: removido `onRemovePhoto` da interface, do destructuring e da passagem ao `ProfileIdentityHeader`
- `ProfileIdentityHeader.tsx`: removido `onRemovePhoto` da interface, do destructuring e da passagem ao `ProfileIdentityCover`
- `ProfileIdentityCover.tsx`: `onRemovePhoto?` opcional; não renderiza botão de remover quando não fornecido
- `ProfileAvatar.tsx`: `borderless` remove a borda; `onRemovePhoto?` controla o botão de lixeira

## Regras seguidas
- Nunca escrever arquivo pelo shell (PowerShell). Usado `write`/`edit`.
- pt-BR em comentários e copy.
- Zero emoji em títulos de nível 1 e 2.
- Nenhuma dependência nova adicionada.
- Gate: `npm run lint` + `npm run test` após cada mudança de código.
