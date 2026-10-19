"""dar-scarlett の試着室のカーテン（赤いベルベット・横につなげられる）を描く。写真ではなく自前の絵なのでライセンスの心配なし。
使い方: pip install numpy pillow && python3 previews/velvet.py velvet.jpg
できた画像を 600x933 にして img/darscarlett.json の dz_velvet に data URI で入れる"""
import sys
import numpy as np
from PIL import Image, ImageFilter

W, H = 900, 1400
rng = np.random.default_rng(11)
x = np.arange(W)[None, :].astype(np.float64)
y = np.arange(H)[:, None].astype(np.float64)
yy = y / H
h = np.zeros((H, W)); dh = np.zeros((H, W))
for k, a in [(6, 1.0), (9, 0.42), (13, 0.18), (19, 0.05)]:  # 横に周期的なひだ（整数の周波数なので左右がつながる）
    ph = rng.uniform(0, 2 * np.pi)
    drift = 0.45 * np.sin(2 * np.pi * yy * rng.uniform(0.5, 1.1) + rng.uniform(0, 6)) * (0.4 + 0.6 * yy)
    t = 2 * np.pi * k * x / W + ph + drift
    amp = a * (1.0 + 0.15 * yy)
    h += amp * np.sin(t); dh += amp * np.cos(t) * (2 * np.pi * k / W)
nx = -dh * 55.0; nz = np.ones_like(nx)
nl = np.sqrt(nx * nx + nz * nz); nx /= nl; nz /= nl
L = np.array([-0.45, 0.0, 0.89]); L /= np.linalg.norm(L)
diff = np.clip(nx * L[0] + nz * L[2], 0, 1)
sheen = (1 - nz) ** 1.4  # ベルベットは斜めの面が光る
hn = (h - h.min()) / (h.max() - h.min())
I = (0.06 + 0.70 * diff ** 2.2 + 0.38 * sheen * np.where(nx < 0, 1.0, 0.45)) * (0.35 + 0.65 * hn ** 0.8)
spot = np.exp(-((x / W - 0.5) ** 2) / 0.9) * (0.55 + 0.45 * np.sin(np.pi * np.clip(yy * 0.95 + 0.1, 0, 1)))
I *= 0.55 + 0.6 * spot
n = rng.normal(0, 1, (H, W))
n = np.array(Image.fromarray(((n * 22) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)), dtype=np.float64) / 255 - 0.5
I = np.clip(I + n * 0.045, 0, 1.3)
stops = np.array([0, .12, .3, .5, .7, .9, 1.1, 1.3])
cols = np.array([[8, 1, 3], [34, 2, 8], [78, 5, 17], [128, 10, 28], [172, 22, 44], [205, 50, 68], [228, 96, 108], [240, 150, 156]], dtype=np.float64)
out = np.zeros((H, W, 3))
for c in range(3):
    out[..., c] = np.interp(I, stops, cols[:, c])
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(sys.argv[1] if len(sys.argv) > 1 else "velvet.jpg", quality=84)
