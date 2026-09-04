import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

const site = process.env.PUBLIC_SITE_URL || 'https://assembleo.ca';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    preact(),
    sitemap({
      // Thank-you is a conversion endpoint, 404 is not a page. Neither belongs in the index.
      filter: (page) => !/\/(thank-you|404)\/?$/.test(page),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
  ],
  build: {
    // Small per-page CSS gets inlined; the shared sheet stays a cacheable file.
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});
