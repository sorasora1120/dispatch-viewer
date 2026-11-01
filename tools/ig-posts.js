// Instagram の投稿画像（sns/ig）を作る。先に tools/ig-shoot.js で見本の画面を撮る
// Instagram（お店に送る用のビジネスアカウント）の投稿画像を作る。1080x1350（4:5）、アイコンは 1080x1080
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
// 使い方: 見本サイトの画面を shots/ に撮ってから（cafe-0.png など）: node tools/ig-posts.js <shotsのフォルダ> sns/ig
const SH = process.argv[2] + '/', OUT = process.argv[3];
const img = f => 'data:image/png;base64,' + fs.readFileSync(SH + f).toString('base64');
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:#14110f;color:#f4efe6;font-family:Jost,sans-serif;position:relative}
.serif{font-family:'Instrument Serif',serif;font-weight:400}
em{font-style:italic;color:#e3a57c}
.brand{position:absolute;left:72px;top:64px;font:500 22px/1 Jost;letter-spacing:.32em;text-transform:uppercase;color:#bfb2a3}
.num{position:absolute;right:72px;top:64px;font:400 22px/1 Jost;letter-spacing:.2em;color:#8c8075}
.foot{position:absolute;left:72px;right:72px;bottom:60px;display:flex;justify-content:space-between;font:400 22px/1.3 Jost;letter-spacing:.06em;color:#a89a8c}
h1{font:400 118px/1 'Instrument Serif',serif;letter-spacing:-.01em}
h2{font:400 92px/1.02 'Instrument Serif',serif}
.lead{font:300 34px/1.45 Jost;color:#d3c6b7;margin-top:30px}
.phone{position:absolute;width:390px;height:844px;border-radius:58px;background:#0b0908;padding:14px;box-shadow:0 50px 90px -30px rgba(0,0,0,.8),0 0 0 2px #3a332d}
.phone img{display:block;width:100%;height:100%;border-radius:45px;object-fit:cover;object-position:top}
.phone::before{content:"";position:absolute;left:50%;top:26px;width:110px;height:30px;margin-left:-55px;border-radius:20px;background:#0b0908;z-index:2}
.tag{display:inline-block;font:500 20px/1 Jost;letter-spacing:.24em;text-transform:uppercase;color:#e3a57c;border:1.5px solid #e3a57c;border-radius:999px;padding:12px 20px}
.light{background:#f4efe6;color:#14110f}
.light .brand{color:#6b5f55}.light .num{color:#9a8d80}.light .foot{color:#7a6d62}.light .lead{color:#5a4e45}.light em{color:#b4502b}
.light .tag{color:#b4502b;border-color:#b4502b}
ul.ck{list-style:none;margin-top:46px}
ul.ck li{font:400 42px/1.3 Jost;padding:28px 0 28px 64px;border-top:1.5px solid rgba(244,239,230,.16);position:relative}
ul.ck li:last-child{border-bottom:1.5px solid rgba(244,239,230,.16)}
ul.ck li::before{content:"";position:absolute;left:6px;top:36px;width:26px;height:13px;border-left:3px solid #e3a57c;border-bottom:3px solid #e3a57c;transform:rotate(-45deg)}
.light ul.ck li{border-color:rgba(20,17,15,.14)}
ol.st{list-style:none;margin-top:40px;counter-reset:s}
ol.st li{counter-increment:s;display:grid;grid-template-columns:120px 1fr;padding:38px 0;border-top:1.5px solid rgba(20,17,15,.14)}
ol.st li:last-child{border-bottom:1.5px solid rgba(20,17,15,.14)}
ol.st li::before{content:"0" counter(s);font:400 64px/1 'Instrument Serif',serif;font-style:italic;color:#b4502b}
ol.st b{display:block;font:500 46px/1.2 Jost}
ol.st span{font:300 33px/1.4 Jost;color:#5a4e45}
.price{display:flex;align-items:baseline;gap:28px;margin-top:40px}
.price s{font:300 64px/1 Jost;color:#8c8075}
.price b{font:400 230px/.9 'Instrument Serif',serif}
.rows{margin-top:40px}
.rows div{display:flex;justify-content:space-between;font:400 36px/1 Jost;padding:26px 0;border-top:1.5px solid rgba(244,239,230,.16)}
.rows div:last-child{border-bottom:1.5px solid rgba(244,239,230,.16)}
.rows i{font-style:normal;color:#e3a57c}
.card{position:absolute;width:620px;height:391px;border-radius:30px;background:linear-gradient(140deg,#2c211c,#100b09 70%);border:2px solid rgba(217,183,122,.5);padding:52px 56px;box-shadow:0 50px 90px -30px rgba(0,0,0,.9)}
.card .t{font:400 64px/1.05 'Instrument Serif',serif;color:#f4efe6}.card .t em{color:#d9b77a}
.card .s{position:absolute;left:56px;bottom:50px;color:#d9b77a;font-size:36px;letter-spacing:6px}
.card svg{position:absolute;right:52px;bottom:42px;width:80px;color:#d9b77a}
`;
const page = (body, cls = '') => `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Jost:wght@300;400;500&display=block" rel="stylesheet"><style>${CSS}</style></head><body class="${cls}">${body}</body></html>`;
const BR = '<div class="brand">Sora Web Design</div>';
const FOOT = (l, r = 'Windsor, Ontario') => `<div class="foot"><span>${l}</span><span>${r}</span></div>`;
const sample = (n, kind, title, sub, k) => page(`${BR}<div class="num">${k}</div>
  <div style="position:absolute;left:72px;top:150px;width:440px">
    <div class="tag">${kind}</div>
    <h2 style="margin-top:34px">${title}</h2>
    <p class="lead">${sub}</p>
    <p class="lead" style="font-size:24px;color:#8c8075;margin-top:40px">Sample design · fictional shop</p>
  </div>
  <div class="phone" style="left:600px;top:150px;transform:rotate(3deg)"><img src="${img(n + '-0.png')}"></div>
  <div class="phone" style="left:96px;top:745px;transform:rotate(-5deg) scale(.6);transform-origin:top left"><img src="${img(n + '-1.png')}"></div>
  ${FOOT('Free preview for your shop. DM me.')}`);
const NFC = '<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 30a12 12 0 0 1 0-16"/><path d="M18 26a6 6 0 0 1 0-8"/><path d="M26 18a6 6 0 0 1 0 8"/><path d="M32 14a12 12 0 0 1 0 16"/></svg>';
const POSTS = [
  ['01-cover', page(`${BR}
    <div style="position:absolute;left:72px;right:72px;top:250px">
      <div class="tag">Windsor · Tecumseh · LaSalle</div>
      <h1 style="margin-top:44px">Websites for<br><em>local shops.</em></h1>
      <p class="lead" style="max-width:820px">Your menu, hours, photos, a map and a call button. Made for phones, ready in about a week.</p>
    </div>
    <div class="phone" style="left:640px;top:820px;transform:rotate(6deg) scale(.62);transform-origin:top left"><img src="${img('cafe-0.png')}"></div>
    <div class="phone" style="left:380px;top:860px;transform:rotate(-4deg) scale(.62);transform-origin:top left"><img src="${img('salon-0.png')}"></div>
    <div class="phone" style="left:120px;top:900px;transform:rotate(-12deg) scale(.62);transform-origin:top left"><img src="${img('pizza-0.png')}"></div>`)],
  ['02-cafe', sample('cafe', 'Café & bakery', 'A café site that <em>feels</em> like the café.', 'Menu with photos, opening hours, catering and directions.', '01 / 04')],
  ['03-pizza', sample('pizza', 'Pizza bar', 'Order buttons <em>right</em> at the top.', 'Today’s pizzas, party trays and a one-tap call button.', '02 / 04')],
  ['04-salon', sample('salon', 'Hair studio', 'Services and prices, <em>clear</em> at a glance.', 'Book with one tap. Your photos, your style.', '03 / 04')],
  ['05-barber', sample('barber', 'Barbershop', 'Bold, simple, <em>easy</em> to book.', 'Cuts, prices and hours. Walk in or book your chair.', '04 / 04')],
  ['06-included', page(`${BR}
    <div style="position:absolute;left:72px;right:72px;top:190px">
      <div class="tag">What you get</div>
      <h2 style="margin-top:34px">Everything customers <em>look for.</em></h2>
      <ul class="ck"><li>Menu and prices</li><li>Opening hours, with “Open now”</li><li>Your photos</li><li>Map and directions</li><li>Tap to call</li><li>On your Google Maps listing</li></ul>
    </div>${FOOT('One page. Works great on phones.')}`)],
  ['07-how', page(`${BR}
    <div style="position:absolute;left:72px;right:72px;top:190px">
      <div class="tag">How it works</div>
      <h2 style="margin-top:34px">Simple, from <em>start</em> to finish.</h2>
      <ol class="st"><li><div><b>Free preview</b><span>I make a preview for your shop and show you.</span></div></li>
      <li><div><b>Say yes</b><span>Pay half. Send your menu and a few photos.</span></div></li>
      <li><div><b>About a week</b><span>Two rounds of changes included.</span></div></li>
      <li><div><b>You’re live</b><span>On your own web address. Then pay the rest.</span></div></li></ol>
    </div>${FOOT('No monthly hosting fees.')}`, 'light')],
  ['08-pricing', page(`${BR}
    <div style="position:absolute;left:72px;right:72px;top:190px">
      <div class="tag">Pricing · CAD</div>
      <h2 style="margin-top:34px">One-page website</h2>
      <div class="price"><s>$400</s><b>$250</b></div>
      <p class="lead" style="margin-top:6px">Launch price for our first three shops. One time.</p>
      <div class="rows"><div>Extra page<i>$100</i></div><div>Updates<i>$25 / month or $20 each</i></div><div>Web address<i>~$20 / year</i></div><div>Google review cards (2)<i>$39</i></div></div>
    </div>${FOOT('Free preview first. Pay half to start.')}`)],
  ['09-cards', page(`${BR}
    <div style="position:absolute;left:72px;right:72px;top:190px">
      <div class="tag">Google review cards</div>
      <h2 style="margin-top:34px">More reviews, <em>one tap</em> away.</h2>
      <p class="lead">Customers tap their phone on the card and your Google review page opens. Two cards for $39, free with a website.</p>
    </div>
    <div class="card" style="left:230px;top:760px;transform:rotate(-6deg)"><div class="t">Enjoyed your visit?<br><em>Tap for a review.</em></div><span class="s">★★★★★</span>${NFC}</div>
    ${FOOT('No monthly fee.')}`)],
];
const ICON = page(`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column">
  <div style="font:400 560px/.8 'Instrument Serif',serif;font-style:italic;color:#f4efe6;margin-top:-40px">S</div>
  <div style="font:500 50px/1 Jost;letter-spacing:.42em;color:#e3a57c;margin-top:40px;margin-left:.42em">WEB</div></div>`).replace('height:1350px', 'height:1080px');
const fontRoute = async r => {
  try {
    const body = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36', r.request().url()], { maxBuffer: 1 << 26 });
    r.fulfill({ body, contentType: r.request().url().includes('css2') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } });
  } catch (e) { r.abort(); }
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1350 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, fontRoute);
  const p = await ctx.newPage();
  for (const [name, html] of POSTS) {
    fs.writeFileSync(require('os').tmpdir() + '/ig-tmp.html', html);
    await p.goto('file://' + require('os').tmpdir() + '/ig-tmp.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + '/' + name + '.jpg', type: 'jpeg', quality: 86 });
  }
  await p.setViewportSize({ width: 1080, height: 1080 });
  fs.writeFileSync(require('os').tmpdir() + '/ig-tmp.html', ICON);
  await p.goto('file://' + require('os').tmpdir() + '/ig-tmp.html'); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: OUT + '/00-icon.jpg', type: 'jpeg', quality: 88 });
  await b.close();
})();
