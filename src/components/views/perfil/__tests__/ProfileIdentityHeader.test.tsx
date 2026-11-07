/**
 * SPEC-013 — o header de identidade apresenta capa, avatar sobreposto, nome
 * (único h1), linha abordagem · universidade, nível · título e até 4
 * conquistas, com botões de capa e avatar.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ProfileIdentityHeader from '../ProfileIdentityHeader';
import type { ProfileIdentityHeaderProps } from '../ProfileIdentityHeader';
import type { ProfileIdentity } from '../../../../lib/profileViewModel';
import type { ProfileAchievements } from '../../../../lib/profileViewModel';
import type { Sticker } from '../../../../types';

const identity = (over: Partial<ProfileIdentity> = {}): ProfileIdentity => ({
  displayName: 'Felipe',
  approach: 'psicanálise',
  university: 'UFBA',
  subtitle: 'psicanálise · UFBA',
  photoUrl: undefined,
  coverPhotoUrl: undefined,
  initials: 'F',
  level: 12,
  title: 'pesquisadora cuidadosa',
  ...over,
});

const achievements = (over: Partial<ProfileAchievements> = {}): ProfileAchievements => ({
  level: 12,
  title: 'pesquisadora cuidadosa',
  unlocked: 4,
  total: 10,
  visible: [
    { id: 's1', name: 'primeira leitura', emoji: '📖', description: '', unlocked: true, category: 'leituras' },
    { id: 's2', name: 'primeira tarefa', emoji: '🎯', description: '', unlocked: true, category: 'estudo' },
    { id: 's3', name: 'análise de autor', emoji: '✨', description: '', unlocked: true, category: 'faculdade' },
    { id: 's4', name: 'primeira missão', emoji: '🌷', description: '', unlocked: false, category: 'jornada' },
    { id: 's5', name: 'grade montada', emoji: '🗓️', description: '', unlocked: false, category: 'faculdade' },
    { id: 's6', name: 'caderno caprichado', emoji: '✍️', description: '', unlocked: true, category: 'leituras' },
  ],
  streak: { current: 3, longest: 7, total: 20, alive: true },
  ...over,
});

const renderHeader = (over: Partial<ProfileIdentityHeaderProps> = {}) => {
  const utils = render(
    <ProfileIdentityHeader
      identity={over.identity ?? identity()}
      achievements={over.achievements ?? achievements()}
      onEdit={over.onEdit ?? vi.fn()}
      onPickPhoto={over.onPickPhoto ?? vi.fn()}
      onPickCover={over.onPickCover ?? vi.fn()}
      onRemoveCover={over.onRemoveCover ?? vi.fn()}
      onOpenStickers={over.onOpenStickers ?? vi.fn()}
    />,
  );
  return utils;
};

describe('ProfileIdentityHeader', () => {
  it('renderiza a capa com fallback visual quando não há foto', () => {
    renderHeader();
    // Fallback: gradiente + formas abstratas, nunca bloco vazio.
    expect(screen.getByTestId('perfil-capa')).toBeTruthy();
  });

  it('renderiza a capa com a foto quando coverPhotoUrl está definido', () => {
    renderHeader({ identity: identity({ coverPhotoUrl: 'data:image/png;base64,AAAA' }) });
    const capa = screen.getByTestId('perfil-capa');
    expect(capa).toHaveStyle('background-image: url("data:image/png;base64,AAAA")');
  });

  it('exibe o botão de editar capa sobre a imagem', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: 'escolher foto de capa' })).toBeTruthy();
  });

  it('exibe o botão de remover capa quando há foto', () => {
    renderHeader({ identity: identity({ coverPhotoUrl: 'data:image/png;base64,AAAA' }) });
    expect(screen.getByRole('button', { name: 'remover foto de capa' })).toBeTruthy();
  });

  it('o avatar é sobreposto (hero, círculo) com iniciais quando não há foto', () => {
    renderHeader();
    // As iniciais aparecem dentro do quadro do avatar hero (w-24, círculo).
    expect(screen.getByText('F')).toBeTruthy();
    expect(screen.getByTestId('perfil-capa')).toBeTruthy();
    // O botão de câmera do avatar está presente.
    expect(screen.getByRole('button', { name: 'trocar foto de perfil' })).toBeTruthy();
  });

  it('o nome é o único h1 e mostra o convite quando vazio', () => {
    renderHeader();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Felipe');

    cleanup();
    renderHeader({ identity: identity({ displayName: '   ' }) });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('como quer ser chamada?');
  });

  it('a linha mostra abordagem · universidade quando ambos existem', () => {
    renderHeader();
    expect(screen.getByText('psicanálise')).toBeTruthy();
    expect(screen.getByText('UFBA')).toBeTruthy();
    // O separador "·" aparece entre os dois spans.
    expect(screen.getByText('·', { selector: 'span[aria-hidden="true"]' })).toBeTruthy();
  });

  it('a linha mostra só um campo quando o outro falta', () => {
    renderHeader({ identity: identity({ approach: '', university: 'UFBA' }) });
    expect(screen.getByText('UFBA')).toBeTruthy();
    // Não há separador "·" na linha de meta quando só um campo existe.
    expect(screen.queryByText('·', { selector: 'span[aria-hidden="true"]' })).toBeNull();

    renderHeader({ identity: identity({ approach: 'psicanálise', university: '' }) });
    expect(screen.getByText('psicanálise')).toBeTruthy();
  });

  it('a linha convida ao preenchimento quando nenhum campo existe', () => {
    renderHeader({ identity: identity({ approach: '', university: '' }) });
    expect(screen.getByRole('button', { name: /adicione sua abordagem e universidade/ })).toBeTruthy();
  });

  it('mostra nível e título próximos ao nome', () => {
    renderHeader();
    expect(screen.getByText(/nível 12 · pesquisadora cuidadosa/)).toBeTruthy();
  });

  it('renderiza até 4 conquistas na faixa compacta', () => {
    renderHeader();
    // Os 4 primeiros da lista aparecem: 3 desbloqueados mostram o nome,
    // 1 bloqueado (primeira missão) mostra apenas "bloqueado".
    expect(screen.getByText('primeira leitura')).toBeTruthy();
    expect(screen.getByText('primeira tarefa')).toBeTruthy();
    expect(screen.getByText('análise de autor')).toBeTruthy();
    expect(screen.queryByText('primeira missão')).toBeNull();
    const bloqueados = screen.getAllByText('bloqueado');
    expect(bloqueados.length).toBe(1);
    // Os demais (grade montada, caderno caprichado) não aparecem.
    expect(screen.queryByText('grade montada')).toBeNull();
    expect(screen.queryByText('caderno caprichado')).toBeNull();
  });

  it('sticker bloqueado mostra apenas "bloqueado", sem emoji', () => {
    renderHeader();
    // 🗓️ é do sticker "grade montada" (bloqueado, 5º na lista): não aparece.
    expect(screen.queryByText('🗓️')).toBeNull();
    // ✍️ é do sticker "caderno caprichado" (desbloqueado, 6º na lista): não aparece com 4 visíveis.
    expect(screen.queryByText('✍️')).toBeNull();
  });

  it('o botão editar perfil está presente', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: 'editar perfil' })).toBeTruthy();
  });

  it('abrir o sheet de edição chama onEdit', () => {
    const onEdit = vi.fn();
    renderHeader({ onEdit });
    fireEvent.click(screen.getByRole('button', { name: 'editar perfil' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
