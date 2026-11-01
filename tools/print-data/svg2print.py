#!/usr/bin/env python3
"""SVG（単位 mm の viewBox）を、印刷会社に入稿できる PDF にする道具（2026-11-01〜）。

- 文字はアウトライン化（フォントのファイルから形を取り出してパスにする。PDF にフォントは入らない）
- 色は CMYK（--color で「SVGの色=C,M,Y,K」を指定。指定がない色は簡単な計算で CMYK に直す）
- 塗り足し（--bleed、mm）。ページの端まである四角は、塗り足しの分まで広げる
- 仕上がりサイズは TrimBox、塗り足しを含めたサイズは BleedBox に入れる
- --drop で消す色（例：黒い紙に箔押しするときの「紙の色」の背景）
- --ai を付けると、同じ中身の .ai も書く（Illustrator は PDF 互換の AI として開ける。最初の納品で開けるか確かめてもらう）

使い方の例：
  python3 svg2print.py box.svg out/box_foil.pdf --fonts fonts/ \
      --color "url(#gold)=0,0,0,100" --drop "#0c0b0a" --ai
  python3 svg2print.py label.svg out/label.pdf --fonts fonts/ --bleed 3 \
      --color "#101010=40,40,40,100" --color "#d4c29c=17,22,42,0"

--fonts のフォルダには .ttf / .otf / .woff2 を置く。どのファイルがどのフォントかは、ファイルの中の名前（ファミリー名・太さ・斜体）で自動で見分ける。
使うには: pip install fonttools brotli reportlab svgelements
"""
import argparse, glob, os, re, shutil, sys
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
import svgelements as se
from reportlab.pdfgen import canvas
from reportlab.lib.colors import CMYKColor

MM = 72 / 25.4


# ---------- フォント ----------
class FontBook:
    def __init__(self, folder):
        self.fonts = []  # (family, weight, italic, TTFont)
        for f in sorted(glob.glob(os.path.join(folder, "*"))):
            if not f.lower().endswith((".ttf", ".otf", ".woff2", ".woff")):
                continue
            tt = TTFont(f)
            name = tt["name"]
            fam = (name.getDebugName(16) or name.getDebugName(1) or "").strip()
            # 「Cormorant Garamond Light」のように太さの名前が付いていることがあるので外す
            fam = re.sub(r"(\s+(Thin|ExtraLight|Extra Light|Light|Regular|Medium|SemiBold|Semi Bold|Bold|ExtraBold|Black|Italic))+$", "", fam, flags=re.I)
            weight = tt["OS/2"].usWeightClass if "OS/2" in tt else 400
            italic = bool(tt["head"].macStyle & 2) or ("OS/2" in tt and bool(tt["OS/2"].fsSelection & 1)) or "italic" in (name.getDebugName(2) or "").lower()
            # 可変フォント：既定の太さの形だけ使う（instancer で太さを変える）
            if "fvar" in tt:
                for ax in tt["fvar"].axes:
                    if ax.axisTag == "wght":
                        weight = None  # どの太さにも合わせられる
            self.fonts.append((fam, weight, italic, tt, f))
        if not self.fonts:
            sys.exit(f"フォントが見つかりません: {folder}")
        self._cache = {}

    def get(self, family, weight=400, italic=False, text=""):
        fam = family.split(",")[0].strip().strip("'\"").lower()
        key = (fam, weight, italic, text)
        if key in self._cache:
            return self._cache[key]
        cands = [x for x in self.fonts if x[0].lower() == fam]
        if not cands:
            sys.exit(f"フォント「{family}」のファイルがありません（--fonts のフォルダに入れてください）")
        same = [x for x in cands if x[2] == italic] or cands
        # 同じ名前で文字の範囲ごとにファイルが分かれていることがある（Google Fonts）。使う文字が全部あるものを選ぶ
        def missing(x):
            cm = x[3].getBestCmap()
            return sum(1 for ch in text if ch.strip() and ord(ch) not in cm)
        best = min(same, key=lambda x: (missing(x), 0 if x[1] is None else abs(x[1] - weight)))
        if missing(best):
            sys.exit(f"フォント「{family}」に無い文字があります: {text}")
        tt = best[3]
        if best[1] is None and "fvar" in tt:
            from fontTools.varLib import instancer
            tt = instancer.instantiateVariableFont(TTFont(best[4]), {"wght": weight})
        self._cache[key] = tt
        return tt


def text_paths(tt, s, size, x, y, anchor, spacing):
    """文字列 s を、左下が (x, y) の基準線にのるパスの命令（SVG の座標、mm）にする"""
    upm = tt["head"].unitsPerEm
    cmap = tt.getBestCmap()
    gs = tt.getGlyphSet()
    hmtx = tt["hmtx"]
    sc = size / upm
    names = [cmap.get(ord(ch), ".notdef") for ch in s]
    widths = [hmtx[n][0] * sc + spacing for n in names]
    total = sum(widths) - (spacing if names else 0)
    if anchor == "middle":
        x -= total / 2
    elif anchor == "end":
        x -= total
    out = []
    for n, w in zip(names, widths):
        rp = RecordingPen()
        # フォントは上が＋、SVG は下が＋なので y を反転
        gs[n].draw(TransformPen(rp, (sc, 0, 0, -sc, x, y)))
        out.append(rp.value)
        x += w
    return out


