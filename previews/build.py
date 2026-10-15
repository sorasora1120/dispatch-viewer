"""previews/src/*.html の {{画像名}} を img/*.json の data URI に置き換えて previews/ に書き出す: python3 previews/build.py"""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent
images = {}
for f in sorted((root / "img").glob("*.json")):
    images.update(json.load(open(f)))
for src in (root / "src").glob("*.html"):
    html = src.read_text(encoding="utf-8")
    out = re.sub(r"\{\{(\w+)\}\}", lambda m: images[m.group(1)], html)
    (root / src.name).write_text(out, encoding="utf-8")
    print(src.name, len(out) // 1024, "KB")
