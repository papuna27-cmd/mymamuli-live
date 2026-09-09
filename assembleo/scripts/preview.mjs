/**
 * Builds a shareable preview of the whole site as ONE self-contained HTML file.
 *
 * Every built page is inlined side by side and a small router swaps between
 * them, because a single file has no server to route with. Everything else is
 * inlined too: CSS, fonts, images as data URIs, and the interactive islands
 * bundled with esbuild — Astro's island runtime needs real URLs, which a
 * single file cannot provide.
 *
 * Outputs:
 *   preview/index.html     complete document, opens straight from disk
 *   preview/artifact.html  same content without <html>/<head>/<body>, for the
 *                          Artifact host which supplies its own skeleton
 *
 * This is a review artifact, not the deploy. The real site is `npm run build`
 * served by Cloudflare Pages.
 */
import { build } from 'esbuild';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const DIST = 'dist';

/** Route -> built file. Order sets the order of the preview switcher. */
const PAGES = [
  { path: '/', label: 'Home', file: 'index.html' },
  { path: '/privacy', label: 'Privacy', file: 'privacy/index.html' },
  { path: '/terms', label: 'Terms', file: 'terms/index.html' },
  { path: '/thank-you', label: 'Thank you', file: 'thank-you/index.html' },
];

const MIME = {
  '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const dataUri = async (p) => {
  const buf = await readFile(p);
  return `data:${MIME[extname(p)] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`;
};

/* ---------- 1. bundle the islands ---------------------------------------- */

await writeFile('.preview-entry.jsx', `
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
`);

