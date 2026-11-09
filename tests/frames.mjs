// A returning visitor's phone keeps files it cached from the old site (walk frames for up to 30 days).
// So no address the new walk uses may have served different bytes on the old site.
// usage: node tests/frames.mjs OLD_BASE NEW_BASE
import { launch, base as slash } from './chrome.mjs';
const [OLD, NEW] = process.argv.slice(2).map(slash);
const b = await launch();
const used = new Set();
for (const vp of [{ width: 390, height: 844, isMobile: true, hasTouch: true }, { width: 1440, height: 900 }]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
  const p = await ctx.newPage();
  p.on('request', (r) => { const u = new URL(r.url()); if (u.pathname.includes('/walk')) used.add(u.pathname + u.search); });
  await p.goto(NEW, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { const f = document.getElementById('forest'); for (let i = 0; i <= 10; i++) { scrollTo(0, f.offsetTop + (f.offsetHeight - innerHeight) * i / 10); await new Promise((r) => setTimeout(r, 150)); } });
  await p.waitForTimeout(2500);
  await ctx.close();
}
await b.close();
let clash = 0;
for (const path of [...used].sort()) {
  const [a, c] = await Promise.all([fetch(OLD + path.slice(1)), fetch(NEW + path.slice(1))]);
  if (a.status !== 200) continue;
  const same = Buffer.from(await a.arrayBuffer()).equals(Buffer.from(await c.arrayBuffer()));
  if (!same) { clash++; if (clash <= 5) console.log('CLASH', path, '(the old site served different bytes here)'); }
}
console.log(`${clash ? 'FAIL' : 'PASS'}: ${used.size} walk addresses, ${clash} reuse an old address with different content`);
process.exit(clash ? 1 : 0);
