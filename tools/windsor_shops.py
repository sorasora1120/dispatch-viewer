"""Windsor の「自分のサイトがない個人のお店」を Overture Maps（オープンデータ）から選んで、shops.html に入れる。

2026-10-21、ユーザー「windsorの行ける店全部調べて、Googleマップにのせて」。Windsor・Tecumseh・LaSalle（バスで行ける所）の
places から、チェーン・病院・役所などを外し、自分のサイトが登録されていない（SNS・予約サイトだけも含む）お店を選ぶ。
使い方: pip install pyarrow && python3 tools/windsor_shops.py   （このコンテナからは HTTPS_PROXY を通して S3 を読める）
"""
import collections, json, os, re, sys
import pyarrow.compute as pc, pyarrow.dataset as ds, pyarrow.fs as fs

RELEASE = os.getenv("OVERTURE_RELEASE", "2026-09-23.1")
W, E, S, N = -83.145, -82.84, 42.20, 42.37  # Windsor 市内＋Tecumseh・LaSalle の近く（デトロイトは国で外す）

CHAINS = re.compile(r"(tim hortons|mcdonald|subway|starbucks|pizza pizza|pizza hut|domino|little caesars|wendy|burger king|a&w|kfc|popeyes|harvey|dairy queen|"
    r"mary brown|wingstop|osmow|thai express|mr\. sub|mr sub|quesada|freshii|booster juice|second cup|coffee culture|country style|"
    r"great clips|first choice|smartstyle|supercuts|magicuts|regis|walmart|shoppers|rexall|loblaw|zehrs|food basics|no frills|freshco|"
    r"sobeys|metro|dollarama|dollar tree|giant tiger|bulk barn|winners|marshalls|homesense|michaels|petsmart|pet valu|canadian tire|"
    r"home depot|lowe|staples|best buy|the brick|leon|sleep country|bank|cibc|scotiabank|rbc|td |bmo|desjardins|credit union|"
    r"esso|petro|shell|ultramar|circle k|mac's|7-eleven|husky|pioneer|sunoco|money mart|cash money|easyhome|h&r block|liberty tax|"
    r"rogers|bell|telus|freedom|fido|koodo|virgin|chatr|public mobile|the mobile shop|lcbo|beer store|cannabis|urbnbud|"
    r"montana|kelsey|east side mario|boston pizza|jack astor|state & main|milestones|swiss chalet|st-hubert|denny|ihop|"
    r"chuck e|sport chek|mark's|old navy|joe fresh|carter|bentley|claire|ardene|la senza|penningtons|reitmans|addition elle|"
    r"specsavers|hakim|iris|f45|goodlife|anytime fitness|planet fitness|orangetheory|crossfit|ups store|canada post|purolator|"
    r"midas|speedy|mr\. lube|jiffy|kal tire|ok tire|fountain tire|uniglobe|edward jones|sun life|state farm|allstate|co-operators|"
    r"remax|re/max|royal lepage|century 21|coldwell|keller williams|sutton|chicken|wing|bento sushi|edo japan|"
    r"burrito guyz|mucho burrito|barburrito|chipotle|panago|papa john|241 pizza|pizza nova|gino|dominion|"
    r"orange julius|cinnabon|teavana|davids tea|bath & body|lush|sephora|nail spa|regal nails)", re.I)
GOOD = re.compile(r"(restaurant|cafe|coffee|bakery|dessert|ice_cream|bar\b|pub|food|pizza|sandwich|deli|grill|diner|shawarma|"
    r"barber|hair|beauty|nail|spa|salon|tattoo|lash|brow|esthetic|massage|florist|flower|gift|boutique|clothing|fashion|jewel|"
    r"pet_groom|pet_store|pet_service|grooming|butcher|meat|market|grocery|specialty_food|candy|chocolate|"
    r"fitness|gym|yoga|martial|dance|music|tutoring|driving_school|child|daycare|"
    r"auto_detailing|car_wash|auto_repair|tire|mechanic|body_shop|"
    r"cleaning|landscap|plumb|electric|handyman|contractor|renovat|roof|painting|moving|"
    r"photograph|print|tailor|alteration|shoe_repair|dry_clean|laundr)", re.I)
BAD = re.compile(r"(atm|bank|government|school|church|place_of_worship|hospital|doctor|dentist|clinic|medical|pharmacy|parking|"
    r"bus_stop|gas_station|fuel|park\b|public_|community_center|library|post_office|structure|bridge|landmark|real_estate|insurance|"
    r"financial|lawyer|legal|accountant|organization|association|charity|non_profit|apartment|residential|housing|hotel|motel|"
    r"storage|utility|industrial|manufactur|wholesale|warehouse|transport|logistics|truck|employment|staffing)", re.I)
