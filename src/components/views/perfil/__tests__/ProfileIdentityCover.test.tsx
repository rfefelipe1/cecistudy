/**
 * SPEC-032 — capa e avatar integrados à tela de perfil (mobile).
 *
 * Critérios de aceite: imagem de fundo edge-to-edge (100% / 160 px),
 * sem cantos arredondados, avatar sobreposto sem borda, sem opção de
 * remover foto quando `onRemovePhoto` não é fornecido, clique no avatar
 * abre seletor, no máximo 4 conquistas inline, fallback sem foto.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ProfileIdentityCover from '../ProfileIdentityCover';

type CoverProps = {
  coverPhotoUrl?: string;
  photoUrl?: string;
  name?: string;
  initials?: string;
  onPickCover?: () => void;
  onRemoveCover?: () => void;
  onPickPhoto?: () => void;
  onRemovePhoto?: () => void;
  editable?: boolean;
};

const renderCover = (props: CoverProps = {}) => {
  const utils = render(
    <ProfileIdentityCover
      coverPhotoUrl={props.coverPhotoUrl ?? undefined}
      photoUrl={props.photoUrl ?? undefined}
      name={props.name ?? 'Felipe'}
      initials={props.initials ?? 'F'}
      onPickCover={props.onPickCover ?? vi.fn()}
      onRemoveCover={props.onRemoveCover ?? vi.fn()}
      onPickPhoto={props.onPickPhoto ?? vi.fn()}
      onRemovePhoto={props.onRemovePhoto ?? undefined}
      editable={props.editable ?? true}
    />,
  );
  return utils;
};

describe('ProfileIdentityCover', () => {
  afterEach(() => {
    cleanup();
  });

  it('renderiza imagem de fundo com largura total e altura 160 px', () => {
    renderCover({ coverPhotoUrl: 'https://exemplo.com/capa.jpg' });
    const capa = screen.getByTestId('perfil-capa');
    expect(capa).toHaveClass('w-full');
    expect(capa).toHaveStyle('height: var(--profile-cover-height, 160px)');
    expect(capa).toHaveStyle('background-image: url("https://exemplo.com/capa.jpg")');
  });

  it('imagem de fundo não tem cantos arredondados (sem border-radius)', () => {
    renderCover();
    const capa = screen.getByTestId('perfil-capa');
    expect(capa).not.toHaveClass(/rounded/);
  });

  it('quando não há foto de capa, renderiza gradiente + formas abstratas (não fica vazio)', () => {
    renderCover();
    const capa = screen.getByTestId('perfil-capa');
    expect(capa).toHaveClass(/bg-gradient-to-br/);
    expect(capa).toHaveClass(/from-surface-rose/);
    expect(document.body.innerHTML).toContain('blur-xl');
  });

  it('avatar está sobreposto na borda inferior da capa', () => {
    renderCover();
    const avatarFrame = screen.getByText('F').closest('div') as HTMLElement;
    const avatarContainer = avatarFrame.parentElement?.parentElement as HTMLElement;
    expect(avatarContainer).toHaveClass(/-top-12/);
  });

  it('avatar tem tamanho hero (96 px) e não tem borda', () => {
    renderCover();
    const avatarFrame = screen.getByText('F').closest('div') as HTMLElement;
    expect(avatarFrame).toHaveClass('w-24');
    expect(avatarFrame).toHaveClass('h-24');
    expect(avatarFrame).not.toHaveClass(/border/);
  });

  it('não renderiza botão de remover foto quando onRemovePhoto não é fornecido', () => {
    renderCover({ photoUrl: 'https://exemplo.com/foto.jpg' });
    expect(screen.queryByRole('button', { name: 'remover foto de perfil' })).not.toBeInTheDocument();
  });

  it('renderiza botão de remover foto quando onRemovePhoto é fornecido', () => {
    renderCover({ photoUrl: 'https://exemplo.com/foto.jpg', onRemovePhoto: vi.fn() });
    expect(screen.getByRole('button', { name: 'remover foto de perfil' })).toBeInTheDocument();
  });

  it('clicar na foto de perfil chama onPickPhoto', () => {
    const onPickPhoto = vi.fn();
    renderCover({ photoUrl: 'https://exemplo.com/foto.jpg', onPickPhoto });
    fireEvent.click(screen.getByRole('button', { name: 'trocar foto de perfil' }));
    expect(onPickPhoto).toHaveBeenCalledTimes(1);
  });

  it('clicar na imagem de fundo não faz nada', () => {
    const onPickCover = vi.fn();
    renderCover({ coverPhotoUrl: 'https://exemplo.com/capa.jpg', onPickCover });
    const capa = screen.getByTestId('perfil-capa');
    fireEvent.click(capa);
    expect(onPickCover).not.toHaveBeenCalled();
  });

  it('botão de editar capa fica no canto superior direito da imagem', () => {
    renderCover();
    const botao = screen.getByRole('button', { name: 'escolher foto de capa' });
    expect(botao).toHaveClass(/top-2/);
    expect(botao).toHaveClass(/right-2/);
  });
});
