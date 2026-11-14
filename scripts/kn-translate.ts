// Machine-translates the English that has no Kannada yet (the list from scripts/kn-missing.ts) with Sarvam AI's
// sarvam-105b, and adds it to src/content/kn-site.json. Every answer is checked: it must be Kannada and keep the
// English's HTML tags. One that fails is asked again on its own, then given to sarvam-translate:v1, and otherwise left
// English and reported. Each entry records its model in `from`, so a Kannada reader can check the machine's work.
// The key is SARVAM_API_KEY, from the environment or from ../.env (outside this public repository).
// usage: node scripts/kn-translate.ts MISSING.json REPORT.json [--skip /brahmakalasha/committees] [--only /visit]
import fs from 'node:fs';
import path from 'node:path';
import { PAGES } from '../src/lib/pages.ts';

const root = path.resolve(import.meta.dirname, '..');
const envFile = path.join(root, '..', '.env');
const KEY = process.env.SARVAM_API_KEY
  || (fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8').match(/^SARVAM_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '') : undefined);
if (!KEY) throw new Error('SARVAM_API_KEY: set it in the environment or in ../.env');

const [missingFile, reportFile, ...flags] = process.argv.slice(2);
const opt = (name: string) => flags.flatMap((f, i) => (f === name ? [flags[i + 1]] : []));
const skip = opt('--skip'), only = opt('--only');
const dictFile = path.join(root, 'src/content/kn-site.json');
const dict = JSON.parse(fs.readFileSync(dictFile, 'utf8'));

// The temple's own Kannada forms, from the patrike where it has them.
const GLOSSARY = `Sri Kshetra Nellitheertha = ಶ್ರೀ ಕ್ಷೇತ್ರ ನೆಲ್ಲಿತೀರ್ಥ; Nellitheertha = ನೆಲ್ಲಿತೀರ್ಥ
Sri Somanatheshwara Guhalaya, Sri Somanatheshwara Cave Temple = ಶ್ರೀ ಸೋಮನಾಥೇಶ್ವರ ಗುಹಾಲಯ (never ದೇವಸ್ಥಾನ for this name)
cave temple = ಗುಹಾಲಯ; the temple (in general) = ದೇವಾಲಯ; cave = ಗುಹೆ
Sri Somanatheshwara = ಶ್ರೀ ಸೋಮನಾಥೇಶ್ವರ; Somanatha = ಸೋಮನಾಥ; Sri Devaru = ಶ್ರೀ ದೇವರು; Lord Shiva = ಶಿವ
Mahaganapati = ಮಹಾಗಣಪತಿ; Jabali Maharshi, Sage Jabali = ಜಾಬಾಲಿ ಮಹರ್ಷಿ; Brindavana = ಬೃಂದಾವನ
Linga, Lingam = ಲಿಂಗ; Saligrama = ಸಾಲಿಗ್ರಾಮ; Ardhanareeshwara = ಅರ್ಧನಾರೀಶ್ವರ; Antar Ganga = ಅಂತರ್ಗಂಗೆ; Ganga = ಗಂಗೆ
bhoota, bhootas (the spirit deities) = ದೈವ, ದೈವಗಳು; Bhoota Kola = ಭೂತಕೋಲ; ganas = ಗಣಗಳು
Pili-Chamundi = ಪಿಲಿಚಾಮುಂಡಿ; Kshetrapala = ಕ್ಷೇತ್ರಪಾಲ; Raktheshwari = ರಕ್ತೇಶ್ವರಿ; Doomavathy = ಧೂಮಾವತಿ
Brahmakalasha = ಬ್ರಹ್ಮಕಲಶ; Brahmakalashabhisheka = ಬ್ರಹ್ಮಕಲಶಾಭಿಷೇಕ; Ashtabandha = ಅಷ್ಟಬಂಧ
Sakruth Pavitra Naga Brahma Mandalotsava = ಸಕೃತ್ಪವಿತ್ರ ನಾಗಬ್ರಹ್ಮ ಮಂಡಲೋತ್ಸವ; Nagabrahma Mandala Seve = ನಾಗಬ್ರಹ್ಮ ಮಂಡಲ ಸೇವೆ
Varshavadhi Jatre = ವರ್ಷಾವಧಿ ಜಾತ್ರೆ; jaatre, jatre = ಜಾತ್ರೆ; Kumbha Lagna = ಕುಂಭ ಲಗ್ನ
Jeernoddhara, Jeernodhara, Jirnoddhara (renovation) = ಜೀರ್ಣೋದ್ಧಾರ; Samiti, committee = ಸಮಿತಿ
Nagappa Kere = ನಾಗಪ್ಪ ಕೆರೆ; kere, pond = ಕೆರೆ; Nagavana = ನಾಗವನ; Nagabana = ನಾಗಬನ
Kompadavu = ಕೊಂಪದವು; Neerude = ನೀರುಡೆ; Kateel = ಕಟೀಲು; Bajpe = ಬಜಪೆ; Mangalore, Mangaluru = ಮಂಗಳೂರು
Dakshina Kannada, D.K. = ದಕ್ಷಿಣ ಕನ್ನಡ; Mulki = ಮುಲ್ಕಿ; Moodabidri, Moodabidare = ಮೂಡುಬಿದಿರೆ; Udupi = ಉಡುಪಿ; Aikala = ಐಕಳ
Tulu = ತುಳು; Tulu-naadu = ತುಳುನಾಡು; Chowta = ಚೌಟ; Dhanur Masa = ಧನುರ್ಮಾಸ; Tula Sankramana = ತುಲಾ ಸಂಕ್ರಮಣ
seva, seve = ಸೇವೆ; pooja, pooje = ಪೂಜೆ; Mahapooje = ಮಹಾಪೂಜೆ; prasada = ಪ್ರಸಾದ; Annadana = ಅನ್ನದಾನ; Annasantarpane = ಅನ್ನಸಂತರ್ಪಣೆ
Yakshagana = ಯಕ್ಷಗಾನ; Archaka = ಅರ್ಚಕರು; Sri = ಶ್ರೀ; Smt = ಶ್ರೀಮತಿ; Dr = ಡಾ.; AD (a year) = ಕ್ರಿ.ಶ.
Times as the patrike writes them: 6:00 AM = ಬೆಳಗ್ಗೆ 6:00; 1:30 PM = ಮಧ್ಯಾಹ್ನ 1:30; 5:00 PM = ಸಂಜೆ 5:00; 8:00 PM = ರಾತ್ರಿ 8:00
Keep as written: web addresses, email addresses, phone numbers, account numbers, IFSC, UPI, PDF.`;

const SYSTEM = `You translate the English website of Sri Somanatheshwara Guhalaya, Sri Kshetra Nellitheertha, a cave temple in Kompadavu village near Mangaluru (Dakshina Kannada), into Kannada for the temple's devotees.
Rules:
- Translate faithfully and completely. Add nothing and drop nothing. No flourishes: plain, standard written Kannada, as in the temple's own printed invitation (patrike).
- Keep every HTML tag exactly as given, with its attributes (<a href="...">, <small>, <br>, <strong>, <span class="...">, <time ...>). Translate only the text between tags. Each tag appears in the Kannada as many times as in the English.
- Text in capitals is a small label; translate it normally (Kannada has no capitals).
- Write numbers with the same digits (0-9) as the English.
- People's names and place names are written in Kannada letters, as they are pronounced.
- Use these forms:
${GLOSSARY}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function post(url: string, body: object) {
  for (let i = 0; ; i++) {
    const wait = lastCall + 1100 - Date.now(); // Sarvam allows 60 requests a minute
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const r = await fetch(url, { method: 'POST', headers: { 'api-subscription-key': KEY!, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) return r.json();
    const text = await r.text();
    if (i < 4 && (r.status === 429 || r.status >= 500)) { await sleep(3000 * (i + 1)); continue; }
    throw new Error(`${url}: ${r.status} ${text.slice(0, 300)}`);
  }
}
const usage = { prompt: 0, completion: 0, translateChars: 0 };
async function chat(system: string, user: string) {
  const j = await post('https://api.sarvam.ai/v1/chat/completions', {
    model: 'sarvam-105b', temperature: 0.2, max_tokens: 4096, reasoning_effort: null,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  });
  usage.prompt += j.usage?.prompt_tokens ?? 0;
  usage.completion += j.usage?.completion_tokens ?? 0;
  return String(j.choices[0].message.content ?? '');
}
async function translate(input: string) {
  usage.translateChars += input.length;
  const j = await post('https://api.sarvam.ai/translate', {
    input, source_language_code: 'en-IN', target_language_code: 'kn-IN', model: 'sarvam-translate:v1', mode: 'formal', numerals_format: 'international',
  });
  return String(j.translated_text ?? '');
}

// Context: the page, and for programme lines the day's programme in English and in the patrike's Kannada.
const programme = JSON.parse(fs.readFileSync(path.join(root, 'src/content/programme.json'), 'utf8'));
const invitation = JSON.parse(fs.readFileSync(path.join(root, 'src/content/invitation.json'), 'utf8'));
function dayContext(date: string) {
  const blocks = programme.days.filter((d: { date: string }) => d.date === date);
  const en: string[] = [], kn: string[] = [];
  for (const b of blocks) {
    for (const s of b.sections) {
      en.push(`[${s.name}]`, ...s.items.map((it: { time: string; text: string; details?: string[] }) => `${it.time} | ${it.text} ${(it.details ?? []).join(' ')}`));
      if (s.kn) kn.push(`[${s.kn.name}]`, ...s.kn.items.map((it: { time: string; text: string; details: string[] }) => `${it.time} | ${it.text} ${it.details.join(' ')}`));
    }
    en.push(...(b.notes ?? []));
    if (b.kn) kn.push(b.kn.heading, ...(b.kn.notes ?? []));
  }
  return `The programme for ${date}, in English:\n${en.join('\n')}\n\nThe same day in the patrike's own Kannada (use its words for the same rituals and events, exactly):\n${kn.join('\n')}`;
}
const BANK = `The patrike's own Kannada for the bank details: ${JSON.stringify(invitation.kn.bank)}`;
function context(page: string) {
  if (page.startsWith('live:')) return `These lines are pieces of one day's temple programme, shown on the home page.\n${dayContext(page.slice(5))}`;
  const entry = PAGES.find((p) => `/${p.slug}` === page);
  const where = page === '/' ? 'the home page' : page === 'shared' ? 'the header and footer of every page'
    : entry ? `the page "${entry.title}" (${entry.about})` : `the page ${page}`;
  let extra = '';
  if (page === '/' || page === '/brahmakalasha') extra = `\n\n${dayContext('2026-12-25')}\n\n${BANK}`;
  return `These lines are from ${where}, in the order they appear.${extra}`;
}

