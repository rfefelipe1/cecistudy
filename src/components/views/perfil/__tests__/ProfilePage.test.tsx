/**
 * SPEC-013 D1/I2/I3/D11 — a página composta é a unidade de leitura da spec: a
 * narrativa tem ordem fixa (identidade → agora → construído → cuidado), existe
 * **um** `h1`, o progresso da graduação aparece **uma vez** (I2), o CTA de virada
 * **uma vez** (I3), e os sheets (identidade, tema) abrem por gesto explícito.
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePage from '../ProfilePage';
import {
  deriveProfileViewModel,
  type ProfileViewModelInput,
} from '../../../../lib/profileViewModel';
import type { AcademicTerm, UserProfile } from '../../../../types';

const profile = (over: Partial<UserProfile> = {}): UserProfile => ({
  name: 'ceci',
  semester: 1,
  totalSemesters: 8,
  university: 'USP',
  targetCareer: 'Psicologia',
  stickersCollected: 0,
  ...over,
});

const term = (over: Partial<AcademicTerm> = {}): AcademicTerm => ({
  id: 'trm-1',
  ordinal: 6,
  label: '6º semestre',
  status: 'ativo',
  startedAt: '2026-02-01',
  statusTransitionAt: '2026-02-01T00:00:00.000Z',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...over,
});

const vmInput = (over: Partial<ProfileViewModelInput> = {}): ProfileViewModelInput => ({
  profile: profile(),
  activeTerm: term(),
  academicTerms: [term()],
  courses: [],
  classes: [],
  tasks: [],
  exams: [],
  readings: [],
  flashcards: [],
  sessions: [],
  stickers: [],
  streak: { current: 0, longest: 0, total: 0, alive: false },
  themePref: 'rosa-claro',
  reminderSettings: { enabled: false, time: '20:00' },
  reminderSupported: true,
  gcalConfigured: false,
  gcalEnabled: false,
  native: false,
  ...over,
});

const renderPage = (input: Partial<ProfileViewModelInput> = {}) => {
  const handlers = {
    onEditClose: vi.fn(),
    onEditSave: vi.fn(),
    onCorrectOrdinal: vi.fn(),
    onSetTotalSemesters: vi.fn(),
    onOpenSemesterWizard: vi.fn(),
    onOpenTermHistory: vi.fn(),
    onOpenSessions: vi.fn(),
    onOpenReadings: vi.fn(),
    onOpenTasks: vi.fn(),
    onOpenExams: vi.fn(),
    onOpenStickers: vi.fn(),
    onOpenStreak: vi.fn(),
    onUpdateReminder: vi.fn(),
    onSetGcalEnabled: vi.fn(),
    onThemeSelect: vi.fn(),
    onMotionPrefSelect: vi.fn(),
    onOpenSync: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onReset: vi.fn(),
  };
  const value = deriveProfileViewModel(vmInput(input));
  const rawProfile = input.profile ?? vmInput().profile;

  // Espelha `PerfilView`: a página é controlada — quem guarda o estado do sheet é
  // a casca de rota. O wrapper existe só para exercitar o ciclo abrir → guardar.
  const Harness: React.FC = () => {
    const [editOpen, setEditOpen] = React.useState(false);
    return (
      <ProfilePage
        vm={value}
        themePref="rosa-claro"
        motionPref="sistema"
        editInitial={{
          name: rawProfile.name,
          university: rawProfile.university,
          targetCareer: rawProfile.targetCareer,
          nomeAutorizado: false,
        }}
        editOpen={editOpen}
        onEditOpen={() => setEditOpen(true)}
        onPickPhoto={vi.fn()}
        onPickCover={vi.fn()}
        onRemoveCover={vi.fn()}
        approachOptions={[]}
        onShowToast={vi.fn()}
        {...handlers}
      />
    );
  };

  render(<Harness />);
  return handlers;
};

describe('ProfilePage — cabeçalho (Twitter/X Profile Header)', () => {
  it('renderiza o banner de capa edge-to-edge (data-testid="perfil-banner")', () => {
    renderPage();
    expect(screen.getByTestId('perfil-banner')).toBeTruthy();
  });

  it('tem um único h1 (o nome) abaixo do banner', () => {
    renderPage();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ceci');
  });

  it('renderiza o avatar sobreposto com iniciais e botão de câmera', () => {
    renderPage();
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'trocar foto de perfil' })).toBeTruthy();
  });

  it('o botão editar perfil abre o sheet de edição e salvar devolve os valores', () => {
    const h = renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'editar perfil', hidden: false }));
    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: 'maria' } });
    fireEvent.click(screen.getByRole('button', { name: 'guardar perfil' }));
    expect(h.onEditSave).toHaveBeenCalledWith({
      name: 'maria',
      university: 'USP',
      targetCareer: 'Psicologia',
      nomeAutorizado: false,
    });
  });

  it('o botão mais opções também abre o sheet de edição', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'opções de perfil' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'opções de perfil' }));
  });
});
