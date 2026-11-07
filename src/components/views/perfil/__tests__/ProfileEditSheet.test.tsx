/**
 * SPEC-013 D5 — o sheet de edição de identidade inclui targetCareer (abordagem)
 * e segue o padrão de estado sujo: guardar só habilita quando algo muda.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileEditSheet from '../ProfileEditSheet';
import type { ProfileEditValues, ProfileEditSheetProps } from '../ProfileEditSheet';
import type { CeciComboboxOption } from '../../../ui/ceci/CeciCombobox';

const approachOptions: CeciComboboxOption[] = [
  { value: 'psicanalise', label: 'psicanálise' },
  { value: 'tcc', label: 'terapia cognitivo-comportamental' },
  { value: 'gestalt', label: 'gestalt-terapia' },
];

const initial = (over: Partial<ProfileEditValues> = {}): ProfileEditValues => ({
  name: 'ceci',
  targetCareer: '',
  university: 'USP',
  nomeAutorizado: false,
  ...over,
});

const renderSheet = (over: Partial<ProfileEditSheetProps> = {}) => {
  const utils = render(
    <ProfileEditSheet
      open={over.open ?? true}
      onClose={over.onClose ?? vi.fn()}
      initial={over.initial ?? initial()}
      onSave={over.onSave ?? vi.fn()}
      approachOptions={over.approachOptions ?? approachOptions}
    />,
  );
  return utils;
};

describe('ProfileEditSheet', () => {
  it('só habilita guardar quando algo mudou e o nome está preenchido', () => {
    const onSave = vi.fn();
    renderSheet({
      initial: { ...initial(), targetCareer: 'psicanalise' },
      onSave,
    });
    const save = screen.getByRole('button', { name: 'guardar perfil' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: 'maria' } });
    expect(save.disabled).toBe(false);

    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith({
      name: 'maria',
      targetCareer: 'psicanalise',
      university: 'USP',
      nomeAutorizado: false,
    });
  });

  it('nome vazio bloqueia o salvar', () => {
    renderSheet();
    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: '   ' } });
    const save = screen.getByRole('button', { name: 'guardar perfil' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.getByText('como quer ser chamada?')).toBeTruthy();
  });

  it('fechar com alterações pendentes pede confirmação antes de descartar', () => {
    const onClose = vi.fn();
    renderSheet({ onClose });
    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: 'maria' } });

    fireEvent.click(screen.getByRole('button', { name: 'cancelar' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/alterações não guardadas/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'descartar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // `SPEC-C-014` D8 — o interruptor do tratamento por nome
  // -------------------------------------------------------------------------
  it('o interruptor do nome começa desligado e a explicação usa o nome digitado', () => {
    renderSheet();
    const toggle = screen.getByRole('switch', { name: 'me chamar pelo nome' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByText(/eu te chamo de ceci/)).toBeTruthy();
  });

  it('ligar o interruptor suja o rascunho e grava a autorização', () => {
    const onSave = vi.fn();
    renderSheet({ onSave });
    fireEvent.click(screen.getByRole('switch', { name: 'me chamar pelo nome' }));
    const save = screen.getByRole('button', { name: 'guardar perfil' }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ nomeAutorizado: true, name: 'ceci' }),
    );
  });

  it('nome vazio nunca salva autorização, mesmo com o interruptor ligado', () => {
    const onSave = vi.fn();
    renderSheet({ onSave });
    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('switch', { name: 'me chamar pelo nome' }));
    const save = screen.getByRole('button', { name: 'guardar perfil' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });

  it('sem alterações, fechar é imediato', () => {
    const onClose = vi.fn();
    renderSheet({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // targetCareer (abordagem) — novo campo
  // -------------------------------------------------------------------------
  it('o combobox de abordagem exibe as opções do catálogo', () => {
    renderSheet();
    fireEvent.click(screen.getByLabelText('como você quer seguir na psicologia?'));
    expect(screen.getByText('psicanálise')).toBeTruthy();
    expect(screen.getByText('terapia cognitivo-comportamental')).toBeTruthy();
    expect(screen.getByText('gestalt-terapia')).toBeTruthy();
  });

  it('selecionar uma abordagem suja o rascunho e a inclui no salvar', () => {
    const onSave = vi.fn();
    renderSheet({ onSave });
    fireEvent.click(screen.getByLabelText('como você quer seguir na psicologia?'));
    fireEvent.click(screen.getByText('psicanálise'));
    const save = screen.getByRole('button', { name: 'guardar perfil' }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ targetCareer: 'psicanalise' }),
    );
  });
});
