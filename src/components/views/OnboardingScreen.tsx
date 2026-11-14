import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Heart,
  GraduationCap,
  Camera,
  Trash2,
  FolderOpen,
  Images,
  CalendarDays,
  Bell,
  X,
} from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { DEFAULT_TOTAL_SEMESTERS } from '@/data/schema';
import { cn } from '../../lib/utils';
import { PillGroup } from '../ui/PillGroup';
import { ToggleRow } from '../ui/ToggleRow';
import { Modal } from '../ui/Modal';
import { pickProfilePhoto } from '../../lib/photo';
import { ONBOARDING, frase } from '../../lib/voice';
import {
  checkPermission,
  requestPermission,
  AppPermissionKind,
  AppPermissionState,
} from '../../lib/permissions';
import { isNativePlatform } from '../../lib/storage';

const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const PERMISSION_CARDS: {
  kind: AppPermissionKind;
  title: string;
  description: string;
  Icon: typeof FolderOpen;
}[] = [
  // `SPEC-C-014` D1: a dica de cada permissão vem da voz; o rótulo ("arquivos",
  // "fotos") é camada 2 e fica.
  {
    kind: 'files',
    title: 'arquivos',
    description: frase(ONBOARDING, 'permissaoFiles'),
    Icon: FolderOpen,
  },
  {
    kind: 'photos',
    title: 'fotos e mídias',
    description: frase(ONBOARDING, 'permissaoPhotos'),
    Icon: Images,
  },
  {
    kind: 'calendar',
    title: 'agenda',
    description: frase(ONBOARDING, 'permissaoCalendar'),
    Icon: CalendarDays,
  },
  {
    kind: 'notifications',
    title: 'notificações',
    description: frase(ONBOARDING, 'permissaoNotifications'),
    Icon: Bell,
  },
];

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding, importData } = useMobileApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [semester, setSemester] = useState(1);
  const [totalSemesters, setTotalSemesters] = useState(DEFAULT_TOTAL_SEMESTERS);
  const [university, setUniversity] = useState('');
  const [targetCareer, setTargetCareer] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [previewManifest, setPreviewManifest] = useState<{
    nomeUsuario: string;
    temaId: string;
    tela: string;
    temPATgithub: boolean;
    createdAt: string;
    schemaVersion: number;
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(arrayBuffer);
        const manifestFile = zip.files['manifest.json'];
        if (manifestFile) {
          const text = await manifestFile.async('string');
          const manifest = JSON.parse(text);
          if (manifest && typeof manifest === 'object' && manifest.nomeUsuario) {
            setPreviewManifest({
              nomeUsuario: manifest.nomeUsuario,
              temaId: manifest.temaId,
              tela: manifest.tela,
              temPATgithub: manifest.temPATgithub,
              createdAt: manifest.createdAt,
              schemaVersion: manifest.schemaVersion,
            });
            setPreviewFile(file);
          }
        }
      } catch {
        // Se falhar a leitura do manifest, importa direto sem preview
        importData(file);
      }
    } else {
      // JSON v2: importa direto (o provider já valida)
      importData(file);
    }
    event.target.value = '';
  };

  const confirmImport = () => {
    if (previewFile) {
      importData(previewFile);
      setPreviewManifest(null);
      setPreviewFile(null);
    }
  };

  const canProceedName = name.trim().length > 0;

  const pickPhoto = async () => {
    try {
      const dataUrl = await pickProfilePhoto();
      if (dataUrl) setPhotoUrl(dataUrl);
    } catch {
      // usuário cancelou ou deu erro — mantém a atual
    }
  };

  const finish = () => {
    completeOnboarding({
      name: name.trim(),
      semester,
      totalSemesters,
      university: university.trim(),
      targetCareer: targetCareer.trim() || 'Psicóloga Clínica',
      dailyQuote: 'compreender o ser humano é a forma mais bonita de cuidado.',
      stickersCollected: 0,
      photoUrl: photoUrl || '',
    });
  };

  return (
    <div className="min-h-dvh bg-canvas text-ceci-primary flex flex-col">
      <div className="flex-1 max-w-md sm:max-w-xl w-full mx-auto px-5 pt-8 pb-8 flex flex-col">
        {/* topo da marca */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-9 h-9 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong font-display font-bold text-lg">
            C
          </span>
          <span className="font-display font-bold text-lg text-ceci-primary">
            cecistudy <span className="text-ceci-brand-strong">♡</span>
          </span>
        </div>

        {/* indicador de progresso */}
        {step > 0 && (
          <div className="flex items-center gap-1.5 justify-center mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-[width] duration-300',
                  step >= i ? 'bg-ceci-brand w-5' : 'bg-ceci-border-default w-1.5',
                )}
              />
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center">
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-3xl">
                🌷
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {frase(ONBOARDING, 'boasVindas')}
              </h1>
              <p className="text-sm text-ceci-secondary leading-relaxed max-w-xs mx-auto">
                {frase(ONBOARDING, 'boasVindasDescricao')}
              </p>
              <div className="pt-4 flex flex-col items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary px-7 py-3.5 rounded-full text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {frase(ONBOARDING, 'comecar')} <ArrowRight className="w-4 h-4" />
                </button>
                {/* Restauração no primeiro acesso (SPEC-M-030 D2). */}
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="text-xs text-ceci-secondary underline underline-offset-2 cursor-pointer"
                >
                  {frase(ONBOARDING, 'jaTenhoBackup')}
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".zip,.json"
                  className="sr-only"
                  data-testid="onboarding-import-input"
                  onChange={handleFileSelect}
                />
              </div>
            </motion.div>
          )}

          {/* Preview do manifest do backup ZIP (SPEC-M-030 D2/T5.2). */}
          {previewManifest && (
            <Modal
              open={true}
              onClose={() => setPreviewManifest(null)}
              closeOnBackdrop={false}
            >
              <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong font-display font-bold text-xl">
                    C
                  </span>
                  <span className="font-display font-bold text-xl text-ceci-primary">
                    cecistudy <span className="text-ceci-brand-strong">♡</span>
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-ceci-primary text-center">
                  {frase(ONBOARDING, 'previewTitulo')}
                </h3>
                <p className="text-sm text-ceci-secondary text-center">
                  {frase(ONBOARDING, 'previewDescricao', { nome: previewManifest.nomeUsuario })}
                </p>
                <div className="space-y-2 text-xs border-t border-ceci-border-subtle pt-3">
                  <div className="flex justify-between">
                    <span className="text-ceci-secondary">{frase(ONBOARDING, 'previewNome')}</span>
                    <span className="font-mono text-ceci-primary">{previewManifest.nomeUsuario}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ceci-secondary">{frase(ONBOARDING, 'previewTema')}</span>
                    <span className="font-mono text-ceci-primary">{previewManifest.temaId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ceci-secondary">{frase(ONBOARDING, 'previewTela')}</span>
                    <span className="font-mono text-ceci-primary">{previewManifest.tela}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ceci-secondary">{frase(ONBOARDING, 'previewData')}</span>
                    <span className="font-mono text-ceci-primary">
                      {new Date(previewManifest.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ceci-secondary">{frase(ONBOARDING, 'previewSchema')}</span>
                    <span className="font-mono text-ceci-primary">v{previewManifest.schemaVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ceci-secondary">{frase(ONBOARDING, 'previewSync')}</span>
                    <span className="font-mono text-ceci-primary">
                      {previewManifest.temPATgithub ? frase(ONBOARDING, 'previewSim') : frase(ONBOARDING, 'previewNao')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-ceci-muted text-center">
                  {frase(ONBOARDING, 'previewAviso')}
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewManifest(null);
                      setPreviewFile(null);
                    }}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer"
                  >
                    {frase(ONBOARDING, 'previewCancelar')}
                  </button>
                  <button
                    type="button"
                    onClick={confirmImport}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand cursor-pointer"
                  >
                    {frase(ONBOARDING, 'previewImportar')}
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong">
                  <Heart className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight">
                    {frase(ONBOARDING, 'quemEuChamo')}
                  </h1>
                  <p className="text-xs text-ceci-secondary">
                    {frase(ONBOARDING, 'quemEuChamoDica')}
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="seu nome (ex.: maria)"
                className="w-full bg-surface-default border border-ceci-border-default rounded-2xl px-4 py-3.5 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-ceci-brand shadow-2xs"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 bg-surface-default border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> voltar
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedName}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 text-ceci-on-brand py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                    canProceedName
                      ? 'bg-ceci-brand-strong hover:bg-ceci-brand'
                      : 'bg-ceci-faded cursor-not-allowed',
                  )}
                >
                  continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight">
                    {frase(ONBOARDING, 'suaJornada')}
                  </h1>
                  <p className="text-xs text-ceci-secondary">
                    {frase(ONBOARDING, 'suaJornadaDica')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-ceci-secondary mb-2">
                  {frase(ONBOARDING, 'semestreAtual')}
                </p>
                <PillGroup
                  variant="primary"
                  options={SEMESTER_OPTIONS.map((s) => ({ value: String(s), label: `${s}º` }))}
                  value={String(semester)}
                  onChange={(v) => setSemester(Number(v))}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-ceci-secondary mb-2">
                  {frase(ONBOARDING, 'totalDoCurso')}
                </p>
                <PillGroup
                  variant="academic"
                  options={SEMESTER_OPTIONS.map((s) => ({ value: String(s), label: `${s}º` }))}
                  value={String(totalSemesters)}
                  onChange={(v) => setTotalSemesters(Number(v))}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 bg-surface-default border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight">
                    {frase(ONBOARDING, 'seuContexto')}
                  </h1>
                  <p className="text-xs text-ceci-secondary">
                    {frase(ONBOARDING, 'seuContextoDica')}
                  </p>
                </div>
              </div>

              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="universidade (opcional)"
                className="w-full bg-surface-default border border-ceci-border-default rounded-2xl px-4 py-3.5 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-ceci-brand shadow-2xs"
              />

              <input
                type="text"
                value={targetCareer}
                onChange={(e) => setTargetCareer(e.target.value)}
                placeholder="objetivo profissional (opcional)"
                className="w-full bg-surface-default border border-ceci-border-default rounded-2xl px-4 py-3.5 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-ceci-brand shadow-2xs"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 bg-surface-default border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> voltar
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 flex items-center justify-center gap-2 bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong">
                  <Camera className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight">
                    {frase(ONBOARDING, 'suaFoto')}
                  </h1>
                  <p className="text-xs text-ceci-secondary">{frase(ONBOARDING, 'suaFotoDica')}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-28 h-28 rounded-[32px] bg-surface-rose border-2 border-ceci-border-brand flex items-center justify-center overflow-hidden shadow-2xs">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="sua foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-display font-bold text-5xl text-ceci-primary">
                      {name.trim().charAt(0).toUpperCase() || 'C'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={pickPhoto}
                    className="inline-flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> escolher foto
                  </button>
                  {photoUrl && (
                    <button
                      onClick={() => setPhotoUrl('')}
                      className="inline-flex items-center gap-1.5 bg-surface-default border border-ceci-border-default text-ceci-secondary px-5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> remover
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-ceci-tertiary">{frase(ONBOARDING, 'suaFotoDica')}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 bg-surface-default border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> voltar
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 flex items-center justify-center gap-2 bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && <PermissionsStep onFinish={finish} onBack={() => setStep(4)} />}
        </div>

        <p className="text-center text-[11px] text-ceci-tertiary mt-6">
          {frase(ONBOARDING, 'rodape')}
        </p>
      </div>
    </div>
  );
};

const PermissionsStep: React.FC<{ onFinish: () => void; onBack: () => void }> = ({
  onFinish,
  onBack,
}) => {
  const [states, setStates] = useState<Record<AppPermissionKind, AppPermissionState | 'loading'>>({
    files: 'loading',
    photos: 'loading',
    calendar: 'loading',
    notifications: 'loading',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const entries = await Promise.all(
        PERMISSION_CARDS.map(
          async (card) => [card.kind, await checkPermission(card.kind)] as const,
        ),
      );
      if (!active) return;
      setStates(
        Object.fromEntries(entries) as Record<AppPermissionKind, AppPermissionState | 'loading'>,
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (kind: AppPermissionKind) => {
    if (!isNativePlatform) return;
    setStates((prev) => ({ ...prev, [kind]: 'loading' }));
    const next = await requestPermission(kind);
    setStates((prev) => ({ ...prev, [kind]: next }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong">
          <Bell className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">
            {frase(ONBOARDING, 'permissoesTitulo')}
          </h1>
          <p className="text-xs text-ceci-secondary">{frase(ONBOARDING, 'permissoesDica')}</p>
        </div>
      </div>

      {!isNativePlatform && (
        <p className="text-[11px] text-ceci-tertiary bg-surface-muted border border-ceci-border-default rounded-xl px-3.5 py-2.5 leading-relaxed">
          {frase(ONBOARDING, 'permissoesWeb')}
        </p>
      )}

      <div className="space-y-3">
        {PERMISSION_CARDS.map(({ kind, title, description, Icon }) => {
          const state = states[kind];
          const supported = isNativePlatform;
          const granted = state === 'granted';
          const loading = state === 'loading';
          return (
            <ToggleRow
              key={kind}
              label={title}
              description={description}
              icon={<Icon className="w-4.5 h-4.5" />}
              iconClassName={
                granted
                  ? 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand'
                  : 'bg-surface-muted text-ceci-secondary border border-ceci-border-default'
              }
              checked={granted}
              onChange={() => toggle(kind)}
              disabled={!supported}
              loading={loading}
              extra={
                state === 'denied' ? (
                  <p className="text-[10px] text-status-danger-strong mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" /> {frase(ONBOARDING, 'permissaoNegada')}
                  </p>
                ) : undefined
              }
              className={cn(
                'rounded-2xl p-4 border',
                granted
                  ? 'bg-surface-rose border-ceci-border-brand'
                  : 'bg-surface-default border-ceci-border-default',
              )}
            />
          );
        })}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-surface-default border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> voltar
        </button>
        <button
          onClick={onFinish}
          className="flex-1 flex items-center justify-center gap-2 bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
        >
          montar meu cantinho <Heart className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