// Checks on an answer. Problems stop it; notes are kept in the report for the reader.
const tags = (s: string) => (s.match(/<[^>]+>/g) ?? []).sort().join('');
const kannada = (s: string) => /[ಀ-೿]/.test(s);
function check(en: string, kn: string) {
  const problems: string[] = [], notes: string[] = [];
  if (!kn.trim()) problems.push('empty');
  else if (!kannada(kn)) problems.push('no Kannada');
  if (tags(en) !== tags(kn)) problems.push(`tags differ: ${tags(en)} vs ${tags(kn)}`);
  if (/Guhalaya|Cave Temple/.test(en) && kn.includes('ದೇವಸ್ಥಾನ')) problems.push('ದೇವಸ್ಥಾನ for Guhalaya');
  const latin = kn.replace(/<[^>]+>/g, ' ').match(/[A-Za-z][A-Za-z.@-]*[A-Za-z]/g) ?? [];
  const kept = latin.filter((w) => !en.includes(w) || !/[.@]|^[A-Z0-9]+$/.test(w));
  if (kept.length) notes.push(`English left: ${kept.join(' ')}`);
  // Kannada runs about as long as the English (median 0.93 on this site); a long text much shorter was cut off.
  const ratio = kn.replace(/<[^>]+>/g, '').length / Math.max(en.replace(/<[^>]+>/g, '').length, 1);
  if (en.length >= 150 && ratio < 0.55) problems.push(`cut short: length ratio ${ratio.toFixed(2)}`);
  else if (ratio < 0.4 || ratio > 2.5) notes.push(`length ratio ${ratio.toFixed(2)}`);
  return { problems, notes };
}

