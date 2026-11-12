// The countdown on the home page: its number rolls down to the days left, once, when it comes into view.
// Screen readers and the page text always carry the true number; the rolling digits are only for the eye.
// usage: node tests/countdown.mjs BASE
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const AT = '?now=2026-11-12T11:30'; // 43 days to Friday 25 December
const DAYS = 43;
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const b = await launch();
let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); };

const state = (p) => p.evaluate(() => {
  const count = document.querySelector('.count'), flow = count?.querySelector('number-flow');
  const box = count?.getBoundingClientRect();
  return {
    text: count ? count.textContent.replace(/\s+/g, ' ').trim() : null,
    flow: !!flow,
    hidden: flow?.getAttribute('aria-hidden') ?? null,
    value: flow?.value ?? null,
    height: flow ? Math.round(flow.getBoundingClientRect().height) : 0,
    moving: flow?.shadowRoot ? flow.shadowRoot.getAnimations().filter((a) => a.playState === 'running').length : 0,
    inView: !!box && box.top < innerHeight && box.bottom > 0,
  };
});
// Counts every animation NumberFlow starts, so a roll that runs and ends before a check still counts.
const COUNT_ROLLS = () => {
  window.__rolls = 0;
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (...args) {
    if (this.getRootNode()?.host?.localName === 'number-flow') window.__rolls++;
    return animate.apply(this, args);
  };
};
const rolls = (p) => p.evaluate(() => window.__rolls);
const into = (p) => p.evaluate(() => document.querySelector('.count').scrollIntoView({ block: 'center', behavior: 'instant' }));

for (const [name, device] of [['phone', PHONE], ['desktop', DESKTOP]]) {
  const ctx = await b.newContext(device);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(COUNT_ROLLS);
  await p.goto(base + AT, { waitUntil: 'networkidle' });
  const before = await state(p);
  const rolledBefore = await rolls(p);
  check(before.flow, `${name}: the countdown uses NumberFlow`);
  check(before.hidden === 'true', `${name}: the rolling digits are hidden from screen readers (aria-hidden ${before.hidden})`);
  check(before.text === `${DAYS} days`, `${name}: the page text reads "${DAYS} days" (got "${before.text}")`);
  if (!before.inView) check(before.value !== DAYS && rolledBefore === 0, `${name}: out of view, the number has not rolled yet (shows ${before.value})`);
  await into(p);
  await p.waitForTimeout(3000);
  const rolled = await rolls(p);
  check(rolled > 0, `${name}: in view, the digits roll (${rolled} digit animations${before.inView ? ', in view from the start' : ''})`);
  const after = await state(p);
  check(after.value === DAYS && after.moving === 0, `${name}: the number settles on ${DAYS} (shows ${after.value}, ${after.moving} still moving)`);
  check(after.height >= 60, `${name}: the number keeps its large size (${after.height} px tall)`);
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(200);
  await into(p); await p.waitForTimeout(400);
  const again = await state(p), rolledAgain = await rolls(p);
  check(rolledAgain === rolled && again.value === DAYS, `${name}: it rolls only once (${rolledAgain - rolled} new animations on the second view)`);
  check(errs.length === 0, `${name}: no script errors ${errs.join(' | ')}`);
  await ctx.close();
}

// With reduced motion the number is simply there, and never moves.
{
  const ctx = await b.newContext({ ...PHONE, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.addInitScript(COUNT_ROLLS);
  await p.goto(base + AT, { waitUntil: 'networkidle' });
  const first = await state(p);
  check(first.value === DAYS, `reduced motion: the number shows ${DAYS} from the start (shows ${first.value})`);
  await into(p); await p.waitForTimeout(400);
  const seen = await state(p), moved = await rolls(p);
  check(moved === 0 && seen.value === DAYS, `reduced motion: nothing moves (${moved} digit animations)`);
  await ctx.close();
}

await b.close();
console.log(fail ? `FAIL: ${fail} checks` : 'PASS: the countdown rolls once, in view, and reads true');
process.exit(fail ? 1 : 0);
