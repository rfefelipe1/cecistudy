import http from 'node:http';

const BROWSER_PORT = 9222;
function httpGetJson(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: BROWSER_PORT, path: p, timeout: 8000 },
      (res) => { let d=''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e){reject(e);} }); }).on('error', reject);
  });
}

async function main() {
  const tabs = await httpGetJson('/json/list');
  const appTab = tabs.find(t => t.url && t.url.startsWith('http://127.0.0.1:4178/') && t.type === 'page');
  const { WebSocket } = globalThis;
  const ws = new WebSocket(`ws://127.0.0.1:${BROWSER_PORT}/devtools/page/${appTab.id}`);
  let pendingId = 0; const cbs = new Map();
  function send(m, p) {
    return new Promise((res, rej) => {
      const id = ++pendingId; cbs.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method: m, params: p }));
      setTimeout(() => { if (cbs.has(id)) { cbs.delete(id); rej(new Error('timeout ' + m)); } }, 20000);
    });
  }
  ws.onopen = async () => {
    await send('Runtime.enable');
    const r = await send('Runtime.evaluate', { expression: 'document.body.innerText.slice(0, 1500)', returnByValue: true });
    console.log('BODY:\n' + r.result.value);
    const b = await send('Runtime.evaluate', { expression: 'Array.from(document.querySelectorAll("button")).map(b => b.getAttribute("aria-label") || b.textContent || "(sem label)").slice(0, 80)', returnByValue: true });
    console.log('\nBOTÕES:\n' + b.result.value.join('\n'));
    const m = await send('Runtime.evaluate', { expression: 'Array.from(document.querySelectorAll("[aria-label]")).map(e => e.tagName + "=" + e.getAttribute("aria-label")).slice(0, 80)', returnByValue: true });
    console.log('\nARIA-LABEL:\n' + m.result.value.join('\n'));
    ws.close();
    process.exit(0);
  };
  ws.onerror = (e) => { console.log('ERR', e); process.exit(1); };
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && cbs.has(msg.id)) { const c = cbs.get(msg.id); cbs.delete(msg.id); c.res(msg.result); }
  };
}
main();
