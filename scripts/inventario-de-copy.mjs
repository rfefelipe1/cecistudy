/**
 * Inventário de copy de tela (SPEC-C-015 D2).
 *
 * Varre `src/components`, `src/shells`, `src/overlays` (excluindo testes) e
 * emite JSON com todo texto de voz da camada 1 encontrado, indicando se já
 * tem chave em `src/lib/voice.ts` e se precisa de revisão.
 *
 * Uso:
 *   node scripts/inventario-de-copy.mjs          # emite JSON no stdout
 *   node scripts/inventario-de-copy.mjs --check  # sai com 1 se houver
 *                                                 texto de camada 1 não migrado
 *
 * Detecção:
 *   1. Chamadas de voz inline (setError, toast, confirm, alert,
 *      description=, emptyMessage=) — padrão do voz-gate.mjs.
 *   2. Literais de string soltos em JSX que contenham acento pt-BR ou
 *      emojis da marca (♡✨🔥☕🌷) — texto de produto fora do detector.
 *
 * Migração: o texto está "migrado" quando aparece (substring normalizada)
 * em alguma frase de `src/lib/voice.ts`.
 *
 * Revisão (precisaRevisao): texto não migrado, ou migrado mas que viola
 * regras da SPEC-C-014 (ceço fora da janela de afeto, ceci como rótulo,
 * erro não migrado).
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const VOZ_PATH = path.join(root, 'src/lib/voice.ts');
let vozTexto = '';
try {
  vozTexto = fs.readFileSync(VOZ_PATH, 'utf-8');
} catch {
  console.error(JSON.stringify({ erro: `não consegui ler ${VOZ_PATH}` }));
  process.exit(1);
}

/** Constantes de marca que NÃO são frases de voz — excluídas da comparação. */
const CONSTANTES_MARCA = new Set([
  'cecistudy ♡',
  'cecistudy',
  'cecinho',
  'ceço',
  'dica do cecinho ✨',
  'dica do cecinho',
]);

/** Todas as frases literais de voice.ts (apenas strings puras, para comparação). */
const FRASES_VOZ = [];

// Extrai strings simples de voice.ts: qualquer conteúdo entre aspas que não seja import/caminho
const stringRe = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
let sm;
while ((sm = stringRe.exec(vozTexto)) !== null) {
  let s = sm[0];
  s = s.slice(1, -1); // remove aspas
  // ignora constantes de marca (não são frases)
  if (CONSTANTES_MARCA.has(s)) continue;
  // ignora imports, caminhos de arquivo, nomes de pacote, tipos
  if (
    s.startsWith('.') ||
    s.startsWith('/') ||
    s.includes('node_modules') ||
    s.includes('from ') ||
    s.match(/^[a-z][a-z0-9-]*$/) // nome simples de pacote/tipo
  ) continue;
  // só frases com pelo menos 3 caracteres úteis
  if (s.trim().length >= 3) FRASES_VOZ.push(s);
}

function normaliza(s) {
  return s.toLowerCase().replace(/[^a-z0-9çãáâêõéí\s]/g, '').trim();
}

const FRASES_NORM = FRASES_VOZ.map((f) => normaliza(f));

