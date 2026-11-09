// Every address people may hold must still answer: the pages, every /assets/ link on the old site's pages
// (posters, PDFs, the share image, the UPI code), the sitemap's URLs and the well-known files.
// usage: node tests/urls.mjs OLD_BASE NEW_BASE
import { PAGES, base as slash } from './chrome.mjs';
const [OLD, NEW] = process.argv.slice(2).map(slash);
const paths = new Set(PAGES.concat(['sitemap.xml', 'robots.txt', 'favicon.ico', 'assets/img/og.jpg', 'assets/icons/apple-touch-icon.png']));
for (const page of PAGES) {
  const html = await (await fetch(OLD + page)).text();
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = new URL(m[1], OLD + page);
    // Fonts and the forest-walk frames are loaded by the pages themselves, never shared; they moved on purpose.
    if (url.origin + '/' === OLD && url.pathname.startsWith('/assets/') && !/^\/assets\/(fonts|walk-)/.test(url.pathname)) paths.add(url.pathname.slice(1));
  }
}
const sitemap = await (await fetch(OLD + 'sitemap.xml')).text();
for (const m of sitemap.matchAll(/<loc>https:\/\/nellitheertha\.in\/([^<]*)<\/loc>/g)) paths.add(m[1]);
let bad = 0;
for (const path of [...paths].sort()) {
  const res = await fetch(NEW + path, { method: 'GET', redirect: 'manual' });
  if (res.status !== 200) { bad++; console.log('FAIL', res.status, '/' + path); }
}
console.log(`${bad ? 'FAIL' : 'PASS'}: ${paths.size - bad} of ${paths.size} addresses answer 200 on ${NEW}`);
process.exit(bad ? 1 : 0);
