#!/usr/bin/env python3
"""One-off: turns the static site's generated content pages into Astro pages, text unchanged.
usage: python3 scripts/port-pages.py PATH/TO/static-site slug [slug ...]
Plates and gallery figures become <Plate> and <Photo>; links lose their "../" prefix."""
import html
import json
import pathlib
import re
import sys

src_root = pathlib.Path(sys.argv[1])
out_root = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'pages'


def one(pattern, text, default=None):
    m = re.search(pattern, text, re.S)
    return m.group(1) if m else default


for slug in sys.argv[2:]:
    page = (src_root / slug / 'index.html').read_text(encoding='utf-8')
    depth = slug.count('/') + 1
    up = '../' * depth
    description = html.unescape(one(r'<meta name="description" content="(.*?)">', page))
    eyebrow = html.unescape(one(r'<p class="eyebrow">(.*?)</p>', page))
    title = html.unescape(one(r'<h1>(.*?)</h1>', page))
    lead = one(r'<p class="lead">(.*?)</p>', page)
    back_href, back_label = re.search(r'<a class="back" href="(.*?)">(.*?)</a>', page).groups()
    next_href, next_label = re.search(r'<nav class="next-page" aria-label="Next page"><a class="more" href="(.*?)">Next: (.*?)</a></nav>', page).groups()
    body = page[page.index('<div class="prose">\n') + len('<div class="prose">\n'):page.index('\n      </div>\n      <nav class="next-page"')]
    imports, n = [], 0

    def image(path):
        global n
        name = f'img{len(imports)}'
        imports.append(f"import {name} from '{'../' * (depth + 1)}assets/img/{path}';")
        return name

    def plate(m):
        kind, src, alt, cap = m.group(1), m.group(2), html.unescape(m.group(3)), m.group(4)
        cap_attr = f' caption={{{json.dumps(html.unescape(cap), ensure_ascii=False)}}}' if cap is not None else ''
        return f'<Plate src={{{image(src)}}} alt={{{json.dumps(alt, ensure_ascii=False)}}}{cap_attr} kind="{kind}" />'

    body = re.sub(r'<figure class="plate ([^"]+)"><img src="' + re.escape(up) + r'assets/img/([^"]+)" alt="([^"]*)" loading="lazy">(?:<figcaption>(.*?)</figcaption>)?</figure>', plate, body)

    def figure(m):
        attrs, cap = m.group(1), m.group(2)
        src = re.search(r'src="' + re.escape(up) + r'assets/img/([^"]+)"', attrs).group(1)
        full = re.search(r'srcset="[^"]*?, ' + re.escape(up) + r'assets/img/([^" ]+) \d+w"', attrs)
        sizes = re.search(r'sizes="([^"]+)"', attrs)
        alt = html.unescape(re.search(r'alt="([^"]*)"', attrs).group(1))
        source = full.group(1) if full else src
        size = sizes.group(1) if sizes else '350px'
        cap_html = f'<figcaption>{cap}</figcaption>' if cap is not None else ''
        return f'<figure><Photo src={{{image(source)}}} alt={{{json.dumps(alt, ensure_ascii=False)}}} sizes="{size}" />{cap_html}</figure>'

    body = re.sub(r'<figure><img ([^>]*)>(?:<figcaption>(.*?)</figcaption>)?</figure>', figure, body)
    assert '<img' not in body, f'{slug}: an image was not converted'
    body = body.replace('href="' + up, 'href="/').replace('href="/"', 'href="/"')
    assert '../' not in body, f'{slug}: a relative link is left'
    components = []
    if '<Plate' in body:
        components.append(f"import Plate from '{'../' * (depth + 1)}components/Plate.astro';")
    if '<Photo' in body:
        components.append(f"import Photo from '{'../' * (depth + 1)}components/Photo.astro';")
    fix = lambda h: h.replace(up, '/') if h.startswith(up) else h
    props = dict(title=title, description=description, slug=slug, eyebrow=eyebrow)
    j = lambda v: json.dumps(v, ensure_ascii=False)
    attrs = ' '.join(f'{k}={{{j(v)}}}' for k, v in props.items())
    if lead is not None:
        attrs += f' lead={{{j(lead)}}}'
    attrs += f' back={{{j(dict(href=fix(back_href), label=html.unescape(back_label)))}}}'
    attrs += f' next={{{j(dict(href=fix(next_href), label=html.unescape(next_label)))}}}'
    head = '\n'.join([f"import Page from '{'../' * (depth + 1)}layouts/Page.astro';", *components, *imports])
    out = out_root / slug / 'index.astro'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(f'---\n{head}\n---\n<Page article {attrs}>\n{body}\n</Page>\n', encoding='utf-8')
    print('wrote', out.relative_to(out_root.parent.parent), len(imports), 'images')
