// Xの投稿に付ける図解画像（x-images/*.jpg）を作る。競合の伸びている投稿（短い一言＋図解1枚）に合わせた形（2026-10-12）。
// 使い方（このフォルダで。playwright は全体に入っているものを使う）:
//   npm install                                   … 日本語フォント（@fontsource）を入れる
//   NODE_PATH=$(npm root -g) node shot.js ../../../sorasora1120.github.io/salon.html out/_salon_m.jpg 390 844 0 0
//   NODE_PATH=$(npm root -g) node shot.js ../../../sorasora1120.github.io/design.html out/_design_top.jpg 1440 900 0 0
//   DSF=1.5 NODE_PATH=$(npm root -g) node ximg.js yoyaku_saki font_yasashii …   … 正方形の図解（1620px）
//   DSF=2 NODE_PATH=$(npm root -g) node ximg.js salon design                    … サンプルの紹介（2400×1350）
//   できた out/<id>.jpg を ../../x-images/ にコピーし、x_posts.js の X_IMAGES に書く
// 画面はすべてイメージ（架空のお店）。写真は sorasora1120.github.io の assets/photos（CC0）を使う
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const FD = process.env.FONTS || path.join(__dirname, 'node_modules/@fontsource');
const PH = process.env.PHOTOS || path.resolve(__dirname, '../../../sorasora1120.github.io/assets/photos');
const OUT = process.env.OUT || path.join(__dirname, 'out');
const FONTS = ['zen-kaku-gothic-new/400', 'zen-kaku-gothic-new/500', 'zen-kaku-gothic-new/700', 'zen-kaku-gothic-new/900',
  'zen-maru-gothic/500', 'zen-maru-gothic/700', 'm-plus-rounded-1c/500', 'm-plus-rounded-1c/800', 'kosugi-maru/400',
  'shippori-mincho/500', 'shippori-mincho/700', 'zen-old-mincho/500', 'zen-old-mincho/700', 'noto-serif-jp/500', 'noto-serif-jp/700',
  'dela-gothic-one/400', 'rocknroll-one/400', 'mochiy-pop-one/400', 'noto-sans-jp/400', 'noto-sans-jp/500', 'noto-sans-jp/700', 'jost/400', 'jost/500'];

const CSS = `
*{box-sizing:border-box}
html,body{margin:0}
body{width:1080px;height:1080px;background:#f6f3ed;font-family:'Zen Kaku Gothic New',sans-serif;color:#25303b;position:relative;overflow:hidden}
.wrap{position:absolute;inset:0;padding:58px 64px 46px;display:flex;flex-direction:column}
.tag{align-self:flex-start;background:#e2edf7;color:#2c6aa0;font-weight:700;font-size:25px;padding:6px 18px;border-radius:999px;letter-spacing:.04em}
h1{font-weight:900;font-size:60px;line-height:1.3;margin:16px 0 0;letter-spacing:.01em}
h1 em{font-style:normal;background:linear-gradient(transparent 64%,#ffe08a 64%)}
.lead{font-size:27px;color:#5b6772;margin-top:10px;line-height:1.5;font-weight:500}
.main{flex:1;display:flex;gap:30px;margin-top:46px;min-height:0}
.foot{display:flex;align-items:center;gap:10px;margin-top:24px;font-size:23px;color:#76818b;font-weight:700}
.foot .note{margin-left:auto;font-weight:500;font-size:20px;color:#9aa3ab}
.cloud{width:34px;height:22px;position:relative;display:inline-block}
.cloud i{position:absolute;background:#9cc9ec;border-radius:50%}
/* 比べるパネル */
.cmp{flex:1;display:flex;flex-direction:column;align-items:center;background:#fff;border-radius:30px;padding:40px 20px 22px;position:relative;border:2px solid #e6dfd4}
.cmp .badge{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-weight:900;font-size:25px;color:#fff;padding:5px 22px;border-radius:999px;white-space:nowrap;letter-spacing:.04em}
.cmp.ng .badge{background:#d9695d}
.cmp.ok{border-color:#a7d6c4}
.cmp.ok .badge{background:#2f8f6f}
.cap{margin-top:16px;font-size:24px;line-height:1.45;text-align:center;font-weight:700}
.cmp.ng .cap{color:#b4544a}
.cmp.ok .cap{color:#25785c}
/* スマホ */
.phone{width:272px;height:500px;border:9px solid #2a2f36;border-radius:40px;background:#fff;position:relative;overflow:hidden;flex:none}
.phone:before{content:'';position:absolute;top:7px;left:50%;transform:translateX(-50%);width:70px;height:19px;border-radius:12px;background:#2a2f36;z-index:9}
.scr{position:absolute;inset:0;padding-top:34px;font-family:'Noto Sans JP',sans-serif;font-size:13px;color:#333;line-height:1.5}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #eee;background:#fff}
.logo{font-family:'Shippori Mincho',serif;font-weight:700;font-size:16px;letter-spacing:.02em}
.btn{display:inline-block;background:#2b2b2b;color:#fff;border-radius:999px;padding:5px 12px;font-size:11.5px;font-weight:700}
.pad{padding:12px 14px}
.ph{background-size:cover;background-position:center}
.tap{position:absolute;width:46px;height:46px;border-radius:50%;background:rgba(61,143,209,.28);border:3px solid rgba(61,143,209,.75)}
.modal{position:absolute;inset:0;background:rgba(20,24,28,.45);display:flex;align-items:center;justify-content:center;z-index:5}
.modal .box{background:#fff;border-radius:14px;width:200px;padding:16px 14px;text-align:center;font-size:12.5px;line-height:1.6}
.chip{display:inline-block;border:1.5px solid #ccc;border-radius:999px;padding:3px 10px;font-size:11.5px;margin:0 4px 6px 0}
.chip.on{border-color:#2b2b2b;background:#2b2b2b;color:#fff}
.slots{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
.slots span{border:1px solid #ddd;border-radius:6px;text-align:center;font-size:11px;padding:4px 0}
.slots span.x{color:#bbb;background:#f6f6f6}
.slots span.on{background:#2f8f6f;color:#fff;border-color:#2f8f6f}
.wide{display:block;text-align:center;border-radius:10px;padding:9px 0;font-weight:700;font-size:13px}
.lbl{font-size:11px;color:#888;margin:10px 0 5px;font-weight:700}
/* 3つ並べる */
.trio{flex:1;display:flex;gap:22px}
.trio .it{flex:1;display:flex;flex-direction:column;align-items:center;background:#fff;border-radius:26px;border:2px solid #e6dfd4;padding:22px 12px 18px}
.trio .num{font-weight:900;font-size:26px;color:#2c6aa0}
.trio .ttl{font-weight:900;font-size:27px;margin:2px 0 14px;text-align:center;line-height:1.3}
.trio .phone{width:236px;height:430px;border-width:8px;border-radius:34px}
.trio .cap{font-size:21.5px;color:#4e5a64;font-weight:700;margin-top:14px}
/* フォントの見本 */
.fonts{flex:1;display:flex;flex-direction:column;gap:20px}
.fonts .f{flex:1;background:#fff;border-radius:26px;border:2px solid #e6dfd4;padding:22px 34px;display:flex;flex-direction:column;justify-content:center}
.fonts .nm{font-size:22px;color:#6b7680;font-weight:700;display:flex;gap:12px;align-items:center}
.fonts .nm b{color:#25303b;font-size:25px}
.fonts .nm span{margin-left:auto;font-size:19px;background:#eef4ea;color:#4f7a3c;border-radius:999px;padding:3px 12px}
.fonts .smp{font-size:50px;line-height:1.35;margin-top:8px}
.fonts .abc{font-size:26px;color:#7a8590;margin-top:4px}
`;

