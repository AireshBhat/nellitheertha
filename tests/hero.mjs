// The home page's hero during the Brahmakalasha: the deity picture (the Linga and the idol from the temple's poster,
// with its ನೆಲ್ಲಿತೀರ್ಥ lettering) must show whole, unfaded and uncovered, on a phone, a tablet and a desktop.
// The artwork's place in each file is fixed (it is the poster's own pixels, placed by the fal-studio script).
// usage: node tests/hero.mjs BASE
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const ALT = 'The Linga in its golden prabhavali and a small golden idol in a silver frame, both garlanded, behind the gold lettering ನೆಲ್ಲಿತೀರ್ಥ';
// The artwork's box in each file, in the file's pixels: [left, top, right, bottom].
const ART = { 'deities-tall.webp': [137, 501, 945, 1266], 'deities-wide.webp': [507, 130, 1315, 895] };
const MAX_DIFF = 0.5; // mean brightness difference, out of 255, between the page and the picture alone
const DEVICES = [
  ['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, 'deities-tall.webp'],
  ['small phone', { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'deities-tall.webp'],
  ['tablet', { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'deities-tall.webp'],
  ['desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, 'deities-wide.webp'],
  ['small laptop', { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, 'deities-wide.webp'],
];
const b = await launch();
let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); };
const overlap = (a, r) => a.left < r.right && r.left < a.right && a.top < r.bottom && r.top < a.bottom;

for (const [name, device, file] of DEVICES) {
  const ctx = await b.newContext(device);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(base + '?now=2026-11-13T09:00', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3500); // the first drop, if any, has finished
  const info = await p.evaluate(({ ART }) => {
    const img = document.querySelector('.hero-photo img');
    if (!img) return null;
    const file = img.currentSrc.split('/').pop();
    const art = ART[file];
    const r = img.getBoundingClientRect(), cs = getComputedStyle(img);
    const nw = img.naturalWidth, nh = img.naturalHeight;
    const scale = Math.max(r.width / nw, r.height / nh);
    const [px, py] = cs.objectPosition.split(' ').map((v, i) => (v.endsWith('%') ? parseFloat(v) / 100 * ((i ? r.height : r.width) - (i ? nh : nw) * scale) : parseFloat(v)));
    const box = art && { left: r.left + px + art[0] * scale, top: r.top + py + art[1] * scale, right: r.left + px + art[2] * scale, bottom: r.top + py + art[3] * scale };
    const rect = (el) => { const q = el.getBoundingClientRect(); return { left: q.left, top: q.top, right: q.right, bottom: q.bottom, name: el.className || el.tagName }; };
    const texts = [...document.querySelectorAll('.hero-copy > *, .present > *, header, .scroll-cue')]
      .filter((el) => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden').map(rect);
    const hero = rect(document.querySelector('.hero')), h1 = rect(document.querySelector('.hero h1'));
    return { alt: img.alt, file, box, texts, hero, h1, scale, fit: cs.objectFit, vw: innerWidth, vh: innerHeight };
  }, { ART });
  if (!info) { check(false, `${name}: no hero picture`); await ctx.close(); continue; }
  check(info.alt === ALT, `${name}: the hero shows the deity picture (alt "${info.alt.slice(0, 40)}…")`);
  check(info.file === file, `${name}: it uses ${file} (got ${info.file})`);
  if (!info.box) { await ctx.close(); continue; }
  const bx = info.box, w = Math.round(bx.right - bx.left), h = Math.round(bx.bottom - bx.top);
  const inside = bx.left >= info.hero.left - 0.5 && bx.right <= info.hero.right + 0.5 && bx.top >= info.hero.top - 0.5 && bx.bottom <= info.hero.bottom + 0.5
    && bx.left >= -0.5 && bx.right <= info.vw + 0.5 && bx.top >= -0.5 && bx.bottom <= info.vh + 0.5;
  check(inside, `${name}: the artwork shows whole on the first screen (${w}x${h} px at ${Math.round(bx.left)},${Math.round(bx.top)})`);
  const covering = info.texts.filter((t) => overlap(bx, t));
  check(covering.length === 0, `${name}: no text covers the artwork${covering.length ? ': ' + covering.map((c) => c.name).join(', ') : ''}`);
  check(info.h1.bottom > info.h1.top && info.h1.top < info.vh * 1.2, `${name}: the temple's name is near the top (${Math.round(info.h1.top)} px)`);
  // Nothing may fade, shade or lie over the artwork: the screen must look the same with everything but the picture
  // hidden and its fade removed. Both shots go through the same rendering, so any difference is an overlay or a fade.
  const clip = { x: bx.left, y: bx.top, width: bx.right - bx.left, height: bx.bottom - bx.top };
  const shown = await p.screenshot({ clip });
  await p.addStyleTag({ content: '*{visibility:hidden!important;animation:none!important}.hero-photo,.hero-photo *{visibility:visible!important}.hero-photo{-webkit-mask-image:none!important;mask-image:none!important}' });
  await p.waitForTimeout(100);
  const bare = await p.screenshot({ clip });
  const diff = await p.evaluate(async ([x, y]) => {
    const load = (b64) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + b64; });
    const [a, b] = await Promise.all([load(x), load(y)]);
    const px = (im) => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
    const da = px(a), db = px(b);
    let t = 0, worst = 0;
    for (let i = 0; i < da.length; i += 4) { const d = Math.abs(0.299 * (da[i] - db[i]) + 0.587 * (da[i + 1] - db[i + 1]) + 0.114 * (da[i + 2] - db[i + 2])); t += d; if (d > worst) worst = d; }
    return { mean: t / (da.length / 4), worst: Math.round(worst), size: `${a.naturalWidth}x${a.naturalHeight}` };
  }, [shown.toString('base64'), bare.toString('base64')]);
  check(diff.mean <= MAX_DIFF, `${name}: nothing fades or covers the artwork (mean difference ${diff.mean.toFixed(2)}, worst pixel ${diff.worst}; max mean ${MAX_DIFF})`);
  const art = ART[info.file], drawn = Number(diff.size.split('x')[0]);
  console.log(`     ${name}: artwork drawn ${diff.size} device px from ${art[2] - art[0]} file px (${(drawn / (art[2] - art[0])).toFixed(2)}x)`);
  check(errs.length === 0, `${name}: no script errors ${errs.join(' | ')}`);
  await ctx.close();
}
await b.close();
console.log(fail ? `FAIL: ${fail} checks` : 'PASS: the deity picture shows whole and uncovered everywhere');
process.exit(fail ? 1 : 0);
