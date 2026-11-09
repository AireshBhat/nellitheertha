// The same page on two hosts: words, overflow, broken pictures, errors; side-by-side screenshots in tests/out/.
// usage: node tests/parity.mjs BASE_A BASE_B [page ...]
import fs from 'fs';
import { PAGES, launch, base as slash } from './chrome.mjs';
const [A, B, ...rest] = process.argv.slice(2);
const pages = rest.length ? rest.map((p) => (p === '/' ? '' : p)) : PAGES;
const query = process.env.QUERY || '';
fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
const b = await launch();
let failures = 0;
const norm = (s) => s.replace(/\s+/g, ' ').trim();
for (const vp of [{ width: 390, height: 844, m: true }, { width: 1440, height: 900, m: false }]) {
  for (const path of pages) {
    const shot = {}, text = {}, info = {};
    for (const [name, host] of [['a', slash(A)], ['b', slash(B)]]) {
      const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.m, hasTouch: vp.m, reducedMotion: 'reduce' });
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
      const res = await p.goto(host + path + query, { waitUntil: 'networkidle' });
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
      await p.waitForTimeout(500);
      text[name] = norm(await p.evaluate(() => document.body.innerText));
      info[name] = await p.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth,
        broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src) }));
      info[name].status = res.status(); info[name].errors = errs;
      shot[name] = `tests/out/${name}-${vp.width}-${path.replace(/\//g, '_') || 'home'}.png`;
      await p.screenshot({ path: shot[name] });
      await ctx.close();
    }
    const same = text.a === text.b;
    const ib = info.b, ok = same && ib.status === 200 && ib.overflow === 0 && !ib.broken.length && !ib.errors.length;
    if (!ok) failures++;
    let diff = '';
    if (!same) { let i = 0; while (text.a[i] === text.b[i]) i++; diff = `\n   A: …${text.a.slice(Math.max(0, i - 50), i + 90)}\n   B: …${text.b.slice(Math.max(0, i - 50), i + 90)}`; }
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${vp.width} /${path} | text ${same ? 'same' : 'DIFFERENT'} | status ${ib.status} | overflow ${ib.overflow} | broken ${ib.broken.length} | errors ${ib.errors.length ? ib.errors : 0}${diff}`);
  }
}
await b.close();
process.exit(failures ? 1 : 0);
