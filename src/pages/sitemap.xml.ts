import type { APIRoute } from 'astro';
import { SITEMAP } from '../lib/pages';

// Kept at /sitemap.xml, the address robots.txt and search engines already know.
export const GET: APIRoute = ({ site }) => {
  const urls = SITEMAP.map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } });
};
