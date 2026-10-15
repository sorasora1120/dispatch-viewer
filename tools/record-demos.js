// 見本サイトをスクロールする動画を撮る（GitHub Actions で実行。ffmpeg で mp4 にする）
// node tools/record-demos.js <出力フォルダ>
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2];
const base = 'file://' + path.resolve('previews') + '/';

async function rec(name, vw, vh, ms, scale) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, recordVideo: { dir: out + '/raw-' + name, size: { width: vw * scale, height: vh * scale } } });
  const p = await ctx.newPage();
  await p.goto(base + 'demo-' + name.replace(/-(m|d)$/, '') + '.html');
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(2600); // 表紙の動きを見せる
  await p.evaluate(async (ms) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const t0 = performance.now();
    await new Promise((res) => {
      const f = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        scrollTo(0, e * max);
        k < 1 ? requestAnimationFrame(f) : res();
      };
      requestAnimationFrame(f);
    });
  }, ms);
  await p.waitForTimeout(1200);
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'smooth' }));
  await p.waitForTimeout(1500);
  await ctx.close(); await b.close();
}

(async () => {
  for (const n of ['cafe', 'salon', 'barber', 'pizza']) {
    await rec(n + '-m', 390, 844, 13000, 1);
    await rec(n + '-d', 1280, 720, 4500, 1);
  }
})();
