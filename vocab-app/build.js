#!/usr/bin/env node
// Builds index.html from src/app.html + src/words/lv*.txt and refuses to build on bad word data.
//   node build.js                      -> index.html
//   node build.js --artifact out.html  -> also a copy for the Claude artifact preview
const fs = require('fs');
const path = require('path');

const EMOJI_NAMES = require('unicode-emoji-json/data-by-emoji.json');
const FLUENT = require('@iconify-json/fluent-emoji-flat/icons.json');

const ROOT = __dirname;
const LEVELS = [['lv1', '5'], ['lv2', '4'], ['lv3', '3'], ['lv4', 'p2'], ['lv5', '2'], ['lv6', 'p1'], ['lv7', '1']];
// Fluent icon names that don't follow the Unicode short name
const ART_NAME_OVERRIDES = {
  '🕐': 'one-oclock', '👒': 'womans-hat', '🔺': 'red-triangle', '👢': 'womans-boot',
  '👯': 'person-with-bunny-ears', '🤗': 'hugging-face'
};
// keep in sync with PICTURE_CATS / PICTURE_WORDS / posOf in src/app.html
const PICTURE_CATS = new Set(['animals', 'food', 'body', 'people', 'school', 'nature', 'objects', 'places', 'colors', 'actions', 'transport', 'clothes', 'sports']);
const PICTURE_WORDS = new Set(['happy', 'sad', 'angry', 'tired', 'hungry', 'cold', 'surprised', 'scared']);
const posOf = (cat) => ({ actions: 'v', thinking: 'v', feelings: 'adj', qualities: 'adj', colors: 'color', adverbs: 'adv' }[cat] || 'n');

const template = fs.readFileSync(path.join(ROOT, 'src/app.html'), 'utf8');
const catBlock = template.slice(template.indexOf('var CATS = ['), template.indexOf('];', template.indexOf('var CATS = [')));
const CATS = new Set([...catBlock.matchAll(/id:'(\w+)'/g)].map((m) => m[1]));

const errors = [];
const warnings = [];
const words = [];
const seen = new Map();

for (const [file, level] of LEVELS) {
  const lines = fs.readFileSync(path.join(ROOT, 'src/words', file + '.txt'), 'utf8').split('\n');
  const inLevel = [];
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const where = `${file}.txt:${i + 1}`;
    const f = line.split('|').map((s) => s.trim());
    if (f.length < 5 || f.length > 6) { errors.push(`${where} needs 5 or 6 fields, got ${f.length}: ${line}`); return; }
    let [en, cat, emoji, ja, sentence, def] = f;
    const deco = emoji.startsWith('~');
    if (deco) emoji = emoji.slice(1);
    if (!CATS.has(cat)) errors.push(`${where} unknown category "${cat}"`);
    if (!en || !emoji || !ja || !sentence) errors.push(`${where} empty field`);
    const key = en.toLowerCase();
    if (seen.has(key)) errors.push(`${where} duplicate "${en}" (also ${seen.get(key)})`);
    seen.set(key, where);
    inLevel.push({ en, cat, emoji, ja, sentence, def: def || '', deco, level, where });
  });
  inLevel.forEach((w, i) => { w.freq = Math.max(3, Math.round(20 - (i * 17) / Math.max(1, inLevel.length - 1))); });
  words.push(...inLevel);
}

const emojiCount = {};
const wantsPicture = (w) => !w.deco && (PICTURE_CATS.has(w.cat) || PICTURE_WORDS.has(w.en));
words.forEach((w) => { if (wantsPicture(w)) emojiCount[w.emoji] = (emojiCount[w.emoji] || 0) + 1; });
const sentenceOwner = new Map();
for (const w of words) {
  const pos = posOf(w.cat);
  const re = new RegExp('\\b' + w.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:s|es|ed|d|ing)?\\b', 'i');
  const pictureable = wantsPicture(w) && emojiCount[w.emoji] === 1;
  const blankable = (pos === 'n' || pos === 'v') && re.test(w.sentence);
  if (wantsPicture(w) && !pictureable) warnings.push(`${w.where} "${w.en}" emoji ${w.emoji} is shared, so it can't be a picture answer`);
  if (!re.test(w.sentence)) warnings.push(`${w.where} "${w.en}" does not appear in its sentence`);
  if (!pictureable && !blankable && !w.def) errors.push(`${w.where} "${w.en}" has no question type: add a definition, a matching sentence, or a unique picture`);
  if (sentenceOwner.has(w.sentence)) warnings.push(`${w.where} "${w.en}" reuses the sentence of "${sentenceOwner.get(w.sentence)}"`);
  sentenceOwner.set(w.sentence, w.en);
}

// Every emoji is drawn with a bundled Fluent Emoji (flat) illustration so it looks the same on every device.
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const art = {};
for (const w of words) {
  for (const { segment: g } of segmenter.segment(w.emoji)) {
    if (g in art) continue;
    const info = EMOJI_NAMES[g] || EMOJI_NAMES[g.replace(/️/g, '')] || EMOJI_NAMES[g + '️'];
    const name = ART_NAME_OVERRIDES[g] || (info && info.slug.replace(/_/g, '-'));
    const icon = name && (FLUENT.icons[name] || (FLUENT.aliases && FLUENT.aliases[name] && FLUENT.icons[FLUENT.aliases[name].parent]));
    if (!icon) { errors.push(`${w.where} "${w.en}": no illustration for ${g} (${name || 'not an emoji'})`); art[g] = null; continue; }
    const width = icon.width || FLUENT.width || 16;
    const height = icon.height || FLUENT.height || 16;
    art[g] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.left || 0} ${icon.top || 0} ${width} ${height}">${icon.body}</svg>`;
  }
}

