// Every Kannada text the static site shows must render pixel-identical on the new build (same fonts, same shaping).
// usage: node tests/glyphs.mjs OLD_BASE NEW_BASE
import { launch, base as slash } from './chrome.mjs';
const [OLD, NEW] = process.argv.slice(2).map(slash);
const TARGETS = [['', '.hero h1'], ['', '.overline'], ['', '.footer-name'], ['', '[data-language-choice="kn"]'],
  ['temple/', '.footer-name'], ['mantras/', '.prose']];
const b = await launch();
const shots = {};
// The home hero's title is compared at phone width: on desktop it is set smaller beside the Brahmakalasha picture
// (2026-11-13), on a phone it is the same size as before, so the same fonts and shaping must give the same pixels.
const PHONE = new Set(['.hero h1', '.overline']);
for (const [name, host] of [['old', OLD], ['new', NEW]]) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const phone = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const pages = { desk: await ctx.newPage(), phone: await phone.newPage() };
  for (const [path, sel] of TARGETS) {
    const p = pages[path === '' && PHONE.has(sel) ? 'phone' : 'desk'];
    await p.goto(host + path + (path ? '' : '?now=2026-11-09T23:00'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    // Text over a photograph: hide the photograph (re-encoded on the new site) so only the letters are compared.
    await p.addStyleTag({ content: '.hero-photo,.hero-shade,.first-drop{visibility:hidden!important} .hero{background:#203020!important} .hero h1,.overline{text-shadow:none!important}' });
    // The title sits lower on the new hero: pin it to the same place on both, so only the letters differ.
    if (p === pages.phone) await p.addStyleTag({ content: '.hero-copy{position:fixed!important;top:120px!important;bottom:auto!important}' });
    shots[`${name}|${path}|${sel}`] = await p.locator(sel).first().screenshot({ animations: 'disabled' });
  }
  await ctx.close(); await phone.close();
}
// Decode both images in the browser and compare pixels: anti-aliasing may differ by a level or two when a
// layer is composited differently; a changed letter differs by far more.
const page = await (await b.newContext()).newPage();
let bad = 0;
for (const [path, sel] of TARGETS) {
  const a = shots[`old|${path}|${sel}`].toString('base64'), c = shots[`new|${path}|${sel}`].toString('base64');
  const r = await page.evaluate(async ([a, c]) => {
    const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
    const [x, y] = await Promise.all([load(a), load(c)]);
    if (x.width !== y.width || x.height !== y.height) return { size: false };
    const data = (img) => { const cv = new OffscreenCanvas(img.width, img.height); const g = cv.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, img.height).data; };
    const d1 = data(x), d2 = data(y); let max = 0, n = 0;
    for (let i = 0; i < d1.length; i++) { const d = Math.abs(d1[i] - d2[i]); if (d) { n++; if (d > max) max = d; } }
    return { size: true, max, n };
  }, [a, c]);
  const ok = r.size && r.max <= 2;
  if (!ok) bad++;
  console.log(`${ok ? 'SAME' : 'DIFF'} /${path} ${sel} (${r.size ? `${r.n} channel values differ, by at most ${r.max}` : 'different size'})`);
}
await b.close();
process.exit(bad ? 1 : 0);
