// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rm } from 'node:fs/promises';
import site from './src/data/site.json' with { type: 'json' };

export default defineConfig({
  site: site.url,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // Keep transactional and utility pages out of the sitemap.
      filter: (page) =>
        !/\/(book\/(success|pending|canceled|failed)|contact\/thanks|newsletter\/thanks|admin)\/?$/.test(page) &&
        !page.includes('/resources/worksheet/'),
    }),
    {
      // The content editor only works locally (`npm run edit`), so keep /admin out of the published site.
      name: 'drop-admin-from-build',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          await rm(new URL('admin/', dir), { recursive: true, force: true });
        },
      },
    },
  ],
});
