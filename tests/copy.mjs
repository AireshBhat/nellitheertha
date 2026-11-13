// Copy account number: a tap copies the number, the label says so, and a small check is drawn beside it.
// Where copying is not allowed, the button shows the number to copy by hand.
// usage: node tests/copy.mjs BASE
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const NUMBER = '0122500100786201';
const b = await launch();
let fail = 0;
const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

for (const [name, opts] of [['motion', {}], ['reduced motion', { reducedMotion: 'reduce' }]]) {
  const ctx = await b.newContext({ ...PHONE, ...opts, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: 'networkidle' });
  const button = p.locator('#copy-account');
  await button.scrollIntoViewIfNeeded();
  const before = await p.evaluate(() => { const t = document.querySelector('#copy-account .tick'); return t ? getComputedStyle(t).opacity : null; });
  check(before === '0', `${name}: no check before copying (opacity ${before})`);
  await button.click();
  await p.waitForTimeout(700);
  const after = await p.evaluate(async () => {
    const btn = document.getElementById('copy-account'), t = btn.querySelector('.tick'), path = t?.querySelector('path');
    return { label: btn.textContent.replace(/\s+/g, ' ').trim(), copied: btn.classList.contains('copied'), tick: t ? getComputedStyle(t).opacity : null,
      drawn: path ? Number(getComputedStyle(path).strokeDashoffset.replace('px', '')) : null, clip: await navigator.clipboard.readText() };
  });
  check(after.clip === NUMBER, `${name}: the account number is on the clipboard (${after.clip})`);
  check(after.label === 'Account number copied', `${name}: the button says "${after.label}"`);
  check(after.copied && after.tick === '1' && after.drawn === 0, `${name}: the check is drawn in full (opacity ${after.tick}, dash offset ${after.drawn})`);
  await ctx.close();
}
{
  const ctx = await b.newContext(PHONE);
  const p = await ctx.newPage();
  await p.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }); });
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.locator('#copy-account').click();
  await p.waitForTimeout(300);
  const label = await p.evaluate(() => document.getElementById('copy-account').textContent.replace(/\s+/g, ' ').trim());
  check(label === `Select and copy: ${NUMBER}`, `where copying is refused, the button shows the number (${label})`);
  await ctx.close();
}
await b.close();
console.log(fail ? `FAIL: ${fail} checks` : 'PASS: copying the account number is confirmed');
process.exit(fail ? 1 : 0);
