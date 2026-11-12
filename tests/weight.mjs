// What a phone downloads (390 px wide, 3x screen): before scrolling and after a full scroll.
// usage: node tests/weight.mjs BASE   (exit 1 if a page is over its limit)
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const MB = 1024 * 1024;
// The pictures are the approved files, unchanged, so a full scroll weighs what the earlier site did (home 8.99 MB, gallery 2.79 MB
// on 2026-11-11). The saving is in when things load: the walk frames wait until the visitor scrolls towards the walk.
// Home: the live site's own weight, plus the Brahmakalasha deity picture (2026-11-13), kept near-lossless so the Linga and
// the idol stay within 2 levels of the approved file; it weighs 0.55 MB more than the forest picture it replaced.
const LIMITS = { '': [1.5, 9.5], 'gallery/': [2.8, 2.8], 'brahmakalasha/': [0.25, 0.25], 'temple/': [0.8, 0.8] };
const b = await launch();
let over = 0;
for (const [path, [first, full]] of Object.entries(LIMITS)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  let bytes = 0; const kinds = {}, types = {};
  cdp.on('Network.responseReceived', (e) => { types[e.requestId] = e.type; });
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; const t = types[e.requestId] || 'Other'; kinds[t] = (kinds[t] || 0) + e.encodedDataLength; });
  await p.goto(base + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const before = bytes;
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
  await p.waitForTimeout(2500);
  const ok = before <= first * MB && bytes <= full * MB;
  if (!ok) over++;
  console.log(`${ok ? 'OK  ' : 'OVER'} /${path} | before scrolling ${(before / MB).toFixed(2)} MB (limit ${first}) | full scroll ${(bytes / MB).toFixed(2)} MB (limit ${full}) | ${Object.entries(kinds).map(([k, v]) => `${k} ${Math.round(v / 1024)} KB`).join(', ')}`);
  await ctx.close();
}
await b.close();
process.exit(over ? 1 : 0);
