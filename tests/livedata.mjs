// The live panel's data, built from the programme, must equal what the live site carries. The site adds the Kannada
// (xk, sk, dk for each entry, nk for each day's notes); every entry with a text must have it.
// usage: node tests/livedata.mjs BASE
import fs from 'fs';
import path from 'path';
import { liveData } from '../src/lib/live.ts';
const base = process.argv[2].replace(/\/?$/, '/');
const html = await (await fetch(base)).text();
const want = JSON.parse(html.match(/<script type="application\/json" id="programme-data">([\s\S]*?)<\/script>/)[1]);
const days = JSON.parse(fs.readFileSync(new URL('../src/content/programme.json', import.meta.url), 'utf8')).days;
const dir = new URL('../public/assets/posters/', import.meta.url);
const posters = (day) => fs.readdirSync(dir).filter((f) => f.startsWith(`dec${day}-`) && f.endsWith('.webp')).sort();
const got = liveData(days, posters);
const noKn = (x) => JSON.parse(JSON.stringify(x, (k, v) => (['xk', 'sk', 'dk', 'nk'].includes(k) ? undefined : v)));
const missing = want.days.flatMap((d) => d.items.filter((it) => !it.xk || !it.sk || (it.d && !it.dk)).map((it) => `${d.date} ${it.t} ${it.s}`));
if (missing.length) { console.log('FAIL: programme entries with no Kannada:\n ' + missing.join('\n ')); process.exit(1); }
const a = JSON.stringify(noKn(want)), b = JSON.stringify(got);
if (a !== b) { let i = 0; while (a[i] === b[i]) i++; console.log('FAIL at', i, '\n live:', a.slice(i - 80, i + 80), '\n new: ', b.slice(i - 80, i + 80)); process.exit(1); }
console.log('PASS: liveData() equals the live programme-data,', got.days.length, 'days,', got.days.reduce((n, d) => n + d.items.length, 0), 'entries, each with its Kannada');
