import { describe, it, expect } from 'vitest';
import {
  backupZipFileName,
  validateManifest,
  MINIMUM_DOMAINS,
  domainPath,
  domainKey,
  domainLabel,
  type BackupManifest,
} from '../manifest';

function manifest(overrides: Partial<BackupManifest> = {}): BackupManifest {
  return {
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
    ...overrides,
  };
}

describe('backupZipFileName', () => {
  it('usa a data fornecida no nome', () => {
    expect(backupZipFileName('2026-11-08')).toBe('cecistudy-backup-2026-11-08.zip');
  });
});

describe('validateManifest', () => {
  it('aceita um manifest completo', () => {
    expect(validateManifest(manifest())).toEqual(manifest());
  });

  it('rejeita quando falta um campo obrigatório', () => {
    const { temaId: _tema, ...incompleto } = manifest();
    expect(validateManifest(incompleto)).toBeNull();
  });

  it('rejeita valor que não é objeto', () => {
    expect(validateManifest(null)).toBeNull();
    expect(validateManifest('manifest')).toBeNull();
  });
});

describe('domainPath / domainKey', () => {
  it('dá nomes de pasta próprios para anotações e estágio', () => {
    expect(domainPath('looseNotes')).toBe('notes/looseNotes.json');
    expect(domainPath('internshipLogs')).toBe('internship/internshipLogs.json');
  });

  it('usa a chave como pasta no caso padrão', () => {
    expect(domainPath('profile')).toBe('profile/profile.json');
    expect(domainPath('courses')).toBe('courses/courses.json');
    expect(domainKey('courses/courses.json')).toBe('courses');
  });

  it('faz o caminho de volta', () => {
    expect(domainKey(domainPath('looseNotes'))).toBe('looseNotes');
    expect(domainKey(domainPath('internshipLogs'))).toBe('internshipLogs');
  });
});

describe('domainLabel', () => {
  it('traduz os domínios conhecidos e cai na chave no resto', () => {
    expect(domainLabel('classes')).toBe('suas aulas');
    expect(domainLabel('desconhecido')).toBe('desconhecido');
  });
});

describe('MINIMUM_DOMAINS', () => {
  it('inclui profile, courses e themes', () => {
    expect(MINIMUM_DOMAINS).toEqual(['profile', 'courses', 'themes']);
  });
});
