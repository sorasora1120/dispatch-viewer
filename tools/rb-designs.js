// Redbubble 用のデザイン（透明PNG 4500x5400）を作る。rb/*.png と rb/preview/*.jpg に書き出す。
// 使い方: NODE_PATH=/opt/node22/lib/node_modules node tools/rb-designs.js
const { chromium } = require('playwright'); const { execFileSync } = require('child_process'); const fs = require('fs');
const OUT = __dirname + '/../rb/';
const fontRoute = async r => { try { const body = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', r.request().url()], { maxBuffer: 1 << 26 }); r.fulfill({ body, contentType: r.request().url().includes('css2') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } }); } catch (e) { r.abort(); } };
const INK = '#1b1714', RED = '#c8342b', NAVY = '#24395c';
// 小さいハンコ（空）
const hanko = (s = 64, c = RED) => `<div style="width:${s}px;height:${s}px;background:${c};border-radius:${s * .12}px;color:#fff;display:flex;align-items:center;justify-content:center;font:400 ${s * .7}px/1 'Yuji Syuku';flex:none">空</div>`;
// 円相（筆の丸）
const enso = (s, c = INK, w = 46) => `<svg width="${s}" height="${s}" viewBox="0 0 400 400" style="position:absolute"><path d="M 236 58 C 120 30 40 120 52 214 C 66 320 190 372 284 326 C 368 284 372 160 304 98" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity=".92"/></svg>`;
const sub = (t, c = INK, sz = 30) => `<div style="font:500 ${sz}px/1.3 Jost;letter-spacing:.28em;text-transform:uppercase;color:${c}">${t}</div>`;
const note = (t, c = INK, sz = 34) => `<div style="font:300 italic ${sz}px/1.35 'Instrument Serif',serif;color:${c}">${t}</div>`;
const vert = (t, font, sz, c = INK) => `<div style="writing-mode:vertical-rl;font:${font.includes('Mincho') || font.includes('Zen') ? 700 : 400} ${sz}px/1 '${font}';color:${c};letter-spacing:.04em">${t}</div>`;
const D = [
  ['01-mendokusai', `<div style="text-align:center">
     <div style="font:400 210px/1.05 'Dela Gothic One';color:${INK}">面倒<br><span style="color:${RED}">くさい</span></div>
     <div style="margin-top:40px">${sub('Mendokusai', INK, 40)}</div>
     <div style="margin-top:18px">${note('(adj.) when literally everything is too much effort', INK, 38)}</div></div>`],
  ['02-nemui', `<div style="display:flex;gap:60px;align-items:center">
     ${vert('眠い', 'Yuji Syuku', 330)}
     <div style="display:flex;flex-direction:column;gap:22px">${hanko(80)}${sub('Nemui', INK, 40)}${note('sleepy.<br>always.', INK, 52)}</div></div>`],
  ['03-ichigo-ichie', `<div style="position:relative;width:760px;height:760px;display:flex;align-items:center;justify-content:center">
     ${enso(760, RED, 30)}
     ${vert('一期一会', 'Zen Antique', 92)}</div>
     <div style="text-align:center;margin-top:10px">${sub('Ichigo Ichie', INK, 38)}<div style="margin-top:14px">${note('one time, one meeting. treasure it.', INK, 40)}</div></div>`],
  ['04-nanakorobi', `<div style="display:flex;gap:70px;align-items:center">
     <div style="display:flex;gap:26px">${vert('八起き', 'Yuji Syuku', 160, RED)}${vert('七転び', 'Yuji Syuku', 160)}</div>
     <div style="display:flex;flex-direction:column;gap:22px;max-width:330px">${hanko(70)}${sub('Nana korobi<br>ya oki', INK, 34)}${note('fall seven times,<br>stand up eight.', INK, 46)}</div></div>`],
  ['05-harahetta', `<div style="text-align:center">
     <svg width="440" height="300" viewBox="0 0 220 150"><g fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"><path d="M70 10 L125 70 M90 6 L135 66"/><path d="M15 70 H205 C200 120 160 140 110 140 C60 140 20 120 15 70 Z" fill="${RED}"/><path d="M75 140 L80 148 H140 L145 140"/></g><path d="M40 92 Q70 82 100 92 T160 92 T190 92" stroke="#fff" stroke-width="5" fill="none"/></svg>
     <div style="font:400 190px/1.05 'Dela Gothic One';color:${INK};margin-top:20px">腹減った</div>
     <div style="margin-top:34px">${sub('Harahetta', INK, 40)}</div><div style="margin-top:14px">${note("i'm hungry. (it's always ramen time)", INK, 40)}</div></div>`],
  ['06-daijoubu', `<div style="text-align:center">
     <div style="font:400 250px/1 'Dela Gothic One';color:${INK}">大丈夫</div>
     <div style="margin-top:44px">${sub('Daijoubu', RED, 44)}</div>
     <div style="margin-top:18px">${note("it's fine. everything is fine.", INK, 46)}</div>
     <div style="margin-top:6px">${note('(it is not fine.)', RED, 38)}</div></div>`],
  ['07-wabi-sabi', `<div style="position:relative;width:700px;height:700px;display:flex;align-items:center;justify-content:center">
     ${enso(700, INK, 40)}
     <div style="font:700 150px/1.15 'Zen Antique';color:${INK};text-align:center">侘び<br>寂び</div></div>
     <div style="text-align:center;margin-top:20px;display:flex;flex-direction:column;align-items:center;gap:16px">${sub('Wabi-sabi', INK, 38)}${note('beauty in the imperfect.', INK, 42)}${hanko(62)}</div>`],
  ['08-ikigai', `<div style="display:flex;gap:64px;align-items:center">
     ${vert('生きがい', 'Zen Antique', 190, NAVY)}
     <div style="display:flex;flex-direction:column;gap:22px;max-width:340px">${hanko(72)}${sub('Ikigai', NAVY, 42)}${note('a reason to get<br>up in the morning.', NAVY, 46)}</div></div>`],
  ['09-neko', `<div style="text-align:center">
     <svg width="460" height="400" viewBox="0 0 230 200"><g fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M40 190 C30 120 50 70 70 55 L62 10 L100 42 C110 39 130 39 140 42 L178 10 L170 55 C190 70 210 120 200 190 Z" fill="#fff"/><path d="M92 95 v8 M148 95 v8"/><path d="M112 118 L120 124 L128 118"/><path d="M70 125 L30 118 M70 133 L32 140 M170 125 L210 118 M170 133 L208 140"/></g><circle cx="120" cy="160" r="0"/></svg>
     <div style="font:400 230px/1 'Yuji Syuku';color:${INK};margin-top:10px">猫</div>
     <div style="margin-top:30px;display:flex;justify-content:center;align-items:center;gap:24px">${sub('Neko', INK, 44)}${hanko(64)}</div>
     <div style="margin-top:14px">${note('cat. the boss of the house.', INK, 40)}</div></div>`],
  ['10-ganbaranai', `<div style="text-align:center">
     <div style="font:400 64px/1 'Dela Gothic One';color:${RED};letter-spacing:.1em">今日も</div>
     <div style="font:400 170px/1.05 'Dela Gothic One';color:${INK};margin-top:18px">がんば<br>らない</div>
     <div style="margin-top:40px">${sub('Kyou mo ganbaranai', INK, 34)}</div>
     <div style="margin-top:16px">${note('not trying hard today either.', INK, 44)}</div></div>`],
];
(async () => {
  fs.mkdirSync(OUT + 'preview', { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 900, height: 1080 }, deviceScaleFactor: 5 });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, fontRoute);
  const head = `<link href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Yuji+Syuku&family=Zen+Antique&family=Instrument+Serif:ital@0;1&family=Jost:wght@300;500&display=block" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:transparent}body{width:900px;height:1080px;display:flex;flex-direction:column;align-items:center;justify-content:center}</style>`;
  for (const [n, inner] of D) {
    const p = await ctx.newPage();
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8">${head}</head><body>${inner}</body></html>`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + n + '.png', omitBackground: true });
    await p.close();
  }
  // 確認用：Tシャツの色っぽい背景に置いた小さいJPG
  const pv = await b.newPage({ viewport: { width: 600, height: 720 } });
  for (const [n] of D) {
    const src = 'data:image/png;base64,' + fs.readFileSync(OUT + n + '.png').toString('base64');
    await pv.setContent(`<body style="margin:0;background:#ece8e1"><img src="${src}" style="width:600px;height:720px;display:block"></body>`);
    await pv.screenshot({ path: OUT + 'preview/' + n + '.jpg', type: 'jpeg', quality: 80 });
  }
  await b.close();
})();
