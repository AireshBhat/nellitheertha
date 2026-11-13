// Accessibility (WCAG 2.2 AA rules in axe-core) on every page, motion reduced so nothing is mid-fade.
// usage: node tests/axe.mjs BASE [lang]
import fs from 'fs';
import { PAGES, launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const lang = process.argv[3] || 'en';
const axe = fs.readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
let total = 0;
// Every page at phone size; the home page also at desktop size, where its top is a dark scene with today's panel in
// light type beside the Brahmakalasha picture.
const desk = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
for (const [path, c] of [...PAGES.map((x) => [x, ctx]), ['', desk]]) {
  const p = await c.newPage();
  await p.goto(`${base}${path}?lang=${lang}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  await p.addScriptTag({ content: axe });
  const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] })).violations
    .map((x) => `${x.id} (${x.impact}) x${x.nodes.length}: ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`));
  total += v.length;
  console.log(`${v.length ? 'FAIL' : 'OK  '} /${path}${c === desk ? ' (desktop)' : ''}${v.length ? '\n   ' + v.join('\n   ') : ''}`);
  await p.close();
}
await b.close();
process.exit(total ? 1 : 0);
