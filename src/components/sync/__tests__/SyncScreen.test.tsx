// Testes das telas de sincronização (hero + opções local/remoto + ações reais).
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach } from 'vitest';

const mobileAppMock = {
  closeSyncScreen: vi.fn(),
  openSyncLocalScreen: vi.fn(),
  openSyncRemoteScreen: vi.fn(),
  closeSyncLocalScreen: vi.fn(),
  closeSyncRemoteScreen: vi.fn(),
  exportData: vi.fn(),
  importData: vi.fn(),
  configureGithubSync: vi.fn(),
  clearGithubSync: vi.fn(),
  githubSyncConfig: null,
  syncStatus: 'idle',
};

vi.mock('@/context/mobileApp', () => ({
  useMobileApp: vi.fn(() => mobileAppMock),
}));

// Mock do fetch para garantir que ensureSyncRepository não tente rede real nos testes
globalThis.fetch = vi.fn(async (url: string, opts?: any) => {
  const isPost = opts?.method === 'POST';
  if (url.includes('/user/repos') && isPost) {
    return {
      ok: true,
      json: async () => ({ owner: { login: 'usuario' }, name: 'cecistudy-sync' }),
    } as Response;
  }
  if (url.includes('/user/repos')) {
    return {
      ok: true,
      json: async () => [],
    } as Response;
  }
  return { ok: false, status: 404 } as Response;
}) as any;

import SyncScreen from '../SyncScreen';
import { SyncLocalInstructions } from '../SyncLocalInstructions';
import { SyncRemoteInstructions } from '../SyncRemoteInstructions';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mobileAppMock.githubSyncConfig = null;
  mobileAppMock.syncStatus = 'idle';
});

describe('SyncScreen — tela de escolha (hero + 2 caminhos)', () => {
  it('renderiza hero card e duas opções (local e remoto)', () => {
    render(<SyncScreen />);
    expect(screen.getByTestId('sync-hero')).toBeTruthy();
    expect(screen.getByText('backup local')).toBeTruthy();
    expect(screen.getByText('sync remoto (GitHub)')).toBeTruthy();
  });

  it('clicar em local chama openSyncLocalScreen', () => {
    render(<SyncScreen />);
    fireEvent.click(screen.getByText('backup local'));
    expect(mobileAppMock.openSyncLocalScreen).toHaveBeenCalledTimes(1);
  });

  it('clicar em remoto chama openSyncRemoteScreen', () => {
    render(<SyncScreen />);
    fireEvent.click(screen.getByText('sync remoto (GitHub)'));
    expect(mobileAppMock.openSyncRemoteScreen).toHaveBeenCalledTimes(1);
  });
});

describe('SyncLocalInstructions — backup local (exportar/importar)', () => {
  it('renderiza hero card e botões de exportar/importar', () => {
    render(<SyncLocalInstructions />);
    expect(screen.getByTestId('sync-local-hero')).toBeTruthy();
    expect(screen.getByText('arquivo que você controla')).toBeTruthy();
    expect(screen.getByText('exportar backup ♡')).toBeTruthy();
    expect(screen.getByText('importar backup ♡')).toBeTruthy();
  });

  it('clicar em exportar abre o modal e confirmar chama exportData', () => {
    render(<SyncLocalInstructions />);
    fireEvent.click(screen.getByText('exportar backup ♡'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'exportar' }));
    expect(mobileAppMock.exportData).toHaveBeenCalledTimes(1);
  });

  it('clicar em importar não causa erro', () => {
    render(<SyncLocalInstructions />);
    fireEvent.click(screen.getByText('importar backup ♡'));
  });
});

describe('SyncRemoteInstructions — sync remoto (GitHub)', () => {
  it('renderiza hero card e botão de configurar quando não há config', () => {
    render(<SyncRemoteInstructions />);
    expect(screen.getByTestId('sync-remote-hero')).toBeTruthy();
    expect(screen.getByText('seu repositório privado no GitHub')).toBeTruthy();
    expect(screen.getByText('configurar GitHub ♡')).toBeTruthy();
  });

  it('modal de configurar aparece após clicar em configurar GitHub', () => {
    render(<SyncRemoteInstructions />);
    fireEvent.click(screen.getByText('configurar GitHub ♡'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('configurar backup em nuvem')).toBeTruthy();
  });

  it('salvar token no modal chama configureGithubSync', async () => {
    render(<SyncRemoteInstructions />);
    fireEvent.click(screen.getByText('configurar GitHub ♡'));
    const input = screen.getByPlaceholderText('cole seu PAT do GitHub');
    fireEvent.change(input, { target: { value: 'ghp_token123' } });
    fireEvent.click(screen.getByRole('button', { name: 'ativar sync' }));
    await waitFor(() => {
      expect(mobileAppMock.configureGithubSync).toHaveBeenCalledTimes(1);
    });
  });

  it('mostra botão de desativar quando já tem config', () => {
    mobileAppMock.githubSyncConfig = {
      owner: 'usuario',
      repo: 'cecistudy-sync',
      token: 'abc123',
    };
    render(<SyncRemoteInstructions />);
    expect(screen.getByText('sincronização ativa')).toBeTruthy();
    expect(screen.getByText('usuario/cecistudy-sync')).toBeTruthy();
    expect(screen.getByText('desativar sync')).toBeTruthy();
    mobileAppMock.githubSyncConfig = null;
  });
});
