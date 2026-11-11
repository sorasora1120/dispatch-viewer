// Fiverr 2つ目の出品（Shopify の日本向けローカライズ）のギャラリー画像 1280x769 を3枚作る → fiverr/gig2-*.jpg
// 使い方: NODE_PATH=/opt/node22/lib/node_modules node tools/fiverr-gig2.js   （お店はすべて架空）
const { chromium } = require('playwright'); const { execFileSync } = require('child_process');
const OUT = __dirname + '/../fiverr/';
const fontRoute = async r => { try { const body = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', r.request().url()], { maxBuffer: 1 << 26 }); r.fulfill({ body, contentType: r.request().url().includes('css2') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } }); } catch (e) { r.abort(); } };
const head = `<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Jost:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@400;500;700;900&display=block" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}body{width:1280px;height:769px;overflow:hidden;font-family:Jost,"Noto Sans JP",sans-serif;background:#f4efe6;color:#191512}
.k{font:600 15px/1 Jost;letter-spacing:.24em;text-transform:uppercase;color:#96602f}
h1{font:400 64px/1.05 'Instrument Serif',serif}h1 em{color:#96602f}
.tag{position:absolute;right:40px;bottom:30px;font:500 13px/1 Jost;letter-spacing:.18em;color:#9a8d80}
.ph{width:300px;height:600px;border-radius:44px;background:#14110f;padding:10px;box-shadow:0 40px 60px -30px rgba(0,0,0,.5)}
.sc{width:100%;height:100%;border-radius:36px;background:#fff;overflow:hidden;font-family:"Noto Sans JP"}
.pimg{height:260px;background:linear-gradient(160deg,#e9e1d4,#d8ccb9);display:flex;align-items:center;justify-content:center}
.bag{width:120px;height:150px;background:#c9b79b;border-radius:10px 10px 18px 18px;position:relative;box-shadow:inset 0 -14px 0 rgba(0,0,0,.06)}
.bag::before{content:"";position:absolute;left:30px;right:30px;top:-34px;height:46px;border:7px solid #b29c7c;border-bottom:0;border-radius:40px 40px 0 0}
.pd{padding:18px}.pd small{font-size:11px;color:#998}.pd h3{font-size:19px;margin-top:6px;line-height:1.4}.pd .pr{font-size:17px;font-weight:700;margin-top:6px}.pd .pr span{font-size:11px;font-weight:400;color:#777}
.pd p{font-size:12px;line-height:1.75;color:#444;margin-top:8px}.btn{margin-top:12px;background:#b8002e;color:#fff;text-align:center;border-radius:8px;padding:11px;font-weight:700;font-size:14px}
.chip{display:inline-block;font-size:10.5px;background:#f5efe6;border-radius:99px;padding:3px 9px;margin:8px 4px 0 0;color:#6b5a48}
</style>`;
const phone = `<div class="ph"><div class="sc"><div class="pimg"><div class="bag"></div></div><div class="pd"><small>SAMPLE STORE（架空）</small><h3>毎日使える、<br>やさしいリネントート</h3><div class="pr">¥7,200 <span>(税込)・送料無料</span></div><span class="chip">国内発送 2〜4日</span><span class="chip">30日返品OK</span><p>洗うほどやわらかくなる天然リネン。A4も入る、ちょうどいい大きさです。</p><div class="btn">カートに入れる</div></div></div></div>`;
const pages = {
  cover: `<div style="position:absolute;inset:0;display:grid;grid-template-columns:1fr 420px;align-items:center;padding:0 70px">
    <div><div class="k">Shopify · Japanese localization</div>
    <h1 style="margin-top:22px">Make your Shopify store<br><em>sell in Japan.</em></h1>
    <p style="font:300 22px/1.6 Jost;color:#5a4e45;margin-top:24px;max-width:600px">Product pages, collections, banners and store policies, rewritten in natural Japanese by a native speaker who has run his own online store.</p>
    <div style="display:flex;gap:10px;margin-top:30px">${['Native Japanese', 'Shopify ready', 'Not machine translation'].map(t => `<span style="font:500 15px/1 Jost;border:1.5px solid #191512;border-radius:99px;padding:10px 16px">${t}</span>`).join('')}</div></div>
    <div style="display:flex;justify-content:center">${phone}</div></div><div class="tag">SAMPLE · FICTIONAL STORE</div>`,
  before: `<div style="height:769px;padding:0 70px;display:flex;flex-direction:column;justify-content:center"><div class="k">Before → After</div><h1 style="font-size:52px;margin-top:14px">Translated isn't the same as <em>localized.</em></h1>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:34px">
      <div style="background:#fff;border-radius:22px;padding:34px 34px;font-family:'Noto Sans JP'"><div class="k" style="color:#9a8d80">Machine translation</div>
        <p style="font-size:25px;line-height:1.85;margin-top:18px;color:#555;text-decoration:line-through;text-decoration-color:#b8002e">今すぐ購入してください！あなたの人生を変えるゲームチェンジャーなトートバッグです。送料はチェックアウトで計算されます。</p>
        <p style="font:400 18px/1.5 Jost;color:#7a6c60;margin-top:20px">Pushy, stiff, and confusing about shipping. Japanese shoppers leave.</p></div>
      <div style="background:#fff;border-radius:22px;padding:34px 34px;font-family:'Noto Sans JP';box-shadow:0 0 0 3px #96602f"><div class="k">Native localization</div>
        <p style="font-size:25px;line-height:1.85;margin-top:18px">毎日使える、やさしいリネントート。<br>A4も入るちょうどいいサイズです。<br><b>¥7,200（税込）・送料無料</b></p>
        <p style="font:400 18px/1.5 Jost;color:#7a6c60;margin-top:20px">Calm and clear. Tax-included price, free shipping and delivery days up front, the way Japanese buyers expect.</p></div>
    </div></div><div class="tag">SAMPLE · FICTIONAL STORE</div>`,
  incl: `<div style="height:769px;padding:0 70px;display:flex;flex-direction:column;justify-content:center"><div class="k">What I localize</div><h1 style="font-size:52px;margin-top:14px">Everything a Japanese shopper <em>reads.</em></h1>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px">
    ${[['Product pages', 'Titles, descriptions, size and material info'], ['Collections & homepage', 'Headlines, banners, buttons'], ['Prices & shipping', 'Tax-included prices, delivery days, returns'], ['Store policies', 'Shipping, refund and FAQ pages'], ['Japanese keywords', 'Words Japanese buyers actually search'], ['Ready to paste', 'Delivered in a sheet that matches your Shopify fields']].map(([a, b]) => `<div style="background:#fff;border-radius:18px;padding:34px 30px"><div style="font:600 26px/1.2 Jost">${a}</div><div style="font:400 18px/1.5 Jost;color:#6b5d51;margin-top:10px">${b}</div></div>`).join('')}
    </div></div>`,
};
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 769 }, deviceScaleFactor: 2 });
  await c.route(/fonts\.(googleapis|gstatic)\.com/, fontRoute);
  for (const [n, body] of Object.entries(pages)) {
    const p = await c.newPage(); await p.setContent(`<!doctype html><html><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + 'gig2-' + n + '.jpg', type: 'jpeg', quality: 88 }); await p.close();
  }
  await b.close();
})();
