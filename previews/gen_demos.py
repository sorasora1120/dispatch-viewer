"""見本サイト（架空のお店）を src/demo-*.html に書き出す。そのあと build.py で写真を埋め込む:
  python3 previews/gen_demos.py && python3 previews/build.py
お店ごとの色・フォント・文章は DEMOS に書く。写真は img/demos.json（{{cafe_hero}} など）"""
import html, pathlib

root = pathlib.Path(__file__).resolve().parent

DEMOS = {
    "cafe": dict(
        name="Golden Hour Café", short="Golden Hour", kind="Café & Bakery",
        fonts="Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500",
        head="'Cormorant Garamond',Georgia,serif", hw=500, upper=False, track="-.01em",
        bg="#f6f0e6", ink="#1f1712", mute="#7a6a5c", acc="#b0442e", acc2="#d9a35f", dark="#1f1712", light="#efe3d2",
        h1=("Golden", "<i>Hour</i>"), sub="Slow coffee, warm bread and a seat by the window. Open early, every day.",
        cta="Visit us", marquee=["Espresso", "Croissants", "Sourdough", "Lattes", "Cinnamon buns", "Iced tea"],
        story_k="Since this morning", story_h="Coffee first,<br><i>then everything else.</i>",
        story_p="We roast in small batches and bake through the night, so everything on the counter is fresh when the doors open.",
        stamp="Fresh<br>every<br>morning", story_img="cafe_c",
        menu_h="On the <i>counter</i>", cards=[("cafe_a", "Coffee", "Espresso, pour-over, lattes."), ("cafe_d", "Pastries", "Croissants and buns, baked daily."),
                                               ("cafe_c", "Bread", "Sourdough and rye loaves."), ("cafe_b", "Slow mornings", "Plants, light, good chairs.")],
        band_img="cafe_wide", band_k="Stay a while", band_h="Your table<br>is ready.",
        list_img="cafe_room", list_k="Catering", list_h="Coffee & pastries<br>for your office.",
        list_p="Order a day ahead. We deliver in town.", rows=[("Pastry box (12)", "$36"), ("Coffee for 10", "$28"), ("Breakfast tray", "$65")],
        visit_h="Come by,<br><i>it's warm inside.</i>",
        hours=[("Monday – Friday", "7:00 – 18:00"), ("Saturday", "8:00 – 18:00"), ("Sunday", "8:00 – 15:00")],
    ),
    "salon": dict(
        name="Maple Hair Studio", short="Maple", kind="Hair Studio",
        fonts="Italiana&family=Jost:wght@300;400;500",
        head="'Italiana',Georgia,serif", hw=400, upper=False, track=".01em",
        bg="#f3eeeb", ink="#231d1d", mute="#7d6f6c", acc="#a35a4c", acc2="#c9a497", dark="#2a2322", light="#f1e7e3",
        h1=("Maple", "<i>Studio</i>"), sub="Cuts, colour and styling in a calm, bright space. Book online in a minute.",
        cta="Book now", marquee=["Cuts", "Colour", "Balayage", "Blowouts", "Treatments", "Bridal"],
        story_k="Your hair, your way", story_h="Take an hour<br><i>just for you.</i>",
        story_p="Every visit starts with a real conversation about what you want. Then we take our time.",
        stamp="Book<br>online<br>24/7", story_img="salon_b",
        menu_h="Our <i>services</i>", cards=[("salon_a", "Cut & style", "Wash, cut and blowout."), ("salon_c", "Colour", "Full colour, roots, balayage."),
                                            ("salon_b", "Treatments", "Scalp care and repair."), ("salon_d", "The studio", "Bright, quiet, relaxed.")],
        band_img="salon_hero", band_k="New clients welcome", band_h="Leave feeling<br>like you.",
        list_img="salon_d", list_k="Price list", list_h="Simple prices,<br>no surprises.",
        list_p="Prices may change with hair length.", rows=[("Women's cut", "from $55"), ("Men's cut", "from $35"), ("Full colour", "from $95")],
        visit_h="Book your<br><i>next visit.</i>",
        hours=[("Tuesday – Friday", "10:00 – 19:00"), ("Saturday", "9:00 – 17:00"), ("Sunday – Monday", "Closed")],
    ),
    "barber": dict(
        name="Hollis Barber Co.", short="Hollis", kind="Barbershop",
        fonts="Anton&family=Jost:wght@300;400;500",
        head="'Anton',Impact,sans-serif", hw=400, upper=True, track=".01em",
        bg="#121212", ink="#efeae2", mute="#a59d92", acc="#c9a227", acc2="#c9a227", dark="#0a0a0a", light="#efeae2",
        h1=("Clean", "<i>cuts.</i>"), sub="Classic cuts, skin fades and hot towel shaves. Walk in or book your chair.",
        cta="Book a chair", marquee=["Fades", "Classic cuts", "Beard trims", "Hot towel shaves", "Kids' cuts", "Line-ups"],
        story_k="The chair is yours", story_h="No rush.<br><i>Just a good cut.</i>",
        story_p="Every cut finishes with a hot towel and a straight-razor line-up. Coffee is on us while you wait.",
        stamp="Walk-ins<br>welcome", story_img="barber_a",
        menu_h="The <i>menu</i>", cards=[("barber_a", "Haircut", "Scissors or clippers, your call."), ("barber_b", "Skin fade", "Clean, sharp, blended."),
                                         ("barber_wide", "Beard", "Trim, shape and hot towel."), ("barber_hero", "The shop", "Open late on Fridays.")],
        band_img="barber_hero", band_k="Fridays till 9", band_h="Look good<br>this weekend.",
        list_img="barber_wide", list_k="Prices", list_h="Straight prices.<br>Cash or card.",
        list_p="Seniors and kids under 12 get $5 off.", rows=[("Haircut", "$30"), ("Skin fade", "$35"), ("Beard trim", "$20")],
        visit_h="Grab a<br><i>chair.</i>",
        hours=[("Tuesday – Thursday", "10:00 – 19:00"), ("Friday", "10:00 – 21:00"), ("Saturday", "9:00 – 17:00")],
    ),
    "pizza": dict(
        name="Ferro Pizza Bar", short="Ferro", kind="Pizza Bar",
        fonts="DM+Serif+Display:ital@0;1&family=Jost:wght@300;400;500",
        head="'DM Serif Display',Georgia,serif", hw=400, upper=False, track="-.01em",
        bg="#fbf3e7", ink="#2a1410", mute="#7d5f55", acc="#c8321f", acc2="#f2b84b", dark="#24120e", light="#f6e6d4",
        h1=("Hot from", "<i>the oven.</i>"), sub="Wood-fired pizza, fresh pasta and cold drinks. Dine in, pick up or delivery.",
        cta="Order now", marquee=["Margherita", "Pepperoni", "Funghi", "Diavola", "Fresh pasta", "Tiramisu"],
        story_k="Dough made daily", story_h="48 hours of rising,<br><i>90 seconds of fire.</i>",
        story_p="Our dough rests for two days, then meets an oven at 450°C. Crispy outside, soft inside.",
        stamp="Wood<br>fired", story_img="pizza_a",
        menu_h="Fresh <i>tonight</i>", cards=[("pizza_b", "Pepperoni", "Tomato, mozzarella, spicy pepperoni."), ("pizza_c", "Ferro special", "Ham, mushrooms, red onion."),
                                              ("pizza_a", "Diavola", "Hot salami, chili oil."), ("pizza_d", "Pasta", "Tagliatelle with mushrooms.")],
        band_img="pizza_room", band_k="Tables for groups", band_h="Bring<br>everyone.",
        list_img="pizza_room", list_k="Party trays", list_h="Feeding a crowd?<br>We've got it.",
        list_p="Call a day ahead for 5+ pizzas.", rows=[("Margherita", "$16"), ("Pepperoni", "$18"), ("Family deal (3 pizzas)", "$45")],
        visit_h="Pick up,<br><i>or stay for dinner.</i>",
        hours=[("Monday – Thursday", "11:30 – 22:00"), ("Friday – Saturday", "11:30 – 23:30"), ("Sunday", "12:00 – 21:00")],
    ),
}

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>%(name)s · Sample website</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=%(fonts)s&display=swap" rel="stylesheet">
<style>
:root{--bg:%(bg)s;--ink:%(ink)s;--mute:%(mute)s;--acc:%(acc)s;--acc2:%(acc2)s;--dark:%(dark)s;--light:%(light)s;--line:color-mix(in srgb,var(--ink) 14%%,transparent);--head:%(head)s}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font:300 17px/1.7 Jost,system-ui,sans-serif;overflow-x:hidden}
a{color:inherit;text-decoration:none}
img{display:block;width:100%%;height:100%%;object-fit:cover}
h1,h2,h3,.brand{font-family:var(--head);font-weight:%(hw)s;letter-spacing:%(track)s;%(upper)s}
h1 i,h2 i{font-style:%(ital)s}
.kicker{font:400 12px Jost,sans-serif;letter-spacing:.32em;text-transform:uppercase}
.pv{position:fixed;right:12px;bottom:12px;z-index:50;background:rgba(20,16,14,.86);color:#f1e6d6;font-size:12px;padding:8px 14px;border-radius:999px;backdrop-filter:blur(6px)}
nav{position:fixed;top:0;left:0;right:0;z-index:40;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;color:#fff;transition:background .4s,color .4s,padding .4s}
nav.solid{background:color-mix(in srgb,var(--bg) 92%%,transparent);color:var(--ink);padding:12px 28px;backdrop-filter:blur(10px);box-shadow:0 1px 0 var(--line)}
nav .brand{font-size:24px}
nav .links a{margin-left:26px;font-size:13px;letter-spacing:.2em;text-transform:uppercase}
.hero{position:relative;height:100svh;min-height:560px;overflow:hidden;color:#fff}
.hero .bg{position:absolute;inset:0;animation:kb 18s ease-out forwards}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,6,4,.5) 0%%,rgba(10,6,4,.12) 35%%,rgba(10,6,4,.78) 100%%)}
@keyframes kb{from{transform:scale(1.18)}to{transform:scale(1)}}
.hero .in{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:0 28px 9vh;max-width:1200px;margin:0 auto}
.hero h1{font-size:clamp(56px,12.5vw,164px);line-height:.9}
.hero h1 i{color:var(--acc2)}
.line{display:block;overflow:hidden;padding-bottom:.04em}
.line>span{display:block;transform:translateY(110%%);animation:up 1.1s cubic-bezier(.2,.7,.1,1) forwards}
.line:nth-child(2)>span{animation-delay:.15s}
@keyframes up{to{transform:none}}
.hero .sub{display:flex;flex-wrap:wrap;gap:18px 40px;align-items:center;justify-content:space-between;margin-top:28px;opacity:0;animation:fade 1s .7s forwards}
@keyframes fade{to{opacity:1}}
.btn{display:inline-flex;align-items:center;gap:10px;padding:14px 26px;border:1px solid currentColor;border-radius:999px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;transition:background .3s,color .3s,border-color .3s}
.btn:hover{background:#fff;color:#111}
.btn.fill{background:var(--acc);border-color:var(--acc);color:#fff}
.btn.fill:hover{background:#fff;border-color:#fff;color:#111}
.mq{border-block:1px solid var(--line);overflow:hidden;padding:22px 0}
.mq .track{display:flex;width:max-content;animation:mq 32s linear infinite}
.mq span{font:400 clamp(30px,5vw,54px) var(--head);%(upper)s padding:0 28px;white-space:nowrap}
.mq b{color:var(--acc2);margin-left:56px;font-weight:400}
@keyframes mq{to{transform:translateX(-50%%)}}
.wrap{max-width:1200px;margin:0 auto;padding:0 28px}
section{padding:120px 0}
.story{display:grid;grid-template-columns:1fr 1.1fr;gap:72px;align-items:center}
.story h2{font-size:clamp(40px,5.6vw,72px);line-height:1.02;margin:18px 0 26px}
.story h2 i,.head h2 i{color:var(--acc)}
.story p,.wide p{color:var(--mute);max-width:30em}
.ph{position:relative;overflow:hidden;border-radius:2px}
.story .ph{aspect-ratio:4/5}
.story .ph img{height:120%%}
.stamp-wrap{position:relative}
.stamp{position:absolute;right:-18px;top:-18px;width:130px;height:130px;border-radius:50%%;background:var(--acc);color:#fff;display:grid;place-items:center;text-align:center;font:500 13px/1.3 Jost,sans-serif;letter-spacing:.18em;text-transform:uppercase;animation:spin 22s linear infinite;z-index:3}
@keyframes spin{to{transform:rotate(360deg)}}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:48px;flex-wrap:wrap}
.head h2{font-size:clamp(44px,6vw,80px);line-height:1}
.head p{color:var(--mute);font-size:14px;max-width:24em}
.menu{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.card .ph{aspect-ratio:3/4}
.card img{transition:transform 1.2s cubic-bezier(.2,.7,.1,1)}
.card:hover img{transform:scale(1.08)}
.card .ph::after{content:attr(data-n);position:absolute;left:14px;top:12px;color:#fff;font:400 22px var(--head);text-shadow:0 1px 8px rgba(0,0,0,.4)}
.card h3{font-size:28px;margin-top:16px;line-height:1.2}
.card p{color:var(--mute);font-size:15px}
.card:nth-child(even){margin-top:56px}
.band{position:relative;height:88vh;min-height:480px;overflow:hidden;color:#fff;display:grid;place-items:center;text-align:center}
.band img{position:absolute;inset:-12%% 0;height:124%%}
.band::after{content:"";position:absolute;inset:0;background:rgba(10,6,4,.45)}
.band .in{position:relative;z-index:2;padding:0 28px}
.band h2{font-size:clamp(48px,9vw,120px);line-height:.98;margin-top:14px}
.wide{display:grid;grid-template-columns:1.4fr 1fr;gap:56px;align-items:center}
.wide .ph{aspect-ratio:16/10}
.wide h2{font-size:clamp(38px,5vw,64px);line-height:1.05;margin:16px 0 20px}
.list{margin-top:26px;border-top:1px solid var(--line)}
.list div{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--line);font-size:15px}
.list div span:last-child{color:var(--acc);font-weight:500}
.visit{background:var(--dark);color:var(--light);padding:120px 0}
.visit .grid{display:grid;grid-template-columns:1fr 1.2fr;gap:56px}
.visit h2{font-size:clamp(48px,7vw,96px);line-height:.98;margin:16px 0 28px}
.visit h2 i{color:var(--acc2)}
.visit .addr{font-size:19px;line-height:1.6}
.hours{margin-top:30px;border-top:1px solid color-mix(in srgb,var(--light) 20%%,transparent)}
.hours div{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid color-mix(in srgb,var(--light) 20%%,transparent);font-size:15px}
.hours div span:last-child{opacity:.7}
.open{display:inline-flex;align-items:center;gap:8px;margin-top:18px;font-size:13px;letter-spacing:.14em;text-transform:uppercase}
.open::before{content:"";width:8px;height:8px;border-radius:50%%;background:#4cc06a;box-shadow:0 0 0 4px rgba(76,192,106,.2);animation:pulse 2s infinite}
.open.closed::before{background:#d9534f;box-shadow:0 0 0 4px rgba(217,83,79,.2)}
@keyframes pulse{50%%{box-shadow:0 0 0 8px rgba(76,192,106,0)}}
.visit .btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px}
.map{min-height:420px;overflow:hidden;filter:grayscale(.8) contrast(1.05)}
.map iframe{width:100%%;height:100%%;min-height:420px;border:0;display:block}
footer{background:var(--dark);color:color-mix(in srgb,var(--light) 55%%,transparent);font-size:12px;padding:28px 0 80px;border-top:1px solid color-mix(in srgb,var(--light) 12%%,transparent)}
footer .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
.rv{opacity:0;transform:translateY(40px);transition:opacity 1s ease,transform 1.2s cubic-bezier(.2,.7,.1,1)}
.rv.on{opacity:1;transform:none}
.mask{clip-path:inset(100%% 0 0 0);transition:clip-path 1.4s cubic-bezier(.7,0,.2,1)}
.mask.on{clip-path:inset(0)}
@media (max-width:900px){
  .story,.wide,.visit .grid{grid-template-columns:1fr;gap:40px}
  .menu{grid-template-columns:1fr 1fr}
  .card:nth-child(even){margin-top:36px}
  section,.visit{padding:84px 0}
  nav .links{display:none}
  .stamp{width:100px;height:100px;font-size:11px;right:-8px;top:-24px}
}
@media (max-width:480px){
  .wrap,.hero .in{padding-left:18px;padding-right:18px}
  nav{padding:16px 18px}
  .menu{gap:14px}
  .card h3{font-size:23px}
  .card p{font-size:13px}
  .pv{font-size:11px;padding:6px 12px}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none!important;transition:none!important}
  .line>span,.hero .sub{transform:none;opacity:1}
  .rv{opacity:1;transform:none}.mask{clip-path:none}
}
</style>
</head>
<body>
<div class="pv">Sample website · fictional shop</div>
<nav id="nav">
  <a class="brand" href="#">%(short)s</a>
  <div class="links"><a href="#story">About</a><a href="#menu">Menu</a><a href="#visit">Visit</a></div>
</nav>
<header class="hero">
  <div class="bg"><img src="{{%(hero)s}}" alt=""></div>
  <div class="in">
    <p class="kicker" style="margin-bottom:22px;opacity:.85">%(kind)s · Windsor, Ontario</p>
    <h1><span class="line"><span>%(h1a)s</span></span><span class="line"><span>%(h1b)s</span></span></h1>
    <div class="sub">
      <p style="max-width:26em">%(sub)s</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn fill" href="#visit">%(cta)s</a><a class="btn" href="#menu">See the menu</a></div>
    </div>
  </div>
</header>
<div class="mq" aria-hidden="true"><div class="track">%(marquee)s%(marquee)s</div></div>
<section id="story">
  <div class="wrap story">
    <div class="rv">
      <p class="kicker" style="color:var(--acc)">%(story_k)s</p>
      <h2>%(story_h)s</h2>
      <p>%(story_p)s</p>
    </div>
    <div class="stamp-wrap rv">
      <div class="stamp">%(stamp)s</div>
      <div class="ph mask"><img data-par="0.12" src="{{%(story_img)s}}" alt=""></div>
    </div>
  </div>
</section>
<section id="menu" style="padding-top:0">
  <div class="wrap">
    <div class="head rv"><h2>%(menu_h)s</h2><p>Tap anything to see where to find us.</p></div>
    <div class="menu">%(cards)s</div>
  </div>
</section>
<div class="band">
  <img data-par="0.18" src="{{%(band_img)s}}" alt="">
  <div class="in rv"><p class="kicker">%(band_k)s</p><h2>%(band_h)s</h2></div>
</div>
<section>
  <div class="wrap wide">
    <div class="ph mask"><img src="{{%(list_img)s}}" alt=""></div>
    <div class="rv">
      <p class="kicker" style="color:var(--acc)">%(list_k)s</p>
      <h2>%(list_h)s</h2>
      <p>%(list_p)s</p>
      <div class="list">%(rows)s</div>
    </div>
  </div>
</section>
<section class="visit" id="visit">
  <div class="wrap grid">
    <div class="rv">
      <p class="kicker" style="color:var(--acc2)">Visit</p>
      <h2>%(visit_h)s</h2>
      <p class="addr">123 Example Street<br>Windsor, ON</p>
      <div class="hours">%(hours)s</div>
      <div class="open" id="open">Open now</div>
      <div class="btns">
        <a class="btn fill" href="tel:5195550123">Call (519) 555-0123</a>
        <a class="btn" href="https://maps.google.com/maps?q=Windsor,+ON">Directions</a>
      </div>
    </div>
    <div class="map rv"><iframe loading="lazy" title="Map" src="https://maps.google.com/maps?q=Windsor,+Ontario&amp;z=13&amp;output=embed"></iframe></div>
  </div>
</section>
<footer><div class="wrap">
  <span>%(name)s is a fictional shop. This is a sample website.</span>
  <span>Photos: free-to-use stock (CC0 / Unsplash License).</span>
</div></footer>
<script>
const nav=document.getElementById('nav');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}}),{threshold:.18});
document.querySelectorAll('.rv,.mask').forEach(el=>io.observe(el));
const par=[...document.querySelectorAll('[data-par]')];
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
let tick=false;
function frame(){
  nav.classList.toggle('solid',scrollY>innerHeight*.7);
  if(!still)par.forEach(img=>{const r=img.parentElement.getBoundingClientRect();img.style.transform=`translateY(${-(r.top+r.height/2-innerHeight/2)*img.dataset.par}px)`});
  tick=false;
}
addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(frame)}},{passive:true});
frame();
// 営業中かどうか（見本なので時間は表のとおりに判定）
const H=%(hours_js)s,d=new Date(),m=d.getHours()*60+d.getMinutes(),t=H[d.getDay()];
const o=document.getElementById('open');
if(!t||m<t[0]||m>=t[1]){o.textContent='Closed now';o.classList.add('closed')}
</script>
</body>
</html>
"""

DAYS = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 0}


def hours_js(hours):
    # 「Monday – Friday」「10:00 – 19:00」を曜日ごとの [開店分, 閉店分] にする
    week = [None] * 7
    for days, time in hours:
        if "Closed" in time:
            continue
        a, b = [p.strip() for p in time.split("–")]
        span = [p.strip() for p in days.split("–")]
        s, e = DAYS[span[0]], DAYS[span[-1]]
        mins = [int(x.split(":")[0]) * 60 + int(x.split(":")[1]) for x in (a, b)]
        i = s
        while True:
            week[i] = mins
            if i == e:
                break
            i = (i + 1) % 7
    return str(week).replace("None", "null")


for key, d in DEMOS.items():
    v = dict(d)
    v.update(
        upper="text-transform:uppercase;" if d["upper"] else "",
        ital="normal" if d["upper"] else "italic",
        hero=f"{key}_hero", h1a=d["h1"][0], h1b=d["h1"][1],
        marquee="".join(f"<span>{html.escape(m)}<b>✦</b></span>" for m in d["marquee"]),
        cards="".join(f'<a class="card rv" href="#visit"><div class="ph" data-n="0{i + 1}"><img src="{{{{{img}}}}}" alt=""></div>'
                      f"<h3>{t}</h3><p>{p}</p></a>" for i, (img, t, p) in enumerate(d["cards"])),
        rows="".join(f"<div><span>{a}</span><span>{b}</span></div>" for a, b in d["rows"]),
        hours="".join(f"<div><span>{a}</span><span>{b}</span></div>" for a, b in d["hours"]),
        hours_js=hours_js(d["hours"]),
    )
    (root / "src" / f"demo-{key}.html").write_text(TEMPLATE % v, encoding="utf-8")
    print("demo", key)
