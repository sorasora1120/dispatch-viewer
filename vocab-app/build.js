#!/usr/bin/env node
// Builds index.html from src/app.html + src/words/lv*.txt and refuses to build on bad word data.
//   node build.js                      -> index.html
//   node build.js --artifact out.html  -> also a copy for the Claude artifact preview
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const LEVELS = [['lv1', '5'], ['lv2', '4'], ['lv3', '3'], ['lv4', 'p2'], ['lv5', '2']];
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
  '// Simple English definitions: the way abstract words get tested without Japanese.\nvar DEFS = ' + J(defs, null, 2) + ';';

let html = template.replace('/*__WORDS__*/', () => data);
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]); // throws on a syntax error

fs.writeFileSync(path.join(ROOT, 'index.html'), html.replace('<!--ARTIFACT_NOTE-->\n', ''));

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
console.log(`built index.html: ${words.length} words (${byLevel}), ${Object.keys(defs).length} definitions, ${warnings.length} warning(s)`);
