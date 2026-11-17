/**
 * Medidor de motion para o perfil "usuário comum" (mobile).
 *
 * Roda sobre o `npm run build` (preview) servido em http://127.0.0.1:4178/,
 * visualizado em um Chrome real lançado com --remote-debugging-port=9222.
 * Conecta via Chrome DevTools Protocol (CDP) puro usando o WebSocket nativo do
 * Node 26 (`globalThis.WebSocket`, callbacks onopen/onmessage/onerror), sem
 * dependência nova.
 *
 * Mede, para cada cenário comum:
 *   - frames renderizados (requestAnimationFrame) e jank (> 50 ms)
 *   - ScriptDuration / LayoutDuration / RecalcStyleDuration / TaskDuration (getMetrics)
 *   - animações ativas no instante do clique (document.getAnimations)
 *   - telas fantasma (elementos inert / aria-hidden presos no DOM)
 *   - erros de console e exceções não tratadas
 *   - screenshots antes/depois (evidência visual)
 *
 * Leitura-only do DOM. Não cria feature. Escreve apenas este script, screenshots
 * e o relatório em dist/artifacts/perf-motion.md.
 *
 * Pré-requisito:
 *   Chrome aberto com --remote-debugging-port=9222 carregando http://127.0.0.1:4178/
 *
 * Uso:
 *   node scripts/motion-report.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const BROWSER_PORT = 9222;
const APP_URL = 'http://127.0.0.1:4178/';
const DIST = path.resolve('dist');
const OUT = path.resolve(DIST, 'artifacts', 'perf-motion.md');
const SHOT_DIR = path.resolve(DIST, 'artifacts', 'shots');

let ws = null;
const callbacks = new Map();
let pendingId = 0;
const consoleErrors = [];
const pageExceptions = [];
let socketReadyResolve = null;
let socketReadyReject = null;
let socketOpen = false;

function httpGetJson(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: BROWSER_PORT, path: p, timeout: 8000 },
      (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject);
  });
}

function openTabCDP() {
  return httpGetJson('/json/list').then((tabs) => {
    const appTab = tabs.find(t => t.url && t.url.startsWith(APP_URL) && t.type === 'page');
    if (!appTab) {
      throw new Error(`Nenhuma tab do app (${APP_URL}) encontrada no Chrome. Tabs: ${tabs.map(t => t.url).join(', ')}`);
    }
    console.log(`Conectando na tab do app: ${appTab.url} (id=${appTab.id})`);
    return new Promise((resolve, reject) => {
      const url = `ws://127.0.0.1:${BROWSER_PORT}/devtools/page/${appTab.id}`;
      console.log('  criando WebSocket:', url);
      ws = new (globalThis.WebSocket)(url);
      socketReadyResolve = resolve;
      socketReadyReject = reject;
      ws.onopen = () => { console.log('  WebSocket aberto'); socketOpen = true; if (socketReadyResolve) socketReadyResolve(); };
      ws.onerror = (e) => { console.log('  WebSocket erro'); if (socketReadyReject) socketReadyReject(new Error('CDP websocket error')); };
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && callbacks.has(msg.id)) {
          const cb = callbacks.get(msg.id); callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(JSON.stringify(msg.error)));
          else cb.resolve(msg.result);
        } else if (msg.method) {
          const params = msg.params || {};
          if (msg.method === 'Runtime.consoleAPICalled') {
            const args = (params.args || []).map((a) => a.value);
            consoleErrors.push({ type: params.type, text: args.join(' ') });
          }
          if (msg.method === 'Runtime.exceptionThrown') {
            pageExceptions.push(params.exceptionDetails);
          }
        }
      };
      ws.onclose = () => { ws = null; };
    });
  });
}

async function enableDomains() {
  await socketReady();
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Page.setLifecycleEventsEnabled', { enabled: true });
}

function socketReady() {
  if (socketOpen) return Promise.resolve();
  return new Promise((res, rej) => { socketReadyResolve = res; socketReadyReject = rej; });
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++pendingId;
    callbacks.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (callbacks.has(id)) { callbacks.delete(id); reject(new Error(`timeout CDP ${method}`)); } }, 30000);
  });
}

function navigate(url) {
  return send('Page.navigate', { url }).then(() => new Promise((r) => setTimeout(r, 1500)));
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Frame sampler: conta quadros via requestAnimationFrame e intervalos.
// Deve ser (re)instalado APÓS cada navegação, pois a página recarrega.
function installFrameSampler() {
  return send('Runtime.evaluate', {
    expression: `
      (() => {
        window.__frames = [];
        let last = performance.now();
        const tick = () => {
          const now = performance.now();
          window.__frames.push({ at: now, delta: now - last });
          last = now;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      })();
    `,
    returnByValue: true,
  });
}

function readFrames() {
  return send('Runtime.evaluate', {
    expression: 'window.__frames ? window.__frames : []',
    returnByValue: true,
  }).then((r) => r.result.value || []);
}

async function snapshotMetrics() {
  const { metrics } = await send('Performance.getMetrics', {});
  const m = {};
  for (const metric of metrics) m[metric.name] = metric.value;
  return m;
}

function metricDiff(a, b) {
  const out = {};
  const keys = ['LayoutCount', 'RecalcStyleCount', 'LayoutDuration', 'RecalcStyleDuration', 'ScriptDuration', 'TaskDuration'];
  for (const k of keys) {
    if (a[k] != null && b[k] != null) out[k] = b[k] - a[k];
  }
  return out;
}

function clickBy(selector) {
  return send('Runtime.evaluate', {
    expression: `
      (async (sel) => {
        const el = document.querySelector(sel);
        if (!el) return { ok: false, reason: 'nao_encontrado', sel };
        el.click();
        return { ok: true, tag: el.tagName, aria: el.getAttribute('aria-label') || '' };
      })(${JSON.stringify(selector)})
    `,
    returnByValue: true,
  }).then((r) => r.result.value);
}

let shotSeq = 0;
async function screenshot(tag) {
  try {
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: false });
    const file = path.join(SHOT_DIR, `shot-${tag}-${++shotSeq}.jpeg`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    return path.basename(file);
  } catch (e) {
    console.log(`  (sem screenshot ${tag}: ${e.message})`);
    return null;
  }
}

function activeAnimations() {
  return send('Runtime.evaluate', {
    expression: `
      (() => {
        const anims = document.getAnimations();
        return anims.map(a => ({
          effect: a.effect ? (a.effect.target?.tagName || '') + (a.effect.target?.className || '') : '',
          playState: a.playState,
          currentTime: a.currentTime,
        }));
      })();
    `,
    returnByValue: true,
  }).then((r) => r.result.value || []);
}

function screenContainerState() {
  return send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.querySelector('main > div.relative.z-10 > div');
        if (!el) return { found: false };
        const cs = getComputedStyle(el);
        return { found: true, opacity: cs.opacity, transform: cs.transform, inert: el.getAttribute('inert'), ariaHidden: el.getAttribute('aria-hidden'), inlineTransform: el.style.transform || '' };
      })();
    `,
    returnByValue: true,
  }).then((r) => r.result.value || {});
}

function inertHiddenCount() {
  return send('Runtime.evaluate', {
    expression: `(() => ({ inert: document.querySelectorAll('main [inert]').length, hidden: document.querySelectorAll('main [aria-hidden="true"]').length }))()`,
    returnByValue: true,
  }).then((r) => r.result.value || {});
}

function analisarFrames(frames) {
  const n = frames.length;
  if (n === 0) return { n: 0, maxDelta: 0, lento: 0, pctLento: 0, jank: 0 };
  const deltas = frames.map((f) => f.delta);
  const maxDelta = Math.max(...deltas);
  const lento = deltas.filter((d) => d > 16.7).length;
  const jank = deltas.filter((d) => d > 50).length;
  return { n, maxDelta: Number(maxDelta.toFixed(1)), lento, pctLento: Number(((lento / n) * 100).toFixed(1)), jank };
}

const results = [];

async function runCenario(nome, desc, fn) {
  console.log(`[${nome}]`);
  try {
    await fn();
  } catch (e) {
    console.log(`  ERRO: ${e.message}`);
    results.push({ cenario: nome, descricao: desc, erro: e.message, frames: { n: 0, maxDelta: 0, lento: 0, pctLento: 0, jank: 0 }, metrics: {}, animacoes: 0 });
  }
}

async function main() {
  await openTabCDP();
  await enableDomains();

  fs.mkdirSync(SHOT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  // ---- Cenário 1: cold start home (vazia) ----
  await runCenario('1/6 cold-start-home', 'Abre o app pela primeira vez (sem dados). Primeiro frame da home.', async () => {
    await navigate(APP_URL);
    await wait(2500);
    await installFrameSampler(); // reinstala após navegação
    await wait(1500); // deixa a splash sumir e a home montar
    const m1a = await snapshotMetrics();
    const f1a = await readFrames();
    const s1 = await screenshot('cold-home');
    const anim1 = await activeAnimations();
    const c1 = await screenContainerState();
    await wait(800);
    const m1b = await snapshotMetrics();
    const f1b = await readFrames();
    results.push({
      cenario: 'cold-start-home',
      descricao: 'Abre o app pela primeira vez (sem dados). Primeiro frame da home.',
      frames: analisarFrames(f1b),
      metrics: metricDiff(m1a, m1b),
      animacoes: anim1.length,
      container: c1,
      screenshot: s1,
    });
  });

  // ---- Cenário 2: troca de abas home -> faculdade ----
  await runCenario('2/6 troca-aba-home-para-faculdade', 'Toque na aba "faculdade" do bottom nav. Esperado: crossfade rápido (tab ~140 ms), sem slide de tela cheia.', async () => {
    await installFrameSampler();
    await wait(800);
    const f2a = await readFrames();
    const m2a = await snapshotMetrics();
    const r2 = await clickBy('[aria-label="faculdade"]');
    await wait(1200);
    const f2b = await readFrames();
    const m2b = await snapshotMetrics();
    const s2 = await screenshot('tab-faculdade');
    const anim2 = await activeAnimations();
    const ih2 = await inertHiddenCount();
    results.push({
      cenario: 'troca-aba-home-para-faculdade',
      descricao: 'Toque na aba "faculdade" do bottom nav. Esperado: crossfade rápido (tab ~140 ms), sem slide de tela cheia.',
      frames: analisarFrames(f2b),
      metrics: metricDiff(m2a, m2b),
      click: r2,
      animacoes: anim2.length,
      inertHidden: ih2,
      screenshot: s2,
    });
  });

  // ---- Cenário 3: troca de abas faculdade -> estudos ----
  await runCenario('3/6 troca-aba-faculdade-para-estudos', 'Toque na aba "estudos". Esperado: crossfade rápido.', async () => {
    const f3a = await readFrames();
    const m3a = await snapshotMetrics();
    const r3 = await clickBy('[aria-label="estudos"]');
    await wait(1200);
    const f3b = await readFrames();
    const m3b = await snapshotMetrics();
    const s3 = await screenshot('tab-estudos');
    const anim3 = await activeAnimations();
    const ih3 = await inertHiddenCount();
    results.push({
      cenario: 'troca-aba-faculdade-para-estudos',
      descricao: 'Toque na aba "estudos". Esperado: crossfade rápido.',
      frames: analisarFrames(f3b),
      metrics: metricDiff(m3a, m3b),
      click: r3,
      animacoes: anim3.length,
      inertHidden: ih3,
      screenshot: s3,
    });
  });

  // ---- Cenário 4: volta para home ----
  await runCenario('4/6 troca-aba-estudos-para-home', 'Toque na aba "home". Esperado: crossfade rápido, volta para a home.', async () => {
    const f4a = await readFrames();
    const m4a = await snapshotMetrics();
    const r4 = await clickBy('[aria-label="home"]');
    await wait(1200);
    const f4b = await readFrames();
    const m4b = await snapshotMetrics();
    const s4 = await screenshot('tab-home');
    const anim4 = await activeAnimations();
    const ih4 = await inertHiddenCount();
    results.push({
      cenario: 'troca-aba-estudos-para-home',
      descricao: 'Toque na aba "home". Esperado: crossfade rápido, volta para a home.',
      frames: analisarFrames(f4b),
      metrics: metricDiff(m4a, m4b),
      click: r4,
      animacoes: anim4.length,
      inertHidden: ih4,
      screenshot: s4,
    });
  });

  // ---- Cenário 5: troca rápida de abas (estresse) ----
  await runCenario('5/6 troca-rapida-abas', 'Toque em "faculdade" e "estudos" em menos de 300 ms. Esperado: nenhuma tela fantasma.', async () => {
    const f5a = await readFrames();
    const m5a = await snapshotMetrics();
    await clickBy('[aria-label="faculdade"]');
    await wait(80);
    await clickBy('[aria-label="estudos"]');
    await wait(1400);
    const f5b = await readFrames();
    const m5b = await snapshotMetrics();
    const s5 = await screenshot('troca-rapida');
    const anim5 = await activeAnimations();
    const ih5 = await inertHiddenCount();
    results.push({
      cenario: 'troca-rapida-abas',
      descricao: 'Toque em "faculdade" e "estudos" em menos de 300 ms. Esperado: nenhuma tela fantasma (inert/aria-hidden presos), app estabiliza em "estudos".',
      frames: analisarFrames(f5b),
      metrics: metricDiff(m5a, m5b),
      animacoes: anim5.length,
      inertHidden: ih5,
      screenshot: s5,
    });
  });

  // ---- Cenário 6: clique no "bora?" (único botão da home vazia) ----
  await runCenario('6/6 clique-bora', 'Clique no único botão da home vazia ("bora?"). Esperado: navegação para uma tela de cadastro/onboarding ou wizard.', async () => {
    const f6a = await readFrames();
    const m6a = await snapshotMetrics();
    const r6 = await clickBy('button');
    await wait(1400);
    const f6b = await readFrames();
    const m6b = await snapshotMetrics();
    const s6 = await screenshot('clique-bora');
    const anim6 = await activeAnimations();
    const c6 = await screenContainerState();
    const ih6 = await inertHiddenCount();
    results.push({
      cenario: 'clique-bora',
      descricao: 'Clique no botão "bora?" da home vazia. Esperado: transição para a próxima tela (push ou wizard).',
      frames: analisarFrames(f6b),
      metrics: metricDiff(m6a, m6b),
      click: r6,
      animacoes: anim6.length,
      container: c6,
      inertHidden: ih6,
      screenshot: s6,
    });
  });

  // ---- Relatório ----
  const linhas = [];
  linhas.push('# Relatório de Motion — perfil usuário comum (mobile)');
  linhas.push('');
  linhas.push('App: `cecistudy/` · build `dist/` preview em `http://127.0.0.1:4178/`');
  linhas.push('Ferramenta: CDP puro sobre Chrome real (`node scripts/motion-report.mjs`), sem dependência nova.');
  linhas.push('Nota: o app inicia **vazio** (sem dados). O único botão na home é "bora?".');
  linhas.push('');
  linhas.push('## Métrico de referência (usuário comum)');
  linhas.push('| Cenário | Quadros | >16,7 ms | Jank >50 ms | Maior intervalo | Animações ativas | Tela sã |');
  linhas.push('|---|---:|---:|---:|---:|---:|---|');
  for (const r of results) {
    const telaSana =
      (!r.inertHidden || (r.inertHidden.inert === 0 && r.inertHidden.hidden === 0)) &&
      (!r.container || !r.container.found || r.container.transform === 'none' || r.container.transform === 'matrix(1, 0, 0, 1, 0, 0)');
    linhas.push(`| ${r.cenario} | ${r.frames.n} | ${r.frames.lento} | ${r.frames.jank} | ${r.frames.maxDelta} ms | ${r.animacoes} | ${telaSana ? 'sim' : 'não'} |`);
  }
  linhas.push('');
  linhas.push('## Detalhe por cenário');
  for (const r of results) {
    linhas.push(`### ${r.cenario}`);
    if (r.erro) { linhas.push('- ERRO: ' + r.erro); linhas.push(''); continue; }
    linhas.push('- ' + r.descricao);
    linhas.push('');
    linhas.push(`- Quadros capturados: ${r.frames.n}`);
    linhas.push(`- Maior intervalo entre quadros: ${r.frames.maxDelta} ms`);
    linhas.push(`- Quadros acima de 16,7 ms (acima de 1 frame @60 Hz): ${r.frames.lento} (${r.frames.pctLento}%)`);
    linhas.push(`- Quadros com jank (> 50 ms): ${r.frames.jank}`);
    linhas.push(`- ScriptDuration Δ: ${(r.metrics.ScriptDuration || 0).toFixed(1)} ms`);
    linhas.push(`- LayoutDuration Δ: ${(r.metrics.LayoutDuration || 0).toFixed(1)} ms`);
    linhas.push(`- RecalcStyleDuration Δ: ${(r.metrics.RecalcStyleDuration || 0).toFixed(1)} ms`);
    linhas.push(`- TaskDuration Δ: ${(r.metrics.TaskDuration || 0).toFixed(1)} ms`);
    linhas.push(`- Animações ativas no clique: ${r.animacoes}`);
    if (r.click !== undefined) linhas.push(`- Clique OK: ${r.click.ok} ${r.click.reason || ''} (aria=${r.click.aria || '-'})`);
    if (r.container && r.container.found !== undefined) linhas.push(`- Contêiner da tela: opacity=${r.container.opacity} transform=${r.container.transform} inert=${r.container.inert} aria-hidden=${r.container.ariaHidden}`);
    if (r.inertHidden) linhas.push(`- Elementos inert/aria-hidden presos no DOM: inert=${r.inertHidden.inert} hidden=${r.inertHidden.hidden}`);
    if (r.screenshot) linhas.push(`- Screenshot: artifacts/shots/${r.screenshot}`);
    linhas.push('');
  }
  linhas.push('## Erros de console / exceções capturadas');
  if (consoleErrors.length) { for (const e of consoleErrors.slice(0, 30)) linhas.push(`- [${e.type}] ${e.text}`); } else { linhas.push('- (nenhum)'); }
  if (pageExceptions.length) { linhas.push(''); linhas.push('### Exceções não tratadas'); for (const ex of pageExceptions.slice(0, 10)) { linhas.push(`- ${ex.text || ex.exception?.text || JSON.stringify(ex)}`); } }
  linhas.push('');
  linhas.push('## Veredito');
  const tudoBom = results.every((r) => !r.erro && r.frames.jank === 0 && r.frames.pctLento < 20);
  linhas.push(tudoBom ? 'DENTRO DO ACEITÁVEL — animações fluidas, sem quadro perdido, nenhuma tela fantasma.' : 'FORA DO ACEITÁVEL — há quadros perdidos, telas fantasma ou erros nos cenários.');
  linhas.push('');
  fs.writeFileSync(OUT, linhas.join('\n') + '\n', 'utf8');
  console.log('RELATÓRIO:', OUT);

  try { ws.close(); } catch {}
  process.exit(0);
}

main().catch((e) => { console.error('ERRO:', e); process.exit(1); });
