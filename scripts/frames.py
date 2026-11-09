#!/usr/bin/env python3
"""Re-cuts the forest-walk frames lighter: fewer frames, 90% size, a light smoothing of the video grain, WebP q50.
Tall (phones): 60 -> 40 frames, 640 -> 576 px wide. Wide: 48 -> 32 frames, 1280 -> 1152 px wide. About 2 MB a set.
Writes walk-tall-2/ and walk-wide-2/. Any later re-cut must use new folder names again.
usage: uv run --with pillow python3 scripts/frames.py SOURCE_DIR   (SOURCE_DIR holds walk-tall/ and walk-wide/ at full count)"""
import pathlib
import sys

from PIL import Image, ImageFilter

src_root = pathlib.Path(sys.argv[1])
out_root = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'assets'
for name, count in (('walk-tall', 40), ('walk-wide', 32)):
    frames = sorted((src_root / name).glob('*.webp'))
    out = out_root / f'{name}-2'  # a new cut needs a new folder: phones cache frames for weeks
    for old in out.glob('*.webp'):
        old.unlink()
    total = 0
    for i in range(count):
        img = Image.open(frames[round(i * (len(frames) - 1) / (count - 1))]).convert('RGB')
        img = img.resize((round(img.width * 0.9), round(img.height * 0.9)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.0))
        target = out / f'{i:03d}.webp'
        img.save(target, 'WEBP', quality=50, method=6)
        total += target.stat().st_size
    print(name, count, 'frames', img.size, f'{total / 1048576:.2f} MB')
