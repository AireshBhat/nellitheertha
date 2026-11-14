// Lists the English on the built site that has no Kannada yet: every unit (src/lib/kn.ts) on every page in dist/,
// and the home page's live panel (the programme pieces from src/lib/live.ts, which home.ts writes in the browser).
// usage: pnpm build && node scripts/kn-missing.ts OUT.json
import fs from 'node:fs';
import path from 'node:path';
import { units, keyOf } from '../src/lib/kn.ts';
import { liveData } from '../src/lib/live.ts';

const root = path.resolve(import.meta.dirname, '..');
const dict = JSON.parse(fs.readFileSync(path.join(root, 'src/content/kn-site.json'), 'utf8')).entries;
const missing = new Map<string, { key: string; pages: string[]; tag: string }>();
const add = (key: string, page: string, tag: string) => {
  if (dict[key]) return;
  const m = missing.get(key) ?? { key, pages: [], tag };
  if (!m.pages.includes(page)) m.pages.push(page);
  missing.set(key, m);
};

const pages = fs.readdirSync(path.join(root, 'dist'), { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('index.html')).sort();
for (const f of pages) {
  const page = '/' + path.dirname(f).replace(/^\.$/, '');
  for (const u of units(fs.readFileSync(path.join(root, 'dist', f), 'utf8'))) add(u.key, page, u.tag);
}

const programme = JSON.parse(fs.readFileSync(path.join(root, 'src/content/programme.json'), 'utf8'));
for (const day of liveData(programme.days, () => []).days) {
  for (const it of day.items) for (const s of [it.x, it.s, it.d]) if (s && /[A-Za-z]{2,}/.test(s)) add(keyOf(s), `live:${day.date}`, 'live');
  for (const n of day.notes) add(keyOf(n), `live:${day.date}`, 'live');
}

const list = [...missing.values()];
fs.writeFileSync(process.argv[2], JSON.stringify(list, null, 1) + '\n');
console.log(`${list.length} English units with no Kannada, ${list.reduce((n, m) => n + m.key.length, 0)} characters`);
