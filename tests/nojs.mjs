// With JavaScript off (or a script that fails) every page must still be readable.
// usage: node tests/nojs.mjs BASE
import { PAGES, launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const b = await launch();
const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
let bad = 0;
for (const path of PAGES) {
  const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: 'load' });
  const r = await p.evaluate(() => {
    const visible = (el) => { if (!el) return false; const s = getComputedStyle(el); const box = el.getBoundingClientRect(); return s.visibility !== 'hidden' && Number(s.opacity) > 0.5 && box.height > 0; };
    const h = document.querySelector('h1');
    // Text blocks, except the after-the-festival panel, which is hidden until 31 December by design.
    const blocks = [...document.querySelectorAll('main p, main li')].filter((x) => x.textContent.trim().length > 30 && !x.closest('.ordinary-present'));
    const hidden = blocks.filter((x) => !visible(x)).map((x) => x.textContent.trim().slice(0, 40));
    // The countdown's number needs the script: without it, no stray "days" may show.
    const count = document.querySelector('.count');
    if (count && visible(count)) hidden.push('countdown shows without its number: ' + count.textContent.trim());
    return { h1: visible(h) ? h.textContent.trim().slice(0, 30) : null, paras: blocks.length, hidden };
  });
  const ok = r.h1 && r.paras > 0 && r.hidden.length === 0;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} /${path} | h1 ${r.h1} | ${r.paras} paragraphs | hidden ${r.hidden.length ? JSON.stringify(r.hidden.slice(0, 3)) : 0}`);
  await p.close();
}
await b.close();
process.exit(bad ? 1 : 0);
