// The home page's hero during the Brahmakalasha: the deity picture (the Linga and the idol from the temple's poster,
// with its ನೆಲ್ಲಿತೀರ್ಥ lettering) must show whole, unfaded and uncovered, on a phone, a tablet and a desktop.
// Behind the deities a living light breathes and turns; it may light the background only, never a deity pixel,
// it rests when the hero is off screen, deepens after sunset in India, and is absent with reduced motion.
// The artwork's place in each file is fixed (it is the poster's own pixels, placed by the fal-studio script).
// usage: node tests/hero.mjs BASE
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const ALT = 'The Linga in its golden prabhavali and a small golden idol in a silver frame, both garlanded, behind the gold lettering ನೆಲ್ಲಿತೀರ್ಥ';
// The artwork's box in each file, in the file's pixels: [left, top, right, bottom]; and the mask of where light may fall
// (alpha 0 on the deities, the trishul and the lettering; half the picture's size).
const ART = { 'deities-tall.webp': [137, 501, 945, 1266], 'deities-wide.webp': [507, 130, 1315, 895] };
const MASK = { 'deities-tall.webp': '/assets/img/deities-tall-light.png', 'deities-wide.webp': '/assets/img/deities-wide-light.png' };
const MAX_DIFF = 0.5; // mean brightness difference, out of 255, on the deities between the page and the picture alone
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
const DEVICES = [
  ['phone', PHONE, 'deities-tall.webp'],
  ['small phone', { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'deities-tall.webp'],
  ['tablet', { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'deities-tall.webp'],
  ['desktop', DESKTOP, 'deities-wide.webp'],
  ['small laptop', { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, 'deities-wide.webp'],
];
const b = await launch();
let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); };
const overlap = (a, r) => a.left < r.right && r.left < a.right && a.top < r.bottom && r.top < a.bottom;

const measure = (p) => p.evaluate(({ ART }) => {
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
  const hero = document.querySelector('.hero'), light = document.querySelector('.hero-light');
  return { alt: img.alt, file, box, texts, hero: rect(hero), h1: rect(hero.querySelector('h1')), vw: innerWidth, vh: innerHeight,
    alive: hero.classList.contains('alive'), mode: hero.dataset.light || null, lightOpacity: light ? Number(getComputedStyle(light).opacity) : 0 };
}, { ART });

// Compares two screenshots of the artwork's box: on the deities (the mask's dark part), and on the lit background.
const compare = (p, x, y, file) => p.evaluate(async ([x, y, mask, art]) => {
  const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
  const [a, c, m] = await Promise.all([load('data:image/png;base64,' + x), load('data:image/png;base64,' + y), load(mask)]);
  const px = (im) => { const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; const g = cv.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, cv.width, cv.height).data; };
  const da = px(a), dc = px(c), dm = px(m), W = a.naturalWidth, H = a.naturalHeight, mw = m.naturalWidth;
  let deity = 0, nd = 0, bg = 0, nb = 0, worst = 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const fx = art[0] + (i + 0.5) / W * (art[2] - art[0]), fy = art[1] + (j + 0.5) / H * (art[3] - art[1]);
    const lit = dm[(Math.floor(fy / 2) * mw + Math.floor(fx / 2)) * 4 + 3];
    const k = (j * W + i) * 4;
    const d = Math.abs(0.299 * (da[k] - dc[k]) + 0.587 * (da[k + 1] - dc[k + 1]) + 0.114 * (da[k + 2] - dc[k + 2]));
    if (lit === 0) { deity += d; nd++; if (d > worst) worst = d; } else if (lit === 255) { bg += d; nb++; }
  }
  return { deity: deity / nd, worst: Math.round(worst), share: nd / (W * H), bg: bg / nb, size: `${W}x${H}` };
}, [x.toString('base64'), y.toString('base64'), MASK[file], ART[file]]);
const BARE = '*{visibility:hidden!important;animation:none!important}.hero-photo,.hero-photo *{visibility:visible!important}.hero-photo,.hero-photo img{-webkit-mask-image:none!important;mask-image:none!important}';

