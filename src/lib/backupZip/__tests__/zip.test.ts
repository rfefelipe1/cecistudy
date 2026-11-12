import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { writeBackupZip } from '../zipWriter';
import { openZip } from '../zipReader';
import type { BackupManifest } from '../manifest';

const manifest: BackupManifest = {
  schemaVersion: 22,
  protocolVersion: 1,
  appVersion: '1.0.0',
  revision: 3,
  deviceId: 'dev-1',
  workspaceScope: 'default',
  parentRevision: 2,
  contentHash: 'abc12345',
  createdAt: '2026-11-08T12:00:00.000Z',
  tela: 'home',
  temPATgithub: true,
  nomeUsuario: 'Fê',
  temaId: 'rosa-claro',
};

const domains = {
  profile: { name: 'Fê', semester: 6 },
  courses: [{ id: 'c1', name: 'Psicopatologia I' }],
  classes: [{ id: 'cl-1', courseId: 'c1', title: 'aula 1' }],
  looseNotes: [{ id: 'n1', title: 'nota' }],
  internshipLogs: [{ id: 'i1', type: 'estagio' }],
};

async function makeZip(): Promise<Uint8Array> {
  let saved: Uint8Array | null = null;
  await writeBackupZip(
    {
      saveFile: async (_fileName, data) => {
        saved = data;
        return 'cecistudy-backup-teste.zip';
      },
    },
    manifest,
    domains,
    { temaId: 'rosa-claro' },
  );
  if (!saved) throw new Error('writer não salvou bytes');
  return saved;
}

describe('zip writer/reader round-trip', () => {
  it('gera um ZIP com manifest, themes e as pastas mapeadas', async () => {
    const bytes = await makeZip();
    const reader = await openZip(bytes);
    expect(reader).not.toBeNull();
    const files = reader!.listFiles();
    expect(files).toContain('manifest.json');
    expect(files).toContain('themes.json');
    expect(files).toContain('profile/profile.json');
    expect(files).toContain('courses/courses.json');
    expect(files).toContain('classes/classes.json');
    expect(files).toContain('notes/looseNotes.json');
    expect(files).toContain('internship/internshipLogs.json');
    reader!.close();
  });

  it('lê o manifest de volta', async () => {
    const reader = await openZip(await makeZip());
    expect(await reader!.readManifest()).toEqual(manifest);
  });

  it('lê um domínio específico', async () => {
    const reader = await openZip(await makeZip());
    const result = await reader!.readDomain<{ name: string }>('profile/profile.json');
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ name: 'Fê', semester: 6 });
  });

  it('devolve erro para domínio ausente sem derrubar a leitura', async () => {
    const reader = await openZip(await makeZip());
    const result = await reader!.readDomain('nao-existe/nao-existe.json');
    expect(result.data).toBeNull();
    expect(result.error).toContain('não encontrado');
  });
});

describe('zip reader — erros', () => {
  it('recusa bytes que não são ZIP', async () => {
    expect(await openZip(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });

  it('aceita ArrayBuffer', async () => {
    const bytes = await makeZip();
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const reader = await openZip(buffer);
    expect(reader).not.toBeNull();
    expect(reader!.listFiles()).toContain('manifest.json');
  });

  it('devolve null quando o manifest tem JSON inválido', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', '{ isso não é json');
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    const reader = await openZip(bytes);
    expect(await reader!.readManifest()).toBeNull();
  });

  it('devolve null quando falta o manifest', async () => {
    const zip = new JSZip();
    zip.file('profile/profile.json', '{}');
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    const reader = await openZip(bytes);
    expect(await reader!.readManifest()).toBeNull();
  });
});