interface Missing { key: string; pages: string[]; tag: string }
const missing: Missing[] = JSON.parse(fs.readFileSync(missingFile, 'utf8'));
const todo = missing.filter((m) => !dict.entries[m.key])
  .map((m) => ({ ...m, page: m.pages.length > 1 && !m.pages[0].startsWith('live:') ? 'shared' : m.pages[0] }))
  .filter((m) => !m.pages.every((p) => skip.includes(p)) && (!only.length || m.pages.some((p) => only.includes(p))));

const report: { key: string; kn: string | null; from: string | null; problems: string[]; notes: string[] }[] = [];
const save = () => fs.writeFileSync(dictFile, JSON.stringify(dict, null, 1) + '\n');
const visible = (s: string) => s.replace(/<[^>]+>/g, '');

// Text with no words to translate (an email address, a number) is kept as it is.
for (const m of todo.filter((m) => !/[A-Za-z]{2,}/.test(visible(m.key).replace(/\S+@\S+|https?:\/\/\S+|\S+\.(?:com|org|in)\b/g, '')))) {
  dict.entries[m.key] = { kn: m.key, from: 'same' };
}
const work = todo.filter((m) => !dict.entries[m.key]);

// Batches of one page's lines, up to about 1,200 characters, so the model sees its neighbours.
const batches: (Missing & { page: string })[][] = [];
for (const page of [...new Set(work.map((m) => m.page))]) {
  let cur: (Missing & { page: string })[] = [], size = 0;
  for (const m of work.filter((x) => x.page === page)) {
    if (cur.length && (size + m.key.length > 1200 || cur.length >= 12)) { batches.push(cur); cur = []; size = 0; }
    cur.push(m); size += m.key.length;
  }
  if (cur.length) batches.push(cur);
}
console.log(`${work.length} lines in ${batches.length} batches; ${todo.length - work.length} kept as they are`);

