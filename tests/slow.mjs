// The forest walk on a slow mobile link (2 Mbps): it must still move.
// A visitor reads the top for 1.5 s, scrolls towards the forest, then walks through it in about 6 s.
// usage: node tests/slow.mjs BASE [MIN]   (exit 1 if fewer than MIN distinct pictures, default 5)
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const min = Number(process.argv[3] || 5);
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 120, downloadThroughput: 2e6 / 8, uploadThroughput: 1e6 / 8 });
await p.goto(base, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);
const top = await p.evaluate(() => document.getElementById('forest').offsetTop);
await p.evaluate((t) => scrollTo(0, t - 900), top);
await p.waitForTimeout(800);
const seen = new Set();
for (let i = 0; i <= 20; i++) {
  await p.evaluate(([t, f]) => { const el = document.getElementById('forest'); scrollTo(0, t + f * (el.offsetHeight - innerHeight)); }, [top, i / 20]);
  await p.waitForTimeout(300);
  seen.add(await p.evaluate(() => { const c = document.querySelector('#forest canvas'); if (!c.width) return 'empty'; const d = c.getContext('2d').getImageData(c.width / 2 - 30, c.height / 2 - 30, 60, 60).data; let s = 0; for (let i = 0; i < d.length; i += 5) s = (s * 31 + d[i]) % 1e9; return s; }));
}
await b.close();
const n = [...seen].filter((s) => s !== 'empty').length;
console.log(`${n >= min ? 'PASS' : 'FAIL'} ${base} | distinct pictures while walking through: ${n} of 21 positions (need ${min})`);
process.exit(n >= min ? 0 : 1);