function estaMigrado(texto) {
  const alvo = normaliza(texto);
  if (!alvo) return null;
  for (let i = 0; i < FRASES_NORM.length; i++) {
    const n = FRASES_NORM[i];
    if (n && (n.includes(alvo) || alvo.includes(n))) return FRASES_VOZ[i];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Detecção de categoria (reutiliza padrão do voz-gate, inline para evitar import cíclico)
// ---------------------------------------------------------------------------

const E_PT_BR = /[à-úâêôãõç♡✨🔥☕🌷]/;

const CATEGORIAS_DE_VOZ = [
  { nome: 'ERRO', re: /\b(setError|setErro|setSituacao|setErrorMsg|setErroDeEscrita|setErroDescriptografar|showErro)\s*\(\s*(['"`])([^'"`]*)\2/ },
  { nome: 'TOAST', re: /\b(toast|showToast)\s*\(\s*(['"`])([^'"`]*)\2/ },
  { nome: 'CONFIRMACAO', re: /\b(confirm|window\.confirm|alert)\s*\(\s*(['"`])([^'"`]*)\2/ },
  { nome: 'VAZIO', re: /\b(description|emptyMessage)\s*=\s*(['"`])([^'"`]*)\2/i },
];

// ---------------------------------------------------------------------------
// Varre arquivos de tela
// ---------------------------------------------------------------------------

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules') continue;
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const alvos = walk(path.join(root, 'src/components'))
  .concat(walk(path.join(root, 'src/shells')))
  .concat(walk(path.join(root, 'src/overlays')));

const ISENTOS = new Set(['src/lib/voice.ts', 'src/lib/useVoz.ts', 'src/lib/diasAte.ts']);

const itens = [];

function semComentario(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function consideraRevisao(texto, categoria, chave) {
  const lower = texto.toLowerCase();
  if (!chave && categoria === 'ERRO') return true; // erro sem chave = precisa duas frases (D5)
  if (!chave) return true; // não migrado = precisa revisão (D1)
  if (/\bceço\b/.test(lower) && categoria !== 'CELEBRACAO' && categoria !== 'ONBOARDING') return true; // D3 / I3
  if (/\bceci\b/.test(lower) && !/cecistudy/.test(lower)) return true; // PROIBIDO
  return false;
}

function motivoRevisao(texto, categoria, chave) {
  const lower = texto.toLowerCase();
  if (!chave && categoria === 'ERRO') return 'erro sem chave em voice.ts (D1) — precisa de duas frases (D5)';
  if (!chave) return 'texto de voz não migrado para voice.ts (D1)';
  if (/\bceço\b/.test(lower) && categoria !== 'CELEBRACAO' && categoria !== 'ONBOARDING')
    return 'ceço fora da janela de afeto próximo (D3 / I3)';
  if (/\bceci\b/.test(lower) && !/cecistudy/.test(lower))
    return '"ceci" não é rótulo de UI (PROIBIDO / SPEC-C-013 D2)';
  return 'revisar contra SPEC-C-014';
}

for (const full of alvos) {
  const rel = path.relative(root, full).split(path.sep).join('/');
  if (ISENTOS.has(rel)) continue;
  if (/[\\/]__tests__[\\/]/.test(rel) || /\.test\.tsx?$/.test(rel)) continue;

  const content = fs.readFileSync(full, 'utf-8');
  const linhas = semComentario(content).split('\n');

  linhas.forEach((linha, i) => {
    const numero = i + 1;
    const trim = linha.trim();

    // ignora linhas que não contêm literal de string com texto de produto
    if (!E_PT_BR.test(linha)) return;

    // --- A. chamada de voz inline por categoria ---
    for (const cat of CATEGORIAS_DE_VOZ) {
      if (!cat.re.test(linha)) continue;
      const mm = linha.match(cat.re);
      if (!mm) continue;
      const textoLiteral = mm[0];
      const textoInterno = mm[3] || '';
      const chave = estaMigrado(textoInterno);
      const precisa = consideraRevisao(textoInterno, cat.nome, chave);
      itens.push({
        texto: textoInterno.slice(0, 140),
        categoria: cat.nome,
        origem: `${rel}:${numero}`,
        migrado: !!chave,
        chave: chave || null,
        precisaRevisao: precisa,
        motivo: precisa ? motivoRevisao(textoInterno, cat.nome, chave) : null,
      });
      return;
    }

    // --- B. literal solto entre aspas em JSX com texto de produto ---
    const strRe = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
    let lm;
    while ((lm = strRe.exec(linha)) !== null) {
      let interno = lm[0].slice(1, -1);
      // ignora caminhos, URLs, nomes de classe, imports, códigos técnicos
      if (
        interno.startsWith('.') ||
        interno.startsWith('/') ||
        interno.includes('http') ||
        interno.includes('.tsx') ||
        interno.includes('.css') ||
        interno.includes('.webp') ||
        interno.includes('.png') ||
        interno.includes('.svg') ||
        interno.includes('node_modules') ||
        /^[a-z][a-z0-9-]*$/.test(interno) ||
        interno.trim().length < 3
      ) {
        continue;
      }
      // ignora se a linha inteira é uma chamada de voz (já tratada em A)
      if (CATEGORIAS_DE_VOZ.some((c) => c.re.test(linha))) continue;
      const chave = estaMigrado(interno);
      const precisa = consideraRevisao(interno, null, chave);
      itens.push({
        texto: interno.slice(0, 140),
        categoria: 'não categorizado',
        origem: `${rel}:${numero}`,
        migrado: !!chave,
        chave: chave || null,
        precisaRevisao: precisa,
        motivo: precisa ? motivoRevisao(interno, 'não categorizado', chave) : null,
      });
      break; // um literal solto por linha
    }

    // --- C. texto livre entre tags JSX (<p>texto</p>) com acento/emoji ---
    // captura conteúdo de texto que não está entre aspas, mas está dentro de tags
    const jsxTextoRe = />([^<>]{3,120})</g;
    let jm;
    while ((jm = jsxTextoRe.exec(linha)) !== null) {
      let interno = jm[1].trim();
      // ignora se é só espaços, chaves de expressão JSX, ou tags de fechamento/abertura
      if (
        !interno ||
        interno.startsWith('{') ||
        interno.endsWith('}') ||
        interno.includes('${') ||
        /^[\s\-\.]+$/.test(interno) ||
        interno.length < 3
      ) {
        continue;
      }
      // só interessa se tem acento pt-BR ou emoji da marca
      if (!E_PT_BR.test(interno)) continue;
      // ignora se a linha já foi capturada como chamada de voz
      if (CATEGORIAS_DE_VOZ.some((c) => c.re.test(linha))) continue;
      const chave = estaMigrado(interno);
      const precisa = consideraRevisao(interno, null, chave);
      itens.push({
        texto: interno.slice(0, 140),
        categoria: 'não categorizado',
        origem: `${rel}:${numero}`,
        migrado: !!chave,
        chave: chave || null,
        precisaRevisao: precisa,
        motivo: precisa ? motivoRevisao(interno, 'não categorizado', chave) : null,
      });
      break; // um texto livre por linha
    }
  });
}

// --- notificações (arquivo exato) ---
const notifPath = path.join(root, 'src/lib/notifications.ts');
if (fs.existsSync(notifPath)) {
  const notifContent = fs.readFileSync(notifPath, 'utf-8');
  const notifLinhas = semComentario(notifContent).split('\n');
  notifLinhas.forEach((linha, i) => {
    const m = /\b(title|body)\s*:\s*(['"`])([^'"`]*)\2/.exec(linha);
    if (!m) return;
    const textoInterno = m[3];
    const chave = estaMigrado(textoInterno);
    itens.push({
      texto: textoInterno.slice(0, 140),
      categoria: 'NOTIFICACAO',
      origem: `src/lib/notifications.ts:${i + 1}`,
      migrado: !!chave,
      chave: chave || null,
      precisaRevisao: !chave,
      motivo: !chave ? 'notificação com texto literal, não usa vozFrase (SPEC-M-018 D18)' : null,
    });
  });
}

// ---------------------------------------------------------------------------
// Emissão
// ---------------------------------------------------------------------------

const naoMigrados = itens.filter((i) => !i.migrado);
const precisaRevisaoLista = itens.filter((i) => i.precisaRevisao);

const relatorio = {
  geradoEm: new Date().toISOString(),
  total: itens.length,
  migrados: itens.length - naoMigrados.length,
  naoMigrados: naoMigrados.length,
  precisaRevisao: precisaRevisaoLista.length,
  itens,
};

if (process.argv.includes('--check')) {
  if (naoMigrados.length > 0) {
    console.error(
      `[INVENTÁRIO DE COPY] ${naoMigrados.length} texto(s) de voz não migrado(s) para voice.ts:`,
    );
    for (const i of naoMigrados) {
      console.error(`  - ${i.origem} [${i.categoria}]: ${i.texto}`);
    }
    process.exit(1);
  }
  console.log(`OK: ${itens.length} texto(s) de voz inventariado(s), todos migrados.`);
} else {
  console.log(JSON.stringify(relatorio, null, 2));
}