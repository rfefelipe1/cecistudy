// Sincronização remota — configurar GitHub PAT.
//
// Tela de ação (empilhada sobre a tela de escolha de sync).
// Se já tem config, mostra o repositório e opção de desativar.
// Se não tem, abre modal para informar o token de acesso pessoal.
// Sem ações bloqueantes: modal só abre quando a usuária pede.
import React, { useState } from 'react';
import { Cloud, Key, ShieldAlert, Trash2 } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { Modal } from '../ui/Modal';
import { HeroCard } from '../ui/HeroCard';
import { Button } from '../ui/button';
import { frase, VAZIO } from '../../lib/voice';

export const SyncRemoteInstructions: React.FC = () => {
  const {
    githubSyncConfig,
    configureGithubSync,
    clearGithubSync,
    syncStatus,
  } = useMobileApp();
  const [configuring, setConfiguring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState('');
  const [setupError, setSetupError] = useState<string | null>();

  const statusDescription =
    syncStatus === 'synced'
      ? 'sincronizado ♡'
      : syncStatus === 'upToDate'
        ? 'tudo em dia.'
        : syncStatus === 'error'
          ? 'erro na última sincronização.'
          : syncStatus === 'checking' || syncStatus === 'syncing'
            ? 'sincronizando…'
            : '';

  const handleSaveConfig = async () => {
    if (!token) return;
    setSaving(true);
    setSetupError(null);
    try {
      const { ensureSyncRepository } = await import('../../lib/githubRepoSetup');
      const ensured = await ensureSyncRepository(token, 'cecistudy-sync');
      configureGithubSync({ owner: ensured.owner, repo: ensured.repo, token });
      setSaving(false);
      setSetupError(null);
      setToken('');
    } catch (e) {
      const err = e as { kind?: string; message?: string };
      if (err.kind === 'AUTH') {
        setSetupError('token inválido ou sem permissão para criar repositórios.');
      } else if (err.kind === 'REPO_PUBLIC') {
        setSetupError(err.message ?? 'repositório existente é público.');
      } else if (err.kind === 'NETWORK') {
        setSetupError('não consegui contatar o GitHub. tente novamente.');
      } else {
        setSetupError('não foi possível configurar o repositório de sincronização.');
      }
      setSaving(false);
    }
  };

  const handleCancelConfig = () => {
    setConfiguring(false);
    setSetupError(null);
    setToken('');
  };

  const handleDisable = () => {
    clearGithubSync();
    setSetupError(null);
  };

  return (
    <div className="min-h-full pb-10">
      <div className="px-5 space-y-4">
        <HeroCard
          eyebrow="remoto"
          title="seu repositório privado no GitHub"
          summary="informe seu token de acesso pessoal (PAT) com permissão repo. o app acessa apenas o repositório privado cecistudy-sync e mantém os dois aparelhos iguais."
          accent="blue"
          testId="sync-remote-hero"
        />

        {githubSyncConfig ? (
          <section className="space-y-3">
            <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
              <div className="flex items-start gap-2">
                <Cloud className="w-4 h-4 text-ceci-academic-strong shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-ceci-primary">
                    sincronização ativa
                  </p>
                  <p className="text-xs text-ceci-secondary leading-relaxed">
                    repositório:{' '}
                    <code className="font-mono text-xs">
                      {githubSyncConfig.owner}/{githubSyncConfig.repo}
                    </code>{' '}
                    {statusDescription && ` — ${statusDescription}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfiguring(true)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
                >
                  alterar token
                </button>
                <button
                  type="button"
                  onClick={handleDisable}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-status-danger-strong bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
                >
                  desativar sync
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-ceci-tertiary shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-ceci-primary">
                    sem sobrescrever sem avisar
                  </p>
                  <p className="text-xs text-ceci-secondary leading-relaxed">
                    cada sincronização usa CAS (compare-and-swap): nunca cria repositórios
                    duplicados, nunca sobrescreve sem saber o que está fazendo.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-3">
            <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
              <div className="flex items-start gap-2">
                <Key className="w-4 h-4 text-ceci-brand-strong shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-ceci-primary">
                    configurar sync remoto
                  </p>
                  <p className="text-xs text-ceci-secondary leading-relaxed">
                    gere um PAT no GitHub com escopo
                    <code className="font-mono text-xs">repo</code>. o token fica guardado apenas no
                    seu dispositivo e é usado só para acessar seu repositório privado.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfiguring(true)}
                className="w-full text-left rounded-xl p-3 bg-surface-default border border-ceci-border-default text-sm font-medium text-ceci-secondary hover:bg-surface-muted cursor-pointer active:scale-[0.99] transition-transform"
              >
                configurar GitHub ♡
              </button>
            </div>

            <div className="rounded-2xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-3">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-ceci-tertiary shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-ceci-primary">
                    opcional e privado
                  </p>
                  <p className="text-xs text-ceci-secondary leading-relaxed">
                    o token não é obrigatório. se não quiser nuvem, use o backup local. o app
                    acessa apenas o repositório privado <code className="font-mono text-xs">cecistudy-sync</code>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <p className="text-[11px] text-ceci-muted text-center leading-relaxed px-4">
          o token é opcional — se não quiser nuvem, use o backup local ♡
        </p>
      </div>

      {/* Modal: configurar GitHub PAT */}
      <Modal
        open={configuring && !githubSyncConfig}
        onClose={handleCancelConfig}
        closeOnBackdrop={false}
      >
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-ceci-primary">
            configurar backup em nuvem
          </h3>
          <p className="text-sm text-ceci-secondary">
            informe seu token de acesso pessoal (PAT) do GitHub com permissão
            <code className="font-mono text-xs">repo</code>. o app acessa apenas seu repositório
            privado <code className="font-mono text-xs">cecistudy-sync</code>.
          </p>

          {setupError && (
            <p role="alert" className="text-xs text-status-danger-strong">
              {setupError}
            </p>
          )}

          <div className="space-y-2">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="cole seu PAT do GitHub"
              className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs"
              disabled={configuring}
            />
            <p className="text-xs text-ceci-muted">
              o token é guardado apenas no seu dispositivo (Preferences) e usado somente para
              acessar seu repositório privado.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveConfig}
              disabled={saving || !token}
              className="flex-1"
            >
              {saving ? 'configurando…' : 'ativar sync'}
            </Button>
            <Button variant="outline" onClick={handleCancelConfig} className="flex-1">
              cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: alterar token (quando já tem config) */}
      <Modal
        open={configuring && !!githubSyncConfig}
        onClose={handleCancelConfig}
        closeOnBackdrop={false}
      >
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-ceci-primary">
            alterar token do GitHub
          </h3>
          <p className="text-sm text-ceci-secondary">
            informe um novo token de acesso pessoal (PAT) com permissão
            <code className="font-mono text-xs">repo</code>.
          </p>

          {setupError && (
            <p role="alert" className="text-xs text-status-danger-strong">
              {setupError}
            </p>
          )}

          <div className="space-y-2">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="cole seu novo PAT do GitHub"
              className="w-full px-3 py-2.5 rounded-2xl border border-ceci-border-default text-xs"
              disabled={configuring}
            />
            <p className="text-xs text-ceci-muted">
              o token é guardado apenas no seu dispositivo (Preferences) e usado somente para
              acessar seu repositório privado.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveConfig}
              disabled={saving || !token}
              className="flex-1"
            >
              {saving ? 'configurando…' : 'salvar token'}
            </Button>
            <Button variant="outline" onClick={handleCancelConfig} className="flex-1">
              cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
