// The UPI deep link is a signed merchant code: one changed character and payment apps reject it.
// usage: node tests/upi.mjs BASE_A BASE_B
import { launch, base } from './chrome.mjs';
const [A, B] = process.argv.slice(2).map(base);
const b = await launch();
const links = [];
for (const host of [A, B]) for (const path of ['', 'brahmakalasha/']) {
  const p = await b.newPage();
  await p.goto(host + path, { waitUntil: 'domcontentloaded' });
  links.push(...await p.evaluate(() => [...document.querySelectorAll('a[href^="upi:"]')].map((a) => a.href)));
  await p.close();
}
await b.close();
const distinct = [...new Set(links)];
if (links.length < 3 || distinct.length !== 1) { console.log('FAIL', links.length, 'UPI links,', distinct.length, 'distinct:', distinct); process.exit(1); }
console.log('PASS', links.length, 'UPI links, all identical:', distinct[0].slice(0, 60) + '…');
