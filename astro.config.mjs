// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nellitheertha.in',
  // Same addresses as the earlier static site: /temple/, /brahmakalasha/committees/ and so on.
  trailingSlash: 'always',
  build: { format: 'directory' },
  // A linked page is fetched when the link is hovered or focused, so it opens almost at once.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