const bundled = await build({
  entryPoints: ['.preview-entry.jsx'],
  bundle: true, format: 'iife', minify: true, target: 'es2020',
  jsx: 'automatic', jsxImportSource: 'preact',
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

/* ---------- 2. island props ---------------------------------------------- */

const reviewsJson = JSON.parse(await readFile('src/data/reviews.json', 'utf8'));
const props = {
  Estimator: {},
  BookingForm: { variant: 'residential', heading: 'Tell us about the job', headingLevel: 'h3' },
  Reviews: {
    reviews: reviewsJson, rating: 4.9, count: 127,
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
    phone: '+14377798843', phoneDisplay: '(437) 779-8843', path: '/',
  },
};

/* ---------- 3. inline each page ------------------------------------------ */

const assets = existsSync(join(DIST, '_astro')) ? await readdir(join(DIST, '_astro')) : [];
const pickWebp = (stem) =>
  assets.filter((f) => f.startsWith(stem) && f.endsWith('.webp')).sort((a, b) => a.length - b.length)[0];

const styles = new Map(); // href -> css, deduped across pages
const bodies = [];
let title = 'Assembleo';

for (const page of PAGES) {
  const src = join(DIST, page.file);
  if (!existsSync(src)) { console.warn(`skip ${page.path} (not built)`); continue; }
  let html = await readFile(src, 'utf8');

  if (page.path === '/') title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? title;

  // Stylesheets, with font files folded in as data URIs.
  for (const m of [...html.matchAll(/<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)">/g)]) {
    if (!styles.has(m[1])) {
      let css = await readFile(join(DIST, m[1]), 'utf8');
      for (const f of [...css.matchAll(/url\((\/fonts\/[^)]+\.woff2)\)/g)]) {
        css = css.replace(f[0], `url(${await dataUri(join(DIST, f[1]))})`);
      }
      styles.set(m[1], css);
    }
    html = html.replace(m[0], '');
  }

  // One source per image, as a data URI, so the file is a single download.
  html = html.replace(/<source[^>]*>/g, '');
  for (const m of [...html.matchAll(/<img[^>]*?src="(\/_astro\/([^"]+))"[^>]*>/g)]) {
    const stem = basename(m[2]).split('.')[0];
    const webp = pickWebp(stem);
    const uri = await dataUri(webp ? join(DIST, '_astro', webp) : join(DIST, m[1]));
    html = html.replace(m[0], m[0].replace(m[1], uri).replace(/\ssrcset="[^"]*"/g, ''));
  }

  // Astro's module scripts cannot resolve without real URLs.
  html = html.replace(/<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/g, '');
  html = html.replace(/<script type="module">[\s\S]*?<\/script>/g, '');
  // Structured data is meaningless in a preview and only bloats the file.
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

  // Astro's scoped <style> blocks live in the body/head of each page.
  for (const m of [...html.matchAll(/<style>[\s\S]*?<\/style>/g)]) {
    styles.set(m[0].slice(0, 60) + styles.size, m[0].replace(/<\/?style>/g, ''));
    html = html.replace(m[0], '');
  }

  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [])[1] ?? '';
  bodies.push({ ...page, body });
}

/* ---------- 4. compose --------------------------------------------------- */

const switcher = `
<nav class="pv-bar" aria-label="Preview pages">
  <span class="pv-tag">PREVIEW</span>
  ${bodies.map((p) => `<button type="button" data-go="${p.path}">${p.label}</button>`).join('')}
  <span class="pv-note">form does not send</span>
</nav>`;

const previewCss = `
[data-page][hidden]{display:none!important}
.pv-bar{position:fixed;left:0;right:0;bottom:0;z-index:200;display:flex;align-items:center;gap:6px;
 flex-wrap:wrap;padding:7px 10px calc(7px + env(safe-area-inset-bottom,0px));background:#12283C;
 font:600 12px/1 ui-sans-serif,system-ui,sans-serif}
.pv-tag{color:#E08A00;letter-spacing:.08em}
.pv-bar button{min-height:32px;padding:0 10px;border-radius:4px;border:1px solid rgba(244,246,248,.35);
 background:transparent;color:#F4F6F8;font:inherit;cursor:pointer}
.pv-bar button[aria-current="true"]{background:#F4F6F8;color:#12283C;border-color:#F4F6F8}
.pv-note{color:rgba(244,246,248,.6);font-weight:400;margin-left:auto}
/* The switcher sits above the site's own sticky bar. */
body{padding-bottom:96px!important}
.actionbar,.calc__sticky{bottom:46px!important}
`;

const routerJs = `
(function(){
  var pages=[].slice.call(document.querySelectorAll('[data-page]'));
  var btns=[].slice.call(document.querySelectorAll('.pv-bar [data-go]'));
  function show(path){
    var found=false;
    pages.forEach(function(el){
      var on=el.getAttribute('data-page')===path;
      el.hidden=!on; if(on) found=true;
    });
    if(!found){ pages[0].hidden=false; path=pages[0].getAttribute('data-page'); }
    btns.forEach(function(b){ b.setAttribute('aria-current', String(b.getAttribute('data-go')===path)); });
    window.scrollTo(0,0);
    try{ history.replaceState(null,'',location.pathname+location.search+'#page='+path); }catch(e){}
  }
  btns.forEach(function(b){ b.addEventListener('click',function(){ show(b.getAttribute('data-go')); }); });
  // Real links inside the pages (footer Privacy/Terms) route too.
  document.addEventListener('click',function(e){
    var a=e.target.closest && e.target.closest('a[href^="/"]');
    if(!a) return;
    var href=a.getAttribute('href').replace(/\\/$/,'')||'/';
    if(!document.querySelector('[data-page="'+href+'"]')) return;
    e.preventDefault(); show(href);
  });
  var m=(location.hash||'').match(/page=([^&]+)/);
  show(m?decodeURIComponent(m[1]):'/');
})();`;

const allStyles = [...styles.values()].join('\n');
const pageDivs = bodies
  .map((p, i) => `<div data-page="${p.path}"${i ? ' hidden' : ''}>${p.body}</div>`)
  .join('\n');
const tail =
  `<script id="preview-props" type="application/json">${JSON.stringify(props).replace(/</g, '\\u003c')}</script>` +
  `<script>${islandJs}</script>${switcher}<script>${routerJs}</script>`;

await mkdir('preview', { recursive: true });

// Artifact variant: the host supplies doctype/html/head/body.
await writeFile(
  'preview/artifact.html',
  `<title>Assembleo</title>\n<style>${allStyles}\n${previewCss}</style>\n${pageDivs}\n${tail}\n`,
);

// Standalone variant: a complete document that opens from disk.
await writeFile(
  'preview/index.html',
  `<!doctype html><html lang="en-CA"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">` +
    `<title>${title}</title><style>${allStyles}\n${previewCss}</style></head>` +
    `<body>${pageDivs}${tail}</body></html>`,
);

for (const f of ['preview/index.html', 'preview/artifact.html']) {
  const kb = (Buffer.byteLength(await readFile(f)) / 1024).toFixed(0);
  console.log(`${f} — ${kb} KB, ${bodies.length} pages`);
}
