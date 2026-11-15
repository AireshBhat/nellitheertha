// The header: on the home page it floats over the dark Brahmakalasha picture, transparent with light words, and fades
// to the page's own colour with dark words once you scroll (the way the Bhojya Kitchen site does); over the forest walk
// it is clear again, and the walk's words dissolve under it. Everywhere else, and whenever the script cannot run, it is
// solid and dark-on-light.
// usage: node tests/header.mjs BASE
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const b = await launch();
let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1440, height: 900 } };

// The header's background opacity, and how light its name and current language are (0 dark .. 1 light).
const look = (p) => p.evaluate(() => {
  const h = document.querySelector('.site-header');
  const g = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d');
  const lum = (el) => { g.clearRect(0, 0, 1, 1); g.fillStyle = getComputedStyle(el).color; g.fillRect(0, 0, 1, 1); const c = g.getImageData(0, 0, 1, 1).data; return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };
  const bg = getComputedStyle(h).backgroundColor;
  const alpha = /rgba?\(/.test(bg) ? (bg.match(/[\d.]+/g)[3] === undefined ? 1 : Number(bg.match(/[\d.]+/g)[3])) : (bg.includes('/') ? Number(bg.split('/')[1].replace(')', '')) : 1);
  const r = h.getBoundingClientRect(), hero = document.querySelector('.hero')?.getBoundingClientRect();
  return { alpha, name: lum(h.querySelector('.brand span')), lang: lum(h.querySelector('[aria-pressed="true"]')), top: r.top, heroTop: hero ? hero.top + scrollY : null, fixed: getComputedStyle(h).position };
});

for (const [name, device] of [['phone', PHONE], ['desktop', DESKTOP]]) {
  const ctx = await b.newContext(device);
  const p = await ctx.newPage();
  await p.goto(base + '?now=2026-11-13T09:00', { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  const top = await look(p);
  check(top.alpha === 0 && top.name > 0.75 && top.lang > 0.75, `${name}, home, at the top: transparent with light words (background ${top.alpha}, name ${top.name.toFixed(2)}, language ${top.lang.toFixed(2)})`);
  check(top.heroTop === 0 && top.fixed === 'fixed', `${name}, home: the dark picture runs up behind the header (hero starts at ${top.heroTop}, header ${top.fixed})`);
  await p.mouse.wheel(0, 300); await p.waitForTimeout(700);
  const down = await look(p);
  check(down.alpha >= 0.95 && down.name < 0.3 && down.lang < 0.3 && down.top === 0, `${name}, home, scrolled: solid with dark words, still at the top (background ${down.alpha}, name ${down.name.toFixed(2)}, language ${down.lang.toFixed(2)})`);
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(700);
  const back = await look(p);
  check(back.alpha === 0 && back.name > 0.75, `${name}, home, back at the top: transparent again (background ${back.alpha})`);
  // The forest walk: clear again while the forest's dark is behind the header, solid in the light fades at either end.
  const forestAt = async (f) => { await p.evaluate((f) => { const el = document.getElementById('forest'); scrollTo({ top: el.getBoundingClientRect().top + scrollY + f * innerHeight, behavior: 'instant' }); }, f); await p.waitForTimeout(700); return look(p); };
  const fade = await forestAt(0.2), mid = await forestAt(1.5), end = await forestAt(2.5);
  check(fade.alpha >= 0.95 && fade.name < 0.3, `${name}, home, entering the forest walk (light fade behind): solid (background ${fade.alpha})`);
  check(mid.alpha === 0 && mid.name > 0.75 && mid.lang > 0.75, `${name}, home, in the forest walk: transparent with light words (background ${mid.alpha}, name ${mid.name.toFixed(2)})`);
  check(end.alpha >= 0.95 && end.name < 0.3, `${name}, home, leaving the forest walk: solid again (background ${end.alpha})`);
  // Its words dissolve as they rise into the clear header instead of running through the name.
  const words = await forestAt(1.0);
  const under = await p.evaluate(() => { const c = document.querySelector('.copy-one'), h = document.querySelector('.site-header').getBoundingClientRect().bottom; return { top: c.getBoundingClientRect().top, edge: h, under: parseFloat(c.style.getPropertyValue('--under')), mask: getComputedStyle(c).maskImage || getComputedStyle(c).webkitMaskImage }; });
  check(words.alpha === 0 && under.top < under.edge && Math.abs(under.under - (under.edge - under.top)) <= 2 && /gradient/.test(under.mask), `${name}, home, the forest's words dissolve under the clear header (top ${Math.round(under.top)}, header edge ${under.edge}, --under ${under.under})`);
  await p.goto(base + 'temple/', { waitUntil: 'networkidle' });
  const other = await look(p);
  check(other.alpha >= 0.95 && other.name < 0.3, `${name}, another page: solid with dark words (background ${other.alpha}, name ${other.name.toFixed(2)})`);
  await ctx.close();
}
{
  const ctx = await b.newContext({ ...PHONE, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => { const bg = getComputedStyle(document.querySelector('.site-header')).backgroundColor; return bg; });
  check(!/rgba\(0, 0, 0, 0\)|transparent/.test(r), `without the script the home header stays solid (${r})`);
  await ctx.close();
}
await b.close();
console.log(fail ? `FAIL: ${fail} checks` : 'PASS: the header floats over the home picture and settles when you scroll');
process.exit(fail ? 1 : 0);
