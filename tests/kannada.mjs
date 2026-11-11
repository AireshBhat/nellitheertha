// With ಕನ್ನಡ chosen, the Brahmakalasha pages show the patrike's Kannada; with English, none of it shows.
// usage: node tests/kannada.mjs BASE
import { launch, base as slash } from './chrome.mjs';
const base = slash(process.argv[2]);
const b = await launch();
let bad = 0;
const check = (ok, msg) => { if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };
for (const lang of ['kn', 'en']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`${base}brahmakalasha/?lang=${lang}`, { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => {
    const shown = (el) => el.getClientRects().length > 0;
    const kannada = (s) => /[ಀ-೿]/.test(s);
    const days = [...document.querySelectorAll('section.day')];
    return {
      days: days.length,
      daysWithKannadaHeading: days.filter((d) => kannada(d.querySelector('h2').innerText)).length,
      kannadaEntries: [...document.querySelectorAll('ol.prog li')].filter((li) => shown(li) && kannada(li.innerText)).length,
      englishEntriesShown: [...document.querySelectorAll('ol.prog li')].filter((li) => shown(li) && !kannada(li.innerText)).length,
      instructionsKannada: [...document.querySelectorAll('#instructions + ol li')].filter((li) => kannada(li.innerText)).length,
      kannadaChars: (document.querySelector('main').innerText.match(/[ಀ-೿]/g) || []).length,
    };
  });
  if (lang === 'kn') {
    check(r.days === 11 && r.daysWithKannadaHeading === 11, `kn: all 11 days have their Kannada heading (${r.daysWithKannadaHeading})`);
    check(r.kannadaEntries >= 45, `kn: programme entries in Kannada (${r.kannadaEntries})`);
    check(r.englishEntriesShown === 0, `kn: no English programme entry left showing (${r.englishEntriesShown})`);
    check(r.instructionsKannada === 5, `kn: the 5 special instructions in Kannada (${r.instructionsKannada})`);
  } else {
    check(r.kannadaChars === 0, `en: no Kannada in the page's main text (${r.kannadaChars} Kannada characters)`);
  }
  if (lang === 'kn') {
    // Printing slips in the patrike, corrected on the site (2026-11-11): the printed form must not show.
    const text = await p.evaluate(() => document.querySelector('main').innerText);
    for (const [slip, right] of [['ಸುಬಹ್ಮಣ್ಯ', 'ಸುಬ್ರಹ್ಮಣ್ಯ'], ['ಸಹೋದರರರು', 'ಸಹೋದರರು'], ['ನಿದೇರ್ಶಕರು', 'ನಿರ್ದೇಶಕರು']])
      check(!text.includes(slip) && text.includes(right), `kn: ${right} (not the printed ${slip})`);
  }
  const inv = await ctx.newPage();
  await inv.goto(`${base}brahmakalasha/invitation/?lang=${lang}`, { waitUntil: 'networkidle' });
  const k = await inv.evaluate(() => (document.querySelector('main').innerText.match(/[ಀ-೿]/g) || []).length);
  check(lang === 'kn' ? k > 500 : k === 0, `${lang}: invitation letter ${lang === 'kn' ? 'in Kannada' : 'has no Kannada'} (${k} Kannada characters)`);
  if (lang === 'kn') {
    const letter = await inv.evaluate(() => document.querySelector('main').innerText);
    check(!letter.includes('ವಿಪ್ರೌಫ') && letter.includes('ವಿಪ್ರೌಘ'), 'kn: the shloka reads ವಿಪ್ರೌಘ (not the printed ವಿಪ್ರೌಫ)');
  }
  await ctx.close();
}
await b.close();
process.exit(bad ? 1 : 0);
