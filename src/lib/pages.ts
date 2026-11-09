// The site's pages, in the order the home page and the footer list them.
export interface PageEntry {
  slug: string;
  title: string;
  about: string;
}

export const PAGES: PageEntry[] = [
  { slug: 'brahmakalasha', title: 'Brahmakalasha 2026', about: 'The programme for 20 to 30 December 2026, day by day' },
  { slug: 'temple', title: 'The temple', about: 'Deities, the bhootas and the places around the temple' },
  { slug: 'history', title: 'History', about: 'Recorded since 1487 AD, under the Chowta family' },
  { slug: 'story', title: 'The birth of Nellitheertha', about: 'The story that led to the creation of the temple' },
  { slug: 'cave', title: 'The cave', about: 'The passage, the lake inside, and the months it is open' },
  { slug: 'sevas', title: 'Sevas', about: 'The poojas and offerings made at the temple' },
  { slug: 'jaatre', title: 'The annual jaatre', about: 'The festival in Dhanur Masa, the Bhoota Kola and the temple calendar' },
  { slug: 'mantras', title: 'Mantras', about: 'Mantras of Lord Shiva, in Kannada' },
  { slug: 'gallery', title: 'Gallery', about: 'Photographs from the temple' },
  { slug: 'visit', title: 'How to reach', about: 'Four routes, the address and contact numbers' },
  { slug: 'appeal', title: 'Renovation appeal, 2024', about: 'The works are complete. The appeal, the estimates and the committees' },
];

// Every address in the sitemap, in the order the earlier site listed them.
export const SITEMAP: string[] = ['', 'temple/', 'history/', 'story/', 'cave/', 'sevas/', 'jaatre/', 'mantras/', 'gallery/',
  'appeal/', 'visit/', 'brahmakalasha/', 'brahmakalasha/invitation/', 'brahmakalasha/committees/'];
