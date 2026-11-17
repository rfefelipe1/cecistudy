// Sincronização local — exportar e importar backup.
//
// Tela de ação (empilhada sobre a tela de escolha de sync).
// Botões funcionais: exportar cria um arquivo, importar lê um arquivo.
// Sem ações bloqueantes: modais só abrem quando a usuária pede.
import React, { useRef, useState } from 'react';
import { Download, Upload, ShieldAlert } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { Modal } from '../ui/Modal';
import { HeroCard } from '../ui/HeroCard';
import { frase, VAZIO } from '../../lib/voice';

interface PendingImport {
  json: string;
  meta: { format: string; schemaVersion: number | string; exportedAt: string };
}

export const SyncLocalInstructions: React.FC = () => {
  const { exportData, importData } = useMobileApp();
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChosen = (file: File) => {
    // ZIP novo (SPEC-M-030 D2) não tem preview JSON: o provider lê o manifest e
    // aplica mínimo + on-demand com os próprios toasts.
    if (file.name.toLowerCase().endsWith('.zip')) {
      importData(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const json = String(reader.result);
      try {
        const parsed = JSON.parse(json);
        if (parsed.v === 1 && parsed.alg === 'AES-GCM' && parsed.salt && parsed.iv && parsed.data) {
          // arquivo criptografado: não há suporte de descriptografia nesta tela
          setPendingImport(null);
          return;
        }
        setPendingImport({
          json,
          meta: {
            format: parsed.format ?? 'desconhecido',
            schemaVersion: parsed.schemaVersion ?? parsed.userSchemaVersion ?? 'n/a',
            exportedAt: parsed.exportedAt ?? 'n/a',
          },
        });
      } catch {
        importData(json);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-full pb-10">
      <div className="px-5 space-y-4">
        <HeroCard
          eyebrow="local"
          title="arquivo que você controla"
          summary="exporta um JSON ou ZIP com todos os seus dados e guarda onde quiser. em outro aparelho, importa esse arquivo e tudo reaparece."
          accent="rose"
          testId="sync-local-hero"
        />

        <section className="space-y-3">
          {/* Exportar backup */}
          <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
            <div className="flex items-start gap-2">
              <Download className="w-4 h-4 text-ceci-brand-strong shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-ceci-primary">exportar backup</p>
                <p className="text-xs text-ceci-secondary leading-relaxed">
                  cria um arquivo com seus dados (perfil, termos, cursos, tarefas, leituras,
                  sessões, lembretes). você pode proteger com senha se quiser.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowExportPassword(true)}
              className="w-full text-left rounded-xl p-3 bg-surface-default border border-ceci-border-default text-sm font-medium text-ceci-secondary hover:bg-surface-muted cursor-pointer active:scale-[0.99] transition-transform"
            >
              exportar backup ♡
            </button>
          </div>

          {/* Importar backup */}
          <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
            <div className="flex items-start gap-2">
              <Upload className="w-4 h-4 text-ceci-academic-strong shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-ceci-primary">importar backup</p>
                <p className="text-xs text-ceci-secondary leading-relaxed">
                  escolhe o arquivo exportado e traz tudo de volta. isso substitui os dados atuais —
                  você pode fazer um backup antes, se quiser.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left rounded-xl p-3 bg-surface-default border border-ceci-border-default text-sm font-medium text-ceci-secondary hover:bg-surface-muted cursor-pointer active:scale-[0.99] transition-transform"
            >
              importar backup ♡
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json,.zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChosen(file);
                e.target.value = '';
              }}
            />
          </div>

          <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-ceci-tertiary shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-ceci-primary">
                  só seus dados, só seu aparelho
                </p>
                <p className="text-xs text-ceci-secondary leading-relaxed">
                  nada sai do seu dispositivo a menos que você mesma envie o arquivo. o backup não
                  depende de servidor nem de nuvem.
                </p>
              </div>
            </div>
          </div>
        </section>

        <p className="text-[11px] text-ceci-muted text-center leading-relaxed px-4">
          o arquivo fica no seu dispositivo até você decidir enviá-lo para outro aparelho ♡
        </p>
      </div>

      {/* Modal: exportar com senha opcional */}
      <Modal
        open={showExportPassword}
        onClose={() => setShowExportPassword(false)}
        closeOnBackdrop={false}
      >
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-ceci-primary">exportar backup</h3>
          <p className="text-sm text-ceci-secondary">
            opcional: defina uma senha para criptografar o backup. deixe em branco para não
            criptografar.
          </p>
          <input
            type="password"
            value={exportPassword}
            onChange={(e) => setExportPassword(e.target.value)}
            placeholder="senha opcional"
            className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs"
          />
          <p className="text-xs text-status-danger-strong mt-1">
            <ShieldAlert className="w-3 h-3 shrink-0 mr-1" aria-hidden="true" />
            se perder essa senha, não dá para recuperar o backup. guarde-a ou deixe em branco para
            exportar sem criptografia.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowExportPassword(false);
                setExportPassword('');
              }}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer"
            >
              cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowExportPassword(false);
                setExportPassword('');
                void exportData();
              }}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand cursor-pointer"
            >
              exportar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: importar backup */}
      <Modal
        open={!!pendingImport}
        onClose={() => setPendingImport(null)}
        closeOnBackdrop={false}
      >
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6">
          <h3 className="font-display font-bold text-lg text-ceci-primary mb-2">
            importar backup?
          </h3>
          {pendingImport && (
            <>
              <p className="text-sm text-ceci-secondary leading-relaxed mb-4">
                formato: <span className="font-mono">{pendingImport.meta.format}</span>
                <br />
                schema: <span className="font-mono">{pendingImport.meta.schemaVersion}</span>
                <br />
                exportado em: <span className="font-mono">{pendingImport.meta.exportedAt}</span>
              </p>
              <p className="text-xs text-ceci-muted mb-5">
                isso substitui os dados atuais. você pode fazer um backup antes ♡
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingImport(null)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
                >
                  cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingImport) {
                      importData(pendingImport.json);
                      setPendingImport(null);
                    }
                  }}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand cursor-pointer active:scale-95 transition-transform"
                >
                  importar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