EXTRA_CHAINS = re.compile(r"(shoppers drug|dollarama|value village|tim horton|a&w|harvey|mary brown|popeyes|pita pit|pizza delight|"
    r"cora\b|denny|wendy|taco bell|kfc|domino|pizza hut|little caesar|subway|starbucks|mcdonald|burger king|dairy queen|"
    r"payless|ardene|claire|aldo|spencer|foot locker|bath|bulk barn|la vie en rose|bluenotes|garage\b|dynamite|urban planet|"
    r"suzy shier|stitches|giant tiger|tsc\b|home hardware|rona\b|canadian tire|princess auto|sail\b|sport chek|hudson|"
    r"nails? ?& ?spa express|great canadian|mobile klinik|cellcom|wireless wave|glentel|tbooth|osmow|gong cha|chatime|coco fresh)", re.I)
# 自分のサイトに数えないもの（SNS・予約サイト・配達アプリ・終わった Google のサイトなど）
MORE_CHAINS = re.compile(r"(presotea|sharetea|kung fu tea|ding tea|real fruit|chatime|gong cha|tiger sugar|bubble republic|coco fresh|booster juice|jugo juice|freshii|pita land|pita pit|thai express|edo japan|sushi shop|mr\.? ?greek|pizza depot|pizza nova|pizzaville|pizza hut|panago|topper|fat bastard|wild wing|st\. louis|kelsey|menchie|yogen|marble slab|baskin|cold stone|krispy|cinnabon|dq\b|orange julius|hakim|specsavers|great clips|first choice|supercuts|magicuts|chatters|lush|sephora)", re.I)
NOT_OWN = re.compile(r"facebook|instagram|linktr|business\.site|wixsite|squareup|square\.site|booksy|fresha|vagaro|ubereats|doordash|"
    r"skipthedishes|yelp|google\.|tiktok|twitter|x\.com|youtube|opentable|setmore|schedulicity|styleseat|mindbody|tripadvisor", re.I)
GROUPS = [
    ("飲食", r"restaurant|cafe|coffee|bakery|dessert|ice_cream|\bbar\b|pub|food|pizza|sandwich|deli|grill|diner|shawarma|brunch|bistro|tea|juice|donut|patisserie"),
    ("美容", r"barber|hair|beauty|nail|spa|salon|tattoo|lash|brow|esthetic|massage|wax|threading|cosmetic|tanning"),
    ("お店", r"boutique|clothing|fashion|jewel|florist|flower|gift|shoe|butcher|meat|market|grocery|specialty_food|candy|chocolate|"
            r"pet_store|book|music|record|furniture|decor|antique|thrift|vintage|toy|hobby|bridal|store|shop|retail"),
    ("教室・ジム", r"fitness|gym|yoga|pilates|martial|karate|taekwondo|boxing|dance|music_school|tutoring|driving_school|child|daycare|school|academy|studio"),
    ("車", r"auto|car_|tire|mechanic|body_shop|vehicle|motor"),
    ("サービス", r"pet_groom|pet_service|grooming|cleaning|landscap|plumb|electric|handyman|contractor|renovat|roof|painting|moving|photograph|print|tailor|alteration|shoe_repair|dry_clean|laundr|repair|service"),
]
JA = [  # 種類の日本語（上から順に最初に当たったもの）
    ("pizza", "ピザ"), ("bakery|patisserie|donut", "パン・お菓子"), ("cafe|coffee|tea|juice", "カフェ"), ("dessert|ice_cream", "スイーツ"),
    ("shawarma|middle_eastern|lebanese|halal", "中東料理・シャワルマ"), ("chinese", "中華"), ("japanese|sushi|ramen", "日本食"),
    ("korean", "韓国料理"), ("vietnam|pho", "ベトナム料理"), ("thai", "タイ料理"), ("indian", "インド料理"), ("mexican|taco", "メキシコ料理"),
    ("italian", "イタリアン"), ("greek", "ギリシャ料理"), ("breakfast|brunch|diner", "朝食・ダイナー"), ("burger", "ハンバーガー"),
    ("\\bbar\\b|pub|lounge", "バー"), ("restaurant|grill|bistro|food|sandwich|deli", "レストラン"),
    ("barber", "床屋"), ("nail", "ネイル"), ("lash|brow|threading|wax", "まつげ・眉"), ("tattoo|pierc", "タトゥー"), ("massage", "マッサージ"),
    ("hair", "美容室"), ("spa|esthetic|beauty|cosmetic|tanning", "エステ・美容"),
    ("bridal", "ブライダル"), ("boutique|fashion|clothing", "服・ブティック"), ("jewel", "アクセサリー"), ("shoe", "靴"),
    ("florist|flower", "花屋"), ("gift|decor", "ギフト・雑貨"), ("butcher|meat", "肉屋"), ("grocery|market|specialty_food", "食料品"),
    ("candy|chocolate", "お菓子屋"), ("pet_store", "ペット用品"), ("pet_groom|grooming|pet_service", "ペットのトリミング"),
    ("book", "本屋"), ("music|record", "音楽"), ("furniture|antique|thrift|vintage", "家具・古着・アンティーク"), ("toy|hobby", "おもちゃ・ホビー"),
    ("yoga|pilates", "ヨガ・ピラティス"), ("martial|karate|taekwondo|boxing", "武道・ボクシング"), ("dance", "ダンス"),
    ("fitness|gym", "ジム"), ("music_school", "音楽教室"), ("tutoring|academy|school", "塾・教室"), ("daycare|child", "子ども"),
    ("tire", "タイヤ"), ("body_shop|collision", "車の板金"), ("car_wash|detailing", "洗車"), ("auto|mechanic|vehicle|motor|car_", "車の修理"),
    ("tailor|alteration", "お直し"), ("dry_clean|laundr", "クリーニング"), ("photograph", "写真"), ("print", "印刷"),
    ("cleaning", "清掃"), ("landscap", "庭"), ("plumb", "水道"), ("electric", "電気工事"), ("roof|renovat|contractor|handyman|painting", "リフォーム"),
    ("moving", "引っ越し"), ("repair", "修理"), ("store|shop|retail", "お店"),
]
JA = [(re.compile(p, re.I), j) for p, j in JA]
GROUPS = [(g, re.compile(p, re.I)) for g, p in GROUPS]
TOWNS = {"windsor": "Windsor", "tecumseh": "Tecumseh", "st. clair beach": "Tecumseh", "lasalle": "LaSalle", "la salle": "LaSalle"}