for (const [name, device, file] of DEVICES) {
  const ctx = await b.newContext(device);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(base + '?now=2026-11-13T09:00', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3500); // the light has bloomed and settled into breathing
  const info = await measure(p);
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
  check(info.alive && info.lightOpacity > 0.05 && info.mode === 'day', `${name}: the living light is on, in its day colour (alive ${info.alive}, opacity ${info.lightOpacity.toFixed(2)}, ${info.mode})`);
  // The light moves on the background, and never on the deities: two shots 1.5 s apart, then the picture alone.
  const clip = { x: bx.left, y: bx.top, width: bx.right - bx.left, height: bx.bottom - bx.top };
  const first = await p.screenshot({ clip });
  await p.waitForTimeout(1500);
  const later = await p.screenshot({ clip });
  const moving = await compare(p, first, later, file);
  check(moving.bg > 0.15, `${name}: the light moves behind the deities (background changes by ${moving.bg.toFixed(2)} in 1.5 s)`);
  await p.addStyleTag({ content: BARE });
  await p.waitForTimeout(100);
  const bare = await p.screenshot({ clip });
  const untouched = await compare(p, later, bare, file);
  check(untouched.share > 0.3 && untouched.deity <= MAX_DIFF, `${name}: the deities are exactly the picture, with the light on (mean difference ${untouched.deity.toFixed(2)}, worst pixel ${untouched.worst}, over ${(untouched.share * 100).toFixed(0)}% of the box)`);
  console.log(`     ${name}: artwork drawn ${untouched.size} device px from ${ART[file][2] - ART[file][0]} file px (${(Number(untouched.size.split('x')[0]) / (ART[file][2] - ART[file][0])).toFixed(2)}x)`);
  check(errs.length === 0, `${name}: no script errors ${errs.join(' | ')}`);
  await ctx.close();
}