const foot = (note = '') => `<div class="foot"><span class="cloud"><i style="left:0;top:8px;width:16px;height:14px"></i><i style="left:8px;top:0;width:18px;height:18px"></i><i style="left:18px;top:7px;width:16px;height:15px"></i></span>ソラ｜Web制作${note ? `<span class="note">${note}</span>` : ''}</div>`;
const page = ({ tag, title, lead = '', main, note = '' }) =>
  `<div class="wrap"><div class="tag">${tag}</div><h1>${title}</h1>${lead ? `<div class="lead">${lead}</div>` : ''}<div class="main">${main}</div>${foot(note)}</div>`;
const cmp = (kind, label, inner, cap) => `<div class="cmp ${kind}"><div class="badge">${label}</div>${inner}<div class="cap">${cap}</div></div>`;
const phone = (inner, style = '') => `<div class="phone" style="${style}"><div class="scr">${inner}</div></div>`;
const photo = (name, h, extra = '') => `<div class="ph" style="height:${h}px;background-image:url('file://${PH}/${name}.jpg');${extra}"></div>`;
const salonHdr = `<div class="hdr"><span class="logo">Lumière</span><span class="btn">ご予約</span></div>`;

const IMAGES = {};

// 予約ボタンを押したら電話番号だけ → 予約できる画面
IMAGES.yoyaku_saki = () => page({
  tag: 'お店のサイト', title: '「ご予約はこちら」の先は、<br><em>予約できる画面</em>に',
  note: '※画面はイメージです',
  main:
    cmp('ng', 'よくある', phone(`${salonHdr}${photo('salon1', 150)}
      <div class="pad"><div style="font-family:'Shippori Mincho';font-weight:700;font-size:17px;line-height:1.5">毎朝の鏡が、<br>少し楽しみになる髪へ。</div>
      <div style="margin-top:12px"><span class="wide" style="background:#2b2b2b;color:#fff">ご予約はこちら</span></div></div>
      <div class="modal"><div class="box"><b style="font-size:14px">ご予約はお電話で</b><br>TEL 00-0000-0000<br><span style="color:#888;font-size:11px">受付 10:00〜18:00（火曜休み）</span></div></div>
      <div class="tap" style="left:110px;top:322px"></div>`), '押したら<br>電話番号が出るだけ')
    + cmp('ok', 'こうすると', phone(`${salonHdr}<div class="pad"><b style="font-size:15px">ご予約</b>
      <div class="lbl">メニュー</div><span class="chip on">カット</span><span class="chip">カラー</span><span class="chip">パーマ</span>
      <div class="lbl">日にち</div><span class="chip">10/14 火</span><span class="chip on">10/15 水</span><span class="chip">10/16 木</span>
      <div class="lbl">時間</div><div class="slots"><span class="x">10:00</span><span>11:00</span><span class="on">13:00</span><span class="x">14:00</span><span>15:00</span><span class="x">16:00</span><span>17:00</span><span>18:00</span></div>
      <div style="margin-top:14px"><span class="wide" style="background:#2f8f6f;color:#fff">この内容で予約する</span></div>
      <div style="text-align:center;font-size:10.5px;color:#999;margin-top:6px">お電話でもご予約できます</div></div>`), 'その場で<br>日にちと時間まで選べる'),
});

// やさしい雰囲気のフォント3つ
IMAGES.font_yasashii = () => page({
  tag: 'フォント', title: 'やさしい雰囲気にしたい時の<br><em>フォント3つ</em>',
  main: `<div class="fonts">${[
    ['Zen Maru Gothic', "'Zen Maru Gothic'", 500, 'まるくて、すっきり。パン屋・カフェに'],
    ['M PLUS Rounded 1c', "'M PLUS Rounded 1c'", 500, '少しポップ。子ども向け・習いごとに'],
    ['Kosugi Maru', "'Kosugi Maru'", 400, '素朴でやわらかい。手作りのお店に'],
  ].map(([n, ff, w, d]) => `<div class="f"><div class="nm"><b>${n}</b>${d}<span>無料</span></div>
      <div class="smp" style="font-family:${ff};font-weight:${w}">焼きたてのパンと、ゆっくりした朝。</div>
      <div class="abc" style="font-family:${ff};font-weight:${w}">あいうえお アイウエオ ABC 123</div></div>`).join('')}</div>`,
  note: 'どれも Google Fonts で無料',
});

// 予約ボタンの置き方 3パターン
IMAGES.yoyaku_3 = () => {
  const body = `${photo('salon2', 120)}<div class="pad"><div style="height:9px;background:#eee;border-radius:5px;width:80%"></div><div style="height:9px;background:#eee;border-radius:5px;width:92%;margin-top:7px"></div><div style="height:9px;background:#eee;border-radius:5px;width:70%;margin-top:7px"></div>
    <div style="height:70px;background:#f3efe9;border-radius:8px;margin-top:12px"></div><div style="height:9px;background:#eee;border-radius:5px;width:86%;margin-top:12px"></div><div style="height:9px;background:#eee;border-radius:5px;width:60%;margin-top:7px"></div></div>`;
  const hi = 'background:#2f8f6f;color:#fff';
  return page({
    tag: 'お店のサイト', title: '予約ボタンの置き方 <em>3パターン</em>',
    lead: 'どれか1つでOK。いちばん困るのは「どこにもない」こと',
    main: `<div class="trio">
      <div class="it"><div class="num">①</div><div class="ttl">上にずっと出す</div>${phone(`<div class="hdr"><span class="logo" style="font-size:14px">Lumière</span><span class="btn" style="${hi}">ご予約</span></div>${body}`)}<div class="cap">どこまで読んでも<br>すぐ押せる</div></div>
      <div class="it"><div class="num">②</div><div class="ttl">下にずっと出す</div>${phone(`<div class="hdr"><span class="logo" style="font-size:14px">Lumière</span><span></span></div>${body}<div style="position:absolute;left:0;right:0;bottom:0;padding:9px 12px;background:#fff;border-top:1px solid #eee"><span class="wide" style="${hi}">空き状況を見る</span></div>`)}<div class="cap">親指が<br>届きやすい</div></div>
      <div class="it"><div class="num">③</div><div class="ttl">読み終わりに大きく</div>${phone(`<div class="hdr"><span class="logo" style="font-size:14px">Lumière</span><span></span></div><div class="pad"><div style="height:9px;background:#eee;border-radius:5px;width:86%"></div><div style="height:9px;background:#eee;border-radius:5px;width:64%;margin-top:7px"></div>
        <div style="height:80px;background:#f3efe9;border-radius:8px;margin-top:12px"></div><div style="margin-top:16px;padding:16px 12px;border-radius:12px;background:#eef7f3;text-align:center"><b style="font-size:12.5px">気になったら、<br>まずは空き状況から</b><span class="wide" style="${hi};margin-top:10px">空き状況を見る</span></div></div>`)}<div class="cap">読んで納得した<br>ところで押せる</div></div></div>`,
    note: '※画面はイメージです',
  });
};


// ---- 入力フォーム・アクセス・料金・メニュー ----
const field = (label, value, st = '', note = '') => `<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:#555;margin-bottom:3px">${label}</div>
  <div style="border:1.5px solid ${st === 'ng' ? '#d9534f' : st === 'ok' ? '#2f8f6f' : '#d5d5d5'};border-radius:8px;padding:7px 9px;font-size:13px;background:${st === 'ng' ? '#fff5f4' : '#fff'};display:flex;justify-content:space-between"><span>${value}</span>${st === 'ok' ? '<span style="color:#2f8f6f;font-weight:700">✓</span>' : ''}</div>
  ${note ? `<div style="font-size:11px;margin-top:3px;font-weight:700;color:${st === 'ng' ? '#d9534f' : '#2f8f6f'}">${note}</div>` : ''}</div>`;
