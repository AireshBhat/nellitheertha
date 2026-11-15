// The forest walk scrolls smoothly on a phone: a slow touch scroll through it, on a CPU slowed 4x, plays the frames in
// order and nothing holds up the screen. Before frames were decoded ahead, each new frame stalled the scroll for two or
// three screen refreshes (about 60 stalls in one pass); decoding them from pictures rather than files still held it up
// about 50 times, away from the draws.
// usage: node tests/smooth.mjs BASE
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  // Which frame each drawn picture is, when it was drawn, and every screen refresh that came late.
  window.__draws = []; window.__late = [];
  const blob = Response.prototype.blob;
  Response.prototype.blob = function () { const url = this.url; return blob.call(this).then((file) => { file.__src = url; return file; }); };
  const make = window.createImageBitmap;
  if (make) window.createImageBitmap = (source, ...rest) => make.call(window, source, ...rest).then((bitmap) => { bitmap.__src = source.__src || source.currentSrc || source.src; return bitmap; });
  const draw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (picture, ...rest) {
    if (this.canvas.closest?.('.forest-stage')) window.__draws.push({ at: performance.now(), frame: Number(String(picture.__src || picture.src).match(/(\d+)\.webp/)?.[1]) });
    return draw.call(this, picture, ...rest);
  };
  let last = 0;
  const tick = (t) => { if (last && t - last > 25) window.__late.push(last); last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await p.goto(base + '?now=2026-11-13T09:00', { waitUntil: 'networkidle' });
const top = await p.evaluate(() => document.getElementById('forest').getBoundingClientRect().top + scrollY);
// Arrive just above the walk and let its frames come in, as a reader would.
await p.evaluate((y) => scrollTo({ top: y - 900, behavior: 'instant' }), top);
await p.waitForFunction(() => performance.getEntriesByType('resource').filter((e) => /\/walk-tall\/\d+\.webp/.test(e.name)).length >= 60, null, { timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate((y) => { scrollTo({ top: y - 200, behavior: 'instant' }); }, top);
await p.waitForTimeout(600);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.evaluate(() => { window.__draws = []; window.__late = []; });
const length = await p.evaluate(() => document.getElementById('forest').offsetHeight);
await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -(length + 200), speed: 500, gestureSourceType: 'touch', preventFling: true });
await p.waitForTimeout(300);
const { draws, late } = await p.evaluate(() => ({ draws: window.__draws, late: window.__late }));
await b.close();
let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); };
const frames = draws.map((d) => d.frame);
const jump = Math.max(0, ...frames.slice(1).map((f, i) => Math.abs(f - frames[i])));
const stalls = late.filter((t) => draws.some((d) => d.at >= t - 1 && d.at <= t + 17)).length;
check(new Set(frames).size >= 50, `the walk plays ${new Set(frames).size} of its 60 frames on a slow scroll`);
check(jump <= 2 && frames.every((f, i) => i === 0 || f >= frames[i - 1]), `in order, never skipping more than one (largest step ${jump})`);
check(stalls <= 3, `drawing a frame held up the screen ${stalls} times`);
check(late.length <= 6, `the screen was late ${late.length} times in the whole pass (decoding frames must not hold it up either)`);
console.log(fail ? `FAIL: ${fail} checks` : 'PASS: the forest walk scrolls smoothly on a slowed phone');
process.exit(fail ? 1 : 0);
