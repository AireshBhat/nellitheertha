// Every page gets its Kannada here, at build time (and in the dev server): src/lib/kn.ts.
import { defineMiddleware } from 'astro:middleware';
import { addKannada, type KnDict } from './lib/kn';
import dict from './content/kn-site.json';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;
  const html = addKannada(await response.text(), (dict as { entries: KnDict }).entries);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
});