# ---------- 色 ----------
def parse_cmyk(v):
    c = [float(t) for t in v.split(",")]
    return CMYKColor(*[t / 100 for t in c])


def rgb_to_cmyk(hexv):
    hexv = hexv.lstrip("#")
    if len(hexv) == 3:
        hexv = "".join(ch * 2 for ch in hexv)
    r, g, b = [int(hexv[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    k = 1 - max(r, g, b)
    if k >= 0.999:
        return CMYKColor(0, 0, 0, 1)
    return CMYKColor((1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k)


def norm_color(v):
    if v is None:
        return None
    v = str(v).strip().lower().replace(" ", "")
    return None if v in ("", "none", "transparent") else v


def strip_unused_font(path):
    """reportlab がページに勝手に付ける Helvetica（使っていない・埋め込みなし）を消す。
    入稿チェックで「埋め込まれていないフォントがある」と言われないように"""
    try:
        import pymupdf
    except ImportError:
        print("  （pymupdf がないので、使っていない Helvetica の登録を消せませんでした。pip install pymupdf）")
        return
    d = pymupdf.open(path)
    for page in d:
        kind, val = d.xref_get_key(page.xref, "Resources")
        if kind == "xref":
            d.xref_set_key(int(val.split()[0]), "Font", "null")
        elif kind == "dict":
            d.xref_set_key(page.xref, "Resources/Font", "null")
    tmp = path + ".tmp"
    d.save(tmp, garbage=4, deflate=True)
    d.close()
    os.replace(tmp, path)


# ---------- 本体 ----------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("svg")
    ap.add_argument("pdf")
    ap.add_argument("--fonts", required=True)
    ap.add_argument("--bleed", type=float, default=0)
    ap.add_argument("--color", action="append", default=[], help='"SVGの色=C,M,Y,K"（0〜100）')
    ap.add_argument("--drop", action="append", default=[], help="描かない色")
    ap.add_argument("--ai", action="store_true")
    a = ap.parse_args()

    cmap = {}
    for c in a.color:
        k, v = c.rsplit("=", 1)
        cmap[norm_color(k)] = parse_cmyk(v)
    drops = {norm_color(d) for d in a.drop}
    fonts = FontBook(a.fonts)

    raw = open(a.svg, encoding="utf-8").read()
    vb = re.search(r'viewBox="([\d.\s-]+)"', raw)
    if not vb:
        sys.exit("SVG に viewBox（mm）がありません")
    _, _, W, H = [float(t) for t in vb.group(1).split()]
    # svgelements は url(#…) の塗りを色にできないので、元の文字のまま読めるように印を付ける
    raw2 = re.sub(r'(fill|stroke)="url\(#([\w-]+)\)"', r'\1="#000001" data-\1-ref="url(#\2)"', raw)
    doc = se.SVG.parse(__import__("io").StringIO(raw2), reify=True, ppi=se.DEFAULT_PPI)

    b = a.bleed
    out_dir = os.path.dirname(os.path.abspath(a.pdf))
    os.makedirs(out_dir, exist_ok=True)
    cv = canvas.Canvas(a.pdf, pagesize=((W + 2 * b) * MM, (H + 2 * b) * MM))
    cv.setTitle(os.path.splitext(os.path.basename(a.pdf))[0])
    # SVG（mm・下が＋）→ PDF（pt・上が＋）
    cv.translate(b * MM, (H + b) * MM)
    cv.scale(MM, -MM)
    if b:
        trim = (b * MM, b * MM, (W + b) * MM, (H + b) * MM)
        cv.setTrimBox(trim)
        cv.setBleedBox((0, 0, (W + 2 * b) * MM, (H + 2 * b) * MM))

    used, unknown = set(), set()

    def color_of(el, which):
        ref = el.values.get(f"data-{which}-ref")
        v = norm_color(ref) if ref else norm_color(el.values.get(which))
        if v is None or v in drops:
            return None
        used.add(v)
        if v in cmap:
            return cmap[v]
        if v.startswith("#"):
            unknown.add(v)
            return rgb_to_cmyk(v)
        unknown.add(v)
        return CMYKColor(0, 0, 0, 1)

    def draw_cmds(cmds, fill, stroke, sw):
        p = cv.beginPath()
        for op, pts in cmds:
            if op == "moveTo":
                p.moveTo(*pts[0])
            elif op == "lineTo":
                p.lineTo(*pts[0])
            elif op == "curveTo":
                p.curveTo(*pts[0], *pts[1], *pts[2])
            elif op == "qCurveTo":
                # 2次ベジェ（TrueType）を3次に直して描く。続きの点は中点を補う
                cur = cur_pt[0]
                ps = list(pts)
                while len(ps) > 2:
                    mid = ((ps[0][0] + ps[1][0]) / 2, (ps[0][1] + ps[1][1]) / 2)
                    q2c(p, cur, ps[0], mid)
                    cur = mid
                    ps = ps[1:]
                q2c(p, cur, ps[0], ps[1])
                pts = [ps[1]]
            elif op in ("closePath", "endPath"):
                p.close()
            if pts:
                cur_pt[0] = pts[-1]
            if op == "moveTo":
                start[0] = pts[0]
        if fill is not None:
            cv.setFillColor(fill)
        if stroke is not None:
            cv.setStrokeColor(stroke)
            cv.setLineWidth(sw)
            cv.setLineCap(1)
            cv.setLineJoin(1)
        cv.drawPath(p, fill=1 if fill is not None else 0, stroke=1 if stroke is not None else 0)

    cur_pt, start = [(0, 0)], [(0, 0)]

    def q2c(p, p0, c, p2):
        c1 = (p0[0] + 2 / 3 * (c[0] - p0[0]), p0[1] + 2 / 3 * (c[1] - p0[1]))
        c2 = (p2[0] + 2 / 3 * (c[0] - p2[0]), p2[1] + 2 / 3 * (c[1] - p2[1]))
        p.curveTo(*c1, *c2, *p2)

    n_text = n_path = 0
    for el in doc.elements():
        if isinstance(el, se.Text):
            fill = color_of(el, "fill")
            if fill is None:
                continue
            fam = el.values.get("font-family", "")
            wt = int(el.values.get("font-weight", 400) or 400)
            it = el.values.get("font-style", "") == "italic"
            size = float(el.values.get("font-size", 16))
            sp = float(el.values.get("letter-spacing", 0) or 0)
            anchor = el.values.get("text-anchor", "start")
            m = el.transform
            tt = fonts.get(fam, wt, it, el.text or "")
            for cmds in text_paths(tt, el.text or "", size, el.x, el.y, anchor, sp):
                cmds = [(op, [tuple(m.point_in_matrix_space(pt)) for pt in pts]) for op, pts in cmds]
                draw_cmds(cmds, fill, None, 0)
            n_text += 1
        elif isinstance(el, se.Shape) and not isinstance(el, se.Text):
            fill = color_of(el, "fill") if el.values.get("fill", "black") not in ("none",) else None
            stroke = color_of(el, "stroke")
            if fill is None and stroke is None:
                continue
            sw = float(el.values.get("stroke-width", 1) or 1)
            path = se.Path(el)
            if isinstance(el, se.Rect) and b and fill is not None:
                # ページの端に触れている四角は塗り足しまで広げる
                x0, y0, x1, y1 = path.bbox()
                if x0 <= 0.01 or y0 <= 0.01 or x1 >= W - 0.01 or y1 >= H - 0.01:
                    x0 = -b if x0 <= 0.01 else x0
                    y0 = -b if y0 <= 0.01 else y0
                    x1 = W + b if x1 >= W - 0.01 else x1
                    y1 = H + b if y1 >= H - 0.01 else y1
                    path = se.Path(se.Rect(x0, y0, x1 - x0, y1 - y0))
            cmds = []
            for seg in path.segments():
                if isinstance(seg, se.Move):
                    cmds.append(("moveTo", [(seg.end.x, seg.end.y)]))
                elif isinstance(seg, se.Line):
                    cmds.append(("lineTo", [(seg.end.x, seg.end.y)]))
                elif isinstance(seg, se.CubicBezier):
                    cmds.append(("curveTo", [(seg.control1.x, seg.control1.y), (seg.control2.x, seg.control2.y), (seg.end.x, seg.end.y)]))
                elif isinstance(seg, se.QuadraticBezier):
                    cmds.append(("qCurveTo", [(seg.control.x, seg.control.y), (seg.end.x, seg.end.y)]))
                elif isinstance(seg, se.Arc):
                    for cb in seg.as_cubic_curves():
                        cmds.append(("curveTo", [(cb.control1.x, cb.control1.y), (cb.control2.x, cb.control2.y), (cb.end.x, cb.end.y)]))
                elif isinstance(seg, se.Close):
                    cmds.append(("closePath", []))
            if fill is not None and stroke is not None:
                draw_cmds(cmds, fill, None, 0)
                draw_cmds(cmds, None, stroke, sw)
            else:
                draw_cmds(cmds, fill, stroke, sw)
            n_path += 1

    cv.showPage()
    cv.save()
    strip_unused_font(a.pdf)
    if a.ai:
        shutil.copyfile(a.pdf, os.path.splitext(a.pdf)[0] + ".ai")
    print(f"書きました: {a.pdf}{' と .ai' if a.ai else ''}  文字 {n_text} / 図形 {n_path}  サイズ {W}x{H}mm 塗り足し {b}mm")
    if unknown - set(cmap):
        print("  指定のない色（計算で CMYK にした）:", ", ".join(sorted(unknown - set(cmap))))


if __name__ == "__main__":
    main()
