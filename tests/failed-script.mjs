// If the home page's script never arrives (a dropped connection), all its text must still become readable.
// usage: node tests/failed-script.mjs BASE
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
let blocked = 0;
await p.route('**/*', (route) => {
  const u = route.request().url();
  // the home page's own script: index.astro's bundle on the new site, script.js on the static one
  if (route.request().resourceType() === 'script' && /index\.astro.*\.js|\/script\.js/.test(u)) { blocked++; return route.abort(); }
  return route.continue();
});
await p.goto(base, { waitUntil: 'load' });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
await p.waitForTimeout(2500);
const r = await p.evaluate(() => {
  const blocks = [...document.querySelectorAll('main h2, main p, main li')]
    .filter((x) => x.textContent.trim().length > 15 && !x.closest('.ordinary-present, .kn-only, .now-next, [hidden]') && x.getClientRects().length);
  const faint = blocks.filter((x) => { let o = 1; for (let e = x; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o < 0.5; });
  return { total: blocks.length, faint: faint.map((x) => x.textContent.trim().slice(0, 50)) };
});
await b.close();
const ok = blocked > 0 && r.faint.length === 0;
console.log(`${ok ? 'PASS' : 'FAIL'}: home script blocked (${blocked}); ${r.total - r.faint.length} of ${r.total} text blocks readable${r.faint.length ? '\n  invisible: ' + r.faint.slice(0, 4).join(' | ') : ''}`);
process.exit(ok ? 0 : 1);
