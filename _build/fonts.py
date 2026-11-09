#!/usr/bin/env python3
"""Cuts the typefaces into WOFF2 files for assets/fonts/.

Every OpenType layout feature is kept, so Kannada conjuncts and vottus shape as in the original fonts.
A page downloads the Kannada file only when it shows Kannada in that typeface. Run from pass-01/:
    uv run --with fonttools --with brotli python3 _build/fonts.py
"""
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
RANGES = {  # keep in step with the unicode-range lines in styles.css
    'latin': 'U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-205E,U+20B9,U+2190-2199,U+2212',
    'kannada': 'U+0964-0965,U+0C80-0CFF,U+1CD0-1CFF,U+200B-200D,U+25CC,U+A830-A839',
}
# Tiro is needed whole on every page (Kannada titles and English headings), so it stays one file and keeps its
# kerning between spaces and Kannada letters. Anek is cut in two, so English pages skip its Kannada glyphs.
JOBS = [('TiroKannada-Regular', 'all', RANGES['latin'] + ',' + RANGES['kannada'])]
JOBS += [('AnekKannada-Variable', part, unicodes) for part, unicodes in RANGES.items()]
for name, part, unicodes in JOBS:
    if True:
        out = ROOT / 'assets' / 'fonts' / f'{name}-{part}.woff2'
        subprocess.run(['pyftsubset', str(ROOT / '_build' / 'fonts' / f'{name}.ttf'), f'--unicodes={unicodes}',
                        '--layout-features=*', '--flavor=woff2', '--no-hinting', f'--output-file={out}'], check=True)
        print(out.relative_to(ROOT), out.stat().st_size)
