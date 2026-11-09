// The live panel's data, built from the programme, must equal what the live site carries.
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
const a = JSON.stringify(want), b = JSON.stringify(got);
if (a !== b) { let i = 0; while (a[i] === b[i]) i++; console.log('FAIL at', i, '\n live:', a.slice(i - 80, i + 80), '\n new: ', b.slice(i - 80, i + 80)); process.exit(1); }
console.log('PASS: liveData() equals the live programme-data,', got.days.length, 'days,', got.days.reduce((n, d) => n + d.items.length, 0), 'entries');
