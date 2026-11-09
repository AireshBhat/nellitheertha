// The home page's live panel data: the programme cut into timed pieces (script: src/scripts/home.ts).
// "Tailabhyanjana to Sri Devaru, at 10:20 AM during Kumbha Lagna Sumuhurtha Brahmakalashabhisheka ..." becomes
// two pieces, 6:00 AM and 10:20 AM. The stage programme lists roles, not times, so it is one entry.
// Plain TypeScript (no Astro imports), so the tests can run it in Node.

export interface LiveItem { m: number | null; t: string; x: string; s: string; d: string; k: boolean }
export interface LiveDay { date: string; weekday: string; items: LiveItem[]; notes: string[]; posters: string[] }
interface Item { time: string; text: string; details?: string[] | null }
interface Section { name: string; items: Item[] }
interface Block { date: string; weekday: string; sections: Section[]; notes?: string[] | null }

const TIME = /(\d{1,2}):(\d{2}) ?([AP]M)/;
const INNER = /,\s*(?:at|from) (\d{1,2}:\d{2} ?[AP]M)\s+/;
const LAGNA = /^(?:in|during) (Kumbha Lagna Sumuhurtha)\s+/;
const STAGE = /^(.*?),\s*from (\d{1,2}:\d{2} ?[AP]M)$/;

export function minutes(label: string | null | undefined): number | null {
  const m = (label || '').match(TIME);
  if (!m) return null;
  return (Number(m[1]) % 12) * 60 + Number(m[2]) + (m[3] === 'PM' ? 720 : 0);
}

export function shownTime(label: string | null | undefined): string {
  const l = (label || '').trim();
  return l.startsWith('From ') ? l.slice(5) : l;
}

function items(blocks: Block[]): LiveItem[] {
  const out: LiveItem[] = [];
  for (const block of blocks) {
    for (const sec of block.sections || []) {
      const stage = sec.name.match(STAGE);
      if (stage) {
        out.push({ m: minutes(stage[2]), t: stage[2], x: stage[1], s: stage[1], d: '', k: false });
        continue;
      }
      for (const it of sec.items || []) {
        const parts = (it.text || '').split(new RegExp(INNER.source));
        const pieces: [string, string][] = [[it.time, parts[0]]];
        for (let i = 1; i < parts.length; i += 2) pieces.push([parts[i], parts[i + 1]]);
        pieces.forEach(([label, raw], n) => {
          let text = raw;
          const lagna = text.match(LAGNA);
          if (lagna) text = text.slice(lagna[0].length);
          const first = n === 0 ? ((it.details && it.details.length ? it.details : [''])[0] || '') : '';
          const detail = lagna ? lagna[1] : first.replace(/,+$/, '');
          let short = text.split(' with ')[0].replace(/\.+$/, '');
          if (short.length > 72) short = short.split(', ')[0];
          out.push({ m: minutes(label), t: shownTime(label), x: text, s: short, d: detail, k: Boolean(lagna) });
        });
      }
    }
  }
  const order = (r: LiveItem) => (r.m !== null ? r.m : r.t === 'Morning' ? 360 : 1440);
  return out.sort((a, b) => order(a) - order(b));
}

export function liveData(blocks: Block[], posters: (day: number) => string[]): { days: LiveDay[] } {
  const groups = new Map<string, Block[]>();
  for (const b of blocks) groups.set(b.date, [...(groups.get(b.date) || []), b]);
  return {
    days: [...groups].map(([date, g]) => ({
      date,
      weekday: g[0].weekday,
      items: items(g),
      notes: g.flatMap((b) => b.notes || []).map((n) => n.replace(/^[()]+|[()]+$/g, '')),
      posters: posters(Number(date.slice(8))),
    })),
  };
}
