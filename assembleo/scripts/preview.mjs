/**
 * Builds a single self-contained HTML file from dist/, so the site can be
 * shared as one link before it has real hosting.
 *
 * Everything is inlined: CSS, fonts, images as data URIs, and the interactive
 * islands bundled into one classic script. Astro's island runtime is replaced
 * with a small mount step, because its dynamic imports need real URLs and a
 * single file has none.
 *
 * This is a review artifact, not the deploy. The real site is built by
 * `npm run build` and served by Cloudflare Pages.
 */
import { build } from 'esbuild';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const DIST = 'dist';
const OUT = 'preview/index.html';

const MIME = {
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const dataUri = async (path) => {
  const buf = await readFile(path);
  return `data:${MIME[extname(path)] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`;
};

/* ---------- 1. bundle the islands ---------------------------------------- */

const entry = `
import { render, h } from 'preact';
import Estimator from './src/islands/Estimator';
import BookingForm from './src/islands/BookingForm';
import Reviews from './src/islands/Reviews';
import MobileNav from './src/islands/MobileNav';

const REG = { Estimator, BookingForm, Reviews, MobileNav };

function boot() {
  const props = JSON.parse(document.getElementById('preview-props').textContent);
  for (const el of document.querySelectorAll('astro-island')) {
    const url = el.getAttribute('component-url') || '';
    const name = Object.keys(REG).find((k) => url.includes('/' + k + '.'));
    if (!name) continue;
    // render(), not hydrate(): the SSR markup is replaced outright, which is
    // fine for a preview and avoids mismatch warnings.
    try { render(h(REG[name], props[name] || {}), el); } catch (e) { console.error(name, e); }
  }
}
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
else boot();
`;

await writeFile('.preview-entry.jsx', entry);

const bundled = await build({
  entryPoints: ['.preview-entry.jsx'],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  loader: { '.jsx': 'jsx', '.tsx': 'tsx', '.ts': 'ts', '.json': 'json' },
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  define: {
    'import.meta.env.PUBLIC_API_MOCK': '"true"',
    'import.meta.env.PUBLIC_API_BASE': '""',
    'import.meta.env.PUBLIC_REVIEWS_LIVE': '"false"',
    'import.meta.env.PUBLIC_TURNSTILE_SITE_KEY': 'undefined',
    'import.meta.env.PUBLIC_GOOGLE_MAPS_KEY': 'undefined',
    'import.meta.env.DEV': 'false',
    'import.meta.env.PROD': 'true',
  },
  write: false,
});
const islandJs = bundled.outputFiles[0].text;

/* ---------- 2. props the islands need ------------------------------------ */

const reviewsJson = JSON.parse(await readFile('src/data/reviews.json', 'utf8'));

const props = {
  Estimator: {},
  BookingForm: { variant: 'residential', heading: 'Tell us about the job', headingLevel: 'h3' },
  Reviews: {
    reviews: reviewsJson,
    rating: 4.9,
    count: 127,
    profileUrl: 'https://www.facebook.com/assembleofurnitureassemblyserviceingta',
  },
  MobileNav: {
    items: [
      { label: 'What we assemble', href: '#what' },
      { label: 'Commercial', href: '#commercial' },
      { label: 'Prices', href: '#estimate' },
      { label: 'Why us', href: '#why' },
      { label: 'Contact', href: '#book' },
    ],
    phone: '+14377798843',
    phoneDisplay: '(437) 779-8843',
    path: '/',
  },
};

/* ---------- 3. inline everything into the HTML --------------------------- */

let html = await readFile(join(DIST, 'index.html'), 'utf8');

// CSS files -> <style>, with font URLs turned into data URIs.
for (const m of [...html.matchAll(/<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)">/g)]) {
  let css = await readFile(join(DIST, m[1]), 'utf8');
  for (const f of [...css.matchAll(/url\((\/fonts\/[^)]+\.woff2)\)/g)]) {
    css = css.replace(f[0], `url(${await dataUri(join(DIST, f[1]))})`);
  }
  html = html.replace(m[0], `<style>${css}</style>`);
}

// Images: keep one source each, as a data URI. srcset/sources are dropped so
// the file stays one download rather than eight.
const assets = existsSync(join(DIST, '_astro')) ? await readdir(join(DIST, '_astro')) : [];
const pickAsset = (name, ext) =>
  assets
    .filter((f) => f.startsWith(name) && f.endsWith(ext))
    .sort((a, b) => a.length - b.length)[0];

html = html.replace(/<source[^>]*>/g, '');

for (const m of [...html.matchAll(/<img[^>]*?src="(\/_astro\/([^"]+))"[^>]*>/g)]) {
  const tag = m[0];
  const stem = basename(m[2]).split('.')[0];
  const webp = pickAsset(stem, '.webp');
  const file = webp ? join(DIST, '_astro', webp) : join(DIST, m[1]);
  const uri = await dataUri(file);
  html = html.replace(tag, tag.replace(m[1], uri).replace(/\ssrcset="[^"]*"/g, ''));
}

// Links that cannot resolve in a single file: the font is already inlined as a
// data URI inside the CSS, and the icon/manifest have nowhere to point.
html = html.replace(/<link rel="preload"[^>]*>/g, '');
html = html.replace(/<link rel="apple-touch-icon"[^>]*>/g, '');
html = html.replace(/<link rel="manifest"[^>]*>/g, '');

// Favicon + OG image references that would 404 in a single file.
for (const p of ['/favicon.svg']) {
  if (existsSync(join(DIST, p))) html = html.replace(p, await dataUri(join(DIST, p)));
}

// Astro's own module scripts cannot resolve without real URLs.
html = html.replace(/<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/g, '');
html = html.replace(/<script type="module">[\s\S]*?<\/script>/g, '');

// A visible note so nobody mistakes the preview for the live site.
const banner = `
<div style="position:fixed;left:0;right:0;bottom:0;z-index:99;background:#12283C;color:#F4F6F8;
font:600 12px/1.4 system-ui,sans-serif;padding:8px 12px;text-align:center">
PREVIEW — design review only. The form does not send anything.
</div>`;

html = html.replace(
  '</body>',
  `<script id="preview-props" type="application/json">${JSON.stringify(props).replace(/</g, '\\u003c')}</script>
<script>${islandJs}</script>${banner}</body>`,
);

await writeFile(OUT, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`${OUT} — ${kb} KB, self-contained`);
