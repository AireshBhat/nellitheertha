// The header's About, Visit and Contribute links on every other page open the home page at #pages, #visit and
// #contribute. Arriving there must not download the forest walk, which is far above.
// usage: node tests/anchor.mjs BASE
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const b = await launch();
let bad = 0;
for (const hash of ['#contribute', '#pages', '#visit']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); let frames = 0;
  p.on('request', (r) => { if (/\/walk-/.test(r.url())) frames++; });
  await p.goto(base + hash, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  if (frames) bad++;
  console.log(`${frames ? 'FAIL' : 'OK  '} ${hash}: ${frames} walk frames downloaded`);
  await ctx.close();
}
await b.close();
process.exit(bad ? 1 : 0);