const formHdr = (t) => `<div class="hdr"><span style="font-weight:700;font-size:13px">${t}</span><span></span></div>`;

IMAGES.form_zenkaku = () => page({
  tag: '入力フォーム', title: '全角でも半角でも、<br><em>そのまま通る</em>フォームに', note: '※画面はイメージです',
  main:
    cmp('ng', 'よくある', phone(`${formHdr('お問い合わせ')}<div class="pad">${field('お名前', '山田 花子')}${field('電話番号', '０９０－１２３４－５６７８', 'ng', '半角数字で入力してください')}${field('メールアドレス', 'hanako@example.com')}
      <div style="margin-top:14px"><span class="wide" style="background:#ccc;color:#fff">送信</span></div></div>`), '全角で入れたら<br>エラーで止まる')
    + cmp('ok', 'こうすると', phone(`${formHdr('お問い合わせ')}<div class="pad">${field('お名前', '山田 花子')}${field('電話番号', '０９０－１２３４－５６７８', 'ok', '全角・ハイフンありでもOK')}${field('メールアドレス', 'hanako@example.com')}
      <div style="margin-top:14px"><span class="wide" style="background:#2f8f6f;color:#fff">確認へ進む</span></div></div>`), 'どっちで入れても<br>中で直して受け付ける'),
});

const mapBox = (h, pin = true) => `<div style="height:${h}px;border-radius:10px;position:relative;overflow:hidden;background:#e9ece4;
  background-image:linear-gradient(90deg,transparent 46%,#fff 46%,#fff 54%,transparent 54%),linear-gradient(0deg,transparent 40%,#fff 40%,#fff 47%,transparent 47%),linear-gradient(35deg,transparent 70%,#fbe7b5 70%,#fbe7b5 76%,transparent 76%)">
  ${pin ? '<div style="position:absolute;left:58%;top:28%;width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#e25b4f;border:3px solid #fff"></div>' : ''}</div>`;
IMAGES.map_access = () => page({
  tag: 'お店のサイト', title: 'アクセスは<br><em>押せる・コピーできる</em>に', note: '※画面はイメージです',
  main:
    cmp('ng', 'よくある', phone(`${formHdr('アクセス')}<div class="pad">${mapBox(170)}
      <div style="margin-top:12px;border:1px dashed #bbb;border-radius:6px;padding:8px;font-size:12.5px;color:#444;filter:blur(.3px);background:#fafafa">〒000-0000 〇〇市〇〇町1-2-3<br>TEL 00-0000-0000<div style="font-size:9.5px;color:#aaa;text-align:right">（画像）</div></div>
      <div style="margin-top:10px;font-size:11.5px;color:#999;text-align:center">タップしても何も起きない…</div></div>
      <div class="tap" style="left:120px;top:120px"></div>`), '地図も住所も画像で<br>押しても何も起きない')
    + cmp('ok', 'こうすると', phone(`${formHdr('アクセス')}<div class="pad">${mapBox(120)}
      <div style="margin-top:10px;font-size:13px;line-height:1.6"><b>〇〇駅 東口から徒歩3分</b><br>〒000-0000 〇〇市〇〇町1-2-3 2F</div>
      <div style="display:flex;gap:6px;margin-top:8px"><span class="wide" style="flex:1;background:#2f8f6f;color:#fff;font-size:12px">地図アプリで開く</span><span class="wide" style="flex:none;width:70px;border:1.5px solid #2f8f6f;color:#2f8f6f;font-size:12px">コピー</span></div>
      <div style="margin-top:8px"><span class="wide" style="border:1.5px solid #ccc;color:#333;font-size:12px">📞 電話する</span></div></div>`), '押せば地図アプリ<br>住所はコピーできる'),
});

