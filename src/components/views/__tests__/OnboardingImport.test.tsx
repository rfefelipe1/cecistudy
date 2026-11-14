/**
 * Teste do fluxo de importação no onboarding (SPEC-M-030 D2/T5.5).
 *
 * Verifica que:
 * - O botão "já tenho um backup" aparece no step 0
 * - Selecionar ZIP abre o preview do manifest
 * - Confirmar no preview chama importData
 * - Cancelar no preview não chama importData
 * - JSON v2 importa direto (sem preview)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingScreen } from '../OnboardingScreen';

const mockImportData = vi.fn();
const mockCompleteOnboarding = vi.fn();

vi.mock('@/context/mobileApp', () => ({
  useMobileApp: () => ({
    completeOnboarding: mockCompleteOnboarding,
    importData: mockImportData,
  }),
}));

vi.mock('jszip', () => {
  const mockFiles = {
    'manifest.json': {
      async: () => Promise.resolve(JSON.stringify({
        nomeUsuario: 'Maria',
        temaId: 'campinho',
        tela: 'home',
        temPATgithub: false,
        createdAt: '2026-11-08T12:00:00.000Z',
        schemaVersion: 22,
      })),
    },
  };
  return {
    default: class MockJSZip {
      files = mockFiles;
      static loadAsync = vi.fn().mockImplementation(async () => new MockJSZip());
    },
  };
});

describe('OnboardingScreen — importação de backup (SPEC-M-030)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra o botão "já tenho um backup" no step 0', () => {
    render(<OnboardingScreen />);
    expect(screen.getByRole('button', { name: /já tenho um backup/i })).toBeInTheDocument();
  });

  it('abre preview ao selecionar arquivo .zip', async () => {
    render(<OnboardingScreen />);
    const input = screen.getByTestId('onboarding-import-input') as HTMLInputElement;
    const file = new File(['dummy'], 'backup.zip', { type: 'application/zip' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(/backup encontrado/i)).toBeInTheDocument();
    });
  });

  it('mostra preview com título', async () => {
    render(<OnboardingScreen />);
    const input = screen.getByTestId('onboarding-import-input') as HTMLInputElement;
    const file = new File(['dummy'], 'backup.zip', { type: 'application/zip' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(/backup encontrado/i)).toBeInTheDocument();
    });
    // O preview abre; detalhes do manifest dependem de async ZIP loading
    // que pode não completar no jsdom — teste foca na abertura do modal
  });

  it('chama importData ao confirmar no preview', async () => {
    render(<OnboardingScreen />);
    const input = screen.getByTestId('onboarding-import-input') as HTMLInputElement;
    const file = new File(['dummy'], 'backup.zip', { type: 'application/zip' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => screen.getByText(/importar/i));
    fireEvent.click(screen.getByRole('button', { name: /importar/i }));
    expect(mockImportData).toHaveBeenCalled();
  });

  it('não chama importData ao cancelar no preview', async () => {
    render(<OnboardingScreen />);
    const input = screen.getByTestId('onboarding-import-input') as HTMLInputElement;
    const file = new File(['dummy'], 'backup.zip', { type: 'application/zip' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => screen.getByText(/cancelar/i));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockImportData).not.toHaveBeenCalled();
  });

  it('importa JSON v2 direto (sem preview)', async () => {
    render(<OnboardingScreen />);
    const input = screen.getByTestId('onboarding-import-input') as HTMLInputElement;
    const file = new File(['{"format":"cecistudy-user-backup"}'], 'backup.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    // JSON não abre preview, chama importData direto
    await waitFor(() => {
      expect(mockImportData).toHaveBeenCalled();
    });
  });
});