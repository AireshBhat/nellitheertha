// Every page in ಕನ್ನಡ shows Kannada, with no English sentence left; in English, no Kannada shows beyond the lines
// that are Kannada on purpose (the temple's name, the ಕನ್ನಡ button). The home page is checked before and during the
// Brahmakalasha (?now=), because its live panel writes its own words.
// usage: node tests/kannada-site.mjs BASE
import { launch, base as slash, PAGES } from './chrome.mjs';
const base = slash(process.argv[2]);
const b = await launch();
let bad = 0;
const check = (ok, msg) => { if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };

// What may stay in Latin letters on a Kannada page: addresses, numbers, codes and company names.
const KEEP = /^(?:PDF|UPI|IFSC|AI|AM|PM|[A-Z]{2,5}\d+|\S+@\S+|\S+\.(?:com|org|in)\S*|https?:\S+|Fortious|Infra|Symetrics|Development|Pvt\.?|Ltd\.?|Shaivam\.org|nellitheertha\.com|©)$/;

const visibleText = () => {
  const out = [];
  const walk = (n) => {
    if (n.nodeType === 3) { if (n.textContent.trim()) out.push({ text: n.textContent.trim(), lang: n.parentElement.closest('[lang]')?.lang }); return; }
    if (n.nodeType !== 1 || ['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT'].includes(n.tagName)) return;
    if (n.hasAttribute('data-no-kn')) return; // English on purpose: the English button, the temple's English name
    if (!n.getClientRects().length && getComputedStyle(n).display !== 'contents') return;
    const cs = getComputedStyle(n);
    if (cs.visibility === 'hidden') return;
    for (const c of n.childNodes) walk(c);
  };
  walk(document.body);
  return out;
};

const pages = [...PAGES.map((p) => [p, '']), ['', '&now=2026-12-25T09:00'], ['', '&now=2026-12-31T09:00']];
for (const [page, extra] of pages) {
  for (const lang of ['kn', 'en']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.goto(`${base}${page}?lang=${lang}${extra}`, { waitUntil: 'networkidle' });
    const nodes = await p.evaluate(visibleText);
    const name = `/${page}${extra}`;
    if (lang === 'kn') {
      const english = nodes.filter((n) => !/[ಀ-೿]/.test(n.text))
        .map((n) => n.text.split(/[\s,:;()·–—'"“”‘’]+/).filter((w) => /[A-Za-z]{2,}/.test(w) && !KEEP.test(w)).join(' '))
        .filter(Boolean);
      const kannada = nodes.filter((n) => /[ಀ-೿]/.test(n.text)).length;
      check(english.length === 0 && kannada > 5, `kn ${name}: ${kannada} Kannada lines; English left: ${english.length ? english.slice(0, 6).join(' | ') : 'none'}`);
    } else {
      const stray = nodes.filter((n) => /[ಀ-೿]/.test(n.text) && n.lang !== 'kn');
      const kn = nodes.filter((n) => /[ಀ-೿]/.test(n.text)).map((n) => n.text);
      check(stray.length === 0 && kn.length <= 6, `en ${name}: Kannada shown only where meant (${kn.length}: ${kn.slice(0, 6).join(' | ')})`);
    }
    await ctx.close();
  }
}
await b.close();
process.exit(bad ? 1 : 0);