warnings.forEach((m) => console.warn('warn  ' + m));
if (errors.length) {
  errors.forEach((m) => console.error('ERROR ' + m));
  console.error(`\n${errors.length} error(s); index.html not written.`);
  process.exit(1);
}

const J = JSON.stringify;
const wordLines = words.map((w) =>
  `  W(${J(w.en)},${J(w.cat)},${J(w.emoji)},${J(w.ja)},${J(w.sentence)},${J(w.level)},${w.freq}${w.deco ? ',1' : ''})`);
const defs = {};
words.forEach((w) => { if (w.def) defs[w.en] = w.def; });
const data = 'var WORDS = [\n' + wordLines.join(',\n') + '\n];\n\n' +
  '// Simple English definitions: the way abstract words get tested without Japanese.\nvar DEFS = ' + J(defs, null, 2) + ';\n\n' +
  '// Fluent Emoji (flat) illustrations, (c) Microsoft Corporation, MIT License.\nvar ART = ' + J(art) + ';';

// Bricolage Grotesque (SIL OFL 1.1) is inlined so the app makes no font requests and works offline everywhere.
const FONT_DIR = path.join(ROOT, 'node_modules/@fontsource/bricolage-grotesque/files');
const fontUrl = (weight) => 'data:font/woff2;base64,' +
  fs.readFileSync(path.join(FONT_DIR, `bricolage-grotesque-latin-${weight}-normal.woff2`)).toString('base64');
let html = template.replace('/*__WORDS__*/', () => data)
  .replace(/url\("fonts\/bricolage-(\d+)\.woff2"\)/g, (_, weight) => `url("${fontUrl(weight)}")`);
if (html.includes('fonts/bricolage-')) throw new Error('font url left in the template');
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]); // throws on a syntax error

const appHtml = html.replace('<!--ARTIFACT_NOTE-->\n', '');
fs.writeFileSync(path.join(ROOT, 'index.html'), appHtml);
// Capacitor bundles www/ into the iOS app: the same page, minus the PWA install links it has no use for.
const nativeHtml = appHtml.replace(/<link rel="(manifest|apple-touch-icon)"[^>]*>\n/g, '');
if (nativeHtml === appHtml) throw new Error('PWA links not found; update the native-build strip in build.js');
fs.mkdirSync(path.join(ROOT, 'www'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'www/index.html'), nativeHtml);

// PWA: "add to home screen" on the free web version (GitHub Pages), full screen and offline.
const PWA_FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];
const manifest = {
  name: 'VisuWord - 絵と音で覚える英単語',
  short_name: 'VisuWord',
  description: '日本語に訳さずに、絵・音・英文で英単語を覚えるアプリ',
  lang: 'ja',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#F3F5FA',
  theme_color: '#F3F5FA',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
fs.writeFileSync(path.join(ROOT, 'manifest.webmanifest'), J(manifest, null, 2) + '\n');
const version = require('crypto').createHash('sha256').update(appHtml).digest('hex').slice(0, 12);
fs.writeFileSync(path.join(ROOT, 'sw.js'), `// Generated by build.js. Caches the app so it opens offline; a new build gets a new cache name.
var CACHE = 'visuword-${version}';
var FILES = ${J(PWA_FILES)};
self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(FILES); }).then(function() { return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k.indexOf('visuword-') === 0 && k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // the page: network first so updates show up, cache when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function(res) {
      var copy = res.clone();
      caches.open(CACHE).then(function(c) { c.put('index.html', copy); });
      return res;
    }).catch(function() { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit) { return hit || fetch(req); }));
});
`);

const artifactIdx = process.argv.indexOf('--artifact');
if (artifactIdx > 0) {
  const note = '<p class="note" style="background:var(--accent-soft);border-radius:12px;padding:10px 12px;">' +
    '※ このプレビューページは外部との通信が制限されているため、キーを登録しても写真・動画は表示されません（アプリ版では表示されます）。</p>';
  const artifact = html.replace('<!--ARTIFACT_NOTE-->', note)
    .replace('<!doctype html>\n', '')
    .replace(/<meta charset="utf-8">\n/, '')
    .replace(/<meta name="viewport"[^>]*>\n/, '')
    .replace(/<meta name="theme-color"[^>]*>\n/g, '')
    .replace(/<link rel="(manifest|apple-touch-icon)"[^>]*>\n/g, '');
  fs.writeFileSync(process.argv[artifactIdx + 1], artifact);
}

const byLevel = LEVELS.map(([f, l]) => `${f}:${words.filter((w) => w.level === l).length}`).join(' ');
const artKb = Math.round(Object.values(art).join('').length / 1024);
console.log(`built index.html: ${words.length} words (${byLevel}), ${Object.keys(defs).length} definitions, ` +
  `${Object.keys(art).length} illustrations (${artKb} KB), ${warnings.length} warning(s)`);
