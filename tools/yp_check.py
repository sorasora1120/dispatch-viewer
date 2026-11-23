"""お店の電話番号をイエローページ（yellowpages.ca）で確かめる（2026-11-23〜）。

使い方:  python3 tools/yp_check.py            # 全部のお店を調べる（結果は tools/yp_cache.json にためる）
        python3 tools/yp_check.py --apply    # 調べた結果を shops.html のデータに入れる

shops.html の各お店に入れるもの:
  yp  … イエローページで見つかった番号（+1 から。見つからなければ ""）
  pq  … ok   = Overture とイエローページ（か2か所以上）が同じ番号
         diff = イエローページは別の番号（pa の先頭に入れる）
         yp   = Overture に番号がなく、イエローページにだけあった（p に入れる）
         ほかはそのまま（one / old / far / shared）
windsor_shops.py で作り直したら、もう一度 --apply する（キャッシュがあるので速い）。
"""
import html as H, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CACHE = os.path.join(ROOT, "tools", "yp_cache.json")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
STOP = {"the", "and", "of", "inc", "ltd", "co", "windsor", "tecumseh", "lasalle", "amherstburg", "on", "ontario", "shop", "store",
        "restaurant", "salon", "spa", "bar", "grill", "cafe", "studio", "services", "service", "by", "s", "a", "at", "in", "&"}


def load_shops():
    s = open(os.path.join(ROOT, "shops.html"), encoding="utf-8").read()
    a = s.index("/*DATA*/") + 8; b = s.index("/*END*/", a)
    return s, a, b, json.loads(s[a:b])


# お店の種類を表すだけの言葉（これだけかぶっても同じお店とは言えない）
GEN = {"hair", "beauty", "nails", "nail", "barber", "barbershop", "barbers", "pizza", "pizzeria", "indian", "cuisine", "kitchen", "food", "foods",
       "martial", "arts", "laundry", "laundromat", "kebab", "shawarma", "sushi", "thai", "chinese", "italian", "mexican", "bakery", "coffee",
       "house", "pub", "tavern", "lounge", "fitness", "gym", "yoga", "auto", "car", "wash", "body", "repair", "pet", "pets", "grooming", "dog",
       "flowers", "florist", "tattoo", "studio", "boutique", "design", "market", "grocery", "bazaar", "pho", "wok", "lawn", "care", "cleaning",
       "massage", "therapy", "wellness", "esthetics", "lash", "lashes", "brow", "brows", "cuts", "cut", "style", "styles", "and", "plus", "new"}
LOCAL = re.compile(r"windsor|tecumseh|lasalle|amherstburg|lakeshore|belle river|essex|oldcastle|maidstone|mcgregor|emeryville", re.I)


def toks(name):
    w = re.sub(r"['’`]s\b", "", name.lower())
    w = re.sub(r"[^a-z0-9]+", " ", w).split()
    return {x for x in w if x not in STOP and len(x) > 1}


def digits(p):
    d = re.sub(r"\D", "", p or "")
    return d[-10:] if len(d) >= 10 else ""


def key(s):
    return f'{s["n"]}|{s["t"]}'


def fetch(name, town):
    q = urllib.parse.quote_plus(name[:80])
    url = f"https://www.yellowpages.ca/search/si/1/{q}/{urllib.parse.quote_plus(town + ' ON')}"
    for i in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-CA"})
            return urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return ""
            time.sleep(2 ** (i + 1))
        except Exception:
            time.sleep(2 ** (i + 1))
    return None


def parse(h):
    out = []
    for b in re.split(r'<div[^>]+class="listing listing--', h)[1:]:
        n = re.search(r"jsListingName[^>]*>([^<]+)", b)
        a = re.search(r"listing__address--full[^>]*>(.*?)</span>\s*</span>", b, re.S)
        out.append({"n": H.unescape(n.group(1)).strip() if n else "",
                    "p": [digits(x) for x in re.findall(r'data-phone="([^"]+)"', b)],
                    "a": re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", H.unescape(a.group(1)))).strip() if a else ""})
    return out


def match(shop, listings):
    """同じお店と言えるリスティングを、似ている順に全部返す（名前の言葉が十分かぶる。番地が同じなら少しでよい）"""
    st = toks(shop["n"]); num = re.match(r"\d+", shop.get("a") or "")
    found = []
    for l in listings:
        lt = toks(l["n"])
        if not st or not lt:
            continue
        inter = len(st & lt); j = inter / len(st | lt); strong = len((st & lt) - GEN)
        lno = re.match(r"\s*(?:[a-z]?\d*-)?(\d+)", l["a"], re.I)
        same_no = bool(num and lno and lno.group(1) == num.group(0))
        if l["a"] and not LOCAL.search(l["a"]):
            continue  # ほかの町のお店
        if num and lno and not same_no and j < 1:
            continue  # 番地がちがう
        ok = (strong and (j >= 0.5 or st <= lt or lt <= st)) or (same_no and inter >= 1)
        if ok:
            found.append((j + same_no, l))
    return [l for _, l in sorted(found, key=lambda t: -t[0])]


def run():
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    _, _, _, shops = load_shops()
    todo = [s for s in shops if key(s) not in cache]
    print("todo", len(todo), "cached", len(cache), flush=True)
    for i, s in enumerate(todo):
        h = fetch(s["n"], s["t"])
        if h is None:
            print("fail", s["n"], flush=True); continue
        cache[key(s)] = parse(h)
        if i % 10 == 0:
            json.dump(cache, open(CACHE, "w"), ensure_ascii=False, indent=0)
            print(i, s["n"], flush=True)
        time.sleep(1.2)
    json.dump(cache, open(CACHE, "w"), ensure_ascii=False, indent=0)


def apply():
    cache = json.load(open(CACHE))
    s, a, b, shops = load_shops()
    n = {"ok": 0, "diff": 0, "yp": 0, "none": 0}
    for x in shops:
        ph = []
        for l in match(x, cache.get(key(x)) or []):
            ph += [p for p in l["p"] if p and p not in ph]
        ours = digits(x.get("p"))
        x["yp"] = "+1" + ph[0] if ph else ""
        if not ph:
            n["none"] += 1; continue
        if ours and ours in ph:
            x["pq"] = "ok"; x["yp"] = "+1" + ours; n["ok"] += 1
        elif ours:
            x["pa"] = ["+1" + ph[0]] + [p for p in x.get("pa", []) if digits(p) != ph[0]]
            x["pq"] = "diff"; n["diff"] += 1
        else:
            x["p"] = "+1" + ph[0]; x["pq"] = "yp"; n["yp"] += 1
    print(n, len(shops))
    open(os.path.join(ROOT, "shops.html"), "w", encoding="utf-8").write(
        s[:a] + json.dumps(shops, ensure_ascii=False, separators=(",", ":")) + s[b:])


if __name__ == "__main__":
    apply() if "--apply" in sys.argv else run()