def fetch():
    s3 = fs.S3FileSystem(anonymous=True, region="us-west-2", proxy_options=os.environ.get("HTTPS_PROXY") or None)
    d = ds.dataset(f"overturemaps-us-west-2/release/{RELEASE}/theme=places/type=place/", filesystem=s3, format="parquet")
    f = (pc.field("bbox", "xmin") > W) & (pc.field("bbox", "xmax") < E) & (pc.field("bbox", "ymin") > S) & (pc.field("bbox", "ymax") < N)
    cols = ["id", "names", "basic_category", "taxonomy", "addresses", "websites", "socials", "phones", "confidence", "bbox",
            "operating_status", "brand"]
    rows = d.to_table(filter=f, columns=cols).to_pylist()
    for r in rows:
        b = r.pop("bbox")
        r["lat"], r["lon"] = (b["ymin"] + b["ymax"]) / 2, (b["xmin"] + b["xmax"]) / 2
    return rows


def pick(d):

    out, seen = [], collections.defaultdict(list)
    for p in d:
        a = (p.get('addresses') or [{}])[0] or {}
        if a.get('country') != 'CA':
            continue
        town = TOWNS.get((a.get('locality') or '').strip().lower())
        if not town:
            continue
        name = ((p.get('names') or {}).get('primary') or '').strip()
        if not name:
            continue
        br = p.get('brand') or {}
        if br.get('wikidata') or (br.get('names') or {}).get('primary'):
            continue
        if CHAINS.search(name) or EXTRA_CHAINS.search(name):
            continue
        cat = p.get('basic_category') or ''
        tax = (p.get('taxonomy') or {}).get('primary') or ''
        hier = ' '.join((p.get('taxonomy') or {}).get('hierarchy') or [])
        allcat = f'{cat} {tax} {hier}'
        if not GOOD.search(allcat) or BAD.search(f'{cat} {tax}'):
            continue
        if p.get('operating_status') and p['operating_status'] != 'open':
            continue
        if (p.get('confidence') or 0) < 0.6:
            continue
        webs = [w for w in (p.get('websites') or []) if w]
        if [w for w in webs if not NOT_OWN.search(w)]:
            continue  # 自分のサイトがある
        addr = (a.get('freeform') or '').strip()
        if not addr:
            continue
        # 同じ名前で50m以内は同じお店
        k = re.sub(r'[^a-z0-9]', '', name.lower())
        dup = False
        for (la, lo) in seen[k]:
            if abs(la - p['lat']) < 0.0005 and abs(lo - p['lon']) < 0.0007:
                dup = True; break
        if dup:
            continue
        seen[k].append((p['lat'], p['lon']))
        g = next((g for g, rx in GROUPS if rx.search(f'{cat} {tax}')), None) or next((g for g, rx in GROUPS if rx.search(allcat)), 'お店')
        ja = next((j for rx, j in JA if rx.search(f'{cat} {tax}')), None) or next((j for rx, j in JA if rx.search(allcat)), 'お店')
        soc = []
        for u in (p.get('socials') or []) + webs:
            if u and u not in soc:
                soc.append(u)
        phone = (p.get('phones') or [None])[0]
        out.append({"n": name, "g": g, "c": ja, "a": addr, "t": town, "lat": round(p['lat'], 6), "lon": round(p['lon'], 6),
                    "p": phone or "", "s": soc[:2], "k": round(p.get('confidence') or 0, 2)})
    return [o for o in out if not MORE_CHAINS.search(o["n"])]


if __name__ == "__main__":
    shops = pick(fetch())
    print("shops", len(shops), collections.Counter(o["g"] for o in shops).most_common())
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "shops.html")
    html = open(p, encoding="utf-8").read()
    html = re.sub(r"/\*DATA\*/.*?/\*END\*/", lambda m: "/*DATA*/" + json.dumps(shops, ensure_ascii=False, separators=(",", ":")) + "/*END*/", html, flags=re.S)
    y, m = RELEASE[:4], int(RELEASE[5:7])
    html = re.sub(r'const UPDATED = "[^"]*";', f'const UPDATED = "{y}年{m}月の版";', html)
    open(p, "w", encoding="utf-8").write(html)