async function one(m: Missing & { page: string }) {
  let kn = '', from = 'sarvam-105b', last = { problems: ['not tried'], notes: [] as string[] };
  try {
    const out = JSON.parse(await chat(`${SYSTEM}\n\n${context(m.page)}`, `Translate the "en" text into Kannada. Reply with JSON: {"kn": "..."}\n${JSON.stringify({ en: m.key })}`));
    kn = String(out.kn ?? '').trim();
    last = check(m.key, kn);
  } catch (e) { last = { problems: [String(e)], notes: [] }; }
  if (last.problems.length) {
    from = 'sarvam-translate:v1';
    try { kn = (await translate(m.key)).trim(); last = check(m.key, kn); } catch (e) { last = { problems: [String(e)], notes: [] }; }
  }
  return { kn, from, ...last };
}

let n = 0;
for (const batch of batches) {
  n++;
  const items = batch.map((m, i) => ({ id: String(i + 1), en: m.key }));
  let answers: Record<string, string> = {};
  try {
    const out = JSON.parse(await chat(`${SYSTEM}\n\n${context(batch[0].page)}`,
      `Translate each item's "en" text into Kannada. Reply with JSON: {"items": [{"id": "1", "kn": "..."}, ...]}, one per item, same ids.\n${JSON.stringify({ items })}`));
    for (const a of out.items ?? []) answers[String(a.id)] = String(a.kn ?? '').trim();
  } catch (e) { console.log(`batch ${n}: ${e}`); answers = {}; }
  for (const [i, m] of batch.entries()) {
    let kn = answers[String(i + 1)] ?? '', from = 'sarvam-105b';
    let result = check(m.key, kn);
    if (result.problems.length) ({ kn, from, ...result } = await one(m));
    if (!result.problems.length) dict.entries[m.key] = { kn, from };
    report.push({ key: m.key, kn: result.problems.length ? null : kn, from: result.problems.length ? null : from, ...result });
  }
  save();
  const failed = report.filter((r) => r.problems.length).length;
  console.log(`batch ${n}/${batches.length} (${batch[0].page}): ${report.length} done, ${failed} left English`);
}
fs.writeFileSync(reportFile, JSON.stringify({ usage, report }, null, 1) + '\n');
const cost = (usage.prompt * 15 + usage.completion * 60) / 1e6 + usage.translateChars * 2 / 1000;
console.log(`tokens in ${usage.prompt}, out ${usage.completion}; sarvam-translate characters ${usage.translateChars}; about ₹${cost.toFixed(2)} before GST`);
