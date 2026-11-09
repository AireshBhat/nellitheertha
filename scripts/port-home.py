#!/usr/bin/env python3
"""One-off: turns the static home page into src/pages/index.astro, words and markup unchanged except
the pictures (AVIF and WebP at several widths), and the page list, day strip and programme data (now built).
usage: python3 scripts/port-home.py PATH/TO/static-site"""
import json
import pathlib
import re
import sys

src = (pathlib.Path(sys.argv[1]) / 'index.html').read_text(encoding='utf-8')
out = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'pages' / 'index.astro'
main = src[src.index('  <main>'):src.index('  </main>') + len('  </main>')]


def swap(pattern, new, count=1):
    global main
    main, n = re.subn(pattern, lambda m: new(m) if callable(new) else new, main, flags=re.S)
    assert n == count, (pattern[:60], n)


def alt(block):
    return json.dumps(re.search(r'alt="([^"]*)"', block).group(1), ensure_ascii=False)


swap(r'<picture class="hero-photo">.*?</picture>',
     lambda m: f'<ArtPicture class="hero-photo" tall={{forestTall}} wide={{forestWide}} alt={{{alt(m.group(0))}}} eager />')
swap(r'<picture>\s*<source media="\(min-width: 700px\)" srcset="assets/img/kere-wide.webp">.*?</picture>',
     lambda m: f'<ArtPicture tall={{kereTall}} wide={{kereWide}} alt={{{alt(m.group(0))}}} wideSizes="(min-width: 700px) 60vw, 100vw" />')
swap(r'<picture>\s*<source media="\(min-width: 700px\)" srcset="assets/img/cave-wide.webp">.*?</picture>',
     lambda m: f'<ArtPicture tall={{caveTall}} wide={{caveWide}} alt={{{alt(m.group(0))}}} />')
swap(r'<img src="assets/img/sanctum.webp"[^>]*>',
     lambda m: f'<Photo src={{sanctum}} alt={{{alt(m.group(0))}}} sizes="(min-width: 1000px) 60vw, 100vw" widths={{[480, 800, 1200, 1600, 2000]}} />')
swap(r'<picture>\s*<source media="\(min-width: 700px\)" srcset="assets/img/moon-ground.webp">.*?</picture>',
     lambda m: f'<Photo src={{moonGround}} alt={{{alt(m.group(0))}}} sizes="(min-width: 1000px) 60vw, 100vw" widths={{[480, 900, 1350, 1800]}} />')
swap(r'<img src="assets/img/pili-torches-sm.webp"[^>]*>',
     lambda m: f'<Photo src={{piliTorches}} alt={{{alt(m.group(0))}}} sizes="(min-width: 1000px) 48vw, 100vw" widths={{[480, 900, 1350, 1800]}} />')
swap(r'<img src="assets/img/kola-silver.webp"[^>]*>',
     lambda m: f'<Photo src={{kolaSilver}} alt={{{alt(m.group(0))}}} sizes="(min-width: 1000px) 26vw, 50vw" widths={{[400, 600, 900, 1200]}} />')
swap(r'<img src="assets/img/kola-arch-sm.webp"[^>]*>',
     lambda m: f'<Photo src={{kolaArch}} alt={{{alt(m.group(0))}}} sizes="(min-width: 1000px) 26vw, 50vw" widths={{[400, 600, 900, 1200]}} />')
swap(r'srcset="assets/walk-wide/000.webp"', 'srcset="/assets/walk-wide/000.webp"')
swap(r'src="assets/walk-tall/000.webp"', 'src="/assets/walk-tall/000.webp"')
swap(r'    <!-- pages:start -->.*?<!-- pages:end -->\n', '    <PageIndex />\n')
swap(r'<!-- days:start -->.*?<!-- days:end -->',
     '{groups.map((g) => <li class={g.day === 25 ? "key" : undefined} data-date={g.date}><a href={`brahmakalasha/#dec-${g.day}`}><span>{g.day}</span><small>{g.weekday.slice(0, 3)}</small></a></li>)}')
assert '<img' not in main.replace('<img class="forest-still"', ''), 'an image was not converted'
assert '{' not in re.sub(r'<(ArtPicture|Photo|PageIndex)[^>]*/>|\{groups\.map.*?</li>\)\}', '', main), 'a stray brace'

head = re.search(r'<script type="application/ld\+json">(.*?)</script>', src).group(1)
meta = lambda name: re.search(rf'<meta (?:name|property)="{re.escape(name)}" content="([^"]*)">', src).group(1)
front = f'''---
// The home page. Its words and markup come from the static site (scripts/port-home.py); the live panel is src/scripts/home.ts.
import Page from '../layouts/Page.astro';
import ArtPicture from '../components/ArtPicture.astro';
import Photo from '../components/Photo.astro';
import PageIndex from '../components/PageIndex.astro';
import {{ byDate, posters, programme }} from '../lib/brahmakalasha';
import {{ liveData }} from '../lib/live';
import forestTall from '../assets/img/forest-tall.webp';
import forestWide from '../assets/img/forest-wide.webp';
import kereTall from '../assets/img/kere-tall.webp';
import kereWide from '../assets/img/kere-wide.webp';
import caveTall from '../assets/img/cave-tall.webp';
import caveWide from '../assets/img/cave-wide.webp';
import sanctum from '../assets/img/sanctum.webp';
import moonGround from '../assets/img/moon-ground.webp';
import piliTorches from '../assets/img/pili-torches.webp';
import kolaSilver from '../assets/img/kola-silver.webp';
import kolaArch from '../assets/img/kola-arch.webp';
import {{ srcset, TALL_WIDTHS, WIDE_WIDTHS }} from '../lib/images';

const blocks = await programme();
const groups = byDate(blocks);
const data = JSON.stringify(liveData(blocks, posters)).replace(/<\\//g, '<\\\\/');
const JSON_LD = {head};
const heroTall = await srcset(forestTall, TALL_WIDTHS, 'avif');
const heroWide = await srcset(forestWide, WIDE_WIDTHS, 'avif');
---
<Page home slug="" title="Sri Kshetra Nellitheertha" docTitle={json.dumps(meta("og:title"), ensure_ascii=False)}
  description={json.dumps(meta("description"), ensure_ascii=False)}
  ogDescription={json.dumps(meta("og:description"), ensure_ascii=False)}
  ogImageAlt={json.dumps(meta("og:image:alt"), ensure_ascii=False)}
  jsonLd={{JSON_LD}} bodyData={{{{ tide: 'festival' }}}}>
  <Fragment slot="head">
    <link rel="preload" as="image" type="image/avif" imagesrcset={{heroTall}} imagesizes="100vw" media="(max-width: 699px)">
    <link rel="preload" as="image" type="image/avif" imagesrcset={{heroWide}} imagesizes="100vw" media="(min-width: 700px)">
  </Fragment>
{main}
  <script type="application/json" id="programme-data" is:inline set:html={{data}} slot="end"></script>
  <script src="../scripts/home.ts"></script>
</Page>
'''
out.write_text(front, encoding='utf-8')
print('wrote', out)
