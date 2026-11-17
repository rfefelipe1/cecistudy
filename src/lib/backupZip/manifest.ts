/**
 * Manifesto do backup ZIP (cecistudy-backup-<yyyy-mm-dd>.zip).
 *
 * Combina os campos do SyncManifest existente (packages/sync/src/provider.ts)
 * com campos específicos do backup local. É o primeiro arquivo lido na
 * importação e o último a ser gravado na exportação.
 */

export interface BackupManifest {
  // --- campos do SyncManifest (mantidos para compatibilidade com o sync) ---
  schemaVersion: number;
  protocolVersion: number;
  appVersion: string;
  revision: number;
  deviceId: string;
  workspaceScope: string;
  parentRevision: number | null;
  contentHash: string;
  createdAt: string;

  // --- campos específicos do backup local ZIP ---
  /** Tela de onde o backup foi gerado (ex.: 'home', 'perfil', 'configuracoes'). */
  tela: string;
  /** Indica se o dispositivo tem PAT do GitHub configurado para sync. */
  temPATgithub: boolean;
  /** Nome da usuária, para exibição rápida no preview. */
  nomeUsuario: string;
  /** ID do tema ativo (viaja no backup agora que themePref é dado do usuário). */
  temaId: string;
}

export interface BackupDomainFile {
  /** Caminho relativo dentro da ZIP, ex.: 'courses/courses.json'. */
  path: string;
  /** Nome da coleção (chave do registro COLLECTIONS). */
  collection: string;
}

/** Coleções que compõem o conjunto mínimo (carregado antes de abrir a home). */
export const MINIMUM_DOMAINS: readonly string[] = [
  'profile',
  'courses',
  'themes', // customizações/temas (não é coleção do COLLECTIONS, arquivo à parte)
];

/**
 * Pastas que não seguem a regra `<chave>/<chave>.json`. O mapa é indexado pela
 * **chave do payload** (a mesma de `buildBackupData`), não pelo nome da pasta.
 */
export const DOMAIN_FOLDERS: Record<string, string> = {
  looseNotes: 'notes/looseNotes.json',
  internshipLogs: 'internship/internshipLogs.json',
};

/** Caminho interno do arquivo de um domínio dentro da ZIP. */
export function domainPath(key: string): string {
  return DOMAIN_FOLDERS[key] ?? `${key}/${key}.json`;
}

/** Caminho interno → chave do payload (inverso de `domainPath`). */
export function domainKey(path: string): string {
  for (const [key, folderPath] of Object.entries(DOMAIN_FOLDERS)) {
    if (folderPath === path) return key;
  }
  return path.split('/').pop()?.replace(/\.json$/, '') ?? path;
}

/** Rótulos de camada 2 para os toasts de restauração (não é voz). */
export const DOMAIN_LABELS: Record<string, string> = {
  profile: 'seu perfil',
  courses: 'suas disciplinas',
  classes: 'suas aulas',
  looseNotes: 'suas anotações',
  internshipLogs: 'seu estágio',
  tasks: 'suas tarefas',
  exams: 'suas provas',
  readings: 'suas leituras',
  flashcards: 'seus flashcards',
  decks: 'seus baralhos',
  tcc: 'seu TCC',
  academicTerms: 'seus períodos letivos',
  syncIndex: 'seu histórico de sincronização',
  stickers: 'suas figurinhas',
  authors: 'seus autores',
  concepts: 'seus conceitos',
  materials: 'seus materiais',
  sessions: 'suas sessões de estudo',
  techniques: 'suas técnicas',
  quizSessions: 'seus quizzes',
  readingSessions: 'suas sessões de leitura',
  readingHighlights: 'seus destaques',
  readingBookmarks: 'seus marcadores',
  thesisChapters: 'seus capítulos do TCC',
  thesisReferences: 'suas referências do TCC',
  thesisMeetings: 'suas reuniões do TCC',
  thesisTasks: 'suas pendências do TCC',
  thesisWritingLogs: 'suas sessões de escrita',
};

export function domainLabel(key: string): string {
  return DOMAIN_LABELS[key] ?? key;
}

/** Extensão e nome do arquivo de export. */
export function backupZipFileName(date: string = new Date().toISOString().slice(0, 10)): string {
  return `cecistudy-backup-${date}.zip`;
}

/** Valida campos obrigatórios do manifest. Retorna null se inválido. */
export function validateManifest(raw: unknown): BackupManifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const required: (keyof BackupManifest)[] = [
    'schemaVersion',
    'protocolVersion',
    'appVersion',
    'revision',
    'deviceId',
    'workspaceScope',
    'parentRevision',
    'contentHash',
    'createdAt',
    'tela',
    'temPATgithub',
    'nomeUsuario',
    'temaId',
  ];
  for (const field of required) {
    if (!(field in m)) return null;
  }
  return m as unknown as BackupManifest;
}
