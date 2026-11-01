const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
// 見本サイト（sorasora1120.github.io/samples）の画面をスマホの大きさで撮る: node tools/ig-shoot.js <出力フォルダ>
const OUT = process.argv[2] + '/';
const fontRoute = async r => {
  try {
    const body = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36', r.request().url()], { maxBuffer: 1 << 26 });
    const u = r.request().url();
    r.fulfill({ body, contentType: u.includes('css2') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } });
  } catch (e) { r.abort(); }
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: 'reduce' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, fontRoute);
  for (const n of ['cafe', 'pizza', 'salon', 'barber']) {
    const p = await ctx.newPage();
    await p.goto('file:///home/user/sorasora1120.github.io/samples/' + n + '.html', { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
    // 表示アニメーションを全部出す
    await p.evaluate(() => document.querySelectorAll('[class*=rv],[class*=reveal],.fade,.in').forEach(e => e.classList.add('on', 'in', 'visible', 'show')));
    await p.screenshot({ path: OUT + n + '-0.png' });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (const [k, f] of [[1, .28], [2, .55]]) {
      await p.evaluate(y => window.scrollTo(0, y), Math.round(H * f)); await p.waitForTimeout(900);
      await p.screenshot({ path: OUT + n + '-' + k + '.png' });
    }
    console.log(n, H);
    await p.close();
  }
  await b.close();
})();