IMAGES.ryokin = () => page({
  tag: 'お店のサイト', title: '料金は<br><em>"目安"だけでも</em>書いておく', note: '※画面はイメージです',
  main:
    cmp('ng', 'よくある', phone(`${salonHdr}<div class="pad"><b style="font-size:15px">料金</b>
      <div style="margin-top:12px;font-size:13px;line-height:1.8;color:#444">料金はお客様の髪の状態によって異なります。<br>お気軽にご相談ください。</div>
      <div style="margin-top:16px"><span class="wide" style="background:#2b2b2b;color:#fff">お問い合わせ</span></div></div>`), 'いくらか分からないと<br>逆に相談しづらい')
    + cmp('ok', 'こうすると', phone(`${salonHdr}<div class="pad"><b style="font-size:15px">料金のめやす</b>
      ${[['カット', '4,400円〜'], ['カラー', '6,600円〜'], ['パーマ', '8,800円〜'], ['トリートメント', '3,300円〜']].map(([a, b]) => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px 2px;font-size:13.5px"><span>${a}</span><b>${b}</b></div>`).join('')}
      <div style="margin-top:10px;font-size:11px;color:#777;line-height:1.6">※髪の長さや状態で変わります。<br>くわしくはご予約のときにお伝えします。</div></div>`), 'だいたい分かると<br>安心して予約できる'),
});

IMAGES.form_5 = () => {
  const row = (n, t, d, vis) => `<div style="flex:1;display:flex;align-items:center;gap:22px;background:#fff;border-radius:22px;border:2px solid #e6dfd4;padding:0 26px">
    <div style="flex:none;width:52px;height:52px;border-radius:50%;background:#2c6aa0;color:#fff;font-weight:900;font-size:28px;display:flex;align-items:center;justify-content:center">${n}</div>
    <div style="flex:1"><div style="font-weight:900;font-size:30px">${t}</div><div style="font-size:21px;color:#6b7680;margin-top:2px;font-weight:500">${d}</div></div>
    <div style="flex:none;width:300px;display:flex;justify-content:flex-end;font-family:'Noto Sans JP'">${vis}</div></div>`;
  const box = (t, c = '#d5d5d5', bg = '#fff') => `<span style="border:2px solid ${c};background:${bg};border-radius:10px;padding:6px 12px;font-size:20px">${t}</span>`;
  return page({
    tag: '入力フォーム', title: '入力フォームが<em>楽になる5つ</em>',
    main: `<div style="flex:1;display:flex;flex-direction:column;gap:14px">
      ${row(1, '聞くことは少なく', '必須は名前と連絡先だけ、など', `<span style="font-size:20px;color:#888">必須 <s style="color:#d9534f">8個</s> → <b style="color:#2f8f6f">2個</b></span>`)}
      ${row(2, '郵便番号で住所が出る', '番地から下だけ入れればいい', `<span style="font-size:19px">${box('000-0000')} → <span style="color:#2f8f6f;font-weight:700">〇〇市〇〇町</span></span>`)}
      ${row(3, 'エラーはその場で、具体的に', 'どこが・どう違うかまで出す', `<div style="text-align:left">${box('hanako.example.com', '#d9534f', '#fff5f4')}<div style="color:#d9534f;font-size:17px;font-weight:700;margin-top:4px">「@」が入っていません</div></div>`)}
      ${row(4, '全角・半角はどっちでもOK', '受け取った側で直す', `<span style="font-size:22px">０９０ ＝ 090 <b style="color:#2f8f6f">✓</b></span>`)}
      ${row(5, 'ボタンに「押すと何が起きるか」', '「送信」より行き先が分かる言葉', `<span style="background:#2f8f6f;color:#fff;border-radius:12px;padding:9px 14px;font-size:17px;font-weight:700;white-space:nowrap">空き状況を聞いてみる</span>`)}
    </div>`,
  });
};

IMAGES.menu_pdf = () => page({
  tag: '飲食店のサイト', title: 'メニューは<br><em>PDFより文字</em>で', note: '※画面はイメージです',
  main:
    cmp('ng', 'よくある', phone(`<div style="position:absolute;inset:0;background:#5a5f66;padding-top:34px"><div style="background:#3f4349;color:#ddd;font-size:11px;padding:7px 12px">menu.pdf　1 / 3</div>
      <div style="margin:22px auto 0;width:150px;height:212px;background:#fff;padding:12px 10px">
      <div style="font-size:8px;font-weight:700;text-align:center">MENU</div>${Array.from({ length: 16 }, (_, i) => `<div style="height:3px;background:#ccc;margin-top:${i % 4 === 0 ? 9 : 4}px;width:${60 + (i * 37) % 35}%"></div>`).join('')}</div>
      <div style="text-align:center;color:#eee;font-size:11.5px;margin-top:22px">ピンチで拡大して読む…</div></div>
      <div class="tap" style="left:70px;top:190px;width:34px;height:34px"></div><div class="tap" style="left:150px;top:270px;width:34px;height:34px"></div>`), '拡大しないと<br>読めない')
    + cmp('ok', 'こうすると', phone(`<div class="hdr"><span style="font-family:'Zen Maru Gothic';font-weight:700;font-size:14px">カフェ こもれび</span><span></span></div><div class="pad">
      <b style="font-size:14px">ランチ</b><span style="font-size:10.5px;color:#888">　11:00〜14:00</span>
      ${[['日替わりランチ', 'スープ・サラダ付き', '1,200円'], ['オムライス', 'きのこのデミソース', '1,100円'], ['ナポリタン', '昔ながらの味', '1,000円']].map(([a, b, c]) => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:7px 0"><span style="font-size:13px">${a}<br><span style="font-size:10.5px;color:#888">${b}</span></span><b style="font-size:13px">${c}</b></div>`).join('')}
      <b style="font-size:14px;display:block;margin-top:12px">ドリンク</b>
      ${[['ブレンドコーヒー', '450円'], ['自家製レモネード', '550円']].map(([a, c]) => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:7px 0;font-size:13px"><span>${a}</span><b>${c}</b></div>`).join('')}</div>`), 'そのまま読める<br>値段もすぐ分かる'),
});

IMAGES.font_jouhin = () => page({
  tag: 'フォント', title: '上品に見せたい時の<br><em>明朝体3つ</em>',
  main: `<div class="fonts">${[
    ['Shippori Mincho', "'Shippori Mincho'", 500, 'しっとり、ていねい。和食・旅館に'],
    ['Zen Old Mincho', "'Zen Old Mincho'", 500, '少しレトロで味がある。和菓子・雑貨に'],
    ['Noto Serif JP', "'Noto Serif JP'", 500, 'くせが少なく読みやすい。士業・病院に'],
  ].map(([n, ff, w, d]) => `<div class="f"><div class="nm"><b>${n}</b>${d}<span>無料</span></div>
      <div class="smp" style="font-family:${ff};font-weight:${w}">季節の器と、静かなひととき。</div>
      <div class="abc" style="font-family:${ff};font-weight:${w}">あいうえお アイウエオ ABC 123</div></div>`).join('')}</div>`,
  note: 'どれも Google Fonts で無料',
});

// ---- トップ・スタッフ・エラー・白・営業時間・元気なフォント ----
IMAGES.welcome = () => page({
  tag: 'お店のサイト', title: '最初の一行は<br><em>"何のお店か"</em>', note: '※画面はイメージです',
  main:
    cmp('ng', 'よくある', phone(`<div class="hdr"><span class="logo">Lumière</span><span>≡</span></div>${photo('salon3', 360, 'position:relative')}
      <div style="position:absolute;left:0;right:0;top:150px;text-align:center;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.4)"><div style="font-family:'Shippori Mincho';font-size:38px;letter-spacing:.12em">WELCOME</div><div style="font-size:12px;letter-spacing:.2em">to our salon</div></div>
      <div style="text-align:center;font-size:18px;color:#aaa;margin-top:12px">↓</div>`), '何のお店か<br>スクロールしないと分からない')
    + cmp('ok', 'こうすると', phone(`<div class="hdr"><span class="logo">Lumière</span><span class="btn">ご予約</span></div>${photo('salon3', 170)}
      <div class="pad"><div style="font-size:11.5px;color:#777">〇〇駅から徒歩3分の美容室</div>
      <div style="font-family:'Shippori Mincho';font-weight:700;font-size:21px;line-height:1.45;margin-top:4px">くせ毛を、<br>扱いやすい髪に。</div>
      <div style="font-size:12.5px;margin-top:6px">カット 4,400円〜 ／ 火曜定休</div>
      <div style="margin-top:12px"><span class="wide" style="background:#2f8f6f;color:#fff">空き状況を見る</span></div></div>`), '誰の・何のお店か<br>開いてすぐ分かる'),
});

const avatar = (bg, hair) => `<div style="flex:none;width:46px;height:46px;border-radius:50%;background:${bg};position:relative;overflow:hidden">
  <div style="position:absolute;left:14px;top:9px;width:18px;height:18px;border-radius:50%;background:#f3d9c4;box-shadow:0 -4px 0 2px ${hair}"></div>
  <div style="position:absolute;left:7px;top:29px;width:32px;height:24px;border-radius:50% 50% 0 0;background:#fff;opacity:.85"></div></div>`;
const staffCard = (name, bg, hair, line, tag) => `<div style="display:flex;gap:10px;align-items:center;border-bottom:1px solid #eee;padding:9px 0">${avatar(bg, hair)}
  <div style="flex:1"><b style="font-size:13px">${name}</b>${tag ? `<span style="margin-left:6px;font-size:10px;background:#e7f4ee;color:#25785c;border-radius:999px;padding:2px 8px;font-weight:700">${tag}</span>` : ''}<div style="font-size:11.5px;color:#555;margin-top:2px;line-height:1.45">${line}</div></div></div>`;
IMAGES.staff = () => page({
  tag: '美容室のサイト', title: 'スタッフ紹介に<br><em>"得意なこと"</em>を一言', note: '※画面・名前はイメージです',
  main:
    cmp('ng', 'よくある', phone(`${salonHdr}<div class="pad"><b style="font-size:15px">スタッフ</b>
      ${staffCard('佐藤 あや', '#f2d7d0', '#5a4034', 'よろしくお願いします！')}${staffCard('鈴木 けん', '#d6e4f0', '#2f2a28', 'よろしくお願いします！')}${staffCard('高橋 みく', '#e3ecd6', '#7a5236', 'よろしくお願いします！')}</div>`), '全員同じだと<br>誰に頼めばいいか分からない')
    + cmp('ok', 'こうすると', phone(`${salonHdr}<div class="pad"><b style="font-size:15px">スタッフ</b>
      ${staffCard('佐藤 あや', '#f2d7d0', '#5a4034', '朝のセットが5分で終わる形にします', 'ショートが得意')}${staffCard('鈴木 けん', '#d6e4f0', '#2f2a28', '広がる・うねるの相談、まかせてください', 'くせ毛に強い')}${staffCard('高橋 みく', '#e3ecd6', '#7a5236', '色落ちまでかわいい色を考えます', '明るめカラー')}</div>`), '得意なことで<br>選べる'),
});

IMAGES.error_doko = () => page({
  tag: '入力フォーム', title: 'エラーは<br><em>"どこが・どう違うか"</em>まで', note: '※画面はイメージです',
  main:
    cmp('ng', 'よくある', phone(`${formHdr('ご予約フォーム')}<div style="background:#fdecea;color:#c0392b;font-size:12px;font-weight:700;padding:8px 12px">入力内容に誤りがあります</div><div class="pad">${field('お名前', '山田 花子')}${field('メールアドレス', 'hanako.example.com')}${field('電話番号', '090123456')}${field('ご希望日', '10月15日')}
      <div style="margin-top:12px"><span class="wide" style="background:#2b2b2b;color:#fff">送信</span></div></div>`), 'どこが違うのか<br>探すところから')
    + cmp('ok', 'こうすると', phone(`${formHdr('ご予約フォーム')}<div class="pad">${field('お名前', '山田 花子')}${field('メールアドレス', 'hanako.example.com', 'ng', '「@」が入っていません')}${field('電話番号', '090123456', 'ng', 'あと1〜2けた足りないようです')}${field('ご希望日', '10月15日')}
      <div style="margin-top:12px"><span class="wide" style="background:#2b2b2b;color:#fff">確認へ進む</span></div></div>`), '直すところが<br>すぐ分かる'),
});

IMAGES.shiro10 = () => {
  const W = [['#FFFFFF', '真っ白'], ['#FDFCF9', 'ほぼ白'], ['#FBF8F2', '生成り'], ['#F7F3EA', '和紙'], ['#FFFBF0', 'クリーム'],
    ['#FAF7F2', 'ミルク'], ['#F7F8FA', '雪'], ['#F2F6FA', '青白い'], ['#F4F4F2', 'グレー寄り'], ['#F9F5EF', '卵の殻']];
  return page({
    tag: 'デザイナーあるある', title: '<em>白、10種類</em>', lead: 'こうやって並べて、わりと真剣に選んでいます。<br>たぶん誰も気づかない。',
    main: `<div style="flex:1;display:grid;grid-template-columns:repeat(5,1fr);gap:18px;align-content:center">${W.map(([c, n]) => `<div style="text-align:center">
      <div style="aspect-ratio:1;border-radius:20px;background:${c};border:1.5px solid #e1dbd0;box-shadow:0 1px 2px rgba(0,0,0,.04)"></div>
      <div style="font-weight:900;font-size:24px;margin-top:10px">${n}</div><div style="font-size:19px;color:#8a949c;font-family:'Noto Sans JP';letter-spacing:.04em">${c}</div></div>`).join('')}</div>`,
  });
};

IMAGES.eigyo = () => page({
  tag: 'お店のサイト', title: '営業時間と定休日は<br><em>いちばん上</em>に', note: '※画面はイメージです',
  main:
    cmp('ng', 'よくある', phone(`${salonHdr}${photo('salon4', 140)}<div class="pad">${Array.from({ length: 5 }, (_, i) => `<div style="height:8px;background:#eee;border-radius:4px;margin-top:7px;width:${70 + (i * 13) % 28}%"></div>`).join('')}
      <div style="height:60px;background:#f3efe9;border-radius:8px;margin-top:10px"></div>
      <div style="text-align:center;color:#bbb;font-size:12px;margin-top:8px">⋮<br>ずっと下までスクロール…<br>⋮</div></div>
      <div style="position:absolute;left:0;right:0;bottom:0;background:#2b2b2b;color:#bbb;font-size:9px;padding:8px 12px;line-height:1.6">営業時間 10:00〜19:00　定休日 火曜・第3水曜<br>© Lumière</div>`), 'いちばん下まで<br>読まないと分からない')
    + cmp('ok', 'こうすると', phone(`${salonHdr}<div style="display:flex;align-items:center;gap:6px;background:#eef7f3;padding:8px 12px;font-size:12px"><span style="width:8px;height:8px;border-radius:50%;background:#2f8f6f;display:inline-block"></span><b style="color:#25785c">本日営業中</b><span>10:00〜19:00</span><span style="margin-left:auto;color:#666">火曜定休</span></div>${photo('salon4', 140)}<div class="pad">${Array.from({ length: 5 }, (_, i) => `<div style="height:8px;background:#eee;border-radius:4px;margin-top:7px;width:${70 + (i * 13) % 28}%"></div>`).join('')}</div>`), '開いてすぐ<br>今日やってるか分かる'),
});

IMAGES.font_genki = () => page({
  tag: 'フォント', title: '元気に見せたい時の<br><em>フォント3つ</em>',
  main: `<div class="fonts">${[
    ['Dela Gothic One', "'Dela Gothic One'", 400, '太くて目立つ。セール・イベントに'],
    ['RocknRoll One', "'RocknRoll One'", 400, '角が丸くて楽しい。子ども向け・お祭りに'],
    ['Mochiy Pop One', "'Mochiy Pop One'", 400, 'ころんとかわいい。スイーツ・雑貨に'],
  ].map(([n, ff, w, d]) => `<div class="f"><div class="nm"><b>${n}</b>${d}<span>無料</span></div>
      <div class="smp" style="font-family:${ff};font-weight:${w}">週末だけの、焼きたてフェア！</div>
      <div class="abc" style="font-family:${ff};font-weight:${w}">あいうえお アイウエオ ABC 123</div></div>`).join('')}</div>`,
  note: 'どれも Google Fonts で無料',
});

// ---- お客様の声・フォームあるある・写真から色・ボタンの文字・チラシ・文字の薄さ ----
const voice = (stars, text, who) => `<div style="border:1px solid #eee;border-radius:10px;padding:9px 10px;margin-bottom:8px;background:#fff"><div style="color:#e6a92b;font-size:11px;letter-spacing:1px">${'★'.repeat(stars)}</div><div style="font-size:12px;line-height:1.55;margin-top:2px">${text}</div>${who ? `<div style="font-size:10px;color:#888;margin-top:3px">${who}</div>` : ''}</div>`;
IMAGES.koe = () => page({
  tag: 'お店のサイト', title: 'お客様の声は<br><em>"来る前の不安"</em>がわかるもの', note: '※画面・声の内容は例です',
  main:
    cmp('ng', 'よくある', phone(`${salonHdr}<div class="pad"><b style="font-size:15px">お客様の声</b><div style="margin-top:8px">${voice(5, 'とても良かったです！また来ます！')}${voice(5, '最高でした！！')}${voice(5, 'スタッフさんが優しかったです♪')}${voice(5, 'また行きたいです！')}</div></div>`), 'ほめ言葉だけだと<br>自分に合うか分からない')
    + cmp('ok', 'こうすると', phone(`${salonHdr}<div class="pad"><b style="font-size:15px">お客様の声</b><div style="margin-top:8px">${voice(5, 'くせ毛で毎朝30分かかっていたのが、乾かすだけでまとまるように。最初に悩みを細かく聞いてもらえて安心しました。', '30代・初めての来店')}${voice(5, '初めての美容室で緊張していたけど、写真を見ながら相談できたので言いやすかったです。', '20代・学生')}</div></div>`), '同じ悩みの人が<br>「自分のことだ」と思える'),
});

IMAGES.aruaru_form = () => {
  const row = (n, t, vis) => `<div style="flex:1;display:flex;align-items:center;gap:22px;background:#fff;border-radius:22px;border:2px solid #efd9d4;padding:0 26px">
    <div style="flex:none;width:52px;height:52px;border-radius:50%;background:#d9695d;color:#fff;font-weight:900;font-size:28px;display:flex;align-items:center;justify-content:center">${n}</div>
    <div style="flex:1;font-weight:900;font-size:31px;line-height:1.35">${t}</div>
    <div style="flex:none;width:330px;display:flex;justify-content:flex-end;font-family:'Noto Sans JP'">${vis}</div></div>`;
  const err = (t) => `<span style="color:#d9534f;font-size:18px;font-weight:700;background:#fff5f4;border:2px solid #f0b8b2;border-radius:10px;padding:6px 12px">${t}</span>`;
  return page({
    tag: '入力フォームあるある', title: '入力フォームの<br><em>イラッとする瞬間</em> 5つ',
    main: `<div style="flex:1;display:flex;flex-direction:column;gap:14px">
      ${row(1, '全角で入れたら怒られる', err('半角で入力してください'))}
      ${row(2, 'パスワードの条件が<br>送ったあとに出てくる', err('記号を1つ以上含めてください'))}
      ${row(3, '「戻る」を押したら<br>全部消えた', `<span style="font-size:19px;color:#999;border:2px dashed #ccc;border-radius:10px;padding:6px 14px">（全部まっさら）</span>`)}
      ${row(4, 'メールアドレスを2回<br>しかもコピペできない', `<div style="font-size:16px;color:#666;text-align:left;line-height:1.5">メールアドレス<br>メールアドレス（確認用）<br><b style="color:#d9534f">貼り付けできません</b></div>`)}
      ${row(5, 'どこが違うのか<br>教えてくれない', err('入力内容に誤りがあります'))}
    </div>`,
  });
};

IMAGES.irodori = () => {
  const C = [['ラテの泡', '#D3B9A1', 0.47, 0.50], ['コーヒー', '#6E472E', 0.45, 0.75], ['葉っぱ', '#7CA887', 0.92, 0.43], ['お皿', '#454B47', 0.67, 0.59]];
  const W = 330, H = 495;
  return page({
    tag: '配色', title: '色に迷ったら<br><em>お店の写真から拾う</em>',
    main: `<div style="display:flex;gap:34px;flex:1;align-items:center">
      <div style="position:relative;flex:none;width:${W}px;height:${H}px;border-radius:24px;overflow:hidden;background:url('file://${PH}/cafe2.jpg') center/cover">
        ${C.map(([n, c, x, y], i) => `<div style="position:absolute;left:${x * W - 22}px;top:${y * H - 22}px;width:44px;height:44px;border-radius:50%;background:${c};border:5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);color:#fff;font-weight:900;font-size:17px;display:flex;align-items:center;justify-content:center">${i + 1}</div>`).join('')}
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:12px">
        ${C.map(([n, c], i) => `<div style="display:flex;align-items:center;gap:16px;background:#fff;border-radius:18px;border:2px solid #e6dfd4;padding:10px 16px"><div style="width:62px;height:62px;border-radius:14px;background:${c}"></div><div><b style="font-size:27px">${i + 1}. ${n}</b><div style="font-size:20px;color:#7a858f;font-family:'Noto Sans JP'">${c}</div></div></div>`).join('')}
        <div style="background:#F6EFE7;border-radius:18px;border:2px solid #e6dfd4;padding:16px 18px;margin-top:4px">
          <div style="font-family:'Zen Maru Gothic';font-weight:700;font-size:25px;color:#454B47">カフェ こもれび</div>
          <div style="font-size:17px;color:#454B47;margin-top:4px">自家焙煎のコーヒーと、季節の焼き菓子。</div>
          <div style="display:flex;gap:10px;margin-top:10px;align-items:center"><span style="background:#6E472E;color:#fff;border-radius:999px;padding:6px 16px;font-size:17px;font-weight:700">メニューを見る</span><span style="background:#7CA887;color:#fff;border-radius:999px;padding:4px 12px;font-size:15px;font-weight:700">テラス席あり</span></div>
          <div style="font-size:14px;color:#8a7f73;margin-top:8px">背景は「ラテの泡」をうすくした色</div>
        </div>
      </div></div>`,
  });
};

IMAGES.button_moji = () => {
  const B = [['送信', '空き状況を聞いてみる', '何をお願いしたのか分かる'], ['こちら', 'メニューと料金を見る', '押した先が分かる'], ['詳しくはこちら', '施術の流れを見る', '何が書いてあるか分かる'], ['お問い合わせ', '見積もりを相談する', '気軽さが伝わる']];
  return page({
    tag: 'ボタン', title: 'ボタンの文字は<br><em>"押すと何が起きるか"</em>',
    main: `<div style="flex:1;display:flex;flex-direction:column;gap:16px">${B.map(([a, b, c]) => `<div style="flex:1;display:flex;align-items:center;gap:20px;background:#fff;border-radius:22px;border:2px solid #e6dfd4;padding:0 26px">
      <span style="flex:none;width:230px;text-align:center;background:#e9e6e1;color:#8a8580;border-radius:14px;padding:14px 0;font-size:26px;font-weight:700">${a}</span>
      <span style="font-size:34px;color:#b9b2a7">→</span>
      <div style="flex:1"><span style="display:inline-block;background:#2f8f6f;color:#fff;border-radius:14px;padding:14px 22px;font-size:27px;font-weight:700">${b}</span><div style="font-size:20px;color:#25785c;font-weight:700;margin-top:6px">${c}</div></div></div>`).join('')}</div>`,
  });
};

const flyer = (inner, bg = '#fff') => `<div style="width:300px;height:424px;background:${bg};box-shadow:0 6px 18px rgba(0,0,0,.12);position:relative;overflow:hidden;flex:none">${inner}</div>`;
IMAGES.chirashi = () => page({
  tag: 'チラシ', title: 'チラシは<br><em>いちばん伝えたいこと</em>を大きく', note: '※デザインはイメージです（架空のお店）',
  main:
    cmp('ng', 'よくある', flyer(`<div style="padding:12px;font-family:'Noto Sans JP';font-weight:700;text-align:center;line-height:1.25">
      <div style="color:#e53935;font-size:23px">★新規オープン★</div><div style="color:#1e88e5;font-size:20px">ヘアサロン Lumière</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:6px">${['カット', 'カラー', 'パーマ', '縮毛矯正', 'ヘッドスパ', 'トリートメント', '着付け', 'ネイル'].map((t, i) => `<span style="font-size:15px;padding:2px 6px;border:2px solid ${['#e53935', '#1e88e5', '#43a047', '#fb8c00'][i % 4]};color:${['#e53935', '#1e88e5', '#43a047', '#fb8c00'][i % 4]}">${t}</span>`).join('')}</div>
      <div style="color:#8e24aa;font-size:18px;margin-top:8px">駐車場あり！キッズスペースあり！</div><div style="color:#43a047;font-size:18px">ポイントカード 2倍！</div>
      <div style="color:#fb8c00;font-size:18px">LINE・Instagram やってます！</div><div style="color:#e53935;font-size:19px">今だけ！！ 初回割引！！</div>
      <div style="font-size:12px;color:#333;margin-top:6px;font-weight:500">営業時間 10:00〜19:00 定休日 火曜 TEL 00-0000-0000 〇〇市〇〇町1-2-3 駐車場3台 クレジットカード可 電子マネー可</div></div>`), '全部同じ大きさだと<br>何も残らない')
    + cmp('ok', 'こうすると', flyer(`<div class="ph" style="height:190px;background-image:url('file://${PH}/salon2.jpg')"></div>
      <div style="padding:16px 18px"><div style="font-size:12px;color:#888;letter-spacing:.1em">HAIR SALON Lumière</div>
      <div style="font-family:'Shippori Mincho';font-weight:700;font-size:25px;line-height:1.4;margin-top:4px">くせ毛の悩み、<br>相談できる美容室。</div>
      <div style="font-size:12px;color:#555;margin-top:10px;line-height:1.7">10月オープン ／ 〇〇駅 東口から徒歩3分<br>営業 10:00〜19:00（火曜休み）</div>
      <div style="position:absolute;right:16px;bottom:16px;width:56px;height:56px;background:repeating-conic-gradient(#333 0 25%,#fff 0 50%) 0 0/14px 14px;border:3px solid #fff;outline:1px solid #ccc"></div></div>`, '#fbf8f3'), 'ひとつが目に入って<br>あとは近くで読める'),
});

IMAGES.mojiiro = () => {
  const txt = (style) => `${salonHdr}${photo('salon5', 130)}<div class="pad" style="${style}"><div style="font-size:15px;font-weight:700;margin-bottom:6px">私たちについて</div>髪のお悩みに合わせて、毎日扱いやすいスタイルをご提案します。初めての方も、まずはお気軽にご相談ください。<div style="margin-top:8px">営業時間 10:00〜19:00<br>定休日 火曜</div></div>
    <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.55),rgba(255,255,255,.15) 60%)"></div>`;
  return page({
    tag: 'お店のサイト', title: 'おしゃれでも<br><em>文字は薄くしすぎない</em>', note: '※明るい外で見たときのイメージです',
    main:
      cmp('ng', 'よくある', phone(txt('color:#b9b9b9;font-weight:300;font-size:11.5px;line-height:1.7')), '薄い・細い・小さいと<br>外ではほぼ読めない')
      + cmp('ok', 'こうすると', phone(txt('color:#333;font-weight:400;font-size:13.5px;line-height:1.75')), '少し濃く・大きくするだけで<br>どこでも読める'),
  });
};

// ---- デザインあるある・名刺・文字の大きさ・LPの最初の画面 ----
IMAGES.aruaru_design = () => {
  const card = (t, vis) => `<div style="background:#fff;border-radius:24px;border:2px solid #e6dfd4;padding:22px 24px;display:flex;flex-direction:column"><div style="font-weight:900;font-size:27px;line-height:1.4">${t}</div><div style="flex:1;display:flex;align-items:center;justify-content:center;margin-top:10px">${vis}</div></div>`;
  const fontsVis = `<div style="font-size:22px;line-height:1.5;width:100%">${[["'Zen Maru Gothic'", 'Zen Maru Gothic', 1], ["'Shippori Mincho'", 'Shippori Mincho'], ["'Noto Sans JP'", 'Noto Sans JP'], ["'M PLUS Rounded 1c'", 'M PLUS Rounded 1c'], ["'Dela Gothic One'", 'Dela Gothic One']].map(([f, n, on]) => `<div style="font-family:${f};${on ? 'color:#2f8f6f;font-weight:700' : 'color:#9aa3ab'}">${n}${on ? '<span style="font-family:Zen Kaku Gothic New;font-size:20px;margin-left:10px">← 結局これ</span>' : ''}</div>`).join('')}</div>`;
  const typoVis = `<div style="text-align:center;font-family:'Noto Sans JP'"><div style="font-size:34px;font-weight:700">お問い合<span style="border:4px solid #d9534f;border-radius:50%;padding:0 6px;color:#d9534f">あ</span>せ</div><div style="font-size:20px;color:#888;margin-top:14px">公開 14:00　→　発見 14:05</div></div>`;
  const colorVis = `<div style="text-align:center"><div style="display:flex;gap:12px;justify-content:center">${['#2F8F6F', '#2E8E6E', '#308F70', '#2F8E6F'].map(c => `<div><div style="width:74px;height:74px;border-radius:14px;background:${c}"></div><div style="font-size:15px;color:#888;font-family:'Noto Sans JP';margin-top:4px">${c}</div></div>`).join('')}</div><div style="font-size:20px;color:#888;margin-top:10px">14:00 → 17:00</div></div>`;
  const fileVis = `<div style="font-family:'Noto Sans JP';font-size:19px;line-height:1.55;width:100%">${['完成.png', '完成2.png', '完成_最終.png', '完成_最終_これ.png', '完成_最終_これ(1).png'].map((f, i) => `<div style="display:flex;align-items:center;gap:10px;${i === 4 ? 'color:#d9534f;font-weight:700' : 'color:#555'}"><span style="width:18px;height:22px;border:2px solid currentColor;border-radius:3px;display:inline-block"></span>${f}</div>`).join('')}</div>`;
  return page({
    tag: 'デザイナーあるある', title: 'デザインしてる時の<br><em>あるある</em> 4つ',
    main: `<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:20px">
      ${card('フォントで1時間迷って<br>結局いちばん最初のやつ', fontsVis)}${card('公開して5分後に<br>誤字を見つける', typoVis)}
      ${card('「ちょっと色を変えるだけ」<br>のつもりで3時間', colorVis)}${card('ファイル名が<br>どんどん増える', fileVis)}</div>`,
  });
};

const card91 = (inner, bg = '#fff') => `<div style="width:392px;height:237px;background:${bg};box-shadow:0 6px 16px rgba(0,0,0,.12);position:relative;overflow:hidden;flex:none;font-family:'Noto Sans JP'">${inner}</div>`;
IMAGES.meishi = () => page({
  tag: '名刺', title: '名刺は<br><em>"何の人か"</em>が一目で', note: '※架空の名刺です',
  main: `<div style="flex:1;display:flex;flex-direction:column;gap:34px">
    ${cmp('ng', 'よくある', card91(`<div style="padding:12px 14px;font-size:9.5px;line-height:1.5;color:#333">
      <div style="font-size:9px">代表 ／ デザイナー ／ 〇〇協会 会員 ／ 〇〇検定2級 ／ 〇〇アドバイザー</div>
      <div style="font-size:17px;font-weight:700;margin:3px 0">山田 はなこ <span style="font-size:9px;font-weight:400">Hanako Yamada</span></div>
      <div>〒000-0000 〇〇県〇〇市〇〇町1-2-3 〇〇ビル5F ／ 〒000-0000 〇〇市〇〇町4-5（第2事務所）</div>
      <div>TEL 00-0000-0000 ／ FAX 00-0000-0000 ／ 携帯 000-0000-0000</div>
      <div>Mail hanako@example.com ／ info@example.com</div><div>URL https://example.com ／ https://example.com/blog</div>
      <div>Instagram @xxxx ／ X @xxxx ／ LINE @xxxx ／ YouTube 〇〇チャンネル</div><div>営業 10:00〜19:00（土日祝休み）　対応エリア：〇〇県全域</div></div>`), '情報が多すぎて<br>何の人か残らない').replace('<div class="cap">', '<div class="cap" style="margin-top:12px">')}
    ${cmp('ok', 'こうすると', card91(`<div style="padding:22px 24px;height:100%;display:flex;flex-direction:column">
      <div style="font-size:12px;color:#2f8f6f;font-weight:700;letter-spacing:.06em">お店のホームページを作っています</div>
      <div style="font-size:30px;font-weight:700;margin-top:6px;letter-spacing:.06em">山田 はなこ</div>
      <div style="margin-top:auto;font-size:12.5px;color:#555;line-height:1.7">hanako@example.com<br>example.com</div>
      <div style="position:absolute;right:22px;bottom:22px;width:64px;height:64px;background:repeating-conic-gradient(#333 0 25%,#fff 0 50%) 0 0/16px 16px;border:3px solid #fff;outline:1px solid #ddd"></div></div>`, '#fbfaf7'), '名前と「何の人か」が<br>すぐ伝わる')}</div>`.replace(/class="cmp (ng|ok)"/g, 'class="cmp $1" style="flex-direction:row;gap:30px;padding:30px 30px;justify-content:center"'),
});

IMAGES.moji16 = () => {
  const T = '髪のお悩みに合わせて、毎日扱いやすいスタイルをご提案します。初めての方も、まずはお気軽にご相談ください。';
  const row = (px, on) => `<div style="flex:1;background:#fff;border-radius:22px;border:2px solid ${on ? '#a7d6c4' : '#e6dfd4'};padding:20px 28px;display:flex;gap:24px;align-items:center;position:relative">
    <div style="flex:none;width:96px;text-align:center"><div style="font-weight:900;font-size:36px;color:${on ? '#2f8f6f' : '#7a858f'}">${px}</div><div style="font-size:17px;color:#9aa3ab;font-weight:700">px</div></div>
    <div style="flex:1;font-family:'Noto Sans JP';font-size:${px * 1.8}px;line-height:1.7;color:#333">${T}</div>
    ${on ? '<div style="position:absolute;top:-16px;right:24px;background:#2f8f6f;color:#fff;font-weight:900;font-size:21px;border-radius:999px;padding:4px 16px">目安</div>' : ''}</div>`;
  return page({
    tag: 'スマホの文字', title: 'スマホの本文は<br><em>16pxが目安</em>',
    main: `<div style="flex:1;display:flex;flex-direction:column;gap:18px">${row(12)}${row(14)}${row(16, 1)}</div>`,
    note: '※スマホでの大きさの比率のまま並べています',
  });
};

IMAGES.lp_fv = () => {
  const mk = (n, x, y) => `<div style="position:absolute;left:${x}px;top:${y}px;width:28px;height:28px;border-radius:50%;background:#2c6aa0;color:#fff;font-weight:900;font-size:16px;display:flex;align-items:center;justify-content:center;font-family:'Zen Kaku Gothic New';z-index:8;box-shadow:0 0 0 3px #fff">${n}</div>`;
  const item = (n, t, q, d) => `<div style="flex:1;background:#fff;border-radius:22px;border:2px solid #e6dfd4;padding:18px 24px;display:flex;gap:18px;align-items:center">
    <div style="flex:none;width:50px;height:50px;border-radius:50%;background:#2c6aa0;color:#fff;font-weight:900;font-size:27px;display:flex;align-items:center;justify-content:center">${n}</div>
    <div><div style="font-weight:900;font-size:31px">${t}</div><div style="font-size:21px;color:#2c6aa0;font-weight:700;margin-top:2px">${q}</div><div style="font-size:19px;color:#7a858f;margin-top:2px">${d}</div></div></div>`;
  return page({
    tag: 'LP', title: 'LPの最初の画面に<br><em>入れたい3つ</em>', note: '※画面はイメージです',
    main: `<div style="display:flex;gap:34px;flex:1;align-items:center">
      <div style="position:relative">${phone(`<div class="hdr"><span class="logo">Lumière</span><span class="btn">ご予約</span></div>
        <div class="pad" style="padding-top:14px"><span style="display:inline-block;background:#f1ece5;border-radius:999px;padding:3px 10px;font-size:11.5px;font-weight:700">くせ毛に悩む方へ</span>
        <div style="font-family:'Shippori Mincho';font-weight:700;font-size:23px;line-height:1.45;margin-top:8px">乾かすだけで、<br>まとまる髪に。</div></div>
        ${photo('salon1', 150)}<div class="pad"><div style="font-size:12px;color:#666">初回カット＋トリートメント</div><div style="font-size:20px;font-weight:700">6,600円<span style="font-size:11px;font-weight:400">（税込）</span></div>
        <div style="margin-top:8px"><span class="wide" style="background:#2f8f6f;color:#fff">空き状況を見る</span></div></div>`, 'width:300px;height:560px')}
        ${mk(1, -10, 78)}${mk(2, -10, 122)}${mk(3, -10, 382)}</div>
      <div style="flex:1;display:flex;flex-direction:column;gap:16px;align-self:stretch">
        ${item(1, '誰に', '「くせ毛に悩む方へ」', '自分のことだ、と思ってもらう')}
        ${item(2, '何が', '「乾かすだけで、まとまる髪に」', 'どうなれるかを一言で')}
        ${item(3, 'いくら・次に何を', '「6,600円 → 空き状況を見る」', '値段と、次の一歩')}</div></div>`,
  });
};

// ---- サンプルの紹介（16:9、前の画像と同じ黒い見せ方） ----
const sampleCard = ({ title, bullets, pill, right }) => `<style>body{width:1200px;height:675px;background:radial-gradient(ellipse at 66% 50%,#1e1e1e 0%,#121212 55%,#0b0b0b 100%)}</style>
  <div style="position:absolute;left:70px;top:0;bottom:0;width:600px;display:flex;flex-direction:column;justify-content:center;color:#efebe5">
  <div style="font-family:'Jost';letter-spacing:.34em;font-size:14px;color:#b3aca2">SORA WEB DESIGN</div>
  <div style="font-family:'Shippori Mincho';font-weight:500;font-size:50px;line-height:1.45;margin-top:22px;letter-spacing:.06em">${title}</div>
  <div style="margin-top:26px;font-size:18px;line-height:2.15;color:#e2ddd6">${bullets.map(b => `<div style="display:flex;gap:14px"><span style="color:#8d867c">—</span>${b}</div>`).join('')}</div>
  <div style="margin-top:22px;align-self:flex-start;border:1px solid #6b655d;border-radius:999px;padding:7px 18px;font-size:15px;color:#d9d3ca">${pill}</div>
  <div style="margin-top:30px;font-size:15px;color:#d6d0c7;letter-spacing:.08em"><b>ソラ｜Web制作</b>　<span style="font-family:'Jost';letter-spacing:.16em;color:#8f8a83">sorasora1120.github.io</span></div></div>${right}`;
IMAGES.salon = () => sampleCard({
  title: '美容サロンの<br>ホームページ',
  bullets: ['予約ボタンを画面の上にずっと出して、すぐ予約できる', '落ち着いた色と余白で、上質な雰囲気に', 'スマホで見やすい、縦にすっと読める流れ'],
  pill: '制作サンプル（架空の店舗です）',
  right: `<div style="position:absolute;right:118px;top:36px;width:290px;height:600px;transform:rotate(-4deg);border:11px solid #25282d;border-radius:42px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.65);background:#f7f3ee url('file://${__dirname}/out/_salon_m.jpg') top center/100% auto no-repeat"></div>`,
});
IMAGES.salon.size = [1200, 675];
IMAGES.design = () => sampleCard({
  title: 'チラシ・名刺の<br>デザイン',
  bullets: ['チラシ・名刺・ロゴ・バナー・パッケージ', '写真と色で、お店の雰囲気をそろえる', '印刷用のデータまでまとめて'],
  pill: '制作サンプル（架空のお店です）',
  right: `<div style="position:absolute;right:46px;top:96px;width:560px;height:410px;border-radius:18px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.65);background:url('file://${__dirname}/out/_design_top.jpg') -${Math.round(250 * 560 / 820)}px -${Math.round(130 * 560 / 820)}px/${Math.round(1440 * 560 / 820)}px auto no-repeat"></div>`,
});
IMAGES.design.size = [1200, 675];

async function main() {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(IMAGES);
  fs.mkdirSync(OUT, { recursive: true });
  const links = FONTS.map(f => `<link rel="stylesheet" href="file://${FD}/${f}.css">`).join('');
  const b = await chromium.launch({ args: ['--font-render-hinting=none'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: +(process.env.DSF || 2) });
  for (const id of ids) {
    const [w, h] = IMAGES[id].size || [1080, 1080];
    await p.setViewportSize({ width: w, height: h });
    const file = path.join(OUT, '_' + id + '.html');
    fs.writeFileSync(file, `<!doctype html><html lang="ja"><head><meta charset="utf-8">${links}<style>${CSS}</style></head><body>${IMAGES[id]()}</body></html>`);
    await p.goto('file://' + file, { waitUntil: 'load' });
    await p.evaluate(async () => { await document.fonts.ready; });
    const fam = await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')));
    if (!fam.includes('Zen Kaku Gothic New')) console.log('  fonts loaded:', [...new Set(fam)].join(', ') || 'none');
    await p.waitForTimeout(300);
    const over = await p.evaluate(() => [...document.querySelectorAll('.wrap, .main, .cmp, .trio .it, .fonts .f')].filter(e => e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2).map(e => e.className));
    await p.screenshot({ path: path.join(OUT, id + '.jpg'), type: 'jpeg', quality: 86 });
    console.log(id, over.length ? 'OVERFLOW ' + over.join(',') : 'ok');
  }
  await b.close();
}
main();
