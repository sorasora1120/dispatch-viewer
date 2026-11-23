"""shops.html のデータから call.html のリストと call-list.csv（スプレッドシート「コールリスト」用）を作る。
使い方: python3 tools/call_list.py   （windsor_shops.py → yp_check.py --apply のあと）
call.html は電話番号があるお店だけ、CSV は全部のお店。番号が確かな順に並べる。"""
import csv, json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
m = json.load(open(os.path.join(ROOT, "tools", "call_catmap.json"), encoding="utf-8"))
cmap, gmap = m["cmap"], m["gmap"]
cmap.update({"ベトナム料理": "Vietnamese", "メキシコ料理": "Mexican"})


def load(p):
    s = open(p, encoding="utf-8").read(); a = s.index("/*DATA*/") + 8; b = s.index("/*END*/", a); return s, a, b


ss, sa, sb = load(os.path.join(ROOT, "shops.html")); shops = json.loads(ss[sa:sb])
rank = {"ok": 0, "one": 1, "yp": 2, "diff": 3, "old": 4, "far": 5, "shared": 6}
shops.sort(key=lambda x: (0 if x.get("p") else 1, rank.get(x.get("pq"), 7)))
out = [{"n": x["n"], "g": gmap[x["g"]], "c": cmap.get(x["c"], x["c"]), "a": x["a"], "t": x["t"], "lat": x["lat"], "lon": x["lon"],
        "p": x["p"], "pa": x.get("pa", []), "pq": x.get("pq", "")} for x in shops if x.get("p")]
cp = os.path.join(ROOT, "call.html"); cs, ca, cb = load(cp)
open(cp, "w", encoding="utf-8").write(cs[:ca] + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + cs[cb:])


def tel(p):
    p = p.replace("+1", ""); return f"({p[:3]}) {p[3:6]}-{p[6:]}" if len(p) == 10 else p


Q = {"ok": "✓ 2か所で同じ番号", "one": "1か所だけ（未確認）", "yp": "イエローページだけ", "diff": "⚠ イエローページは別の番号（別の番号の列）",
     "old": "⚠ 古い情報", "far": "⚠ 市外の番号", "shared": "⚠ 別のお店と同じ番号"}
rows = [["お店", "種類", "町", "住所", "電話", "番号の確かさ", "別の番号"]] + [
    [x["n"], x["c"], x["t"], x["a"], tel(x["p"]) if x.get("p") else "", Q.get(x.get("pq"), "") if x.get("p") else "番号なし",
     ", ".join(tel(p) for p in x.get("pa", []))] for x in shops]
with open(os.path.join(ROOT, "call-list.csv"), "w", newline="", encoding="utf-8") as f:
    csv.writer(f).writerows(rows)
print("call.html", len(out), "csv", len(rows) - 1)
