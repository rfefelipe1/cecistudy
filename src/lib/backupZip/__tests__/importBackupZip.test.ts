import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { importBackupZip } from '../importBackupZip';
import { writeBackupZip } from '../zipWriter';
import { type BackupManifest } from '../manifest';

const manifest: BackupManifest = {
  schemaVersion: 22,
  protocolVersion: 1,
  appVersion: '1.0.0',
  revision: 3,
  deviceId: 'dev-1',
  workspaceScope: 'default',
  parentRevision: null,
  contentHash: 'abc12345',
  createdAt: '2026-11-08T12:00:00.000Z',
  tela: 'home',
  temPATgithub: false,
  nomeUsuario: 'Fê',
  temaId: 'rosa-claro',
};

const profile = {
  name: 'Fê',
  semester: 6,
  totalSemesters: 10,
  university: 'UFRJ',
  targetCareer: 'clínica',
  dailyQuote: 'leveza',
  stickersCollected: 0,
  photoUrl: '',
};

const course = {
  id: 'c1',
  name: 'Psicopatologia I',
  professor: 'Ana',
  semester: '6º',
  schedule: [],
  color: '#fff',
  icon: 'book',
  status: 'ativo',
};

const classNote = {
  id: 'cl1',
  courseId: 'c1',
  title: 'Aula 1',
  number: 1,
  date: '2026-11-01',
  summary: 'resumo',
};

async function buildZip(
  files: Record<string, string>,
  manifestOverride: Partial<BackupManifest> | null = manifest,
): Promise<Uint8Array> {
  const zip = new JSZip();
  if (manifestOverride) zip.file('manifest.json', JSON.stringify(manifestOverride));
  for (const [path, content] of Object.entries(files)) zip.file(path, content);
  return zip.generateAsync({ type: 'uint8array' });
}

const minimumFiles = {
  'themes.json': JSON.stringify({ temaId: 'campinho' }),
  'profile/profile.json': JSON.stringify(profile),
  'courses/courses.json': JSON.stringify([course]),
};

describe('importBackupZip — mínimo + on-demand', () => {
  it('aplica o mínimo antes da home e carrega o resto por domínio', async () => {
    const bytes = await buildZip({
      ...minimumFiles,
      'classes/classes.json': JSON.stringify([classNote]),
    });
    const applied: any[] = [];
    const onDomainLoaded = vi.fn();

    const result = await importBackupZip(bytes, {
      apply: (db) => applied.push(db),
      applyTheme: vi.fn(),
      onDomainLoaded,
    });

    expect(result.ok).toBe(true);
    // mínimo já traz perfil e disciplinas
    expect(applied[0].profile.name).toBe('Fê');
    expect(applied[0].courses).toHaveLength(1);
    // segunda aplicação acumula as aulas
    expect(applied[1].classes).toHaveLength(1);
    expect(onDomainLoaded).toHaveBeenCalledWith('classes');
  });

  it('aplica o tema do themes.json', async () => {
    const applyTheme = vi.fn();
    await importBackupZip(await buildZip({ ...minimumFiles }), {
      apply: vi.fn(),
      applyTheme,
    });
    expect(applyTheme).toHaveBeenCalledWith('campinho');
  });

  it('faz round-trip export→import sem perder domínio', async () => {
    const looseNote = {
      id: 'n1',
      title: 'nota',
      content: 'texto',
      category: 'reflexão',
      date: '2026-11-01',
    };
    let bytes: Uint8Array = new Uint8Array();
    await writeBackupZip(
      { saveFile: async (_name, data) => ((bytes = data), 'x.zip') },
      manifest,
      { profile, courses: [course], looseNotes: [looseNote] },
      { temaId: 'campinho' },
    );
    const applied: any[] = [];
    const result = await importBackupZip(bytes, { apply: (db) => applied.push(db) });
    expect(result.ok).toBe(true);
    expect(applied.at(-1).looseNotes).toHaveLength(1);
  });

  it('abre a home mesmo com domínio corrompido e avisa o domínio', async () => {
    const bytes = await buildZip({
      ...minimumFiles,
      'notes/looseNotes.json': '{ isso não é json',
      'classes/classes.json': JSON.stringify([classNote]),
    });
    const applied: any[] = [];
    const onDomainError = vi.fn();
    const onDomainLoaded = vi.fn();

    const result = await importBackupZip(bytes, {
      apply: (db) => applied.push(db),
      onDomainError,
      onDomainLoaded,
    });

    expect(result.ok).toBe(true);
    expect(onDomainError).toHaveBeenCalledWith('looseNotes');
    expect(onDomainLoaded).toHaveBeenCalledWith('classes');
    // as aulas sobrevivem ao arquivo ruim de anotações
    expect(applied.at(-1).classes).toHaveLength(1);
  });
});

describe('importBackupZip — recusas', () => {
  it('recusa bytes que não são ZIP', async () => {
    const result = await importBackupZip(new Uint8Array([1, 2, 3]), { apply: vi.fn() });
    expect(result).toEqual({ ok: false, reason: 'arquivo' });
  });

  it('recusa ZIP sem manifest', async () => {
    const result = await importBackupZip(
      await buildZip(minimumFiles, null),
      { apply: vi.fn() },
    );
    expect(result).toEqual({ ok: false, reason: 'manifesto' });
  });

  it('recusa backup de versão futura', async () => {
    const result = await importBackupZip(
      await buildZip(minimumFiles, { ...manifest, schemaVersion: 999 }),
      { apply: vi.fn() },
    );
    expect(result).toEqual({ ok: false, reason: 'versao' });
  });

  it('não aplica nada quando o mínimo é inválido', async () => {
    const apply = vi.fn();
    const bytes = await buildZip({
      'profile/profile.json': JSON.stringify({ name: 42 }), // perfil inválido
    });
    const result = await importBackupZip(bytes, { apply });
    expect(result.ok).toBe(false);
    expect(apply).not.toHaveBeenCalled();
  });
});