// Desktops: the picture and the panel beside it are one dark scene. The temple's name sits in the picture under the
// lettering, in light type, and nothing along the meeting of the picture and the panel jumps in brightness.
for (const [name, device] of [['desktop', DESKTOP], ['small laptop', { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }], ['wide desktop', { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 }]]) {
  const ctx = await b.newContext({ ...device, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(base + '?now=2026-11-13T09:00', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const info = await measure(p);
  const layout = await p.evaluate(() => {
    const h1 = document.querySelector('.hero h1'), panel = document.querySelector('.present'), hero = document.querySelector('.hero');
    // The colour may come back as oklch(); a canvas turns any CSS colour into sRGB.
    const g = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d');
    g.fillStyle = getComputedStyle(h1).color; g.fillRect(0, 0, 1, 1);
    const c = g.getImageData(0, 0, 1, 1).data;
    const lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    const r = h1.getBoundingClientRect(), q = panel.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    return { h1: { left: r.left, right: r.right, top: r.top, bottom: r.bottom }, panelLeft: q.left, heroBottom: hr.bottom, lum, vw: innerWidth, vh: innerHeight };
  });
  const t = layout.h1;
  check(t.top >= info.box.bottom && t.right <= layout.panelLeft && t.bottom <= Math.min(layout.heroBottom, layout.vh), `${name}: the temple's name is in the picture, under the lettering (top ${Math.round(t.top)} below ${Math.round(info.box.bottom)}, right ${Math.round(t.right)} before the panel at ${Math.round(layout.panelLeft)})`);
  check(layout.lum > 0.75, `${name}: the name is in light type (luminance ${layout.lum.toFixed(2)})`);
  // Brightness along three rows from just past the artwork up to where the panel's words begin: no step larger than a
  // fade makes. (Letters themselves are steep, so the rows stop short of them.)
  const shot = await p.screenshot();
  const step = await p.evaluate(async ([b64, x0, x1, rows]) => {
    const i = await new Promise((ok) => { const m = new Image(); m.onload = () => ok(m); m.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0);
    const k = i.naturalWidth / innerWidth; // the shot is in device pixels; the positions are in CSS pixels
    let worst = 0, at = null;
    for (const yy of rows) {
      const y = yy * k;
      const d = g.getImageData(0, Math.round(y) - 2, c.width, 5).data, W = c.width;
      const luma = (x) => { let t = 0; for (let k = 0; k < 5; k++) for (let dx = -2; dx <= 2; dx++) { const o = (k * W + x + dx) * 4; t += 0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2]; } return t / 25; };
      for (let x = Math.round(x0 * k); x < Math.round(x1 * k); x++) { const s = Math.abs(luma(x + 1) - luma(x)) * k; if (s > worst) { worst = s; at = [Math.round(x / k), Math.round(yy)]; } }
    }
    return { worst, at };
  }, [shot.toString('base64'), Math.max(info.box.right + 8, layout.panelLeft - 0.2 * layout.vw), layout.panelLeft + 12, [info.box.top + 20, (info.box.top + info.box.bottom) / 2, Math.min(layout.heroBottom, layout.vh) - 24]]);
  check(step.worst < 6, `${name}: the picture melts into the panel's side (largest step ${step.worst.toFixed(1)} levels per pixel, at ${step.at})`);
  await ctx.close();
}

// Reduced motion: no light at all, and the whole artwork box is exactly the picture.
for (const [name, device, file] of [['phone, reduced motion', PHONE, 'deities-tall.webp'], ['desktop, reduced motion', DESKTOP, 'deities-wide.webp']]) {
  const ctx = await b.newContext({ ...device, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(base + '?now=2026-11-13T09:00', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const info = await measure(p);
  check(!info.alive && info.lightOpacity === 0, `${name}: no living light (alive ${info.alive}, opacity ${info.lightOpacity})`);
  const clip = { x: info.box.left, y: info.box.top, width: info.box.right - info.box.left, height: info.box.bottom - info.box.top };
  const shown = await p.screenshot({ clip });
  await p.addStyleTag({ content: BARE }); await p.waitForTimeout(100);
  const r = await compare(p, shown, await p.screenshot({ clip }), file);
  check(r.deity <= MAX_DIFF && r.bg <= MAX_DIFF, `${name}: the picture is exactly as made (deities ${r.deity.toFixed(2)}, background ${r.bg.toFixed(2)})`);
  await ctx.close();
}

// After sunset in India the light is the evening's; by day, the day's.
{
  const ctx = await b.newContext(PHONE);
  const p = await ctx.newPage();
  for (const [now, want] of [['2026-11-13T20:00', 'evening'], ['2026-11-14T05:30', 'evening'], ['2026-11-13T07:00', 'day'], ['2026-11-13T18:00', 'day']]) {
    await p.goto(base + `?now=${now}`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(300);
    const mode = await p.evaluate(() => document.querySelector('.hero').dataset.light || null);
    check(mode === want, `light at ${now.slice(11)} in India is ${want} (got ${mode})`);
  }
  // Off screen, the light rests.
  await p.goto(base + '?now=2026-11-13T09:00', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const state = () => p.evaluate(() => { const l = document.querySelector('.hero-light'); return l ? [...l.getAnimations({ subtree: true })].map((a) => a.playState) : []; });
  const on = await state();
  await p.evaluate(() => scrollTo({ top: document.body.scrollHeight / 2, behavior: 'instant' })); await p.waitForTimeout(500);
  const off = await state();
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(500);
  const back = await state();
  check(on.length > 0 && on.every((s) => s === 'running'), `the light runs while the hero is on screen (${on.join(', ')})`);
  check(off.length > 0 && off.every((s) => s === 'paused'), `the light rests while the hero is off screen (${off.join(', ')})`);
  check(back.length > 0 && back.every((s) => s === 'running'), `the light resumes on the way back (${back.join(', ')})`);
  await ctx.close();
}
await b.close();
console.log(fail ? `FAIL: ${fail} checks` : 'PASS: the deity picture shows whole and untouched, with its light behind it');
process.exit(fail ? 1 : 0);
