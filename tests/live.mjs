// The home page's live Brahmakalasha panel at fixed moments, always in Indian time.
// usage: node tests/live.mjs BASE [--save FILE | --compare FILE]
import fs from 'fs';
import { launch, base as slash } from './chrome.mjs';
const [B, mode, file] = process.argv.slice(2);
const base = slash(B);
// [label, ?now= (Indian time) or '', fixed real clock (UTC) or null, device timezone]
const MOMENTS = [
  ['9 Nov 23:30 IST, clock', '', '2026-11-09T18:00:00Z', 'Asia/Kolkata'],
  ['10 Nov 01:00 IST, phone in Los Angeles', '', '2026-11-09T19:30:00Z', 'America/Los_Angeles'],
  ['19 Dec 22:00', '2026-12-19T22:00', null, 'Asia/Kolkata'],
  ['20 Dec 09:00', '2026-12-20T09:00', null, 'Asia/Kolkata'],
  ['24 Dec 18:00', '2026-12-24T18:00', null, 'Asia/Kolkata'],
  ['25 Dec 09:00', '2026-12-25T09:00', null, 'Asia/Kolkata'],
  ['25 Dec 09:00, phone in Los Angeles', '2026-12-25T09:00', null, 'America/Los_Angeles'],
  ['25 Dec 10:45', '2026-12-25T10:45', null, 'Asia/Kolkata'],
  ['25 Dec 23:30', '2026-12-25T23:30', null, 'Asia/Kolkata'],
  ['26 Dec 03:00', '2026-12-26T03:00', null, 'Asia/Kolkata'],
  ['29 Dec 12:00', '2026-12-29T12:00', null, 'Asia/Kolkata'],
  ['30 Dec 21:00', '2026-12-30T21:00', null, 'Asia/Kolkata'],
  ['31 Dec 10:00', '2026-12-31T10:00', null, 'Asia/Kolkata'],
];
const b = await launch();
const out = {};
for (const [label, now, clock, tz] of MOMENTS) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: tz });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  if (clock) await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + (now ? `?now=${now}` : ''), { waitUntil: 'networkidle' });
  out[label] = await p.evaluate(() => {
    const vis = (el) => !!el && el.offsetParent !== null && !el.hidden && !el.closest('[hidden]');
    const q = (n) => document.querySelector(`[data-live="${n}"]`);
    const t = (n) => (vis(q(n)) ? q(n).textContent.replace(/\s+/g, ' ').trim() : '-');
    return {
      phase: document.body.dataset.phase, tide: document.body.dataset.tide, eyebrow: t('eyebrow'), title: t('title'),
      count: vis(q('count')) ? `${q('count').textContent} ${q('unit').textContent}` : '-',
      now: t('now'), since: t('since'), nextLabel: t('next-label'), nextTime: t('next-time'), next: t('next'), nextDetail: t('next-detail'),
      line: t('line'), today: document.querySelector('.festival-days .today')?.dataset.date || '-',
      past: document.querySelectorAll('.festival-days .past').length, dayEyebrow: t('day-eyebrow'),
      timeline: [...(q('timeline')?.children || [])].map((li) => li.textContent.replace(/\s+/g, ' ').trim()),
      notes: t('notes'), poster: q('poster')?.getAttribute('href')?.split('/').pop() || '-', link: q('programme-link')?.getAttribute('href') || '-',
    };
  });
  out[label].errors = errs;
  await ctx.close();
}
await b.close();
if (mode === '--save') { fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n'); console.log('saved', Object.keys(out).length, 'moments'); }
else if (mode === '--compare') {
  const want = JSON.parse(fs.readFileSync(file, 'utf8')); let bad = 0;
  for (const [k, v] of Object.entries(out)) {
    const a = JSON.stringify(want[k]), c = JSON.stringify(v);
    if (a !== c) { bad++; console.log('DIFF', k); for (const f of Object.keys(v)) if (JSON.stringify(want[k]?.[f]) !== JSON.stringify(v[f])) console.log(`  ${f}: live ${JSON.stringify(want[k]?.[f])?.slice(0, 160)}\n  ${' '.repeat(f.length)}  new  ${JSON.stringify(v[f])?.slice(0, 160)}`); }
    else console.log('SAME', k);
  }
  process.exit(bad ? 1 : 0);
} else console.log(JSON.stringify(out, null, 1));
