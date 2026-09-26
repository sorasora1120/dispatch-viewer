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

let html = template.replace('/*__WORDS__*/', () => data);
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]); // throws on a syntax error

const appHtml = html.replace('<!--ARTIFACT_NOTE-->\n', '');
fs.writeFileSync(path.join(ROOT, 'index.html'), appHtml);
// Capacitor bundles www/ into the iOS app. The native app must work fully offline and
// make no third-party requests on launch, so it uses the system fonts instead of Google Fonts.
const nativeHtml = appHtml.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n/, '');
if (nativeHtml === appHtml) throw new Error('Google Fonts link not found; update the native-build strip in build.js');
fs.mkdirSync(path.join(ROOT, 'www'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'www/index.html'), nativeHtml);

const artifactIdx = process.argv.indexOf('--artifact');
if (artifactIdx > 0) {
  const note = '<p class="note" style="background:var(--accent-soft);border-radius:12px;padding:10px 12px;">' +
    '※ このプレビューページは外部との通信が制限されているため、キーを登録しても写真・動画は表示されません（アプリ版では表示されます）。</p>';
  const artifact = html.replace('<!--ARTIFACT_NOTE-->', note)
    .replace('<!doctype html>\n', '')
    .replace(/<meta charset="utf-8">\n/, '')
    .replace(/<meta name="viewport"[^>]*>\n/, '')
    .replace(/<meta name="theme-color"[^>]*>\n/, '');
  fs.writeFileSync(process.argv[artifactIdx + 1], artifact);
}

const byLevel = LEVELS.map(([f, l]) => `${f}:${words.filter((w) => w.level === l).length}`).join(' ');
const artKb = Math.round(Object.values(art).join('').length / 1024);
console.log(`built index.html: ${words.length} words (${byLevel}), ${Object.keys(defs).length} definitions, ` +
  `${Object.keys(art).length} illustrations (${artKb} KB), ${warnings.length} warning(s)`);
