// The home page's pictures must look as they did on the earlier site, where they were approved.
// 1. The forest walk on a phone (390 px, 2x) and a desktop (1440 px): its scroll length, and the canvas at every frame's point
//    through the walk, so the whole sequence is compared, frame by frame.
// 2. Every picture on the home page, matched by its alt text, on a 3x phone.
// Pictures are compared by brightness, pixel by pixel: the mean difference, and the sharpness (how strong the edges are).
// usage: node tests/walk-parity.mjs OLD_BASE NEW_BASE
import { launch, base as slash } from './chrome.mjs';
const [OLD, NEW] = process.argv.slice(2).map(slash);
const MAX_DIFF = 1.0;      // mean brightness difference, out of 255
const MIN_SHARP = 0.98;    // new sharpness / old sharpness
const b = await launch();
let fail = 0;

const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const PHONE3 = { ...PHONE, deviceScaleFactor: 3 };

// Brightness of every pixel, base64, plus the size.
const LUMA = `(source, w, h) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(source, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, y = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) y[j] = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
  let s = ''; for (let i = 0; i < y.length; i += 32768) s += String.fromCharCode(...y.subarray(i, i + 32768));
  return { w, h, y: btoa(s) };
}`;
const decode = (l) => ({ ...l, y: Buffer.from(l.y, 'base64') });
function sharpness({ w, h, y }) {
  let s = 0;
  for (let r = 1; r < h - 1; r++) for (let c = 1; c < w - 1; c++) {
    const i = r * w + c; s += Math.abs(4 * y[i] - y[i - 1] - y[i + 1] - y[i - w] - y[i + w]);
  }
  return s / ((w - 2) * (h - 2));
}
function compare(label, a, n, quiet = false) {
  if (!a || !n) { fail++; console.log(`FAIL ${label} | missing on the ${a ? 'new' : 'old'} site`); return false; }
  if (a.w !== n.w || a.h !== n.h) { fail++; console.log(`FAIL ${label} | size ${a.w}x${a.h} before, ${n.w}x${n.h} now`); return false; }
  let d = 0; for (let i = 0; i < a.y.length; i++) d += Math.abs(a.y[i] - n.y[i]);
  d /= a.y.length;
  const sa = sharpness(a), sn = sharpness(n), ratio = sn / sa;
  const ok = d <= MAX_DIFF && ratio >= MIN_SHARP;
  if (!ok) fail++;
  if (!ok || !quiet) console.log(`${ok ? 'PASS' : 'FAIL'} ${label} | mean difference ${d.toFixed(2)} (max ${MAX_DIFF}) | sharpness ${sa.toFixed(2)} before, ${sn.toFixed(2)} now (${(ratio * 100).toFixed(0)}%)`);
  return ok;
}

// The walk canvas at the given number of evenly spaced points, after every frame has arrived.
async function walk(base, device, points) {
  const ctx = await b.newContext(device);
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: 'networkidle' });
  const top = await p.evaluate(() => document.getElementById('forest').getBoundingClientRect().top + scrollY);
  for (const y of [top - 2000, top - 1000, top]) { await p.evaluate((t) => scrollTo({ top: t, behavior: 'instant' }), y); await p.waitForTimeout(300); }
  // Wait until no new frame has arrived for 1.5 s.
  let count = -1;
  for (let t = 0; t < 60; t++) {
    const now = await p.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.name.includes('/walk')).length);
    if (now === count && now > 0) break;
    count = now; await p.waitForTimeout(1500);
  }
  const length = await p.evaluate(() => document.getElementById('forest').offsetHeight - innerHeight);
  const shots = [];
  for (let i = 0; i < (points || count); i++) {
    await p.evaluate(([t, f]) => { const el = document.getElementById('forest'); scrollTo({ top: t + f * (el.offsetHeight - innerHeight), behavior: 'instant' }); }, [top, i / ((points || count) - 1)]);
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await p.waitForTimeout(250);
    shots.push(await p.evaluate(`(${LUMA})(document.querySelector('#forest canvas'), document.querySelector('#forest canvas').width, document.querySelector('#forest canvas').height)`).then(decode).catch(() => null));
  }
  await ctx.close();
  return { frames: count, length, shots };
}

for (const [name, device] of [['phone', PHONE], ['desktop', DESKTOP]]) {
  // One point per frame of the earlier walk: the whole sequence.
  const a = await walk(OLD, device);
  const n = await walk(NEW, device, a.frames);
  console.log(`-- walk, ${name}: ${a.frames} frames before, ${n.frames} now | scroll length ${a.length} px before, ${n.length} px now`);
  if (a.frames !== n.frames) { fail++; console.log(`FAIL walk ${name} | frame count differs`); }
  if (a.length !== n.length) { fail++; console.log(`FAIL walk ${name} | the walk is ${n.length} px of scrolling now, ${a.length} px before: it plays at a different speed`); }
  let same = 0;
  for (let i = 0; i < a.shots.length; i++) if (compare(`walk ${name} point ${i + 1}/${a.shots.length}`, a.shots[i], n.shots[i], true)) same++;
  console.log(`${same === a.shots.length ? 'PASS' : 'FAIL'} walk ${name} | ${same} of ${a.shots.length} points match (mean difference at most ${MAX_DIFF}, sharpness at least ${MIN_SHARP * 100}%)`);
}

// Every home-page picture, by alt text, on a 3x phone, drawn at its own full size.
async function pictures(base) {
  const ctx = await b.newContext(PHONE3);
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 80)); } });
  await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  // With srcset, naturalWidth is in CSS pixels; the file's own size comes from loading it on its own.
  const list = await p.evaluate(() => Promise.all([...document.images].filter((i) => i.alt && i.naturalWidth).map(async (i) => {
    const file = new Image(); file.src = i.currentSrc; await file.decode();
    return { alt: i.alt, w: file.naturalWidth, h: file.naturalHeight, src: i.currentSrc, need: Math.round(i.getBoundingClientRect().width * devicePixelRatio) };
  })));
  return { p, ctx, list };
}
const [A, N] = await Promise.all([pictures(OLD), pictures(NEW)]);
console.log('-- home-page pictures, 3x phone');
for (const pic of A.list) {
  const now = N.list.find((x) => x.alt === pic.alt);
  const label = `"${pic.alt.slice(0, 50)}"`;
  if (!now) { fail++; console.log(`FAIL ${label} | not on the new home page`); continue; }
  const w = Math.min(pic.w, now.w), h = Math.round(w * pic.h / pic.w);
  if (Math.abs(now.h / now.w - pic.h / pic.w) > 0.01) { fail++; console.log(`FAIL ${label} | different shape: ${pic.w}x${pic.h} before, ${now.w}x${now.h} now`); continue; }
  const grab = (page, src) => page.evaluate(`(async () => { const i = new Image(); i.src = ${JSON.stringify(src)}; await i.decode(); return (${LUMA})(i, ${w}, ${h}); })()`).then(decode);
  // A smaller file than before is a loss only where the screen can show the difference.
  if (now.w < pic.w && now.w < now.need) { fail++; console.log(`FAIL ${label} | file ${now.w} px wide now, ${pic.w} before; the screen shows ${now.need} px`); }
  else if (now.w !== pic.w) console.log(`     ${label} | file ${now.w} px wide now, ${pic.w} before; the screen shows ${now.need} px`);
  compare(label, await grab(A.p, pic.src), await grab(N.p, now.src));
}
await A.ctx.close(); await N.ctx.close();
await b.close();
console.log(fail ? `FAIL: ${fail} differences` : 'PASS: the walk and the pictures match the earlier site');
process.exit(fail ? 1 : 0);
