// The head of each page: what search engines and WhatsApp read.
// usage: node tests/head.mjs BASE [--save FILE | --compare FILE] [page ...]
import fs from 'fs';
import { PAGES, launch, base as slash } from './chrome.mjs';
const args = process.argv.slice(2);
const base = slash(args.shift());
let mode = null, file = null;
if (['--save', '--compare'].includes(args[0])) { mode = args.shift(); file = args.shift(); }
const pages = args.length ? args.map((p) => (p === '/' ? '' : p)) : PAGES;
const b = await launch();
const out = {};
for (const path of pages) {
  const p = await b.newPage();
  const res = await p.goto(base + path, { waitUntil: 'domcontentloaded' });
  out['/' + path] = await p.evaluate((status) => {
    const meta = (sel) => document.querySelector(sel)?.getAttribute('content') ?? null;
    const href = (sel) => { const el = document.querySelector(sel); return el ? new URL(el.getAttribute('href'), location.href).pathname : null; };
    const og = {};
    document.querySelectorAll('meta[property^="og:"]').forEach((m) => { og[m.getAttribute('property')] = m.getAttribute('content'); });
    return {
      status, title: document.title, lang: document.documentElement.lang,
      description: meta('meta[name=description]'), robots: meta('meta[name=robots]'), themeColor: meta('meta[name=theme-color]'),
      canonical: document.querySelector('link[rel=canonical]')?.href ?? null, og, twitter: meta('meta[name="twitter:card"]'),
      touchIcon: href('link[rel=apple-touch-icon]'), icon: document.querySelector('link[rel=icon]')?.getAttribute('href')?.slice(0, 40) ?? null,
      fontPreloads: document.querySelectorAll('link[rel=preload][as=font]').length,
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)),
    };
  }, res.status());
  await p.close();
}
await b.close();
if (mode === '--save') { fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n'); console.log('saved', Object.keys(out).length, 'pages to', file); }
else if (mode === '--compare') {
  const want = JSON.parse(fs.readFileSync(file, 'utf8')); let bad = 0;
  for (const [k, v] of Object.entries(out)) {
    const a = JSON.stringify(want[k], null, 1), c = JSON.stringify(v, null, 1);
    if (a !== c) {
      bad++; console.log('DIFF', k);
      const al = a.split('\n'), cl = c.split('\n');
      for (let i = 0; i < Math.max(al.length, cl.length); i++) if (al[i] !== cl[i]) console.log('  live:', al[i], '\n  new: ', cl[i]);
    } else console.log('SAME', k);
  }
  process.exit(bad ? 1 : 0);
} else console.log(JSON.stringify(out, null, 1));
