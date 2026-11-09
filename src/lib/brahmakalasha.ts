import fs from 'node:fs';
import path from 'node:path';

// Decoded from the QR code on page 23 of the invitation: a signed Karnataka Bank merchant code.
// Not one character may change, or the signature fails in the payer's UPI app.
export const UPI = 'upi://pay?pa=9986376974@kbl&pn=SRI%20SOMANATHESHWARA%20TEMPLE%20JEERNODHARA%20S&cu=INR&mc=8661&orgid=159052'
  + '&sign=MEUCIQDHPf/JRbCGXygPlNo2Jh2ickx8b3OqTEgxAOU1wFuo6wIgRal+zz3RJsSpuioIKfI4gtkJgPaFw2jOJkIG2Ji+UvQ=';

const SITE = 'https://nellitheertha.in';
export const EVENT = {
  '@context': 'https://schema.org', '@type': 'Event',
  name: 'Ashtabandha Brahmakalashabhisheka, Sri Kshetra Nellitheertha',
  description: 'Ashtabandha Brahmakalashabhisheka, Sakruth Pavitra Naga Brahma Mandalotsava and Varshavadhi Jatre at '
    + 'Sri Kshetra Nellitheertha. The Brahmakalashabhisheka is on Friday 25 December 2026 at 10:20 AM, in Kumbha Lagna.',
  startDate: '2026-12-20', endDate: '2026-12-30', eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: { '@type': 'HinduTemple', name: 'Sri Somanatheshwara Guhalaya, Sri Kshetra Nellitheertha',
    address: { '@type': 'PostalAddress', streetAddress: 'Neerude Post, Kompadavu Village', addressLocality: 'Mangaluru Taluk',
      addressRegion: 'Karnataka', postalCode: '574144', addressCountry: 'IN' } },
  image: [`${SITE}/assets/img/og.jpg`], url: `${SITE}/brahmakalasha/`,
  organizer: { '@type': 'Organization', name: 'Sri Somanatheshwara Temple Jirnoddhara Samiti', url: `${SITE}/` },
};

export interface Group<T> { date: string; weekday: string; day: number; blocks: T[] }
// Programme blocks grouped by date, in order (24 December has the day's programme and the stage programme).
export function byDate<T extends { date: string; weekday: string }>(blocks: T[]): Group<T>[] {
  const out: Group<T>[] = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (last && last.date === b.date) last.blocks.push(b);
    else out.push({ date: b.date, weekday: b.weekday, day: Number(b.date.slice(8)), blocks: [b] });
  }
  return out;
}

// The day's posters in public/assets/posters, e.g. dec24-04.webp and dec24-05.webp.
export function posters(day: number): string[] {
  return fs.readdirSync(path.join(process.cwd(), 'public/assets/posters')).filter((f) => f.startsWith(`dec${day}-`) && f.endsWith('.webp')).sort();
}

// Attributes that let the language switch show the Kannada version, when there is one.
export const bi = (en?: string | null, kn?: string | null) => (en && kn ? { 'data-en': en, 'data-kn': kn } : {});

export async function programme() {
  const { getCollection } = await import('astro:content');
  return (await getCollection('programme')).sort((a, b) => a.id.localeCompare(b.id)).map((e) => e.data);
}
